import { Request } from 'express';
import { IStorage } from './storage';
import { InsertAuditLog } from '@shared/schema';

export class AuditLogService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Log an action performed by a user
   */
  async log(
    req: Request,
    action: string,
    entityType: string,
    entityId?: number,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const user = req.user;
      const userId = user?.id;
      const departmentId = user?.departmentId;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'];

      const auditLog: InsertAuditLog = {
        userId: userId || undefined,
        action,
        entityType,
        entityId: entityId || undefined,
        details: details || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        departmentId: departmentId || undefined
      };

      await this.storage.createAuditLog(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not disrupt normal operation
    }
  }

  /**
   * Get logs with various filter options and respect RBAC
   */
  async getLogs(
    req: Request,
    options: {
      limit?: number;
      offset?: number;
      userId?: number;
      entityType?: string;
      entityId?: number;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      departmentId?: number;
    }
  ): Promise<any[]> {
    const user = req.user;
    if (!user) {
      return [];
    }

    const role = user.role || '';
    let departmentId = options.departmentId;

    // Apply RBAC filters
    // Administrators and MainPMO see all logs
    if (!['Administrator', 'MainPMO'].includes(role)) {
      if (role === 'DepartmentDirector' || role === 'SubPMO') {
        // Department directors and sub-PMOs can only see logs from their department
        departmentId = user.departmentId || undefined;
      } else {
        // Regular users and project managers only see logs of their own actions
        return this.storage.getAuditLogsByUser(user.id, options.limit, options.offset);
      }
    }

    // Get filtered logs based on options
    return this.storage.getAuditLogs({
      ...options,
      departmentId
    });
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: Request): string | undefined {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor && typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    return req.ip;
  }
} 