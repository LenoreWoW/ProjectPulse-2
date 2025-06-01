import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { Task, RiskIssue, Project } from '@shared/schema';

// Simple auth middleware for analytics routes
const hasAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

// Register the analytics routes
export function registerAnalyticsRoutes(router: Router) {
  // Get projects analytics
  router.get('/api/analytics/projects', hasAuth, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { department, status, startDate, endDate, client } = req.query;
      
      // Get all projects
      let projects = await storage.getProjects();
      
      // Filter based on user role
      if (user.role !== 'Admin' && user.role !== 'Manager') {
        // Regular users can only see projects in their department
        projects = projects.filter(project => project.departmentId === user.departmentId);
      } else if (user.role === 'Manager' && user.departmentId) {
        // Managers can see projects in their department
        projects = projects.filter(project => project.departmentId === user.departmentId);
      }
      
      // Apply filters
      if (department) {
        projects = projects.filter(project => project.departmentId === Number(department));
      }
      
      if (status) {
        projects = projects.filter(project => project.status === String(status));
      }
      
      if (client) {
        projects = projects.filter(project => project.client === String(client));
      }
      
      if (startDate) {
        const start = new Date(String(startDate));
        projects = projects.filter(project => {
          const projectStart = new Date(project.startDate);
          return projectStart >= start;
        });
      }
      
      if (endDate) {
        const end = new Date(String(endDate));
        projects = projects.filter(project => {
          if (!project.deadline) return false;
          const projectDeadline = new Date(project.deadline);
          return projectDeadline <= end;
        });
      }
      
      // Transform data for analytics
      const analyticsData = projects.map((project: Project) => {
        return {
          id: project.id,
          title: project.title,
          client: project.client,
          status: project.status,
          priority: project.priority,
          budget: project.budget,
          actualCost: project.actualCost,
          startDate: project.startDate,
          deadline: project.deadline,
          departmentId: project.departmentId,
        };
      });
      
      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching projects analytics:', error);
      res.status(500).json({ error: 'Failed to fetch projects analytics' });
    }
  });
  
  // Get tasks analytics
  router.get('/api/analytics/tasks', hasAuth, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { project, status, priority, assignee } = req.query;
      
      // Get all tasks (we'll filter them below)
      let allTasks: Task[] = [];
      
      // First get all projects to filter tasks by user role
      const projects = await storage.getProjects();
      
      // Filter based on user role
      if (user.role !== 'Admin' && user.role !== 'Manager') {
        // Regular users only see tasks assigned to them
        allTasks = await storage.getTasksByAssignee(user.id);
      } else {
        // Admin and Managers see all tasks but we'll filter by department later
        const projectIds = projects.map(p => p.id);
        
        // Fetch tasks for each project and merge them
        for (const projectId of projectIds) {
          const projectTasks = await storage.getTasksByProject(projectId);
          allTasks = [...allTasks, ...projectTasks];
        }
        
        // If manager, filter to only show tasks in their department
        if (user.role === 'Manager' && user.departmentId) {
          const departmentProjectIds = projects
            .filter(p => p.departmentId === user.departmentId)
            .map(p => p.id);
          
          allTasks = allTasks.filter(task => departmentProjectIds.includes(task.projectId));
        }
      }
      
      // Apply additional filters
      let tasks = allTasks;
      
      if (project) {
        tasks = tasks.filter(task => task.projectId === Number(project));
      }
      
      if (status) {
        tasks = tasks.filter(task => task.status === String(status));
      }
      
      if (priority) {
        tasks = tasks.filter(task => task.priority === String(priority));
      }
      
      if (assignee) {
        tasks = tasks.filter(task => task.assignedUserId === Number(assignee));
      }
      
      // Transform data for analytics
      const analyticsData = tasks.map((task: Task) => {
        return {
          id: task.id,
          title: task.title,
          projectId: task.projectId,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          assignedUserId: task.assignedUserId
        };
      });
      
      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching tasks analytics:', error);
      res.status(500).json({ error: 'Failed to fetch tasks analytics' });
    }
  });
  
  // Get risks analytics
  router.get('/api/analytics/risks', hasAuth, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { project, type, severity, status } = req.query;
      
      // Get all risks
      let risks = await storage.getRisks();
      const issues = await storage.getIssues();
      const allRisksAndIssues: RiskIssue[] = [...risks, ...issues];
      
      // Filter based on user role
      if (user.role !== 'Admin' && user.role !== 'Manager') {
        // Regular users can only see risks on projects they have access to
        const projects = await storage.getProjects();
        
        const accessibleProjectIds = projects
          .filter(p => p.departmentId === user.departmentId)
          .map(p => p.id);
        
        risks = allRisksAndIssues.filter(risk => accessibleProjectIds.includes(risk.projectId));
      } else if (user.role === 'Manager' && user.departmentId) {
        // Managers see risks for projects in their department
        const projects = await storage.getProjects();
        
        const departmentProjectIds = projects
          .filter(p => p.departmentId === user.departmentId)
          .map(p => p.id);
        
        risks = allRisksAndIssues.filter(risk => departmentProjectIds.includes(risk.projectId));
      } else {
        risks = allRisksAndIssues;
      }
      
      // Apply filters
      if (project) {
        risks = risks.filter(risk => risk.projectId === Number(project));
      }
      
      if (type) {
        risks = risks.filter(risk => risk.type === String(type));
      }
      
      if (status) {
        risks = risks.filter(risk => risk.status === String(status));
      }
      
      if (severity) {
        risks = risks.filter(risk => risk.priority === String(severity));
      }
      
      // Transform data for analytics
      const analyticsData = risks.map((risk: RiskIssue) => {
        return {
          id: risk.id,
          projectId: risk.projectId,
          type: risk.type,
          description: risk.description,
          priority: risk.priority,
          status: risk.status
        };
      });
      
      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching risks analytics:', error);
      res.status(500).json({ error: 'Failed to fetch risks analytics' });
    }
  });
} 