import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { validateBody } from "./middleware";
import { 
  insertProjectSchema, insertTaskSchema, insertChangeRequestSchema,
  insertRiskIssueSchema, insertNotificationSchema, insertAssignmentSchema,
  insertActionItemSchema, insertWeeklyUpdateSchema, insertProjectCostHistorySchema,
  insertDepartmentSchema, insertGoalSchema, insertTaskCommentSchema, insertAssignmentCommentSchema
} from "@shared/schema";
import { z } from "zod";

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
    
    if (req.user?.role && roles.includes(req.user.role)) {
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
    if (req.user?.role && ["Administrator", "MainPMO", "Executive"].includes(req.user.role)) {
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
        departmentId = user?.departmentId || undefined;
        break;
      // Add more resource types as needed
    }
    
    if (departmentId === undefined) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    // Department directors can only access their department's resources
    if (req.user?.role === "DepartmentDirector" && req.user.departmentId === departmentId) {
      return next();
    }
    
    // Sub-PMO can only access their department's resources
    if (req.user?.role === "SubPMO" && req.user.departmentId === departmentId) {
      return next();
    }
    
    // Project managers can only access their department's resources and only if they're the manager
    if (req.user?.role === "ProjectManager" && req.user.departmentId === departmentId) {
      if (resourceType === 'projects') {
        const project = await storage.getProject(resourceId);
        if (project?.managerUserId === req.user.id) {
          return next();
        }
      }
    }
    
    // Regular users can only access their department's resources
    if (req.user?.role === "User" && req.user.departmentId === departmentId) {
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
      
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
        req.user?.role !== "Administrator" && 
        req.user?.role !== "MainPMO" && 
        req.user?.role !== "Executive" && 
        req.user?.departmentId !== user.departmentId && 
        req.user?.id !== userId
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
      
      // Filter based on user role and department
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      let filteredProjects = projects;
      
      if (req.user.role === "DepartmentDirector" || req.user.role === "SubPMO") {
        // Department directors and Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === req.user.departmentId);
      } else if (!["Administrator", "MainPMO", "Executive"].includes(req.user.role)) {
        // Other roles can only see projects they're assigned to
        filteredProjects = projects.filter(project => {
          // Check if user is member of the project
          return project.teamMembers.some(member => member.userId === req.user.id);
        });
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
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (
        req.user.role !== "Administrator" && 
        req.user.role !== "MainPMO" && 
        req.user.role !== "Executive" && 
        req.user.departmentId !== project.departmentId && 
        !project.teamMembers.some(member => member.userId === req.user.id)
      ) {
        return res.status(403).json({ message: "Forbidden: No access to this project" });
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
    validateBody(z.object({
      title: z.string(),
      titleAr: z.string().nullish(),
      description: z.string().nullish(),
      descriptionAr: z.string().nullish(),
      managerUserId: z.number(),
      departmentId: z.number(),
      client: z.string(),
      budget: z.number().nullish(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      startDate: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
      deadline: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
      status: z.enum(["Pending", "Planning", "InProgress", "OnHold", "Completed"]).default("Pending"),
      actualCost: z.number().nullish(),
      teamMembers: z.array(z.string().or(z.number())).optional()
    })), 
    async (req, res) => {
      try {
        // Project Managers can only create projects in their department
        if (
          req.user?.role === "ProjectManager" && 
          req.body.departmentId !== req.user.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // If creating as Project Manager, set manager to self
        if (req.user?.role === "ProjectManager" && !req.body.managerUserId) {
          req.body.managerUserId = req.user.id;
        }
        
        // Department Directors can only create projects in their department
        if (
          req.user?.role === "DepartmentDirector" && 
          req.body.departmentId !== req.user.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // Sub-PMO can only create projects in their department
        if (
          req.user?.role === "SubPMO" && 
          req.body.departmentId !== req.user.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // If user is Administrator, automatically set status to Planning if not explicitly provided
        if (req.user?.role === "Administrator" && (!req.body.status || req.body.status === "Pending")) {
          req.body.status = "Planning";
        }
        
        const newProject = await storage.createProject(req.body);

        // Add team members if provided
        if (req.body.teamMembers && Array.isArray(req.body.teamMembers)) {
          for (const memberId of req.body.teamMembers) {
            await storage.addProjectMember(newProject.id, parseInt(memberId.toString()));
          }
        }
        
        res.status(201).json(newProject);
      } catch (error) {
        console.error("Project creation error:", error);
        if (error instanceof Error) {
          res.status(500).json({ 
            message: `Failed to create project: ${error.message}`,
            error: error.message
          });
        } else {
          res.status(500).json({ message: "Failed to create project" });
        }
      }
    }
  );
  
  app.put(
    "/api/projects/:id", 
    isAuthenticated, 
    validateBody(z.object({
      title: z.string().optional(),
      titleAr: z.string().nullish().optional(),
      description: z.string().nullish().optional(),
      descriptionAr: z.string().nullish().optional(),
      managerUserId: z.number().optional(),
      departmentId: z.number().optional(),
      client: z.string().optional(),
      budget: z.number().nullish().optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      startDate: z.date().or(z.string().transform(str => new Date(str))).nullish().optional(),
      deadline: z.date().or(z.string().transform(str => new Date(str))).nullish().optional(),
      status: z.enum(["Pending", "Planning", "InProgress", "OnHold", "Completed"]).nullish().optional(),
      actualCost: z.number().nullish().optional()
    })), 
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
          currentUser?.role === "ProjectManager" && 
          project.managerUserId !== currentUser.id
        ) {
          return res.status(403).json({ message: "Forbidden: You are not the manager of this project" });
        }
        
        // Department Director can only update projects in their department
        if (
          currentUser?.role === "DepartmentDirector" && 
          project.departmentId !== currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Project is not in your department" });
        }
        
        // Sub-PMO can only update projects in their department
        if (
          currentUser?.role === "SubPMO" && 
          project.departmentId !== currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Project is not in your department" });
        }
        
        // Regular users cannot update projects
        if (currentUser?.role === "User") {
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
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get tasks assigned to the user
      const assignedToMe = await storage.getTasksByAssignee(req.user.id);
      
      // Get tasks created by the user
      const assignedByMe = await storage.getTasksByCreator(req.user.id);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post(
    "/api/tasks", 
    isAuthenticated, 
    validateBody(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      assignedUserId: z.number().optional(),
      deadline: z.date().or(z.string().transform(str => new Date(str))),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      status: z.enum(["Todo", "InProgress", "Review", "Completed"]).default("Todo"),
      createdByUserId: z.number().optional()
    })), 
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const { projectId, title, description, assignedUserId, deadline, priority, status } = req.body;
        
        // Enhanced validation
        if (!title || title.trim() === '') {
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: [{ path: "title", message: "Task title is required" }] 
          });
        }
        
        if (title.trim().length < 3) {
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: [{ path: "title", message: "Task title must be at least 3 characters" }] 
          });
        }
        
        if (title.trim().length > 100) {
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: [{ path: "title", message: "Task title must be at most 100 characters" }] 
          });
        }
        
        if (deadline) {
          const deadlineDate = new Date(deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (isNaN(deadlineDate.getTime())) {
            return res.status(400).json({ 
              message: "Validation failed", 
              errors: [{ path: "deadline", message: "Invalid deadline date format" }] 
            });
          }
          
          if (deadlineDate < today) {
            return res.status(400).json({ 
              message: "Validation failed", 
              errors: [{ path: "deadline", message: "Deadline must be in the future" }] 
            });
          }
        }
        
        // Check if project exists
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if user is authorized to create tasks for this project
        if (
          req.user.role !== "Administrator" && 
          req.user.role !== "MainPMO" && 
          req.user.role !== "Executive" && 
          req.user.departmentId !== project.departmentId && 
          project.teamMembers && !project.teamMembers.some(member => member.userId === req.user?.id)
        ) {
          return res.status(403).json({ message: "Forbidden: You don't have access to create tasks for this project" });
        }
        
        // If assignedUserId is specified, check if the user exists
        if (assignedUserId) {
          const assignedUser = await storage.getUser(assignedUserId);
          if (!assignedUser) {
            return res.status(400).json({ 
              message: "Validation failed", 
              errors: [{ path: "assignedUserId", message: "Assigned user not found" }] 
            });
          }
          
          // Check if assigned user is in the same department or part of the project team
          if (
            assignedUser.departmentId !== project.departmentId && 
            project.teamMembers && !project.teamMembers.some(member => member.userId === assignedUserId)
          ) {
            return res.status(400).json({ 
              message: "Validation failed", 
              errors: [{ path: "assignedUserId", message: "Cannot assign task to a user outside of the project's department or team" }] 
            });
          }
        }
        
        // Create the task data object
        const taskData = {
          projectId,
          title: title.trim(),
          description: description ? description.trim() : undefined,
          assignedUserId: assignedUserId || undefined,
          deadline: deadline ? new Date(deadline) : undefined,
          priority: priority || "Medium",
          status: status || "Todo",
          createdByUserId: req.user.id
        };
        
        const newTask = await storage.createTask(taskData);
        
        // If the task is assigned to someone, create a notification
        if (assignedUserId && assignedUserId !== req.user.id) {
          try {
            await storage.createNotification({
              userId: assignedUserId,
              relatedEntity: 'Task',
              relatedEntityId: newTask.id,
              message: `You have been assigned a new task: "${title}" by ${req.user.name}`,
            });
          } catch (notifError) {
            console.error('Failed to create notification:', notifError);
            // Don't fail the whole operation if notification creation fails
          }
        }
        
        res.status(201).json(newTask);
      } catch (error) {
        console.error("Error creating task:", error);
        if (error instanceof Error) {
          res.status(500).json({ message: error.message || "Failed to create task" });
        } else {
          res.status(500).json({ message: "Failed to create task" });
        }
      }
    }
  );
  
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
  
  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Get the project to check permissions
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Associated project not found" });
      }
      
      // Check permissions for viewing the task
      const currentUser = req.user;
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== task.createdByUserId &&
        currentUser.id !== task.assignedUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view this task" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  
  app.put(
    "/api/tasks/:id", 
    isAuthenticated, 
    validateBody(z.object({
      projectId: z.number().optional(),
      title: z.string().optional(),
      titleAr: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      descriptionAr: z.string().nullable().optional(),
      assignedUserId: z.number().nullable().optional(),
      deadline: z.date().or(z.string().transform(str => new Date(str))).nullable().optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      status: z.enum(["Todo", "InProgress", "Review", "Completed", "OnHold"]).optional(),
      priorityOrder: z.number().optional(),
      createdByUserId: z.number().optional()
    })), 
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
        
        // Only task creator, project manager, assigned user, or admin can update tasks
        if (
          !currentUser || 
          (currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.id !== task.createdByUserId && 
          currentUser.id !== task.assignedUserId &&
          currentUser.id !== project?.managerUserId && 
          currentUser.role !== "DepartmentDirector" && 
          (currentUser.role === "DepartmentDirector" && currentUser.departmentId !== project?.departmentId))
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
  
  app.post("/api/notifications", isAuthenticated, validateBody(insertNotificationSchema), async (req, res) => {
    try {
      const currentUser = req.user;
      
      // Only certain roles can create notifications for other users
      if (req.body.userId !== currentUser.id && 
          !["Administrator", "MainPMO", "SubPMO", "DepartmentDirector", "ProjectManager"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Insufficient permissions to create notifications for other users" });
      }
      
      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
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
      const allGoals = await storage.getGoals();
      
      // Determine if we should filter by department
      let departmentFilter: number | null = null;
      if (req.query.departmentId) {
        departmentFilter = parseInt(req.query.departmentId as string);
      } else if (req.query.departmentOnly === 'true' && currentUser && currentUser.departmentId) {
        departmentFilter = currentUser.departmentId;
      }
      
      // Filter goals if a department filter is applied
      let filteredGoals = allGoals;
      if (departmentFilter !== null) {
        filteredGoals = allGoals.filter(goal => 
          goal.departmentId === departmentFilter
        );
      }
      
      res.json({
        strategic: filteredGoals.filter(goal => goal.isStrategic),
        annual: filteredGoals.filter(goal => !goal.isStrategic),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });
  
  // Create a new goal
  app.post(
    "/api/goals", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO", "DepartmentDirector", "Executive"]), 
    validateBody(insertGoalSchema), 
    async (req, res) => {
      try {
        const currentUser = req.user;
        
        // Check if creating a department goal
        if (req.body.departmentId) {
          // Administrators can create department goals for any department
          // Department directors can only create department goals for their department
          if (!currentUser || 
              (currentUser.role !== 'Administrator' &&
               (currentUser.role !== 'DepartmentDirector' || 
               currentUser.departmentId !== req.body.departmentId))) {
            return res.status(403).json({ 
              message: "Only administrators or department directors can create goals for their department"
            });
          }
        } else {
          // For non-department goals, check if user has correct permission
          if (!currentUser || 
              !["Administrator", "MainPMO", "Executive"].includes(currentUser.role)) {
            return res.status(403).json({ 
              message: "Only administrators, main PMO and executives can create general goals"
            });
          }
        }
        
        const goalData = {
          ...req.body,
          createdByUserId: currentUser.id
        };
        
        // Save the goal
        const newGoal = await storage.createGoal(goalData);
        
        // Process related projects if provided
        if (req.body.relatedProjects && Array.isArray(req.body.relatedProjects)) {
          for (const projectRelation of req.body.relatedProjects) {
            await storage.createProjectGoal({
              projectId: projectRelation.projectId,
              goalId: newGoal.id,
              weight: projectRelation.weight || 1
            });
          }
        }
        
        // Process related goals if provided
        if (req.body.relatedGoals && Array.isArray(req.body.relatedGoals)) {
          for (const goalRelation of req.body.relatedGoals) {
            await storage.createGoalRelationship({
              parentGoalId: newGoal.id,
              childGoalId: goalRelation.goalId,
              weight: goalRelation.weight || 1
            });
          }
        }
        
        res.status(201).json(newGoal);
      } catch (error) {
        res.status(500).json({ message: "Failed to create goal" });
      }
    }
  );
  
  // Get relationships for multiple goals - used for visualization
  app.get("/api/goals/relationships", isAuthenticated, async (req, res) => {
    try {
      // Get all goals first
      const allGoals = await storage.getGoals();
      const results = [];

      // For each goal, fetch its relationships
      for (const goal of allGoals) {
        const relatedProjects = await storage.getProjectGoalsByGoal(goal.id);
        const childGoals = await storage.getChildGoalRelationships(goal.id);
        const parentGoals = await storage.getParentGoalRelationships(goal.id);
        
        results.push({
          ...goal,
          relatedProjects,
          childGoals,
          parentGoals
        });
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal relationships" });
    }
  });
  
  // Get goal details with related projects and goals
  app.get("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Get related projects
      const relatedProjects = await storage.getProjectGoalsByGoal(goalId);
      
      // Get related goals (both parent and child relationships)
      const childGoals = await storage.getChildGoalRelationships(goalId);
      const parentGoals = await storage.getParentGoalRelationships(goalId);
      
      res.json({
        ...goal,
        relatedProjects,
        childGoals,
        parentGoals
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal details" });
    }
  });
  
  // Risks & Issues Routes
  app.get("/api/risks-issues", isAuthenticated, async (req, res) => {
    try {
      // Get all risks and issues the user has access to
      const currentUser = req.user;
      // Fix: Properly await both promises before combining
      const risks = await storage.getRisks();
      const issues = await storage.getIssues();
      const allRisksIssues = [...risks, ...issues];
      
      // Filter based on user role and department
      let filteredRisksIssues = allRisksIssues;
      
      if (currentUser && currentUser.role && !["Administrator", "MainPMO", "Executive"].includes(currentUser.role)) {
        // For other roles, filter by department
        filteredRisksIssues = [];
        
        for (const ri of allRisksIssues) {
          const project = await storage.getProject(ri.projectId);
          if (project && currentUser.departmentId && project.departmentId === currentUser.departmentId) {
            filteredRisksIssues.push(ri);
          }
        }
      }
      
      res.json({
        risks: filteredRisksIssues.filter(ri => ri.type === "Risk"),
        issues: filteredRisksIssues.filter(ri => ri.type === "Issue")
      });
    } catch (error) {
      console.error("Error fetching risks and issues:", error);
      res.status(500).json({ message: "Failed to fetch risks and issues" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/risks-issues", 
    isAuthenticated, 
    validateBody(z.object({
      type: z.enum(["Risk", "Issue"]),
      description: z.string().min(1, "Description is required"),
      descriptionAr: z.string().optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      status: z.enum(["Open", "InProgress", "Resolved", "Closed"]).default("Open"),
      projectId: z.number().optional(),
      createdByUserId: z.number().optional()
    })), 
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
          !currentUser || 
          (currentUser.role !== "Administrator" && 
          currentUser.role !== "MainPMO" && 
          currentUser.role !== "SubPMO" && 
          currentUser.role !== "DepartmentDirector" && 
          currentUser.id !== project.managerUserId && 
          currentUser.role !== "ProjectManager")
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to create risks/issues" });
        }
        
        // Set the projectId and createdByUserId in the request body
        const riskIssueData = {
          ...req.body,
          projectId,
          createdByUserId: currentUser.id
        };
        
        const newRiskIssue = await storage.createRiskIssue(riskIssueData);
        res.status(201).json(newRiskIssue);
      } catch (error) {
        console.error("Error creating risk/issue:", error);
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
    validateBody(z.object({
      title: z.string(),
      description: z.string().optional(),
      assignedToUserId: z.number(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
      deadline: z.date().or(z.string().transform(str => new Date(str))),
      status: z.enum(["Pending", "InProgress", "Completed"]).default("Pending")
    })), 
    async (req, res) => {
      try {
        const assignmentData = {
          ...req.body,
          assignedByUserId: req.user?.id
        };
        
        const newAssignment = await storage.createAssignment(assignmentData);
        
        // Create notification for the assignment recipient
        if (assignmentData.assignedToUserId && assignmentData.assignedToUserId !== req.user?.id) {
          try {
            const assigningUser = await storage.getUser(req.user?.id || 0);
            const assignerName = assigningUser ? assigningUser.name : 'Someone';
            
            await storage.createNotification({
              userId: assignmentData.assignedToUserId,
              relatedEntity: "Assignment",
              relatedEntityId: newAssignment.id,
              message: `You have been assigned a new assignment: "${assignmentData.title}" by ${assignerName}`,
              isRead: false
            });
          } catch (notificationError) {
            console.error('Failed to create notification:', notificationError);
            // Don't fail the whole operation if notification creation fails
          }
        }
        
        res.status(201).json(newAssignment);
      } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ message: "Failed to create assignment" });
      }
    }
  );
  
  app.put(
    "/api/assignments/:id", 
    isAuthenticated, 
    validateBody(z.object({
      assignedByUserId: z.number().optional(),
      assignedToUserId: z.number().optional(),
      title: z.string().optional(),
      titleAr: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      descriptionAr: z.string().nullable().optional(),
      deadline: z.date().or(z.string().transform(str => new Date(str))).nullable().optional(),
      priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
      status: z.enum(["Todo", "InProgress", "Review", "Completed", "OnHold"]).optional()
    })), 
    async (req, res) => {
      try {
        const assignmentId = parseInt(req.params.id);
        const assignment = await storage.getAssignment(assignmentId);
        
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        
        // Only the assigner or assignee can update the assignment
        if (
          !req.user ||
          (req.user.id !== assignment.assignedByUserId && 
          req.user.id !== assignment.assignedToUserId && 
          req.user.role !== "Administrator")
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

  // Project Team Members Routes
  app.get("/api/projects/:projectId/members", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
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
      
      const members = await storage.getProjectMembers(projectId);
      
      // Remove password field from response
      const sanitizedMembers = members.map(member => {
        const { password, ...memberWithoutPassword } = member;
        return memberWithoutPassword;
      });
      
      res.json(sanitizedMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });
  
  app.post("/api/projects/:projectId/members", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only project manager or admin can add members
      const currentUser = req.user;
      if (
        !currentUser ||
        (currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.id !== project.managerUserId)
      ) {
        return res.status(403).json({ message: "Forbidden: Only project manager or admin can add team members" });
      }
      
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      // Check if user exists and is in the same department
      const userIdNumber = parseInt(userId.toString());
      const user = await storage.getUser(userIdNumber);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only add users from the same department
      if (user.departmentId !== project.departmentId) {
        return res.status(403).json({ message: "Can only add team members from the same department" });
      }
      
      await storage.addProjectMember(projectId, userIdNumber);
      res.status(201).json({ message: "Team member added successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add team member" });
    }
  });
  
  app.delete("/api/projects/:projectId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Only project manager or admin can remove members
      const currentUser = req.user;
      if (
        !currentUser ||
        (currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.id !== project.managerUserId)
      ) {
        return res.status(403).json({ message: "Forbidden: Only project manager or admin can remove team members" });
      }
      
      await storage.removeProjectMember(projectId, userId);
      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Task Comments Routes
  app.get("/api/tasks/:taskId/comments", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to this task
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only people involved with the task should see comments
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.id !== task.createdByUserId && 
        currentUser.id !== task.assignedUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view comments for this task" });
      }
      
      const comments = await storage.getTaskCommentsByTask(taskId);
      
      // Include user information for each comment
      const commentsWithUser = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: user ? {
              id: user.id,
              name: user.name || '',
            } : undefined
          };
        })
      );
      
      res.json(commentsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
  });
  
  app.post("/api/tasks/:taskId/comments", isAuthenticated, validateBody(insertTaskCommentSchema), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to this task
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only people involved with the task should be able to comment
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.id !== task.createdByUserId && 
        currentUser.id !== task.assignedUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot comment on this task" });
      }
      
      const comment = await storage.createTaskComment({
        ...req.body,
        taskId,
        userId: currentUser.id
      });
      
      // Create notification for the other party
      const notifyUserId = currentUser.id === task.assignedUserId 
        ? task.createdByUserId 
        : task.assignedUserId;
      
      if (notifyUserId) {
        try {
          await storage.createNotification({
            userId: notifyUserId,
            relatedEntity: "Task",
            relatedEntityId: taskId,
            message: `New comment on task "${task.title}" from ${currentUser.name || ''}`,
            isRead: false
          });
        } catch (notificationError) {
          console.error("Failed to create notification:", notificationError);
          // Don't fail if notification creation fails
        }
      }
      
      // Return comment with user info
      const user = await storage.getUser(comment.userId);
      const commentWithUser = {
        ...comment,
        user: user ? {
          id: user.id,
          name: user.name || '',
        } : undefined
      };
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error creating task comment:", error);
      res.status(500).json({ message: "Failed to create task comment" });
    }
  });
  
  // Assignment Comments Routes
  app.get("/api/assignments/:assignmentId/comments", isAuthenticated, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Check if user has access to this assignment
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only people involved with the assignment should see comments
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.id !== assignment.assignedByUserId && 
        currentUser.id !== assignment.assignedToUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view comments for this assignment" });
      }
      
      const comments = await storage.getAssignmentCommentsByAssignment(assignmentId);
      
      // Include user information for each comment
      const commentsWithUser = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: user ? {
              id: user.id,
              name: user.name || '',
            } : undefined
          };
        })
      );
      
      res.json(commentsWithUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment comments" });
    }
  });
  
  app.post("/api/assignments/:assignmentId/comments", isAuthenticated, validateBody(insertAssignmentCommentSchema), async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Check if user has access to this assignment
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only people involved with the assignment should be able to comment
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.id !== assignment.assignedByUserId && 
        currentUser.id !== assignment.assignedToUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot comment on this assignment" });
      }
      
      const comment = await storage.createAssignmentComment({
        ...req.body,
        assignmentId,
        userId: currentUser.id
      });
      
      // Create notification for the other party
      const notifyUserId = currentUser.id === assignment.assignedToUserId 
        ? assignment.assignedByUserId 
        : assignment.assignedToUserId;
      
      if (notifyUserId) {
        try {
          await storage.createNotification({
            userId: notifyUserId,
            relatedEntity: "Assignment",
            relatedEntityId: assignmentId,
            message: `New comment on assignment "${assignment.title}" from ${currentUser.name || ''}`,
            isRead: false
          });
        } catch (notificationError) {
          console.error("Failed to create notification:", notificationError);
          // Don't fail if notification creation fails
        }
      }
      
      // Return comment with user info
      const user = await storage.getUser(comment.userId);
      const commentWithUser = {
        ...comment,
        user: user ? {
          id: user.id,
          name: user.name || '',
        } : undefined
      };
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error creating assignment comment:", error);
      res.status(500).json({ message: "Failed to create assignment comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
