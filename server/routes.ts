import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  projectStatus, userStatus, ProjectGoal, InsertProjectGoal, updateProjectSchema,
  InsertProjectDependency, UpdateTask, UpdateAssignment, UpdateActionItem,
  insertDepartmentSchema, updateTaskSchema, updateAssignmentSchema, updateActionItemSchema,
  insertProjectSchema, insertTaskSchema, insertChangeRequestSchema,
  insertProjectCostHistorySchema, insertGoalSchema, insertRiskIssueSchema,
  insertAssignmentSchema, insertActionItemSchema, insertWeeklyUpdateSchema,
  insertMilestoneSchema, updateMilestoneSchema, insertTaskMilestoneSchema,
  ProjectAttachment, InsertProjectAttachment, insertProjectAttachmentSchema
} from "@shared/schema";
import { z } from "zod";
import { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { PgStorage } from "./pg-storage";
import { setupAuth } from "./auth";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { registerAnalyticsRoutes } from "./analytics-routes";
import { registerAuditLogRoutes } from "./audit-log-routes";
import express from "express";
import { sendEmail, sendPasswordResetEmail, sendApprovalNotificationEmail } from "./email";
import path from "path";
import http from 'http';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create a new instance of the PostgreSQL storage
export const storage = new PgStorage();

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'projects');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with UUID
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow various file types for project attachments
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents, images, and archives are allowed.'));
    }
  }
});

// Add a type declaration to extend Express.Request
declare global {
  namespace Express {
    interface Request {
      currentUser?: Express.User;
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
      ? usersToNotify.filter(user => user.departmentid === item.departmentId)
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

// Helper function to wrap route handlers and ensure they return void
function wrapHandler<T extends any[]>(
  handler: (...args: T) => any
): (...args: T) => void {
  return (...args: T): void => {
    const result = handler(...args);
    // If the result is a Promise, we don't need to do anything special
    // If it's a Response object, we just ignore the return value
    if (result instanceof Promise) {
      result.catch((error) => {
        // Handle any unhandled promise rejections
        console.error('Unhandled promise rejection in route handler:', error);
      });
    }
  };
}

// Helper function to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Advanced authenticated function with typed user object
function hasAuth(handler: (req: Request & { currentUser: Express.User }, res: Response, next: NextFunction) => Promise<void> | void) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    // Set currentUser to the authenticated user
    const reqWithUser = req as Request & { currentUser: Express.User };
    reqWithUser.currentUser = req.user as Express.User;
    
    try {
      await handler(reqWithUser, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// Helper function to check if user has required role(s)
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
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
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
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
        departmentId = project?.departmentid ?? undefined;
        break;
      case 'users':
        const user = await storage.getUser(resourceId);
        departmentId = user?.departmentid ?? undefined;
        break;
      // Add more resource types as needed
    }
    
    if (departmentId === undefined) {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
    
    const userDeptId = req.user.departmentid ?? -1;
    
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
function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Pre-process dates before schema validation
      if (req.path.includes('/api/projects')) {
        transformProjectDates(req, res, () => {});
      }
      
      // Log the request body for debugging
      console.log('Validating request body:', req.body);
      
      // Let the schema handle validation
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      console.error('Auth validation error:', error);
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

export async function registerRoutes(app: Express): Promise<Server> {
  // setup auth routes
  setupAuth(app);
  
  // Register audit log routes EARLY to avoid conflicts
  const auditLogRouter = express.Router();
  registerAuditLogRoutes(auditLogRouter, storage);
  app.use(auditLogRouter);
  
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
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
  app.get("/api/departments", isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/departments/:id", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        res.status(404).json({ message: "Department not found" });
        return;
      }
      
      res.json(department);
    } catch (error) {
      next(error);
    }
  });
  
  app.post(
    "/api/departments", 
    isAuthenticated,
    hasRole(["Administrator", "MainPMO"]),
    validateBody(insertDepartmentSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        console.log("Creating department with data:", JSON.stringify(req.body, null, 2));
        const newDepartment = await storage.createDepartment(req.body);
        console.log("Department created successfully:", JSON.stringify(newDepartment, null, 2));
        res.status(201).json(newDepartment);
      } catch (error) {
        console.error("Failed to create department:", error);
        if (error instanceof Error) {
          res.status(500).json({ message: `Failed to create department: ${error.message}` });
        } else {
          res.status(500).json({ message: "Failed to create department: Unknown error" });
        }
      }
    }
  );
  
  app.put(
    "/api/departments/:id", 
    isAuthenticated, 
    hasRole(["Administrator", "MainPMO"]), 
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const departmentId = parseInt(req.params.id);
        const updatedDepartment = await storage.updateDepartment(departmentId, req.body);
        
        if (!updatedDepartment) {
          res.status(404).json({ message: "Department not found" });
          return;
        }
        
        res.json(updatedDepartment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update department" });
      }
    }
  );
  
  // Users Routes (Admin)
  app.get("/api/users", hasAuth(async (req, res): Promise<void> => {
    try {
      const users = await storage.getUsers();
      
      // Filter based on user role
      let filteredUsers = users;
      
      if (req.currentUser.role === "DepartmentDirector") {
        // Department directors can only see users in their department
        filteredUsers = users.filter(user => user.departmentid === req.currentUser.departmentid);
      } else if (req.currentUser.role === "SubPMO") {
        // Sub-PMO can only see users in their department
        filteredUsers = users.filter(user => user.departmentid === req.currentUser.departmentid);
      } else if (!["Administrator", "MainPMO", "Executive"].includes(req.currentUser.role || '')) {
        // Other roles can only see users in their department
        filteredUsers = users.filter(user => 
          user.departmentid === req.currentUser.departmentid
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
  
  app.get("/api/user/:id", hasAuth(async (req, res): Promise<void> => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      // Users can only view users in their department unless they're admins
      if (
        req.currentUser.role !== "Administrator" && 
        req.currentUser.role !== "MainPMO" && 
        req.currentUser.role !== "Executive" && 
        req.currentUser.departmentid !== user.departmentid && 
        req.currentUser.id !== userId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view user from different department" });
        return;
      }
      
      // Remove password field
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }));
  
  // Projects Routes
  app.get("/api/projects", hasAuth(async (req, res): Promise<void> => {
    try {
      const projects = await storage.getProjects();
      
      // Filter based on user role
      let filteredProjects = projects;
      
      if (req.currentUser.role === "DepartmentDirector") {
          // Department directors can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentid === req.currentUser.departmentid);
      } else if (req.currentUser.role === "SubPMO") {
          // Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentid === req.currentUser.departmentid);
      } else if (req.currentUser.role === "ProjectManager") {
          // Project managers can only see projects they manage or in their department
          filteredProjects = projects.filter(project => 
          project.managerUserId === req.currentUser.id || 
          project.departmentid === req.currentUser.departmentid
          );
      } else if (req.currentUser.role === "User") {
          // Regular users can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentid === req.currentUser.departmentid);
      }
      
      // Enhance projects with milestone-based progress calculation
      const enhancedProjects = await Promise.all(
        filteredProjects.map(async (project) => {
          try {
            // Get milestones for this project
            const milestones = await storage.getMilestonesByProject(project.id);
            
            let completionPercentage = 0;
            let totalMilestones = milestones.length;
            let completedMilestones = 0;
            
            if (totalMilestones > 0) {
              // Calculate project progress based on milestone completion percentages
              const totalProgress = milestones.reduce((sum, milestone) => {
                return sum + (milestone.completionPercentage || 0);
              }, 0);
              
              completionPercentage = Math.round(totalProgress / totalMilestones);
              completedMilestones = milestones.filter(m => (m.completionPercentage || 0) >= 100).length;
            } else {
              // Fallback: If no milestones, calculate based on tasks directly
              const tasks = await storage.getTasksByProject(project.id);
              const totalTasks = tasks.length;
              
              if (totalTasks > 0) {
                const completedTasks = tasks.filter(task => task.status === "Completed").length;
                completionPercentage = Math.round((completedTasks / totalTasks) * 100);
              }
            }
            
            return {
              ...project,
              completionPercentage,
              totalMilestones,
              completedMilestones
            };
          } catch (error) {
            // If fetching fails for a project, return project with zero progress
            console.error(`Failed to calculate progress for project ${project.id}:`, error);
            return {
              ...project,
              completionPercentage: 0,
              totalMilestones: 0,
              completedMilestones: 0
            };
          }
        })
      );
      
      res.json(enhancedProjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  }));
  
  app.get("/api/projects/:id", hasAuth(async (req, res): Promise<void> => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project
      if (
        req.currentUser.role !== "Administrator" && 
        req.currentUser.role !== "MainPMO" && 
        req.currentUser.role !== "Executive" && 
        req.currentUser.departmentid !== project.departmentid && 
        req.currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view project from different department" });
        return;
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
    upload.fields([
      { name: 'projectPlanFile', maxCount: 1 },
      { name: 'attachments', maxCount: 10 }
    ]),
    hasAuth(async (req, res): Promise<void> => {
      try {
        // Get the project manager to determine department
        const managerId = parseInt(req.body.managerUserId);
        const projectManager = await storage.getUser(managerId);
        
        if (!projectManager) {
          res.status(400).json({ message: "Invalid project manager selected" });
          return;
        }

        // Parse the project data from FormData
        const projectData: any = {
          title: req.body.title,
          description: req.body.description || null,
          priority: req.body.priority || 'Medium',
          departmentId: projectManager.departmentid, // Automatically assign based on project manager
          managerUserId: managerId,
          budget: req.body.budget ? parseFloat(req.body.budget) : null,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate),
          status: 'Planning' // Default status for new projects
        };

        // Parse JSON fields
        let projectGoals = [];
        let relatedProjects = [];
        let relatedToProjects = [];
        
        try {
          if (req.body.projectGoals) {
            projectGoals = JSON.parse(req.body.projectGoals);
          }
          if (req.body.relatedProjects) {
            relatedProjects = JSON.parse(req.body.relatedProjects);
          }
          if (req.body.relatedToProjects) {
            relatedToProjects = JSON.parse(req.body.relatedToProjects);
          }
        } catch (parseError) {
          console.error('Error parsing JSON fields:', parseError);
        }

        // Project Managers can only create projects in their department
        if (
          req.currentUser.role === "ProjectManager" && 
          projectManager.departmentid !== req.currentUser.departmentid
        ) {
          res.status(403).json({ message: "Forbidden: Cannot assign project manager from different department" });
          return;
        }
        
        // Project Managers can only assign themselves as manager
        if (
          req.currentUser.role === "ProjectManager" && 
          managerId !== req.currentUser.id
        ) {
          res.status(403).json({ message: "Forbidden: Project managers can only assign themselves as manager" });
          return;
        }
        
        // Department Directors can only create projects in their department
        if (
          req.currentUser.role === "DepartmentDirector" && 
          projectManager.departmentid !== req.currentUser.departmentid
        ) {
          res.status(403).json({ message: "Forbidden: Cannot assign project manager from different department" });
          return;
        }
        
        // Sub-PMO can only create projects in their department
        if (
          req.currentUser.role === "SubPMO" && 
          projectManager.departmentid !== req.currentUser.departmentid
        ) {
          res.status(403).json({ message: "Forbidden: Cannot assign project manager from different department" });
          return;
        }
        
        // Determine if project needs approval
        const needsApproval = req.currentUser.role === "ProjectManager";
        
        // If project needs approval, set status to "Pending"
        if (needsApproval) {
          projectData.status = "Pending";
        }
        
        // Create the project
        const newProject = await storage.createProject(projectData);
        
        // Handle file uploads if any
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const attachments: any[] = [];
        
        // Handle project plan file
        if (files && files.projectPlanFile && files.projectPlanFile.length > 0) {
          const planFile = files.projectPlanFile[0];
          const planAttachment = await storage.createProjectAttachment({
            projectid: newProject.id,
            uploadeduserid: req.currentUser.id,
            filename: planFile.filename,
            originalname: planFile.originalname,
            filesize: planFile.size,
            filetype: planFile.mimetype,
            filepath: planFile.path,
            filecategory: 'plan',
            description: 'Project Plan Document',
            isprojectplan: true,
          });
          attachments.push(planAttachment);
        }
        
        // Handle additional attachments
        if (files && files.attachments && files.attachments.length > 0) {
          for (const file of files.attachments) {
            const attachment = await storage.createProjectAttachment({
              projectid: newProject.id,
              uploadeduserid: req.currentUser.id,
              filename: file.filename,
              originalname: file.originalname,
              filesize: file.size,
              filetype: file.mimetype,
              filepath: file.path,
              filecategory: 'general',
              description: 'Project Attachment',
              isprojectplan: false,
            });
            attachments.push(attachment);
          }
        }
        
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
        
        res.status(201).json({
          ...newProject,
          attachments: attachments
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to create project" });
      }
    })
  );
  
  app.put(
    "/api/projects/:id", 
    isAuthenticated, 
    validateBody(updateProjectSchema), 
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // Check permissions for updating the project
        const currentUser = req.user;
        
        // PM can only update projects they manage
        if (
          currentUser && 
          currentUser.role === "ProjectManager" && 
          project.managerUserId !== currentUser.id
        ) {
          res.status(403).json({ message: "Forbidden: You are not the manager of this project" });
          return;
        }
        
        // Department Director can only update projects in their department
        if (
          currentUser && 
          currentUser.role === "DepartmentDirector" && 
          project.departmentId !== currentUser.departmentid
        ) {
          res.status(403).json({ message: "Forbidden: Project is not in your department" });
          return;
        }
        
        // Sub-PMO can only update projects in their department
        if (
          currentUser && 
          currentUser.role === "SubPMO" && 
          project.departmentId !== currentUser.departmentid
        ) {
          res.status(403).json({ message: "Forbidden: Project is not in your department" });
          return;
        }
        
        // Regular users cannot update projects
        if (currentUser && currentUser.role === "User") {
          res.status(403).json({ message: "Forbidden: Insufficient permissions to update projects" });
          return;
        }
        
        // Check if status is changing to InProgress to create initial snapshot
        const isStatusChangingToInProgress = req.body.status === "InProgress" && project.status !== "InProgress";
        
        const updatedProject = await storage.updateProject(projectId, req.body);
        
        // Create initial snapshot if project just moved to InProgress
        if (isStatusChangingToInProgress && updatedProject.manageruserid) {
          try {
            await storage.createInitialSnapshot(projectId, updatedProject.manageruserid);
            console.log(`Created initial snapshot for project ${projectId}`);
          } catch (snapshotError) {
            console.error(`Failed to create initial snapshot for project ${projectId}:`, snapshotError);
            // Don't fail the whole request if snapshot creation fails
          }
        }
        
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // SubPMO and Department Directors can only approve projects in their department
        if (
          req.currentUser.role === "SubPMO" || 
          req.currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project.departmentid !== req.currentUser.departmentid) {
            res.status(403).json({ message: "Forbidden: Project is not in your department" });
            return;
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
          res.status(400).json({ message: "Project is not pending approval" });
          return;
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // SubPMO and Department Directors can only reject projects in their department
        if (
          req.currentUser.role === "SubPMO" || 
          req.currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project.departmentid !== req.currentUser.departmentid) {
            res.status(403).json({ message: "Forbidden: Project is not in your department" });
            return;
          }
        }
        
        // Validation: Rejection reason is required
        if (!req.body.rejectionReason || req.body.rejectionReason.trim() === '') {
          res.status(400).json({ message: "Rejection reason is required" });
          return;
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
          res.status(400).json({ message: "Project is not pending approval" });
          return;
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to reject project" });
      }
    })
  );
  
  // Tasks Routes
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project's tasks
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view tasks from different department's project" });
        return;
      }
      
      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  app.get("/api/tasks", hasAuth(async (req, res): Promise<void> => {
    try {
      console.log(`Getting tasks for user ID: ${req.currentUser.id}`);
      const assignedToMe = await storage.getTasksByAssignee(req.currentUser.id);
      const assignedByMe = await storage.getTasksByCreator(req.currentUser.id);
      
      console.log(`Found ${assignedToMe.length} tasks assigned to user and ${assignedByMe.length} tasks created by user`);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ 
        message: "Failed to fetch tasks", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }));
  
  // Direct task creation endpoint
  app.post(
    "/api/tasks", 
    validateBody(insertTaskSchema), 
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = req.body.projectId;
        if (!projectId) {
          res.status(400).json({ message: "Project ID is required" });
          return;
        }
        
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // Check if user can create tasks in this project
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.departmentid !== project.departmentid && 
          req.currentUser.id !== project.managerUserId
        ) {
          res.status(403).json({ message: "Forbidden: Cannot create tasks in different department's project" });
          return;
        }
        
        const taskData = {
          ...req.body,
          createdByUserId: req.currentUser.id
        };
        
        const newTask = await storage.createTask(taskData);
        
        // If task is assigned to someone, create a notification
        if (newTask.assignedUserId && newTask.assignedUserId !== req.currentUser.id) {
          try {
            await storage.createNotification({
              userId: newTask.assignedUserId,
              message: `You have been assigned a new task: "${newTask.title}"`,
              relatedEntity: "Task",
              relatedEntityId: newTask.id,
              isRead: false
            });
          } catch (notifyError) {
            console.error("Failed to create notification:", notifyError);
            // Don't fail the task creation if notification fails
          }
        }
        
        res.status(201).json(newTask);
      } catch (error) {
        console.error("Failed to create task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    })
  );
  
  app.post(
    "/api/projects/:projectId/tasks", 
    validateBody(insertTaskSchema),
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // Check if user can create tasks in this project
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.departmentid !== project.departmentid && 
          req.currentUser.id !== project.managerUserId
        ) {
          res.status(403).json({ message: "Forbidden: Cannot create tasks in different department's project" });
          return;
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const taskId = parseInt(req.params.id);
        const task = await storage.getTask(taskId);
        
        if (!task) {
          res.status(404).json({ message: "Task not found" });
          return;
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
          (req.currentUser.role === "DepartmentDirector" && req.currentUser.departmentid !== project?.departmentid)
        ) {
          res.status(403).json({ message: "Forbidden: Insufficient permissions to update this task" });
          return;
        }
        
        const updatedTask = await storage.updateTask(taskId, req.body);
        res.json(updatedTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to update task" });
      }
    })
  );
  
  // Project Members Routes
  app.get("/api/projects/:projectId/members", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project's team
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view team from different department's project" });
        return;
      }

      // Get all users assigned to tasks in this project
      const tasks = await storage.getTasksByProject(projectId);
      const assignedUserIds = new Set<number>(tasks
        .map(task => task.assignedUserId)
        .filter((id): id is number => id !== null && id !== undefined));
      
      // Add the project manager if they exist
      if (project.managerUserId) {
        assignedUserIds.add(project.managerUserId);
      }
      
      // Get user details for all team members
      const members = [];
      for (const userId of assignedUserIds) {
        const user = await storage.getUser(userId);
        if (user) {
          members.push({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentid,
            isManager: user.id === project.managerUserId
          });
        }
      }
      
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  // Change Requests Routes
  app.get("/api/projects/:projectId/change-requests", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project's change requests
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view change requests from different department's project" });
        return;
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
          if (project && project.departmentid === currentUser.departmentid) {
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
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
          res.status(403).json({ message: "Forbidden: Insufficient permissions to create change requests" });
          return;
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
            departmentId: project.departmentid
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const changeRequestId = parseInt(req.params.id);
        const changeRequest = await storage.getChangeRequest(changeRequestId);
        
        if (!changeRequest) {
          res.status(404).json({ message: "Change request not found" });
          return;
        }
        
        // Check if user can approve/reject this change request
        const project = await storage.getProject(changeRequest.projectId);
        
        // SubPMO and Department Directors can only approve/reject from their department
        if (
          req.currentUser.role === "SubPMO" || 
          req.currentUser.role === "DepartmentDirector"
        ) {
          // Check if the project is in their department
          if (project && project.departmentid !== req.currentUser.departmentid) {
            res.status(403).json({ message: "Forbidden: Change request is for a project outside your department" });
            return;
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
            res.status(400).json({ message: "Rejection reason is required" });
            return;
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
              // Update project deadline (using endDate since deadline doesn't exist in Project type)
              if (req.body.newDeadline) {
                await storage.updateProject(project.id, { endDate: new Date(req.body.newDeadline) });
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
              const departmentSubPMO = subPMOUsers.find(user => user.departmentid === project?.departmentid);
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // Only project manager or higher roles can update cost
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId
        ) {
          res.status(403).json({ message: "Forbidden: Insufficient permissions to update project cost" });
          return;
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
  
  app.get("/api/projects/:projectId/cost-history", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project's cost history
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view cost history from different department's project" });
        return;
      }
      
      const costHistory = await storage.getProjectCostHistoryByProject(projectId);
      res.json(costHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost history" });
    }
  });
  
  // Budget Summary
  app.get("/api/budget-summary", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projects = await storage.getProjects();
      
      // Filter projects based on user role
      const currentUser = req.user;
      let filteredProjects = projects;
      
      if (currentUser && currentUser.role === "DepartmentDirector") {
        // Department directors can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentid === currentUser.departmentid);
      } else if (currentUser && currentUser.role === "SubPMO") {
        // Sub-PMO can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentid === currentUser.departmentid);
      } else if (currentUser && currentUser.role === "ProjectManager") {
        // Project managers can only see projects they manage
        filteredProjects = projects.filter(project => project.managerUserId === currentUser.id);
      } else if (currentUser && currentUser.role === "User") {
        // Regular users can only see projects in their department
        filteredProjects = projects.filter(project => project.departmentid === currentUser.departmentid);
      }
      
      // Separate planning projects from active projects
      const planningProjects = filteredProjects.filter(project => project.status === "Planning");
      const activeProjects = filteredProjects.filter(project => project.status !== "Planning");
      
      // Calculate main budget summary (excluding planning projects)
      const totalBudget = activeProjects.reduce((sum, project) => {
        const budget = typeof project.budget === 'string' ? parseFloat(project.budget) : (project.budget || 0);
        return sum + budget;
      }, 0);
      const actualCost = activeProjects.reduce((sum, project) => {
        const cost = typeof project.actualCost === 'string' ? parseFloat(project.actualCost) : (project.actualCost || 0);
        return sum + cost;
      }, 0);
      const remainingBudget = totalBudget - actualCost;
      
      // Calculate planning projects budget (separate)
      const planningBudget = planningProjects.reduce((sum, project) => {
        const budget = typeof project.budget === 'string' ? parseFloat(project.budget) : (project.budget || 0);
        return sum + budget;
      }, 0);
      const planningCount = planningProjects.length;
      
      // Simplified prediction calculation with null safety
      const predictedCost = activeProjects.reduce((sum, project) => {
        // Get budget and actualCost with null safety
        const budget = typeof project.budget === 'string' ? parseFloat(project.budget) : (project.budget || 0);
        const actualCost = typeof project.actualCost === 'string' ? parseFloat(project.actualCost) : (project.actualCost || 0);
        
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
        predictedCost,
        // Planning projects data (separate from main budget)
        planningBudget,
        planningCount,
        activeProjectsCount: activeProjects.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate budget summary" });
    }
  });
  
  // Notifications Routes
  app.get("/api/notifications", hasAuth(async (req, res): Promise<void> => {
    try {
      const notifications = await storage.getNotificationsByUser(req.currentUser.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  }));
  
  app.post("/api/notifications/:id/read", hasAuth(async (req, res): Promise<void> => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      
      // Users can only mark their own notifications as read
      if (notification.userId !== req.currentUser.id) {
        res.status(403).json({ message: "Forbidden: Not your notification" });
        return;
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }));
  
  // Goals Routes
  app.get("/api/goals", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    hasAuth(async (req, res): Promise<void> => {
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
  app.get("/api/risks-issues", hasAuth(async (req, res): Promise<void> => {
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
          if (project && project.departmentid === req.currentUser.departmentid) {
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
  
  // Get project risks and issues
  app.get("/api/projects/:projectId/risks-issues", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      const risksIssues = await storage.getRiskIssuesByProject(projectId);
      res.json(risksIssues);
    } catch (error) {
      console.error("Error fetching project risks and issues:", error);
      res.status(500).json({ message: "Failed to fetch project risks and issues" });
    }
  });

  app.post(
    "/api/projects/:projectId/risks-issues", 
    validateBody(insertRiskIssueSchema), 
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // Only project managers or higher roles can create risks/issues
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId
        ) {
          res.status(403).json({ message: "Forbidden: Insufficient permissions to create risks/issues" });
          return;
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
  app.get("/api/assignments", hasAuth(async (req, res): Promise<void> => {
    try {
      console.log(`Getting assignments for user ID: ${req.currentUser.id}`);
      const assignedToMe = await storage.getAssignmentsByAssignee(req.currentUser.id);
      const assignedByMe = await storage.getAssignmentsByAssigner(req.currentUser.id);
      
      console.log(`Found ${assignedToMe.length} assignments assigned to user and ${assignedByMe.length} assignments created by user`);
      
      res.json({
        assignedToMe,
        assignedByMe
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ 
        message: "Failed to fetch assignments", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }));
  
  app.post(
    "/api/assignments", 
    validateBody(insertAssignmentSchema), 
    hasAuth(async (req, res): Promise<void> => {
      try {
        console.log("Creating new assignment:", req.body);
        const assignmentData = {
          ...req.body,
          assignedByUserId: req.currentUser.id
        };
        
        const newAssignment = await storage.createAssignment(assignmentData);
        
        // Create notification for assignee
        if (newAssignment.assignedToUserId !== req.currentUser.id) {
          try {
            await storage.createNotification({
              userId: newAssignment.assignedToUserId,
              message: `You have been assigned a new assignment: "${newAssignment.title}"`,
              relatedEntity: "Assignment",
              relatedEntityId: newAssignment.id,
              isRead: false
            });
          } catch (notifyError) {
            console.error("Failed to create notification for assignment:", notifyError);
            // Don't fail the assignment creation if notification fails
          }
        }
        
        console.log("Assignment created successfully:", newAssignment);
        res.status(201).json(newAssignment);
      } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ 
          message: "Failed to create assignment", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    })
  );
  
  app.put(
    "/api/assignments/:id", 
    validateBody(updateAssignmentSchema), 
    hasAuth(async (req, res): Promise<void> => {
      try {
        const assignmentId = parseInt(req.params.id);
        const assignment = await storage.getAssignment(assignmentId);
        
        if (!assignment) {
          res.status(404).json({ message: "Assignment not found" });
          return;
        }
        
        // Only the assigner or assignee can update the assignment
        if (
          req.currentUser.id !== assignment.assignedByUserId && 
          req.currentUser.id !== assignment.assignedToUserId && 
          req.currentUser.role !== "Administrator"
        ) {
          res.status(403).json({ message: "Forbidden: You cannot modify this assignment" });
          return;
        }
        
        const updatedAssignment = await storage.updateAssignment(assignmentId, req.body);
        res.json(updatedAssignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update assignment" });
      }
    })
  );
  
  // Action Items Routes
  app.get("/api/action-items/user", isAuthenticated, hasAuth(async (req, res): Promise<void> => {
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
    hasAuth(async (req, res): Promise<void> => {
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const actionItemId = parseInt(req.params.id);
        const actionItem = await storage.getActionItem(actionItemId);
        
        if (!actionItem) {
          res.status(404).json({ message: "Action item not found" });
          return;
        }
        
        // Users can only update their own action items
        if (actionItem.userId !== req.currentUser.id) {
          res.status(403).json({ message: "Forbidden: Not your action item" });
          return;
        }
        
        const updatedActionItem = await storage.updateActionItem(actionItemId, req.body);
        res.json(updatedActionItem);
      } catch (error) {
        res.status(500).json({ message: "Failed to update action item" });
      }
    })
  );
  
  // Weekly Updates Routes
  app.get("/api/projects/:projectId/weekly-updates", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project's weekly updates
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view weekly updates from different department's project" });
        return;
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
    hasAuth(async (req, res): Promise<void> => {
      try {
        const projectId = parseInt(req.params.projectId);
        const project = await storage.getProject(projectId);
        
        if (!project) {
          res.status(404).json({ message: "Project not found" });
          return;
        }
        
        // Don't allow weekly updates for completed, cancelled, or pending projects
        if (project.status === "Completed" || project.status === "Cancelled" || project.status === "Pending") {
          res.status(400).json({ message: "Cannot create weekly updates for projects that are completed, cancelled, or pending" });
          return;
        }
        
        // Only project manager can create weekly updates
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.id !== project.managerUserId
        ) {
          res.status(403).json({ message: "Forbidden: Only project manager can create weekly updates" });
          return;
        }
        
        // Get current week and year
        const currentDate = new Date();
        const currentWeek = getWeekNumber(currentDate);
        const currentYear = currentDate.getFullYear();
        
        // Check if weekly update already exists for this week
        const existingUpdates = await storage.getWeeklyUpdatesByProject(projectId);
        const weekUpdateExists = existingUpdates.some(update => 
          update.weekNumber === currentWeek && 
          update.year === currentYear
        );
        
        if (weekUpdateExists) {
          res.status(400).json({ message: "Weekly update already exists for this week" });
          return;
        }
        
        const weeklyUpdateData = {
          ...req.body,
          projectId,
          weekNumber: currentWeek,
          year: currentYear,
          createdByUserId: req.currentUser.id
        };
        
        const newWeeklyUpdate = await storage.createWeeklyUpdate(weeklyUpdateData);
        res.status(201).json(newWeeklyUpdate);
      } catch (error) {
        res.status(500).json({ message: "Failed to create weekly update" });
      }
    })
  );

  // Check if project has missed weekly update (for UI color indication)
  app.get("/api/projects/:projectId/missed-weekly-update", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Import the function from weekly update checker
      const { hasProjectMissedWeeklyUpdate } = await import('./jobs/weekly-update-checker');
      const hasMissed = await hasProjectMissedWeeklyUpdate(projectId);
      
      res.json({ hasMissedUpdate: hasMissed });
    } catch (error) {
      res.status(500).json({ message: "Failed to check weekly update status" });
    }
  });

  // Project Favorites Routes
  app.post("/api/projects/:projectId/favorite", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if already favorited
      const isAlreadyFavorited = await storage.isProjectFavorite(userId, projectId);
      if (isAlreadyFavorited) {
        res.status(409).json({ message: "Project is already favorited" });
        return;
      }
      
      const favorite = await storage.addProjectFavorite({ userId, projectId });
      res.status(201).json(favorite);
    } catch (error) {
      console.error('Error adding project favorite:', error);
      res.status(500).json({ message: "Failed to add project to favorites" });
    }
  });
  
  app.delete("/api/projects/:projectId/favorite", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const success = await storage.removeProjectFavorite(userId, projectId);
      if (!success) {
        res.status(404).json({ message: "Favorite not found" });
        return;
      }
      
      res.status(200).json({ message: "Project removed from favorites" });
    } catch (error) {
      console.error('Error removing project favorite:', error);
      res.status(500).json({ message: "Failed to remove project from favorites" });
    }
  });
  
  app.get("/api/users/:userId/favorite-projects", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);
      const currentUser = req.user;
      
      // Users can only access their own favorites unless they're an admin
      if (currentUser?.id !== userId && currentUser?.role !== "Administrator" && currentUser?.role !== "MainPMO") {
        res.status(403).json({ message: "Access denied" });
        return;
      }
      
      const favorites = await storage.getUserFavoriteProjects(userId);
      
      // Get full project details for each favorite
      const favoriteProjects = await Promise.all(
        favorites.map(async (favorite) => {
          const project = await storage.getProject(favorite.projectId);
          return {
            ...favorite,
            project: project
          };
        })
      );
      
      res.json(favoriteProjects);
    } catch (error) {
      console.error('Error getting user favorite projects:', error);
      res.status(500).json({ message: "Failed to get favorite projects" });
    }
  });
  
  app.get("/api/projects/:projectId/is-favorited", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      const isFavorited = await storage.isProjectFavorite(userId, projectId);
      res.json({ isFavorited });
    } catch (error) {
      console.error('Error checking if project is favorited:', error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Project Attachment Routes
  app.get("/api/projects/:projectId/attachments", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view attachments from different department's project" });
        return;
      }
      
      const attachments = await storage.getProjectAttachments(projectId);
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching project attachments:', error);
      res.status(500).json({ message: "Failed to fetch project attachments" });
    }
  });

  app.get("/api/projects/:projectId/plan", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view project plan from different department's project" });
        return;
      }
      
      const projectPlan = await storage.getProjectPlan(projectId);
      res.json(projectPlan);
    } catch (error) {
      console.error('Error fetching project plan:', error);
      res.status(500).json({ message: "Failed to fetch project plan" });
    }
  });

  app.post("/api/projects/:projectId/attachments", isAuthenticated, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      // Check if user has permission to upload files to this project
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "SubPMO" && 
        currentUser.role !== "DepartmentDirector" && 
        currentUser.id !== project.managerUserId &&
        currentUser.departmentid !== project.departmentid
      ) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions to upload files to this project" });
        return;
      }
      
      const { description = '', category = 'general', isProjectPlan = false } = req.body;
      
      // If setting as project plan, ensure only one project plan exists
      if (isProjectPlan === 'true' || isProjectPlan === true) {
        // This will be handled by the setProjectPlan method after creation
      }
      
      const attachmentData = {
        projectid: projectId,
        uploadeduserid: currentUser.id,
        filename: req.file.filename,
        originalname: req.file.originalname,
        filesize: req.file.size,
        filetype: req.file.mimetype,
        filepath: req.file.path,
        filecategory: category,
        description: description,
        isprojectplan: (isProjectPlan === 'true' || isProjectPlan === true),
      };
      
      const newAttachment = await storage.createProjectAttachment(attachmentData);
      
      // If this is marked as a project plan, ensure only this one is marked as the plan
      if (isProjectPlan === 'true' || isProjectPlan === true) {
        await storage.setProjectPlan(projectId, newAttachment.id);
      }
      
      res.status(201).json(newAttachment);
    } catch (error) {
      console.error('Error uploading project attachment:', error);
      res.status(500).json({ message: "Failed to upload project attachment" });
    }
  });

  app.put("/api/projects/:projectId/plan/:attachmentId", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const attachmentId = parseInt(req.params.attachmentId);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      const attachment = await storage.getProjectAttachment(attachmentId);
      if (!attachment || attachment.projectid !== projectId) {
        res.status(404).json({ message: "Attachment not found" });
        return;
      }
      
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      // Check permissions
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "SubPMO" && 
        currentUser.role !== "DepartmentDirector" && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions to set project plan" });
        return;
      }
      
      const success = await storage.setProjectPlan(projectId, attachmentId);
      if (success) {
        res.json({ message: "Project plan updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update project plan" });
      }
    } catch (error) {
      console.error('Error setting project plan:', error);
      res.status(500).json({ message: "Failed to set project plan" });
    }
  });

  app.delete("/api/attachments/:id", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getProjectAttachment(attachmentId);
      
      if (!attachment) {
        res.status(404).json({ message: "Attachment not found" });
        return;
      }
      
      const project = await storage.getProject(attachment.projectid);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      // Check permissions
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "SubPMO" && 
        currentUser.role !== "DepartmentDirector" && 
        currentUser.id !== project.managerUserId &&
        currentUser.id !== attachment.uploadeduserid
      ) {
        res.status(403).json({ message: "Forbidden: Insufficient permissions to delete this attachment" });
        return;
      }
      
      // Delete file from filesystem
      try {
        if (fs.existsSync(attachment.filepath)) {
          fs.unlinkSync(attachment.filepath);
        }
      } catch (fsError) {
        console.error('Error deleting file from filesystem:', fsError);
        // Continue with database deletion even if file deletion fails
      }
      
      const success = await storage.deleteProjectAttachment(attachmentId);
      if (success) {
        res.json({ message: "Attachment deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete attachment" });
      }
    } catch (error) {
      console.error('Error deleting project attachment:', error);
      res.status(500).json({ message: "Failed to delete project attachment" });
    }
  });

  app.get("/api/attachments/:id/download", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await storage.getProjectAttachment(attachmentId);
      
      if (!attachment) {
        res.status(404).json({ message: "Attachment not found" });
        return;
      }
      
      const project = await storage.getProject(attachment.projectid);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      const currentUser = req.user;
      if (!currentUser) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }
      
      // Check if user has access to this project
      if (
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot download attachments from different department's project" });
        return;
      }
      
      // Check if file exists
      if (!fs.existsSync(attachment.filepath)) {
        res.status(404).json({ message: "File not found on server" });
        return;
      }
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalname}"`);
      res.setHeader('Content-Type', attachment.filetype);
      
      // Stream the file
      const fileStream = fs.createReadStream(attachment.filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading project attachment:', error);
      res.status(500).json({ message: "Failed to download project attachment" });
    }
  });

  // Utility function to get week number
  function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  }

  // Get projects that need weekly updates (for dashboard reminder)
  app.get("/api/projects/weekly-updates-needed", isAuthenticated, async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUser = req.user;
      
      if (!currentUser || currentUser.role !== "ProjectManager") {
        res.status(403).json({ message: "Only project managers can access this endpoint" });
        return;
      }
      
      // Get projects managed by this user
      const projects = await storage.getProjectsByManager(currentUser.id);
      
      // Filter out completed, cancelled, or pending projects
      const activeProjects = projects.filter(project => 
        project.status !== "Completed" && 
        project.status !== "Cancelled" && 
        project.status !== "Pending"
      );
      
      const currentDate = new Date();
      const currentWeek = getWeekNumber(currentDate);
      const currentYear = currentDate.getFullYear();
      
      // Check which projects need weekly updates
      const projectsNeedingUpdates = [];
      
      for (const project of activeProjects) {
        const weeklyUpdates = await storage.getWeeklyUpdatesByProject(project.id);
        const hasCurrentWeekUpdate = weeklyUpdates.some(update => 
          update.weekNumber === currentWeek && 
          update.year === currentYear
        );
        
        if (!hasCurrentWeekUpdate) {
          projectsNeedingUpdates.push(project);
        }
      }
      
      res.json(projectsNeedingUpdates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects needing weekly updates" });
    }
  });

  // Milestone Routes
  app.get("/api/projects/:projectId/milestones", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      // Check if user has access to this project's milestones
      const currentUser = req.user;
      if (
        currentUser && 
        currentUser.role !== "Administrator" && 
        currentUser.role !== "MainPMO" && 
        currentUser.role !== "Executive" && 
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view milestones from different department's project" });
        return;
      }
      
      const milestones = await storage.getMilestonesByProject(projectId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });
  
  app.get("/api/milestones/:id", isAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const milestoneId = parseInt(req.params.id);
      const milestone = await storage.getMilestone(milestoneId);
      
      if (!milestone) {
        res.status(404).json({ message: "Milestone not found" });
        return;
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
        currentUser.departmentid !== project.departmentid && 
        currentUser.id !== project.managerUserId
      ) {
        res.status(403).json({ message: "Forbidden: Cannot view milestone from different department's project" });
        return;
      }
      
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestone" });
    }
  });
  
  app.post(
    "/api/projects/:projectId/milestones", 
    validateBody(insertMilestoneSchema),
    hasAuth(async (req, res): Promise<void> => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
        // Only project manager or higher roles can create milestones
        if (
          req.currentUser.role !== "Administrator" && 
          req.currentUser.role !== "MainPMO" && 
          req.currentUser.role !== "SubPMO" && 
          req.currentUser.role !== "DepartmentDirector" && 
          req.currentUser.id !== project.managerUserId
        ) {
          res.status(403).json({ message: "Forbidden: Insufficient permissions to create milestones" });
          return;
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

  // Create the HTTP server from the Express app
  const httpServer = http.createServer(app);
  return httpServer;
}
  