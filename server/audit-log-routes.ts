import { Router, Request, Response, NextFunction } from 'express';
import { IStorage } from './storage';
import { AuditLogService } from './audit-log-service';

// Helper function to check if user is authenticated - using same pattern as main routes
function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Advanced authenticated function with typed user object - matching main routes pattern
function hasAuth(handler: (req: Request & { currentUser: Express.User }, res: Response, next: NextFunction) => Promise<void> | void) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    // Set currentUser to the authenticated user - same as main routes
    const reqWithUser = req as Request & { currentUser: Express.User };
    reqWithUser.currentUser = req.user as Express.User;
    
    try {
      await handler(reqWithUser, res, next);
    } catch (error) {
      console.error('Audit log route error:', error);
      next(error);
    }
  };
}

// Helper function to check if user has required role(s) - same as main routes
function hasRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    const user = req.user as Express.User;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    const userRole = user.role || '';
    if (roles.includes(userRole)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  };
}

export function registerAuditLogRoutes(router: Router, storage: IStorage) {
  const auditLogService = new AuditLogService(storage);
  
  // Simple test route to verify audit log routes are working
  router.get("/api/audit-logs-test", (req, res) => {
    console.log('🔥 AUDIT LOG ROUTES TEST ENDPOINT HIT!');
    res.json({ message: "Audit log routes are loaded!" });
  });
  
  // Get audit logs (with RBAC filters)
  router.get("/api/audit-logs", isAuthenticated, hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]), hasAuth(async (req, res): Promise<void> => {
    try {
      console.log('🔍 === AUDIT LOG ROUTE START ===');
      console.log('User:', req.currentUser?.id, 'Role:', req.currentUser?.role);
      console.log('Query params:', req.query);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
      const action = req.query.action as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;

      console.log('📋 Parsed options:', { limit, offset, userId, entityType, entityId, action, startDate, endDate, departmentId });

      // Get logs with RBAC filtering
      console.log('🚀 About to call auditLogService.getLogs');
      const logs = await auditLogService.getLogs(req, {
        limit,
        offset,
        userId,
        entityType,
        entityId,
        action,
        startDate,
        endDate,
        departmentId
      });

      console.log('✅ Audit logs retrieved successfully:', logs.length);
      console.log('🔍 === AUDIT LOG ROUTE END ===');
      res.json(logs);
    } catch (error) {
      console.error('❌ === AUDIT LOG ROUTE ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error details:', error);
      console.error('❌ === END ERROR DETAILS ===');
      
      res.status(500).json({ 
        message: "Failed to fetch audit logs", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }));

  // Get audit log by ID (for administrators only)
  router.get("/api/audit-logs/:id", isAuthenticated, hasRole(["Administrator", "MainPMO"]), hasAuth(async (req, res): Promise<void> => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getAuditLog(logId);

      if (!log) {
        res.status(404).json({ message: "Audit log not found" });
        return;
      }

      res.json(log);
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }));
} 