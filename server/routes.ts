import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  projectStatusEnum, roleEnum, userStatusEnum, ProjectGoal, InsertProjectGoal, updateProjectSchema,
  InsertProjectDependency, UpdateTask, UpdateAssignment, UpdateActionItem,
  insertDepartmentSchema, updateTaskSchema, updateAssignmentSchema, updateActionItemSchema,
  insertProjectSchema, insertTaskSchema, insertChangeRequestSchema, 
  insertProjectCostHistorySchema, insertGoalSchema, insertRiskIssueSchema,
  insertAssignmentSchema, insertActionItemSchema, insertWeeklyUpdateSchema,
  insertMilestoneSchema, updateMilestoneSchema, insertTaskMilestoneSchema
} from "@shared/schema";
import { z } from "zod";
import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { PgStorage } from "./pg-storage";
import { setupAuth } from "./auth";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerAnalyticsRoutes } from "./analytics-routes";
import express from "express";
import { sendEmail, sendPasswordResetEmail, sendApprovalNotificationEmail } from "./email";

// Create a new instance of the PostgreSQL storage
export const storage = new PgStorage();

// Add a type declaration to extend Express.User
declare global {
  namespace Express {
    interface User {
      id: number;
      role: string | null;
      departmentId: number | null;
    }
  }
}

/**
 * Send approval notifications to appropriate users (based on role and department)
 */
async function sendApprovalNotifications(
  itemType: 'Project' | 'ChangeRequest', 
  item: { id: number; title?: string; name?: string; departmentId?: number | null },
  requesterUserId?: number | null
): Promise<void> {
  try {
    // Determine who should receive the notification based on item type and department
    const targetRole = itemType === 'Project' ? 'SubPMO' : 'MainPMO';
    
    // For projects, find SubPMO users first; for other items, go directly to MainPMO
    const roleToNotify = targetRole;
    
    // Get the users with the target role
    const usersToNotify = await storage.getUsersByRole(roleToNotify);
    
    // Filter users by department if applicable
    const filteredUsers = item.departmentId
      ? usersToNotify.filter(user => user.departmentId === item.departmentId)
      : usersToNotify;
    
    // If no departmental approvers found, notify MainPMO as fallback
    const finalUsersToNotify = filteredUsers.length > 0 
      ? filteredUsers 
      : (targetRole === 'SubPMO' ? await storage.getUsersByRole('MainPMO') : filteredUsers);
    
    if (finalUsersToNotify.length === 0) {
      console.log(`No users found to notify for ${itemType} approval`);
      return;
    }
    
    // Add notifications for each user
    const itemName = item.title || item.name || `${itemType} #${item.id}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const approvalUrl = `${clientUrl}/approvals?type=${itemType.toLowerCase()}&id=${item.id}`;
    
    for (const user of finalUsersToNotify) {
      if (!user.email) continue;
      
      // Create in-app notification
      const notification = await storage.createNotification({
        userId: user.id,
        message: `A new ${itemType.toLowerCase()} "${itemName}" requires your approval.`,
        relatedEntity: itemType,
        relatedEntityId: item.id,
        isRead: false,
        requiresApproval: true
      });
      
      // Send email notification
      await sendApprovalNotificationEmail(
        user.email,
        itemType.toLowerCase(),
        itemName,
        item.id,
        approvalUrl
      );
      
      console.log(`Sent approval notification to ${user.email} for ${itemType} ${item.id}`);
    }
    
    // Also send a notification to the requester if provided
    if (requesterUserId) {
      const requester = await storage.getUser(requesterUserId);
      if (requester) {
        await storage.createNotification({
          userId: requesterUserId,
          message: `Your ${itemType.toLowerCase()} "${itemName}" has been submitted for approval.`,
          relatedEntity: itemType,
          relatedEntityId: item.id,
          isRead: false
        });
      }
    }
  } catch (error) {
    console.error(`Failed to send approval notifications for ${itemType} ${item.id}:`, error);
  }
}

// Helper function to validate date fields in project data
function transformProjectDates(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    // Convert ISO date strings to Date objects for any API endpoint that might contain dates
    if (req.body.startDate && typeof req.body.startDate === 'string') {
      try {
        // Create a new Date object from the ISO string
        const date = new Date(req.body.startDate);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          req.body.startDate = date;
        } else {
          console.error('Invalid startDate format:', req.body.startDate);
        }
      } catch (error) {
        console.error('Error parsing startDate:', error);
      }
    }
    
    if (req.body.deadline && typeof req.body.deadline === 'string') {
      try {
        // Create a new Date object from the ISO string
        const date = new Date(req.body.deadline);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          req.body.deadline = date;
        } else {
          console.error('Invalid deadline format:', req.body.deadline);
        }
      } catch (error) {
        console.error('Error parsing deadline:', error);
      }
    }
    
    // Handle endDate field from the client (map to deadline)
    if (req.body.endDate && typeof req.body.endDate === 'string') {
      try {
        // Create a new Date object from the ISO string
        const date = new Date(req.body.endDate);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          req.body.deadline = date;
          // Remove endDate since our schema doesn't have it
          delete req.body.endDate;
        } else {
          console.error('Invalid endDate format:', req.body.endDate);
        }
      } catch (error) {
        console.error('Error parsing endDate:', error);
      }
    }
  }
  next();
}

// Helper function to validate request body with Zod schema
function validateBody<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Pre-process dates before schema validation
      if (req.path.includes('/api/projects')) {
        transformProjectDates(req, res, () => {});
      }
      
      // Log the request body for debugging
      console.log('Validating request body:', req.body);
      
      // Let the schema handle validation - the transformProjectDates function 
      // should have already converted the dates properly
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Validating request body:', req.body);
        console.log('Validation errors:', error.errors);
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

// Advanced authenticated function with typed user object
function hasAuth(handler: (req: Request & { currentUser: Express.User }, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Create a typed version of the request with guaranteed user
    const typedReq = req as Request & { currentUser: Express.User };
    typedReq.currentUser = req.user;
    
    return handler(typedReq, res, next);
  };
}

// Helper function to check if user has required role(s)
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userRole = req.user.role || '';
    if (roles.includes(userRole)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  };
}

// Helper to check if user has role and is in the same department as the resource
function hasDepartmentAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userRole = req.user.role || '';
    // Admins and MainPMO have access to all departments
    if (["Administrator", "MainPMO", "Executive"].includes(userRole)) {
      return next();
    }
    
    const resourceId = parseInt(req.params.id);
    const resourceType = req.baseUrl.split('/').pop();
    
    let departmentId: number | undefined = undefined;
    
    // Determine the department ID of the resource
    switch (resourceType) {
      case 'projects':
        const project = await storage.getProject(resourceId);
        departmentId = project?.departmentId ?? undefined;
        break;
      case 'users':
        const user = await storage.getUser(resourceId);
        departmentId = user?.departmentId ?? undefined;
        break;
      // Add more resource types as needed
    }
    
    if (departmentId === undefined) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    const userDeptId = req.user.departmentId ?? -1;
    
    // Department directors can only access their department's resources
    if (userRole === "DepartmentDirector" && userDeptId === departmentId) {
      return next();
    }
    
    // Sub-PMO can only access their department's resources
    if (userRole === "SubPMO" && userDeptId === departmentId) {
      return next();
    }
    
    // Project managers can only access their department's resources and only if they're the manager
    if (userRole === "ProjectManager" && userDeptId === departmentId) {
      if (resourceType === 'projects') {
        const project = await storage.getProject(resourceId);
        if (project?.managerUserId === req.user.id) {
          return next();
        }
      }
    }
    
    // Regular users can only access their department's resources
    if (userRole === "User" && userDeptId === departmentId) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Insufficient permissions for this department's resources" });
  };
}

// Helper function to combine validation and auth
function validateAuthBody<T>(schema: z.Schema<T>) {
  return hasAuth((req: Request & { currentUser: Express.User }, res: Response, next: NextFunction) => {
    try {
      // Pre-process dates before schema validation
      if (req.path.includes('/api/projects')) {
        transformProjectDates(req, res, () => {});
      }
      
      // Log the request body for debugging
      console.log('Validating request body:', req.body);
      
      // Let the schema handle validation
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Validating request body:', req.body);
        console.log('Validation errors:', error.errors);
        res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
        return;
      }
      next(error);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // setup auth routes
  setupAuth(app);
  
  // Add date transformation middleware for API requests
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      // Apply date transformation for POST and PUT requests
      transformProjectDates(req, res, next);
    } else {
      next();
    }
  });
  
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
  app.get("/api/users", hasAuth(async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Filter based on user role
      let filteredUsers = users;
      
      if (req.currentUser.role === "DepartmentDirector") {
        // Department directors can only see users in their department
        filteredUsers = users.filter(user => user.departmentId === req.currentUser.departmentId);
      } else if (req.currentUser.role === "SubPMO") {
        // Sub-PMO can only see users in their department
        filteredUsers = users.filter(user => user.departmentId === req.currentUser.departmentId);
      } else if (!["Administrator", "MainPMO", "Executive"].includes(req.currentUser.role || '')) {
        // Other roles can only see active users in their department
        filteredUsers = users.filter(user => 
          user.departmentId === req.currentUser.departmentId && 
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
  }));
  
  app.get("/api/user/:id", hasAuth(async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Users can only view users in their department unless they're admins
      if (
        req.currentUser.role !== "Administrator" && 
        req.currentUser.role !== "MainPMO" && 
        req.currentUser.role !== "Executive" && 
        req.currentUser.departmentId !== user.departmentId && 
        req.currentUser.id !== userId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view user from different department" });
      }
      
      // Remove password field
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }));
  
  // Projects Routes
  app.get("/api/projects", hasAuth(async (req, res) => {
    try {
      const projects = await storage.getProjects();
      
      // Filter based on user role
      let filteredProjects = projects;
      
      if (req.currentUser.role === "DepartmentDirector") {
        // Department directors can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === req.currentUser.departmentId);
      } else if (req.currentUser.role === "SubPMO") {
        // Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === req.currentUser.departmentId);
      } else if (req.currentUser.role === "ProjectManager") {
        // Project managers can only see projects they manage or in their department
        filteredProjects = projects.filter(project => 
          project.managerUserId === req.currentUser.id || 
          project.departmentId === req.currentUser.departmentId
        );
      } else if (req.currentUser.role === "User") {
        // Regular users can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === req.currentUser.departmentId);
      }
      
      res.json(filteredProjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  }));
  
  app.get("/api/projects/:id", hasAuth(async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project
      if (
        req.currentUser.role !== "Administrator" && 
        req.currentUser.role !== "MainPMO" && 
        req.currentUser.role !== "Executive" && 
        req.currentUser.departmentId !== project.departmentId && 
        req.currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view project from different department" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  }));
  
  app.post(
    "/api/projects", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO", "SubPMO", "ProjectManager", "DepartmentDirector"]), 
    validateBody(insertProjectSchema),
    hasAuth(async (req, res) => {
      try {
        // Project Managers can only create projects in their department
        if (
          req.currentUser.role === "ProjectManager" && 
          req.body.departmentId !== req.currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // If creating as Project Manager, set manager to self
        if (req.currentUser.role === "ProjectManager" && !req.body.managerUserId) {
          req.body.managerUserId = req.currentUser.id;
        }
        
        // Department Directors can only create projects in their department
        if (
          req.currentUser.role === "DepartmentDirector" && 
          req.body.departmentId !== req.currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // Sub-PMO can only create projects in their department
        if (
          req.currentUser.role === "SubPMO" && 
          req.body.departmentId !== req.currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create project in different department" });
        }
        
        // Extract the project goals and project relationships from request body
        const { projectGoals, relatedProjects, relatedToProjects, ...projectData } = req.body;
        
        // Determine if project needs approval
        const needsApproval = req.currentUser.role === "ProjectManager";
        
        // If project needs approval, set status to "Pending"
        if (needsApproval) {
          projectData.status = "Pending";
        }
        
        // Create the project
        const newProject = await storage.createProject(projectData);
        
        // If project manager created this, notify the Sub-PMO of the same department
        if (needsApproval) {
          try {
            // Use the new utility function to send approval notifications
            await sendApprovalNotifications('Project', newProject, req.currentUser.id);
          } catch (notifyError) {
            console.error("Failed to send notification:", notifyError);
          }
        }
        
        // Create project goal relationships if provided
        if (projectGoals && projectGoals.length > 0) {
          for (const goalRelation of projectGoals) {
            if (goalRelation.goalId) {
              await storage.createProjectGoal({
                projectId: newProject.id,
                goalId: goalRelation.goalId,
                weight: goalRelation.weight || 1
              });
            }
          }
        }
        
        // Create project dependencies (projects this one depends on)
        if (relatedProjects && relatedProjects.length > 0) {
          for (const relation of relatedProjects) {
            if (relation.projectId) {
              // Create the project dependency
              await storage.createProjectDependency({
                projectId: newProject.id,
                dependsOnProjectId: relation.projectId
              });
            }
          }
        }
        
        // Create reverse project dependencies (projects that depend on this one)
        if (relatedToProjects && relatedToProjects.length > 0) {
          for (const relation of relatedToProjects) {
            if (relation.dependsOnProjectId) {
              // Create the project dependency
              await storage.createProjectDependency({
                projectId: relation.dependsOnProjectId,
                dependsOnProjectId: newProject.id
              });
            }
          }
        }
        
        res.status(201).json(newProject);
      } catch (error) {
        res.status(500).json({ message: "Failed to create project" });
      }
    })
  );
  
  app.put(
    "/api/projects/:id", 
    isAuthenticated, 
    validateBody(updateProjectSchema), 
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
          currentUser && 
          currentUser.role === "ProjectManager" && 
          project.managerUserId !== currentUser.id
        ) {
          return res.status(403).json({ message: "Forbidden: You are not the manager of this project" });
        }
        
        // Department Director can only update projects in their department
        if (
          currentUser && 
          currentUser.role === "DepartmentDirector" && 
          project.departmentId !== currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Project is not in your department" });
        }
        
        // Sub-PMO can only update projects in their department
        if (
          currentUser && 
          currentUser.role === "SubPMO" && 
          project.departmentId !== currentUser.departmentId
        ) {
          return res.status(403).json({ message: "Forbidden: Project is not in your department" });
        }
        
        // Regular users cannot update projects
        if (currentUser && currentUser.role === "User") {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update projects" });
        }
        
        const updatedProject = await storage.updateProject(projectId, req.body);
        res.json(updatedProject);
      } catch (error) {
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  );
  
  app.put(
    "/api/projects/:id/approve", 
    isAuthenticated,
    hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // SubPMO and Department Directors can only approve projects in their department
        if (
          req.currentUser.role === "SubPMO" || 
          req.currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project.departmentId !== req.currentUser.departmentId) {
            return res.status(403).json({ message: "Forbidden: Project is not in your department" });
          }
        }
        
        // If project status is Pending, approve it
        if (project.status === "Pending") {
          const updatedProject = await storage.updateProject(projectId, {
            status: "Planning" // Change to whatever the initial active status should be
          });
          
          // Notify the project manager
          try {
            if (project.managerUserId) {
              await storage.createNotification({
                userId: project.managerUserId,
                message: `Your project "${project.title}" has been approved.`,
                relatedEntity: "Project",
                relatedEntityId: projectId,
                isRead: false
              });
            }
          } catch (notifyError) {
            console.error("Failed to send notification:", notifyError);
          }
          
          res.json(updatedProject);
        } else {
          return res.status(400).json({ message: "Project is not pending approval" });
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to approve project" });
      }
    })
  );
  
  app.put(
    "/api/projects/:id/reject", 
    isAuthenticated,
    hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // SubPMO and Department Directors can only reject projects in their department
        if (
          req.currentUser.role === "SubPMO" || 
          req.currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project.departmentId !== req.currentUser.departmentId) {
            return res.status(403).json({ message: "Forbidden: Project is not in your department" });
          }
        }
        
        // Validation: Rejection reason is required
        if (!req.body.rejectionReason || req.body.rejectionReason.trim() === '') {
          return res.status(400).json({ message: "Rejection reason is required" });
        }
        
        // If project status is Pending, reject it
        if (project.status === "Pending") {
          const updatedProject = await storage.updateProject(projectId, {
            // Using "Completed" as a workaround since there's no proper "Rejected" status in the database schema
            // TODO: Add a proper "Rejected" status to the project status enum
            status: "Completed"
          });
          
          // Notify the project manager
          try {
            if (project.managerUserId) {
              await storage.createNotification({
                userId: project.managerUserId,
                message: `Your project "${project.title}" has been rejected. Reason: ${req.body.rejectionReason}`,
                relatedEntity: "Project",
                relatedEntityId: projectId,
                isRead: false
              });
            }
          } catch (notifyError) {
            console.error("Failed to send notification:", notifyError);
          }
          
          res.json(updatedProject);
        } else {
          return res.status(400).json({ message: "Project is not pending approval" });
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to reject project" });
      }
    })
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
        currentUser && 
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
  
  app.get("/api/tasks", hasAuth(async (req, res) => {
    try {
      const assignedToMe = await storage.getTasksByAssignee(req.currentUser.id);
      const assignedByMe = await storage.getTasksByCreator(req.currentUser.id);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  }));
  
  app.post(
    "/api/projects/:projectId/tasks", 
    validateBody(insertTaskSchema),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if user can create tasks in this project
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.departmentId !== project.departmentId && 
          req.currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Cannot create tasks in different department's project" });
        }
        
        const taskData = {
          ...req.body,
          projectId,
          createdByUserId: req.currentUser.id
        };
        
        const newTask = await storage.createTask(taskData);
        res.status(201).json(newTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to create task" });
      }
    })
  );
  
  app.put(
    "/api/tasks/:id", 
    validateBody(updateTaskSchema),
    hasAuth(async (req, res) => {
      try {
        const taskId = parseInt(req.params.id);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        // Check permissions for updating the task
        const project = await storage.getProject(task.projectId);
        
        // Only task creator, project manager, or admin can update tasks
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.id !== task.createdByUserId && 
          req.currentUser.id !== project?.managerUserId && 
          req.currentUser.role !== "DepartmentDirector" && 
          (req.currentUser.role === "DepartmentDirector" && req.currentUser.departmentId !== project?.departmentId)
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update this task" });
        }
        
        const updatedTask = await storage.updateTask(taskId, req.body);
        res.json(updatedTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to update task" });
      }
    })
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
        currentUser && 
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
      
      if (currentUser && (currentUser.role === "SubPMO" || currentUser.role === "DepartmentDirector")) {
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
    validateBody(insertChangeRequestSchema),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager or higher roles can create change requests
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId && 
          req.currentUser.role !== "ProjectManager"
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to create change requests" });
        }
        
        const changeRequestData = {
          ...req.body,
          projectId,
          requestedByUserId: req.currentUser.id,
          status: "Pending"
        };
        
        const newChangeRequest = await storage.createChangeRequest(changeRequestData);
        
        // Send approval notifications for the change request
        try {
          await sendApprovalNotifications('ChangeRequest', {
            id: newChangeRequest.id,
            title: newChangeRequest.details || `Change Request #${newChangeRequest.id}`,
            departmentId: project.departmentId
          }, req.currentUser.id);
        } catch (notifyError) {
          console.error("Failed to send approval notifications:", notifyError);
        }
        
        res.status(201).json(newChangeRequest);
      } catch (error) {
        res.status(500).json({ message: "Failed to create change request" });
      }
    })
  );
  
  app.put(
    "/api/change-requests/:id", 
    hasAuth(async (req, res) => {
      try {
        const changeRequestId = parseInt(req.params.id);
        const changeRequest = await storage.getChangeRequest(changeRequestId);
        
        if (!changeRequest) {
          return res.status(404).json({ message: "Change request not found" });
        }
        
        // Check if user can approve/reject this change request
        const project = await storage.getProject(changeRequest.projectId);
        
        // SubPMO and Department Directors can only approve/reject from their department
        if (
          req.currentUser.role === "SubPMO" || 
          req.currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project && project.departmentId !== req.currentUser.departmentId) {
            return res.status(403).json({ message: "Forbidden: Change request is for a project outside your department" });
          }
        }
        
        // Special handling for different change request types
        let updatedStatus = req.body.status;
        let implementChanges = false;
        
        // Handle approval flow
        if (req.body.status === "Approved") {
          if (changeRequest.type === "Faculty") {
            // If it's a Faculty change and SubPMO or higher approves, immediately approve and implement
            if (req.currentUser.role && ["SubPMO", "MainPMO", "Administrator"].includes(req.currentUser.role)) {
              updatedStatus = "Approved";
              implementChanges = true;
            }
          } else {
            // For non-Faculty change requests, maintain the two-step workflow
            if (req.currentUser.role === "SubPMO") {
              updatedStatus = "PendingMainPMO";
            } else if (changeRequest.status === "PendingMainPMO" && 
                     req.currentUser.role && ["Administrator", "MainPMO"].includes(req.currentUser.role)) {
              updatedStatus = "Approved";
              implementChanges = true;
            } else if (req.currentUser.role && ["Administrator", "MainPMO"].includes(req.currentUser.role)) {
              updatedStatus = "Approved";
              implementChanges = true;
            }
          }
        }
        // Handle rejection flow
        else if (req.body.status === "Rejected") {
          // Validation: Rejection reason is required
          if (!req.body.rejectionReason || req.body.rejectionReason.trim() === '') {
            return res.status(400).json({ message: "Rejection reason is required" });
          }
          
          // Determine where to return the request based on role and specified returnTo
          if (req.currentUser.role === "MainPMO" || req.currentUser.role === "Administrator") {
            // Main PMO can choose where to return a rejected request
            if (req.body.returnTo === "SubPMO") {
              updatedStatus = "ReturnedToSubPMO";
            } else {
              updatedStatus = "ReturnedToProjectManager";
            }
          } else if (req.currentUser.role === "SubPMO") {
            // Sub PMO always returns to Project Manager
            updatedStatus = "ReturnedToProjectManager";
          } else {
            updatedStatus = "Rejected";
          }
        }
        
        const updateData = {
          ...req.body,
          status: updatedStatus,
          reviewedByUserId: req.currentUser.id,
          reviewedAt: new Date()
        };
        
        const updatedChangeRequest = await storage.updateChangeRequest(changeRequestId, updateData);
        
        // Only implement the requested changes if approved and implementChanges flag is true
        if (implementChanges && updatedChangeRequest?.status === "Approved" && project) {
          // Implement the changes based on change request type
          switch (updatedChangeRequest.type) {
            case "Status":
              // Update project status
              if (req.body.newStatus) {
                await storage.updateProject(project.id, { status: req.body.newStatus });
              }
              break;
              
            case "Budget":
              // Update project budget
              if (req.body.newBudget) {
                await storage.updateProject(project.id, { budget: req.body.newBudget });
              }
              break;
              
            case "Schedule":
              // Update project deadline
              if (req.body.newDeadline) {
                await storage.updateProject(project.id, { deadline: new Date(req.body.newDeadline) });
              }
              break;
              
            case "Faculty":
              // Handle Faculty-specific changes
              if (req.body.facultyChangeType === "Delegate" && req.body.newManagerId) {
                await storage.updateProject(project.id, { managerUserId: req.body.newManagerId });
              }
              // Additional faculty change types can be handled here
              break;
              
            case "Scope":
              // Update project description/scope
              if (req.body.newDescription) {
                await storage.updateProject(project.id, { description: req.body.newDescription });
              }
              break;
              
            case "AdjustTeam":
              // Team adjustments would be handled elsewhere through the project members API
              break;
              
            case "Closure":
              // Handle project closure
              await storage.updateProject(project.id, { 
                status: "Completed",
                // Could update additional fields for closed projects
              });
              break;
          }
        }
        
        // Notify the project manager or SubPMO about the rejection as appropriate
        if (updatedStatus === "ReturnedToProjectManager" || updatedStatus === "ReturnedToSubPMO") {
          try {
            // Find the relevant user to notify (project manager or SubPMO)
            let notifyUserId = project?.managerUserId;
            if (updatedStatus === "ReturnedToSubPMO") {
              // Find a SubPMO user from the same department (simplified approach)
              const subPMOUsers = await storage.getUsersByRole("SubPMO");
              const departmentSubPMO = subPMOUsers.find(user => user.departmentId === project?.departmentId);
              if (departmentSubPMO) {
                notifyUserId = departmentSubPMO.id;
              }
            }
            
            if (notifyUserId) {
              await storage.createNotification({
                userId: notifyUserId,
                message: `A change request has been rejected and returned to you for revisions. Reason: ${req.body.rejectionReason}`,
                relatedEntity: "ChangeRequest",
                relatedEntityId: changeRequestId,
                isRead: false
              });
            }
          } catch (notifyError) {
            console.error("Failed to send notification:", notifyError);
          }
        }
        
        res.json(updatedChangeRequest);
      } catch (error) {
        res.status(500).json({ message: "Failed to update change request" });
      }
    })
  );
  
  // Cost History Routes
  app.post(
    "/api/projects/:projectId/cost-history", 
    validateBody(insertProjectCostHistorySchema),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager or higher roles can update cost
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update project cost" });
        }
        
        const costHistoryData = {
          ...req.body,
          projectId,
          updatedByUserId: req.currentUser.id
        };
        
        const newCostHistory = await storage.createProjectCostHistory(costHistoryData);
        res.status(201).json(newCostHistory);
      } catch (error) {
        res.status(500).json({ message: "Failed to update project cost" });
      }
    })
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
        currentUser && 
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
      
      if (currentUser && currentUser.role === "DepartmentDirector") {
        // Department directors can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      } else if (currentUser && currentUser.role === "SubPMO") {
        // Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      } else if (currentUser && currentUser.role === "ProjectManager") {
        // Project managers can only see projects they manage
        filteredProjects = projects.filter(project => project.managerUserId === currentUser.id);
      } else if (currentUser && currentUser.role === "User") {
        // Regular users can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentId === currentUser.departmentId);
      }
      
      // Calculate budget summary with null safety
      const totalBudget = filteredProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
      const actualCost = filteredProjects.reduce((sum, project) => sum + (project.actualCost || 0), 0);
      const remainingBudget = totalBudget - actualCost;
      
      // Simplified prediction calculation with null safety
      const predictedCost = filteredProjects.reduce((sum, project) => {
        // Get budget and actualCost with null safety
        const budget = project.budget || 0;
        const actualCost = project.actualCost || 0;
        
        // Basic prediction: If less than 50% progress but more than 60% spent, predict overrun
        const percentSpent = budget > 0 ? (actualCost / budget) : 0;
        // Assuming we had a progress field, we'd use that instead of this dummy calculation
        const progress = 0.5; // Dummy progress value
        
        // If spending faster than progress, predict overrun
        if (progress < 0.5 && percentSpent > 0.6) {
          return sum + (budget * 1.2); // 20% overrun prediction
        }
        return sum + budget;
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
  app.get("/api/notifications", hasAuth(async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.currentUser.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }));
  
  app.post("/api/notifications/:id/read", hasAuth(async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Users can only mark their own notifications as read
      if (notification.userId !== req.currentUser.id) {
        return res.status(403).json({ message: "Forbidden: Not your notification" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }));
  
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
    validateBody(insertGoalSchema),
    hasRole(["Administrator", "MainPMO", "DepartmentDirector", "Executive"]),
    hasAuth(async (req, res) => {
      try {
        const goalData = {
          ...req.body,
          createdByUserId: req.currentUser.id
        };
        
        const newGoal = await storage.createGoal(goalData);
        res.status(201).json(newGoal);
      } catch (error) {
        res.status(500).json({ message: "Failed to create goal" });
      }
    })
  );
  
  // Risks & Issues Routes
  app.get("/api/risks-issues", hasAuth(async (req, res) => {
    try {
      // Get all risks and issues the user has access to
      // Fix the concat operation by properly awaiting the promises
      const risks = await storage.getRisks();
      const issues = await storage.getIssues();
      const allRisksIssues = [...risks, ...issues];
      
      // Filter based on user role and department
      let filteredRisksIssues = allRisksIssues;
      
      if (!["Administrator", "MainPMO", "Executive"].includes(req.currentUser.role || '')) {
        // For other roles, filter by department
        filteredRisksIssues = [];
        
        for (const ri of allRisksIssues) {
          const project = await storage.getProject(ri.projectId);
          if (project && project.departmentId === req.currentUser.departmentId) {
            filteredRisksIssues.push(ri);
          }
        }
      }
      
      res.json({
        risks: filteredRisksIssues.filter((ri): ri is typeof ri & { type: 'Risk' } => ri.type === "Risk"),
        issues: filteredRisksIssues.filter((ri): ri is typeof ri & { type: 'Issue' } => ri.type === "Issue")
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch risks and issues" });
    }
  }));
  
  app.post(
    "/api/projects/:projectId/risks-issues", 
    validateBody(insertRiskIssueSchema),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project managers or higher roles can create risks/issues
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to create risks/issues" });
        }
        
        const riskIssueData = {
          ...req.body,
          projectId,
          createdByUserId: req.currentUser.id
        };
        
        const newRiskIssue = await storage.createRiskIssue(riskIssueData);
        res.status(201).json(newRiskIssue);
      } catch (error) {
        res.status(500).json({ message: "Failed to create risk/issue" });
      }
    })
  );
  
  // Assignments Routes
  app.get("/api/assignments", hasAuth(async (req, res) => {
    try {
      const assignedToMe = await storage.getAssignmentsByAssignee(req.currentUser.id);
      const assignedByMe = await storage.getAssignmentsByAssigner(req.currentUser.id);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  }));
  
  app.post(
    "/api/assignments", 
    validateBody(insertAssignmentSchema),
    hasAuth(async (req, res) => {
      try {
        const assignmentData = {
          ...req.body,
          assignedByUserId: req.currentUser.id
        };
        
        const newAssignment = await storage.createAssignment(assignmentData);
        res.status(201).json(newAssignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to create assignment" });
      }
    })
  );
  
  app.put(
    "/api/assignments/:id", 
    validateBody(updateAssignmentSchema), 
    hasAuth(async (req, res) => {
      try {
        const assignmentId = parseInt(req.params.id);
        const assignment = await storage.getAssignment(assignmentId);
        
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        
        // Only the assigner or assignee can update the assignment
        if (
          req.currentUser.id !== assignment.assignedByUserId && 
          req.currentUser.id !== assignment.assignedToUserId && 
          req.currentUser.role !== "Administrator"
        ) {
          return res.status(403).json({ message: "Forbidden: You cannot modify this assignment" });
        }
        
        const updatedAssignment = await storage.updateAssignment(assignmentId, req.body);
        res.json(updatedAssignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update assignment" });
      }
    })
  );
  
  // Action Items Routes
  app.get("/api/action-items/user", isAuthenticated, hasAuth(async (req, res) => {
    try {
      // Use getActionItemsByAssignee as implemented in the MemStorage class
      const actionItems = await storage.getActionItemsByAssignee(req.currentUser.id);
      res.json(actionItems);
    } catch (error) {
      console.error("Error fetching action items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }));
  
  app.post(
    "/api/action-items", 
    validateBody(insertActionItemSchema),
    hasAuth(async (req, res) => {
      try {
        const actionItemData = {
          ...req.body,
          userId: req.currentUser.id
        };
        
        const newActionItem = await storage.createActionItem(actionItemData);
        res.status(201).json(newActionItem);
      } catch (error) {
        res.status(500).json({ message: "Failed to create action item" });
      }
    })
  );
  
  app.put(
    "/api/action-items/:id", 
    validateBody(updateActionItemSchema),
    hasAuth(async (req, res) => {
      try {
        const actionItemId = parseInt(req.params.id);
        const actionItem = await storage.getActionItem(actionItemId);
        
        if (!actionItem) {
          return res.status(404).json({ message: "Action item not found" });
        }
        
        // Users can only update their own action items
        if (actionItem.userId !== req.currentUser.id) {
          return res.status(403).json({ message: "Forbidden: Not your action item" });
        }
        
        const updatedActionItem = await storage.updateActionItem(actionItemId, req.body);
        res.json(updatedActionItem);
      } catch (error) {
        res.status(500).json({ message: "Failed to update action item" });
      }
    })
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
        currentUser && 
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
    validateBody(insertWeeklyUpdateSchema),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager can create weekly updates
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Only project manager can create weekly updates" });
        }
        
        const weeklyUpdateData = {
          ...req.body,
          projectId,
          createdByUserId: req.currentUser.id
        };
        
        const newWeeklyUpdate = await storage.createWeeklyUpdate(weeklyUpdateData);
        res.status(201).json(newWeeklyUpdate);
      } catch (error) {
        res.status(500).json({ message: "Failed to create weekly update" });
      }
    })
  );

  // Milestone Routes
  app.get("/api/projects/:projectId/milestones", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project's milestones
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view milestones from different department's project" });
      }
      
      const milestones = await storage.getMilestonesByProject(projectId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });
  
  app.get("/api/milestones/:id", isAuthenticated, async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      const milestone = await storage.getMilestone(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Check if user has access to this milestone's project
      const currentUser = req.user;
      const project = await storage.getProject(milestone.projectId);
      
      if (
        currentUser && 
        project &&
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view milestone from different department's project" });
      }
      
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestone" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/milestones", 
    validateBody(insertMilestoneSchema),
    hasAuth(async (req, res) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Only project manager or higher roles can create milestones
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to create milestones" });
        }
        
        const milestoneData = {
          ...req.body,
          projectId,
          createdByUserId: req.currentUser.id
        };
        
        const newMilestone = await storage.createMilestone(milestoneData);
        res.status(201).json(newMilestone);
      } catch (error) {
        res.status(500).json({ message: "Failed to create milestone" });
      }
    })
  );
  
  app.put(
    "/api/milestones/:id", 
    validateBody(updateMilestoneSchema),
    hasAuth(async (req, res) => {
      try {
        const milestoneId = parseInt(req.params.id);
        const milestone = await storage.getMilestone(milestoneId);
        
        if (!milestone) {
          return res.status(404).json({ message: "Milestone not found" });
        }
        
        // Check if user has permission to update this milestone
        const project = await storage.getProject(milestone.projectId);
        
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          (project && req.currentUser.role === "DepartmentDirector" && req.currentUser.departmentId !== project.departmentId) && 
          (project && req.currentUser.id !== project.managerUserId)
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update this milestone" });
        }
        
        const updatedMilestone = await storage.updateMilestone(milestoneId, req.body);
        res.json(updatedMilestone);
      } catch (error) {
        res.status(500).json({ message: "Failed to update milestone" });
      }
    })
  );
  
  // Task-Milestone Relationship Routes
  app.get("/api/tasks/:taskId/milestones", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to this task's project
      const currentUser = req.user;
      const project = await storage.getProject(task.projectId);
      
      if (
        currentUser && 
        project &&
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId &&
        currentUser.id !== task.assignedUserId &&
        currentUser.id !== task.createdByUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view task-milestone relationships from different department's project" });
      }
      
      const taskMilestones = await storage.getTaskMilestonesByTask(taskId);
      
      // Get the full milestone data for each relationship
      const milestoneDetails = await Promise.all(
        taskMilestones.map(async (tm) => {
          const milestone = await storage.getMilestone(tm.milestoneId);
          return {
            ...tm,
            milestone
          };
        })
      );
      
      res.json(milestoneDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task-milestone relationships" });
    }
  });
  
  app.get("/api/milestones/:milestoneId/tasks", isAuthenticated, async (req, res) => {
    try {
      const milestoneId = parseInt(req.params.milestoneId);
      const milestone = await storage.getMilestone(milestoneId);
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Check if user has access to this milestone's project
      const currentUser = req.user;
      const project = await storage.getProject(milestone.projectId);
      
      if (
        currentUser && 
        project &&
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentId !== project.departmentId && 
        currentUser.id !== project.managerUserId
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot view milestone-task relationships from different department's project" });
      }
      
      const taskMilestones = await storage.getTaskMilestonesByMilestone(milestoneId);
      
      // Get the full task data for each relationship
      const taskDetails = await Promise.all(
        taskMilestones.map(async (tm) => {
          const task = await storage.getTask(tm.taskId);
          return {
            ...tm,
            task
          };
        })
      );
      
      res.json(taskDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestone-task relationships" });
    }
  });
  
  app.post(
    "/api/tasks/:taskId/milestones", 
    validateBody(insertTaskMilestoneSchema),
    hasAuth(async (req, res) => {
      try {
        const taskId = parseInt(req.params.taskId);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        const milestoneId = req.body.milestoneId;
        const milestone = await storage.getMilestone(milestoneId);
        
        if (!milestone) {
          return res.status(404).json({ message: "Milestone not found" });
        }
        
        // Check if task and milestone belong to the same project
        if (task.projectId !== milestone.projectId) {
          return res.status(400).json({ message: "Task and milestone must belong to the same project" });
        }
        
        // Only project manager or higher roles can link tasks to milestones
        const project = await storage.getProject(task.projectId);
        
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          (project && req.currentUser.role === "DepartmentDirector" && req.currentUser.departmentId !== project.departmentId) && 
          (project && req.currentUser.id !== project.managerUserId)
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to link tasks to milestones" });
        }
        
        const taskMilestoneData = {
          ...req.body,
          taskId
        };
        
        const newTaskMilestone = await storage.createTaskMilestone(taskMilestoneData);
        res.status(201).json(newTaskMilestone);
      } catch (error) {
        res.status(500).json({ message: "Failed to link task to milestone" });
      }
    })
  );
  
  app.put(
    "/api/task-milestones/:id", 
    hasAuth(async (req, res) => {
      try {
        const taskMilestoneId = parseInt(req.params.id);
        const taskMilestone = await storage.getTaskMilestone(taskMilestoneId);
        
        if (!taskMilestone) {
          return res.status(404).json({ message: "Task-milestone relationship not found" });
        }
        
        // Check if user has permission to update this relationship
        const task = await storage.getTask(taskMilestone.taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        const project = await storage.getProject(task.projectId);
        
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          (project && req.currentUser.role === "DepartmentDirector" && req.currentUser.departmentId !== project.departmentId) && 
          (project && req.currentUser.id !== project.managerUserId)
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to update task-milestone relationship" });
        }
        
        // Only allow updating the weight property
        const updatedTaskMilestone = await storage.updateTaskMilestone(taskMilestoneId, {
          weight: req.body.weight
        });
        
        res.json(updatedTaskMilestone);
      } catch (error) {
        res.status(500).json({ message: "Failed to update task-milestone relationship" });
      }
    })
  );
  
  app.delete(
    "/api/task-milestones/:id", 
    hasAuth(async (req, res) => {
      try {
        const taskMilestoneId = parseInt(req.params.id);
        const taskMilestone = await storage.getTaskMilestone(taskMilestoneId);
        
        if (!taskMilestone) {
          return res.status(404).json({ message: "Task-milestone relationship not found" });
        }
        
        // Check if user has permission to delete this relationship
        const task = await storage.getTask(taskMilestone.taskId);
        
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        const project = await storage.getProject(task.projectId);
        
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          (project && req.currentUser.role === "DepartmentDirector" && req.currentUser.departmentId !== project.departmentId) && 
          (project && req.currentUser.id !== project.managerUserId)
        ) {
          return res.status(403).json({ message: "Forbidden: Insufficient permissions to delete task-milestone relationship" });
        }
        
        // Add a method to delete the task milestone and update milestone progress
        // This will be implemented in the storage class
        const deleted = await storage.deleteTaskMilestone(taskMilestoneId);
        
        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete task-milestone relationship" });
        }
        
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ message: "Failed to delete task-milestone relationship" });
      }
    })
  );

  // API Routes for Dashboard
  app.get("/api/dashboard", isAuthenticated, hasAuth(async (req, res) => {
    try {
      // Simplified dashboard data for the prototype
      const projects = await storage.getProjectsByManager(req.currentUser.id);
      const tasks = await storage.getTasksByAssignee(req.currentUser.id);
      const assignments = await storage.getAssignmentsByAssignee(req.currentUser.id);
      // Use getActionItemsByAssignee as implemented in the MemStorage class
      const actionItems = await storage.getActionItemsByAssignee(req.currentUser.id);
      
      // Get recent projects (last 5)
      const recentProjects = [...projects]
        .sort((a, b) => {
          // Use default timestamp if both updatedAt and createdAt are null
          const aTime = a.updatedAt?.getTime() || a.createdAt?.getTime() || 0;
          const bTime = b.updatedAt?.getTime() || b.createdAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      
      res.json({
        projects,
        tasks,
        assignments,
        actionItems,
        recentProjects
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }));

  // Get projects that need approval
  app.get("/api/projects/pending", isAuthenticated, hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]), async (req, res) => {
    try {
      const pendingProjects = await storage.getProjectsByStatus("Pending");
      
      // Filter based on user role
      const currentUser = req.user;
      let filteredProjects = pendingProjects;
      
      if (currentUser && (currentUser.role === "SubPMO" || currentUser.role === "DepartmentDirector")) {
        // Filter to only show projects in their department
        filteredProjects = pendingProjects.filter(project => project.departmentId === currentUser.departmentId);
      }
      
      res.json(filteredProjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending projects" });
    }
  });

  // Register analytics routes
  const analyticsRouter = express.Router();
  registerAnalyticsRoutes(analyticsRouter);
  app.use(analyticsRouter);

  const httpServer = createServer(app);
  return httpServer;
}
