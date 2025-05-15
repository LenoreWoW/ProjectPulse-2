import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProjectSchema, insertTaskSchema, insertChangeRequestSchema,
  insertRiskIssueSchema, insertNotificationSchema, insertAssignmentSchema,
  insertActionItemSchema, insertWeeklyUpdateSchema, insertProjectCostHistorySchema,
  insertDepartmentSchema, insertGoalSchema
} from "@shared/schema";
import { z } from "zod";

// Helper function to validate request body with Zod schema
function validateBody<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
        return;
      }
      next(error);
    }
  };
}

// Helper function to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Helper function to check if user has required role(s)
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  };
}

// Helper to check if user has role and is in the same department as the resource
function hasDepartmentAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Admins and MainPMO have access to all departments
    if (["Administrator", "MainPMO", "Executive"].includes(req.user.role)) {
      return next();
    }
    
    const resourceId = parseInt(req.params.id);
    const resourceType = req.baseUrl.split('/').pop();
    
    let departmentId: number | undefined = undefined;
    
    // Determine the department ID of the resource
    switch (resourceType) {
      case 'projects':
        const project = await storage.getProject(resourceId);
        departmentId = project?.departmentId;
        break;
      case 'users':
        const user = await storage.getUser(resourceId);
        departmentId = user?.departmentId;
        break;
      // Add more resource types as needed
    }
    
    if (departmentId === undefined) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Department directors can only access their department's resources
    if (req.user.role === "DepartmentDirector" && req.user.departmentId === departmentId) {
      return next();
    }
    
    // Sub-PMO can only access their department's resources
    if (req.user.role === "SubPMO" && req.user.departmentId === departmentId) {
      return next();
    }
    
    // Project managers can only access their department's resources and only if they're the manager
    if (req.user.role === "ProjectManager" && req.user.departmentId === departmentId) {
      if (resourceType === 'projects') {
        const project = await storage.getProject(resourceId);
        if (project?.managerUserId === req.user.id) {
          return next();
        }
      }
    }
    
    // Regular users can only access their department's resources
    if (req.user.role === "User" && req.user.departmentId === departmentId) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Insufficient permissions for this department's resources" });
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // setup auth routes
  setupAuth(app);
  
  // Departments Routes
  app.get("/api/departments", isAuthenticated, async (_req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });
  
  app.get("/api/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department" });
    }
  });
  
  app.post(
    "/api/departments", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO"]), 
    validateBody(insertDepartmentSchema), 
    async (req, res) => {
      try {
        const newDepartment = await storage.createDepartment(req.body);
        res.status(201).json(newDepartment);
      } catch (error) {
        res.status(500).json({ message: "Failed to create department" });
      }
    }
  );
  
  app.put(
    "/api/departments/:id", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO"]), 
    async (req, res) => {
      try {
        const departmentId = parseInt(req.params.id);
        const updatedDepartment = await storage.updateDepartment(departmentId, req.body);
        
        if (!updatedDepartment) {
          return res.status(404).json({ message: "Department not found" });
        }
        
        res.json(updatedDepartment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update department" });
      }
    }
  );
  
  // Users Routes (Admin)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Filter based on user role
      const currentUser = req.user;
      let filteredUsers = users;
      
      if (currentUser.role === "DepartmentDirector") {
        // Department directors can only see users in their department
        filteredUsers = users.filter(user => user.departmentId === currentUser.departmentId);
      } else if (currentUser.role === "SubPMO") {
        // Sub-PMO can only see users in their department
        filteredUsers = users.filter(user => user.departmentId === currentUser.departmentId);
      } else if (!["Administrator", "MainPMO", "Executive"].includes(currentUser.role)) {
        // Other roles can only see active users in their department
        filteredUsers = users.filter(user => 
          user.departmentId === currentUser.departmentId && 
          user.status === "Active"
        );
      }
      
      // Remove password field from response
      const sanitizedUsers = filteredUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can only view users in their department unless they're admins
      if (
        req.user.role !== "Administrator" && 
        req.user.role !== "MainPMO" && 
        req.user.role !== "Executive" && 
        req.user.departmentId !== user.departmentId && 
        req.user.id !== userId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view user from different department" });
      }
      
      // Remove password field
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Projects Routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      
      // Filter based on user role
      const currentUser = req.user;
      let filteredProjects = projects;
      
      if (currentUser.role === "DepartmentDirector") {
        // Department directors can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      } else if (currentUser.role === "SubPMO") {
        // Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      } else if (currentUser.role === "ProjectManager") {
        // Project managers can only see projects they manage or in their department
        filteredProjects = projects.filter(project => 
          project.managerUserId === currentUser.id || 
          project.departmentId === currentUser.departmentId
        );
      } else if (currentUser.role === "User") {
        // Regular users can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      }
      
      res.json(filteredProjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project
      const currentUser = req.user;
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view project from different department" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  
  app.post(
    "/api/projects", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO", "SubPMO", "ProjectManager", "DepartmentDirector"]), 
    validateBody(insertProjectSchema), 
    async (req, res) => {
      try {
        // Project Managers can only create projects in their department
        if (
          req.user.role === "ProjectManager" && 
          req.body.departmentId !== req.user.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // If creating as Project Manager, set manager to self
        if (req.user.role === "ProjectManager" && !req.body.managerUserId) {
          req.body.managerUserId = req.user.id;
        }
        
        // Department Directors can only create projects in their department
        if (
          req.user.role === "DepartmentDirector" && 
          req.body.departmentId !== req.user.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // Sub-PMO can only create projects in their department
        if (
          req.user.role === "SubPMO" && 
          req.body.departmentId !== req.user.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        const newProject = await storage.createProject(req.body);
        res.status(201).json(newProject);
      } catch (error) {
        res.status(500).json({ message: "Failed to create project" });
      }
    }
  );
  
  app.put(
    "/api/projects/:id", 
    isAuthenticated, 
    validateBody(insertProjectSchema.partial()), 
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check permissions for updating the project
        const currentUser = req.user;
        
        // PM can only update projects they manage
        if (
          currentUser.role === "ProjectManager" && 
          project.managerUserId !== currentUser.id
        ) {
          return res.status(403).json({ message: "Forbidden: You are not the manager of this project" });
        }
        
        // Department Director can only update projects in their department
        if (
          currentUser.role === "DepartmentDirector" && 
          project.departmentId !== currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Project is not in your department" });
        }
        
        // Sub-PMO can only update projects in their department
        if (
          currentUser.role === "SubPMO" && 
          project.departmentId !== currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Project is not in your department" });
        }
        
        // Regular users cannot update projects
        if (currentUser.role === "User") {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update projects" });
        }
        
        const updatedProject = await storage.updateProject(projectId, req.body);
        res.json(updatedProject);
      } catch (error) {
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  );
  
  // Tasks Routes
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project's tasks
      const currentUser = req.user;
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view tasks from different department's project" });
      }
      
      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user;
      const assignedToMe = await storage.getTasksByAssignee(currentUser.id);
      const assignedByMe = await storage.getTasksByCreator(currentUser.id);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/tasks", 
    isAuthenticated, 
    validateBody(insertTaskSchema), 
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if user can create tasks in this project
        const currentUser = req.user;
        if (
          currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.departmentId !== project.departmentId && 
          currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create tasks in different department's project" });
        }
        
        const taskData = {
          ...req.body,
          projectId,
          createdByUserId: currentUser.id
        };
        
        const newTask = await storage.createTask(taskData);
        res.status(201).json(newTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  );
  
  app.put(
    "/api/tasks/:id", 
    isAuthenticated, 
    validateBody(insertTaskSchema.partial()), 
    async (req, res) => {
      try {
        const taskId = parseInt(req.params.id);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        // Check permissions for updating the task
        const currentUser = req.user;
        const project = await storage.getProject(task.projectId);
        
        // Only task creator, project manager, or admin can update tasks
        if (
          currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.id !== task.createdByUserId && 
          currentUser.id !== project?.managerUserId && 
          currentUser.role !== "DepartmentDirector" && 
          (currentUser.role === "DepartmentDirector" && currentUser.departmentId !== project?.departmentId)
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update this task" });
        }
        
        const updatedTask = await storage.updateTask(taskId, req.body);
        res.json(updatedTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  );
  
  // Change Requests Routes
  app.get("/api/projects/:projectId/change-requests", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project's change requests
      const currentUser = req.user;
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view change requests from different department's project" });
      }
      
      const changeRequests = await storage.getChangeRequestsByProject(projectId);
      res.json(changeRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch change requests" });
    }
  });
  
  app.get("/api/change-requests/pending", isAuthenticated, hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]), async (req, res) => {
    try {
      const pendingChangeRequests = await storage.getChangeRequestsByStatus("Pending");
      
      // Filter based on user role
      const currentUser = req.user;
      let filteredChangeRequests = pendingChangeRequests;
      
      if (currentUser.role === "SubPMO" || currentUser.role === "DepartmentDirector") {
        // Filter to only show change requests for projects in their department
        filteredChangeRequests = [];
        for (const cr of pendingChangeRequests) {
          const project = await storage.getProject(cr.projectId);
          if (project && project.departmentId === currentUser.departmentId) {
            filteredChangeRequests.push(cr);
          }
        }
      }
      
      res.json(filteredChangeRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending change requests" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/change-requests", 
    isAuthenticated, 
    validateBody(insertChangeRequestSchema), 
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager or higher roles can create change requests
        const currentUser = req.user;
        if (
          currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.role !== "SubPMO" && 
          currentUser.role !== "DepartmentDirector" && 
          currentUser.id !== project.managerUserId && 
          currentUser.role !== "ProjectManager"
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to create change requests" });
        }
        
        const changeRequestData = {
          ...req.body,
          projectId,
          requestedByUserId: currentUser.id,
          status: "Pending"
        };
        
        const newChangeRequest = await storage.createChangeRequest(changeRequestData);
        res.status(201).json(newChangeRequest);
      } catch (error) {
        res.status(500).json({ message: "Failed to create change request" });
      }
    }
  );
  
  app.put(
    "/api/change-requests/:id", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]), 
    async (req, res) => {
      try {
        const changeRequestId = parseInt(req.params.id);
        const changeRequest = await storage.getChangeRequest(changeRequestId);
        
        if (!changeRequest) {
          return res.status(404).json({ message: "Change request not found" });
        }
        
        // Check if user can approve/reject this change request
        const currentUser = req.user;
        const project = await storage.getProject(changeRequest.projectId);
        
        if (
          currentUser.role === "SubPMO" || 
          currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project && project.departmentId !== currentUser.departmentId) {
            return res.status(403).json({ message: "Forbidden: Change request is for a project outside your department" });
          }
        }
        
        const updateData = {
          ...req.body,
          reviewedByUserId: currentUser.id,
          reviewedAt: new Date()
        };
        
        const updatedChangeRequest = await storage.updateChangeRequest(changeRequestId, updateData);
        
        // If approving status change, update the project status
        if (
          updatedChangeRequest?.status === "Approved" && 
          updatedChangeRequest.type === "Status" && 
          project && 
          req.body.newStatus
        ) {
          await storage.updateProject(project.id, { status: req.body.newStatus });
        }
        
        // If approving budget change, update the project budget
        if (
          updatedChangeRequest?.status === "Approved" && 
          updatedChangeRequest.type === "Budget" && 
          project && 
          req.body.newBudget
        ) {
          await storage.updateProject(project.id, { budget: req.body.newBudget });
        }
        
        res.json(updatedChangeRequest);
      } catch (error) {
        res.status(500).json({ message: "Failed to update change request" });
      }
    }
  );
  
  // Cost History Routes
  app.post(
    "/api/projects/:projectId/cost-history", 
    isAuthenticated, 
    validateBody(insertProjectCostHistorySchema), 
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager or higher roles can update cost
        const currentUser = req.user;
        if (
          currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.role !== "SubPMO" && 
          currentUser.role !== "DepartmentDirector" && 
          currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update project cost" });
        }
        
        const costHistoryData = {
          ...req.body,
          projectId,
          updatedByUserId: currentUser.id
        };
        
        const newCostHistory = await storage.createProjectCostHistory(costHistoryData);
        res.status(201).json(newCostHistory);
      } catch (error) {
        res.status(500).json({ message: "Failed to update project cost" });
      }
    }
  );
  
  app.get("/api/projects/:projectId/cost-history", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project's cost history
      const currentUser = req.user;
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view cost history from different department's project" });
      }
      
      const costHistory = await storage.getProjectCostHistoryByProject(projectId);
      res.json(costHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost history" });
    }
  });
  
  // Budget Summary
  app.get("/api/budget-summary", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      
      // Filter projects based on user role
      const currentUser = req.user;
      let filteredProjects = projects;
      
      if (currentUser.role === "DepartmentDirector") {
        // Department directors can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      } else if (currentUser.role === "SubPMO") {
        // Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      } else if (currentUser.role === "ProjectManager") {
        // Project managers can only see projects they manage
        filteredProjects = projects.filter(project => project.managerUserId === currentUser.id);
      } else if (currentUser.role === "User") {
        // Regular users can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      }
      
      // Calculate budget summary
      const totalBudget = filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
      const actualCost = filteredProjects.reduce((sum, project) => sum + (project.actualCost || 0), 0);
      const remainingBudget = totalBudget - actualCost;
      
      // Simplified prediction calculation
      // In a real app, this would be more sophisticated
      const predictedCost = filteredProjects.reduce((sum, project) => {
        // Basic prediction: If less than 50% progress but more than 60% spent, predict overrun
        const percentSpent = project.budget > 0 ? (project.actualCost / project.budget) : 0;
        // Assuming we had a progress field, we'd use that instead of this dummy calculation
        const progress = 0.5; // Dummy progress value
        
        // If spending faster than progress, predict overrun
        if (progress < 0.5 && percentSpent > 0.6) {
          return sum + (project.budget * 1.2); // 20% overrun prediction
        }
        return sum + project.budget;
      }, 0);
      
      res.json({
        totalBudget,
        actualCost,
        remainingBudget,
        predictedCost
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate budget summary" });
    }
  });
  
  // Notifications Routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Users can only mark their own notifications as read
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your notification" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Goals Routes
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user;
      const goals = await storage.getGoals();
      
      // Handle filtering based on role - everyone can see goals, but some might
      // only see certain types or those related to their department
      
      res.json({
        strategic: goals.filter(goal => goal.isStrategic),
        annual: goals.filter(goal => !goal.isStrategic),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });
  
  app.post(
    "/api/goals", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO", "DepartmentDirector", "Executive"]), 
    validateBody(insertGoalSchema), 
    async (req, res) => {
      try {
        const goalData = {
          ...req.body,
          createdByUserId: req.user.id
        };
        
        const newGoal = await storage.createGoal(goalData);
        res.status(201).json(newGoal);
      } catch (error) {
        res.status(500).json({ message: "Failed to create goal" });
      }
    }
  );
  
  // Risks & Issues Routes
  app.get("/api/risks-issues", isAuthenticated, async (req, res) => {
    try {
      // Get all risks and issues the user has access to
      const currentUser = req.user;
      const allRisksIssues = await storage.getRisks().concat(await storage.getIssues());
      
      // Filter based on user role and department
      let filteredRisksIssues = allRisksIssues;
      
      if (!["Administrator", "MainPMO", "Executive"].includes(currentUser.role)) {
        // For other roles, filter by department
        filteredRisksIssues = [];
        
        for (const ri of allRisksIssues) {
          const project = await storage.getProject(ri.projectId);
          if (project && project.departmentId === currentUser.departmentId) {
            filteredRisksIssues.push(ri);
          }
        }
      }
      
      res.json({
        risks: filteredRisksIssues.filter(ri => ri.type === "Risk"),
        issues: filteredRisksIssues.filter(ri => ri.type === "Issue")
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch risks and issues" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/risks-issues", 
    isAuthenticated, 
    validateBody(insertRiskIssueSchema), 
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project managers or higher roles can create risks/issues
        const currentUser = req.user;
        if (
          currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.role !== "SubPMO" && 
          currentUser.role !== "DepartmentDirector" && 
          currentUser.id !== project.managerUserId && 
          currentUser.role !== "ProjectManager"
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to create risks/issues" });
        }
        
        const riskIssueData = {
          ...req.body,
          projectId,
          createdByUserId: currentUser.id
        };
        
        const newRiskIssue = await storage.createRiskIssue(riskIssueData);
        res.status(201).json(newRiskIssue);
      } catch (error) {
        res.status(500).json({ message: "Failed to create risk/issue" });
      }
    }
  );
  
  // Assignments Routes
  app.get("/api/assignments", isAuthenticated, async (req, res) => {
    try {
      const assignedToMe = await storage.getAssignmentsByAssignee(req.user.id);
      const assignedByMe = await storage.getAssignmentsByAssigner(req.user.id);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });
  
  app.post(
    "/api/assignments", 
    isAuthenticated, 
    validateBody(insertAssignmentSchema), 
    async (req, res) => {
      try {
        const assignmentData = {
          ...req.body,
          assignedByUserId: req.user.id
        };
        
        const newAssignment = await storage.createAssignment(assignmentData);
        res.status(201).json(newAssignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to create assignment" });
      }
    }
  );
  
  app.put(
    "/api/assignments/:id", 
    isAuthenticated, 
    validateBody(insertAssignmentSchema.partial()), 
    async (req, res) => {
      try {
        const assignmentId = parseInt(req.params.id);
        const assignment = await storage.getAssignment(assignmentId);
        
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        
        // Only the assigner or assignee can update the assignment
        if (
          req.user.id !== assignment.assignedByUserId && 
          req.user.id !== assignment.assignedToUserId && 
          req.user.role !== "Administrator"
        ) {
          return res.status(403).json({ message: "Forbidden: You cannot modify this assignment" });
        }
        
        const updatedAssignment = await storage.updateAssignment(assignmentId, req.body);
        res.json(updatedAssignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update assignment" });
      }
    }
  );
  
  // Action Items Routes
  app.get("/api/action-items", isAuthenticated, async (req, res) => {
    try {
      const actionItems = await storage.getActionItemsByUser(req.user.id);
      res.json(actionItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch action items" });
    }
  });
  
  app.post(
    "/api/action-items", 
    isAuthenticated, 
    validateBody(insertActionItemSchema), 
    async (req, res) => {
      try {
        const actionItemData = {
          ...req.body,
          userId: req.user.id
        };
        
        const newActionItem = await storage.createActionItem(actionItemData);
        res.status(201).json(newActionItem);
      } catch (error) {
        res.status(500).json({ message: "Failed to create action item" });
      }
    }
  );
  
  app.put(
    "/api/action-items/:id", 
    isAuthenticated, 
    validateBody(insertActionItemSchema.partial()), 
    async (req, res) => {
      try {
        const actionItemId = parseInt(req.params.id);
        const actionItem = await storage.getActionItem(actionItemId);
        
        if (!actionItem) {
          return res.status(404).json({ message: "Action item not found" });
        }
        
        // Users can only update their own action items
        if (actionItem.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden: Not your action item" });
        }
        
        const updatedActionItem = await storage.updateActionItem(actionItemId, req.body);
        res.json(updatedActionItem);
      } catch (error) {
        res.status(500).json({ message: "Failed to update action item" });
      }
    }
  );
  
  // Weekly Updates Routes
  app.get("/api/projects/:projectId/weekly-updates", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project's weekly updates
      const currentUser = req.user;
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view weekly updates from different department's project" });
      }
      
      const weeklyUpdates = await storage.getWeeklyUpdatesByProject(projectId);
      res.json(weeklyUpdates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly updates" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/weekly-updates", 
    isAuthenticated, 
    validateBody(insertWeeklyUpdateSchema), 
    async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager can create weekly updates
        const currentUser = req.user;
        if (
          currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Only project manager can create weekly updates" });
        }
        
        const weeklyUpdateData = {
          ...req.body,
          projectId,
          createdByUserId: currentUser.id
        };
        
        const newWeeklyUpdate = await storage.createWeeklyUpdate(weeklyUpdateData);
        res.status(201).json(newWeeklyUpdate);
      } catch (error) {
        res.status(500).json({ message: "Failed to create weekly update" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
