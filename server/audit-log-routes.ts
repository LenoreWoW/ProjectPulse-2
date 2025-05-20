import { Router, Request, Response, NextFunction } from 'express';
import { IStorage } from './storage';
import { AuditLogService } from './audit-log-service';

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

export function registerAuditLogRoutes(router: Router, storage: IStorage) {
  const auditLogService = new AuditLogService(storage);
  
  // Get audit logs (with RBAC filters)
  router.get("/api/audit-logs", isAuthenticated, hasRole(["Administrator", "MainPMO", "SubPMO", "DepartmentDirector"]), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId ? parseInt(req.query.entityId as string) : undefined;
      const action = req.query.action as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;

      // Get logs with RBAC filtering
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

      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Get audit log by ID (for administrators only)
  router.get("/api/audit-logs/:id", isAuthenticated, hasRole(["Administrator", "MainPMO"]), async (req, res) => {
    try {
      const logId = parseInt(req.params.id);
      const log = await storage.getAuditLog(logId);

      if (!log) {
        return res.status(404).json({ message: "Audit log not found" });
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });
} 