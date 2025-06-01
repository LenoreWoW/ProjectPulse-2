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
    req: Request & { currentUser?: Express.User },
    action: string,
    entityType: string,
    entityId?: number,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const user = req.currentUser || req.user;
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
        departmentId: departmentId || undefined,
        createdAt: new Date()
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
    req: Request & { currentUser?: Express.User },
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
    console.log('AuditLogService.getLogs - Called with options:', options);
    
    const user = req.currentUser || req.user;
    if (!user) {
      console.log('AuditLogService.getLogs - No user found, returning empty array');
      return [];
    }

    console.log('AuditLogService.getLogs - User:', { id: user.id, role: user.role, departmentId: user.departmentId });

    const role = user.role || '';
    let departmentId = options.departmentId;

    // Apply RBAC filters
    // Administrators and MainPMO see all logs
    if (!['Administrator', 'MainPMO'].includes(role)) {
      if (role === 'DepartmentDirector' || role === 'SubPMO') {
        // Department directors and sub-PMOs can only see logs from their department
        departmentId = user.departmentId || undefined;
        console.log('AuditLogService.getLogs - Department role, filtering by departmentId:', departmentId);
      } else {
        // Regular users and project managers only see logs of their own actions
        console.log('AuditLogService.getLogs - Regular user, calling getAuditLogsByUser');
        return this.storage.getAuditLogsByUser(user.id, options.limit, options.offset);
      }
    }

    // Get filtered logs based on options
    console.log('AuditLogService.getLogs - Calling storage.getAuditLogs with options:', { ...options, departmentId });
    try {
      const result = await this.storage.getAuditLogs({
        ...options,
        departmentId
      });
      console.log('AuditLogService.getLogs - Got result from storage, length:', result.length);
      return result;
    } catch (error) {
      console.error('AuditLogService.getLogs - Error from storage:', error);
      throw error;
    }
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