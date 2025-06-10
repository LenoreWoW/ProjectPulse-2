import { Pool, PoolClient } from 'pg';
import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  InsertProjectGoal, InsertGoalRelationship,
  ProjectDependency, Milestone, TaskMilestone,
  ProjectGoal, GoalRelationship, ProjectFavorite,
  InsertMilestone, InsertTaskMilestone, AuditLog, InsertAuditLog,
  InsertProjectFavorite, InsertProjectDependency, ProjectAttachment, InsertProjectAttachment
} from '@shared/schema';
import { IStorage } from './storage';
import { Store } from 'express-session';
import { pool } from './db-config';
import pgSession from 'connect-pg-simple';
import session from 'express-session';
import { eq, and } from 'drizzle-orm';
import { db } from './db';
import * as schema from '@shared/schema';

// Helper function to format JSON dates
function formatJsonDates(obj: any): any {
  if (!obj) return obj;
  
  // Clone the object to avoid modifying the original
  const result = { ...obj };
  
  // Convert PostgreSQL timestamp strings and Date objects to ISO strings
  Object.keys(result).forEach(key => {
    const value = result[key];
    
    // Skip null or undefined values
    if (value === null || value === undefined) {
      return;
    }
    
    // Handle Date objects (from PostgreSQL driver)
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) {
        result[key] = value.toISOString();
      } else {
        result[key] = null;
      }
      return;
    }
    
    // Handle empty objects that might be malformed dates
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      result[key] = null;
      return;
    }
    
    // Check if the value is a string that looks like a date
    if (typeof value === 'string' && 
        (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || 
         value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/))) {
      try {
        const date = new Date(value);
        // Ensure it's a valid date before replacing
        if (!isNaN(date.getTime())) {
          result[key] = date.toISOString();
        }
      } catch (e) {
        // Keep the original value if date parsing fails
        console.warn('Failed to parse date:', value);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively process nested objects (but not arrays)
      result[key] = formatJsonDates(value);
    }
  });
  
  return result;
}

/**
 * PostgreSQL implementation of the storage interface
 */
export class PgStorage implements IStorage {
  private pool: Pool;
  sessionStore: Store;
  
  constructor() {
    this.pool = pool;
    
    // Create a session store backed by PostgreSQL
    const PgSessionStore = pgSession(session);
    this.sessionStore = new PgSessionStore({
      pool: this.pool,
      tableName: 'sessions'
    });
    
    console.log('PostgreSQL storage initialized');
  }
  
  /**
   * Execute a query and handle common errors
   */
  private async query<T>(text: string, params: any[] = []): Promise<T[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result.rows.map((row: any) => formatJsonDates(row) as T);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get a client from the pool and begin a transaction
   */
  private async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }
  
  /**
   * Common function to get a single entity by ID
   */
  private async getEntityById<T>(table: string, id: number, returnNullIfNotFound = true): Promise<T | undefined> {
    const result = await this.query<T>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    if (result.length === 0) {
      if (returnNullIfNotFound) {
        return undefined;
      }
      throw new Error(`${table} with ID ${id} not found`);
    }
    return result[0];
  }
  
  /**
   * Common function to create an entity
   */
  private async createEntity<TInsert, TSelect>(tableName: keyof typeof schema, data: TInsert): Promise<TSelect> {
    // @ts-ignore
    const result = await db.insert(schema[tableName]).values(data).returning();
    return result[0] as TSelect;
  }
  
  /**
   * Common function to update an entity
   */
  private async updateEntity<TUpdate, TSelect>(tableName: keyof typeof schema, id: number, data: TUpdate): Promise<TSelect | undefined> {
    // @ts-ignore
    const result = await db.update(schema[tableName]).set(data).where(eq(schema[tableName].id, id)).returning();
    return result[0] as TSelect | undefined;
  }

  // ------------------------------------------------------------------------
  // User methods
  // ------------------------------------------------------------------------
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query(`
      SELECT 
        id,
        name,
        email,
        phonenumber as phone,
        username,
        password,
        role,
        status,
        departmentid as "departmentId",
        title,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM users 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) return undefined;
    
    const user = result.rows[0];
    return {
      ...user,
      roles: [user.role], // Convert single role to array
      isActive: user.status === 'Active', // Convert status to boolean
      position: user.title, // Use title as position
      avatarUrl: null, // Not in database
      preferredLanguage: 'en', // Default value
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query(`
      SELECT 
        id,
        name,
        email,
        phonenumber as phone,
        username,
        password,
        role,
        status,
        departmentid as "departmentId",
        title,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM users 
      WHERE username = $1
    `, [username]);
    
    if (result.rows.length === 0) return undefined;
    
    const user = result.rows[0];
    return {
      ...user,
      roles: [user.role], // Convert single role to array
      isActive: user.status === 'Active', // Convert status to boolean
      position: user.title, // Use title as position
      avatarUrl: null, // Not in database
      preferredLanguage: 'en', // Default value
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.pool.query(`
      SELECT 
        id,
        name,
        email,
        phonenumber as phone,
        username,
        password,
        role,
        status,
        departmentid as "departmentId",
        title,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (result.rows.length === 0) return undefined;
    
    const user = result.rows[0];
    return {
      ...user,
      roles: [user.role], // Convert single role to array
      isActive: user.status === 'Active', // Convert status to boolean
      position: user.title, // Use title as position
      avatarUrl: null, // Not in database
      preferredLanguage: 'en', // Default value
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.createEntity<InsertUser, User>('users', user);
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    return this.updateEntity<Partial<User>, User>('users', id, user);
  }

  async getUsers(): Promise<User[]> {
    const result = await this.pool.query(`
      SELECT 
        id,
        name,
        email,
        phonenumber as phone,
        username,
        password,
        role,
        status,
        departmentid as "departmentId",
        title,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM users
    `);
    
    return result.rows.map((user: any) => ({
      ...user,
      roles: [user.role], // Convert single role to array
      isActive: user.status === 'Active', // Convert status to boolean
      position: user.title, // Use title as position
      avatarUrl: null, // Not in database
      preferredLanguage: 'en', // Default value
    }));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const result = await this.pool.query(`
      SELECT 
        id,
        name,
        email,
        phonenumber as phone,
        username,
        password,
        role,
        status,
        departmentid as "departmentId",
        title,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM users 
      WHERE role = $1
    `, [role]);
    
    return result.rows.map((user: any) => ({
      ...user,
      roles: [user.role], // Convert single role to array
      isActive: user.status === 'Active', // Convert status to boolean
      position: user.title, // Use title as position
      avatarUrl: null, // Not in database
      preferredLanguage: 'en', // Default value
    }));
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    const result = await this.pool.query(`
      SELECT 
        id,
        name,
        email,
        phonenumber as phone,
        username,
        password,
        role,
        status,
        departmentid as "departmentId",
        title,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM users 
      WHERE departmentid = $1
    `, [departmentId]);
    
    return result.rows.map((user: any) => ({
      ...user,
      roles: [user.role], // Convert single role to array
      isActive: user.status === 'Active', // Convert status to boolean
      position: user.title, // Use title as position
      avatarUrl: null, // Not in database
      preferredLanguage: 'en', // Default value
    }));
  }

  // ------------------------------------------------------------------------
  // Department methods
  // ------------------------------------------------------------------------
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.getEntityById<Department>('departments', id);
  }

  async getDepartments(): Promise<Department[]> {
    return this.query<Department>('SELECT * FROM departments');
  }

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    const result = await this.query<Department>('SELECT * FROM departments WHERE name = $1', [name]);
    return result.length > 0 ? result[0] : undefined;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    return this.createEntity<InsertDepartment, Department>('departments', department);
  }

  async updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined> {
    return this.updateEntity<Partial<Department>, Department>('departments', id, department);
  }

  // ------------------------------------------------------------------------
  // Project methods
  // ------------------------------------------------------------------------
  async getProject(id: number): Promise<Project | undefined> {
    const results = await this.query<Project>(`
      SELECT 
        id,
        title,
        description,
        manageruserid as "managerUserId",
        departmentid as "departmentId",
        client,
        budget,
        priority,
        CASE 
          WHEN startdate IS NOT NULL THEN startdate::text
          ELSE NULL 
        END as "startDate",
        CASE 
          WHEN deadline IS NOT NULL THEN deadline::text
          ELSE NULL 
        END as deadline,
        status,
        actualcost as "actualCost",
        CASE 
          WHEN createdat IS NOT NULL THEN createdat::text
          ELSE NULL 
        END as "createdAt",
        CASE 
          WHEN updatedat IS NOT NULL THEN updatedat::text
          ELSE NULL 
        END as "updatedAt"
      FROM projects 
      WHERE id = $1
    `, [id]);
    
    return results.length > 0 ? results[0] : undefined;
  }

  async getProjects(): Promise<Project[]> {
    return this.query<Project>(`
      SELECT 
        id,
        title,
        description,
        manageruserid as "managerUserId",
        departmentid as "departmentId",
        client,
        budget,
        priority,
        CASE 
          WHEN startdate IS NOT NULL THEN startdate::text
          ELSE NULL 
        END as "startDate",
        CASE 
          WHEN deadline IS NOT NULL THEN deadline::text
          ELSE NULL 
        END as deadline,
        status,
        actualcost as "actualCost",
        CASE 
          WHEN createdat IS NOT NULL THEN createdat::text
          ELSE NULL 
        END as "createdAt",
        CASE 
          WHEN updatedat IS NOT NULL THEN updatedat::text
          ELSE NULL 
        END as "updatedAt"
      FROM projects
    `);
  }

  async getProjectsByDepartment(departmentId: number): Promise<Project[]> {
    return this.query<Project>(`
      SELECT 
        id,
        title,
        description,
        manageruserid as "managerUserId",
        departmentid as "departmentId",
        client,
        budget,
        priority,
        CASE 
          WHEN startdate IS NOT NULL THEN startdate::text
          ELSE NULL 
        END as "startDate",
        CASE 
          WHEN deadline IS NOT NULL THEN deadline::text
          ELSE NULL 
        END as deadline,
        status,
        actualcost as "actualCost",
        CASE 
          WHEN createdat IS NOT NULL THEN createdat::text
          ELSE NULL 
        END as "createdAt",
        CASE 
          WHEN updatedat IS NOT NULL THEN updatedat::text
          ELSE NULL 
        END as "updatedAt"
      FROM projects 
      WHERE departmentid = $1
    `, [departmentId]);
  }

  async getProjectsByManager(managerUserId: number): Promise<Project[]> {
    return this.query<Project>(`
      SELECT 
        id,
        title,
        description,
        manageruserid as "managerUserId",
        departmentid as "departmentId",
        client,
        budget,
        priority,
        CASE 
          WHEN startdate IS NOT NULL THEN startdate::text
          ELSE NULL 
        END as "startDate",
        CASE 
          WHEN deadline IS NOT NULL THEN deadline::text
          ELSE NULL 
        END as deadline,
        status,
        actualcost as "actualCost",
        CASE 
          WHEN createdat IS NOT NULL THEN createdat::text
          ELSE NULL 
        END as "createdAt",
        CASE 
          WHEN updatedat IS NOT NULL THEN updatedat::text
          ELSE NULL 
        END as "updatedAt"
      FROM projects 
      WHERE manageruserid = $1
    `, [managerUserId]);
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return this.query<Project>(`
      SELECT 
        id,
        title,
        description,
        manageruserid as "managerUserId",
        departmentid as "departmentId",
        client,
        budget,
        priority,
        CASE 
          WHEN startdate IS NOT NULL THEN startdate::text
          ELSE NULL 
        END as "startDate",
        CASE 
          WHEN deadline IS NOT NULL THEN deadline::text
          ELSE NULL 
        END as deadline,
        status,
        actualcost as "actualCost",
        CASE 
          WHEN createdat IS NOT NULL THEN createdat::text
          ELSE NULL 
        END as "createdAt",
        CASE 
          WHEN updatedat IS NOT NULL THEN updatedat::text
          ELSE NULL 
        END as "updatedAt"
      FROM projects 
      WHERE status = $1
    `, [status]);
  }

  async createProject(project: InsertProject): Promise<Project> {
    return this.createEntity<InsertProject, Project>('projects', project);
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    return this.updateEntity<Partial<Project>, Project>('projects', id, project);
  }

  // ------------------------------------------------------------------------
  // Project Goal methods
  // ------------------------------------------------------------------------
  async createProjectGoal(projectGoal: InsertProjectGoal): Promise<ProjectGoal> {
    return this.createEntity<InsertProjectGoal, ProjectGoal>('projectGoals', projectGoal);
  }

  async getProjectGoals(projectId: number): Promise<ProjectGoal[]> {
    return this.query<ProjectGoal>('SELECT * FROM projectGoals WHERE projectid = $1', [projectId]);
  }

  // ------------------------------------------------------------------------
  // Project Dependency methods
  // ------------------------------------------------------------------------
  async getProjectDependencies(projectid: number): Promise<ProjectDependency[]> {
    return db.select().from(schema.projectDependencies).where(eq(schema.projectDependencies.projectid, projectid));
  }

  async createProjectDependency(dependency: InsertProjectDependency): Promise<ProjectDependency> {
    return this.createEntity<InsertProjectDependency, ProjectDependency>('projectDependencies', dependency);
  }

  async removeProjectDependency(projectid: number, dependsonprojectid: number): Promise<boolean> {
    const result = await db.delete(schema.projectDependencies).where(and(eq(schema.projectDependencies.projectid, projectid), eq(schema.projectDependencies.dependsonprojectid, dependsonprojectid)));
    return (result.rowCount ?? 0) > 0;
  }

  // ------------------------------------------------------------------------
  // Task methods
  // ------------------------------------------------------------------------
  async getTask(id: number): Promise<Task | undefined> {
    return this.getEntityById<Task>('tasks', id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return this.query<Task>(`
      SELECT 
        id,
        status,
        title,
        description,
        deadline,
        projectid as "projectId",
        assigneduserid as "assignedUserId",
        priority,
        createdbyuserid as "createdByUserId",
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM tasks 
      WHERE projectid = $1
    `, [projectId]);
  }

  async getTasksByAssignee(assignedUserId: number): Promise<Task[]> {
    return this.query<Task>(`
      SELECT 
        id,
        status,
        title,
        description,
        deadline,
        projectid as "projectId",
        assigneduserid as "assignedUserId",
        priority,
        createdbyuserid as "createdByUserId",
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM tasks 
      WHERE assigneduserid = $1
    `, [assignedUserId]);
  }

  async getTasksByCreator(createdByUserId: number): Promise<Task[]> {
    return this.query<Task>(`
      SELECT 
        id,
        status,
        title,
        description,
        deadline,
        projectid as "projectId",
        assigneduserid as "assignedUserId",
        priority,
        createdbyuserid as "createdByUserId",
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM tasks 
      WHERE createdbyuserid = $1
    `, [createdByUserId]);
  }

  async createTask(task: InsertTask): Promise<Task> {
    return this.createEntity<InsertTask, Task>('tasks', task);
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task | undefined> {
    return this.updateEntity<Partial<Task>, Task>('tasks', id, task);
  }

  // ------------------------------------------------------------------------
  // Change Request methods
  // ------------------------------------------------------------------------
  async getChangeRequest(id: number): Promise<ChangeRequest | undefined> {
    return this.query<ChangeRequest>('SELECT * FROM change_requests WHERE id = $1', [id]).then(results => results[0]);
  }

  async getChangeRequestsByProject(projectId: number): Promise<ChangeRequest[]> {
    return this.query<ChangeRequest>('SELECT * FROM change_requests WHERE projectid = $1', [projectId]);
  }

  async getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
    return this.query<ChangeRequest>('SELECT * FROM change_requests WHERE status = $1', [status]);
  }

  async createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    const result = await this.query<ChangeRequest>(`
      INSERT INTO change_requests (projectid, requestedbyuserid, type, details, status, impact, createdat, updatedat)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      changeRequest.projectid,
      changeRequest.requestedbyuserid,
      changeRequest.type,
      changeRequest.details,
      changeRequest.status || 'Pending',
      changeRequest.impact
    ]);
    return result[0];
  }

  async updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (changeRequest.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(changeRequest.status);
    }
    if (changeRequest.reviewedbyuserid !== undefined) {
      updates.push(`reviewedbyuserid = $${paramCount++}`);
      values.push(changeRequest.reviewedbyuserid);
    }
    if (changeRequest.reviewedat !== undefined) {
      updates.push(`reviewedat = $${paramCount++}`);
      values.push(changeRequest.reviewedat);
    }
    if (changeRequest.impact !== undefined) {
      updates.push(`impact = $${paramCount++}`);
      values.push(changeRequest.impact);
    }

    if (updates.length === 0) return this.getChangeRequest(id);

    updates.push(`updatedat = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<ChangeRequest>(`
      UPDATE change_requests 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    return result[0];
  }

  // ------------------------------------------------------------------------
  // Goal methods
  // ------------------------------------------------------------------------
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.getEntityById<Goal>('goals', id);
  }

  async getGoals(): Promise<Goal[]> {
    return this.query<Goal>('SELECT * FROM goals');
  }

  async getStrategicGoals(): Promise<Goal[]> {
    return this.query<Goal>('SELECT * FROM goals WHERE is_strategic = TRUE');
  }

  async getAnnualGoals(): Promise<Goal[]> {
    return this.query<Goal>('SELECT * FROM goals WHERE is_strategic = FALSE');
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    return this.createEntity<InsertGoal, Goal>('goals', goal);
  }

  async updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined> {
    return this.updateEntity<Partial<Goal>, Goal>('goals', id, goal);
  }

  // ------------------------------------------------------------------------
  // Risk & Issue methods
  // ------------------------------------------------------------------------
  async getRiskIssue(id: number): Promise<RiskIssue | undefined> {
    return this.query<RiskIssue>('SELECT * FROM risks_issues WHERE id = $1', [id]).then(results => results[0]);
  }

  async getRiskIssuesByProject(projectId: number): Promise<RiskIssue[]> {
    return this.query<RiskIssue>('SELECT * FROM risks_issues WHERE projectid = $1', [projectId]);
  }

  async getRisks(): Promise<RiskIssue[]> {
    return this.query<RiskIssue>('SELECT * FROM risks_issues WHERE type = $1', ['Risk']);
  }

  async getIssues(): Promise<RiskIssue[]> {
    return this.query<RiskIssue>('SELECT * FROM risks_issues WHERE type = $1', ['Issue']);
  }

  async createRiskIssue(riskIssue: InsertRiskIssue): Promise<RiskIssue> {
    const result = await this.query<RiskIssue>(`
      INSERT INTO risks_issues (projectid, createdbyuserid, title, description, type, status, severity, impact, mitigationplan, createdat, updatedat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      riskIssue.projectid,
      riskIssue.createdbyuserid,
      riskIssue.title,
      riskIssue.description || null,
      riskIssue.type,
      riskIssue.status || 'Open',
      riskIssue.severity || 'Medium',
      riskIssue.impact || null,
      riskIssue.mitigationplan || null
    ]);
    return result[0];
  }

  async updateRiskIssue(id: number, riskIssue: Partial<RiskIssue>): Promise<RiskIssue | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (riskIssue.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(riskIssue.title);
    }
    if (riskIssue.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(riskIssue.description);
    }
    if (riskIssue.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(riskIssue.status);
    }
    if (riskIssue.severity !== undefined) {
      updates.push(`severity = $${paramCount++}`);
      values.push(riskIssue.severity);
    }
    if (riskIssue.impact !== undefined) {
      updates.push(`impact = $${paramCount++}`);
      values.push(riskIssue.impact);
    }
    if (riskIssue.mitigationplan !== undefined) {
      updates.push(`mitigationplan = $${paramCount++}`);
      values.push(riskIssue.mitigationplan);
    }
    if (riskIssue.resolvedat !== undefined) {
      updates.push(`resolvedat = $${paramCount++}`);
      values.push(riskIssue.resolvedat);
    }

    if (updates.length === 0) return this.getRiskIssue(id);

    updates.push(`updatedat = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<RiskIssue>(`
      UPDATE risks_issues 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    return result[0];
  }

  // ------------------------------------------------------------------------
  // Notification methods
  // ------------------------------------------------------------------------
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.getEntityById<Notification>('notifications', id);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return this.query<Notification>('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.createEntity<InsertNotification, Notification>('notifications', notification);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    return this.updateEntity<Partial<Notification>, Notification>('notifications', id, { isRead: true });
  }

  async getPendingApprovalNotifications(): Promise<Notification[]> {
    return this.query<Notification>('SELECT * FROM notifications WHERE requiresapproval = TRUE AND isread = FALSE');
  }

  async updateNotificationReminderSent(id: number): Promise<Notification | undefined> {
    return this.updateEntity<Partial<Notification>, Notification>('notifications', id, { lastremindersent: new Date() });
  }

  async getNotificationsNeedingReminders(hoursThreshold: number = 24): Promise<Notification[]> {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    return this.query<Notification>(
      `SELECT * FROM notifications
       WHERE requiresapproval = TRUE
       AND isread = FALSE
       AND (lastremindersent IS NULL OR lastremindersent < $1)`,
      [thresholdTime]
    );
  }

  // ------------------------------------------------------------------------
  // Assignment methods
  // ------------------------------------------------------------------------
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.getEntityById<Assignment>('assignments', id);
  }

  async getAssignmentsByAssignee(assignedToUserId: number): Promise<Assignment[]> {
    return this.query<Assignment>('SELECT * FROM assignments WHERE assignedtouserid = $1', [assignedToUserId]);
  }

  async getAssignmentsByAssigner(assignedByUserId: number): Promise<Assignment[]> {
    return this.query<Assignment>('SELECT * FROM assignments WHERE assignedbyuserid = $1', [assignedByUserId]);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await this.query<Assignment>(`
      INSERT INTO assignments (title, description, assignedtouserid, assignedbyuserid, status, duedate, createdat, updatedat)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      assignment.title,
      assignment.description || null,
      assignment.assignedtouserid,
      assignment.assignedbyuserid,
      assignment.status || 'Pending',
      assignment.deadline || null
    ]);
    return result[0];
  }

  async updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (assignment.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(assignment.title);
    }
    if (assignment.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(assignment.description);
    }
    if (assignment.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(assignment.status);
    }
    if (assignment.duedate !== undefined) {
      updates.push(`duedate = $${paramCount++}`);
      values.push(assignment.duedate);
    }

    if (updates.length === 0) return this.getAssignment(id);

    updates.push(`updatedat = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.query<Assignment>(`
      UPDATE assignments 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    return result[0];
  }

  // ------------------------------------------------------------------------
  // Action Item methods
  // ------------------------------------------------------------------------
  async getActionItem(id: number): Promise<ActionItem | undefined> {
    return this.getEntityById<ActionItem>('actionItems', id);
  }

  async getActionItemsByMeeting(meetingId: number): Promise<ActionItem[]> {
    return this.query<ActionItem>('SELECT * FROM actionItems WHERE meeting_id = $1', [meetingId]);
  }

  async getActionItemsByAssignee(assignedToUserId: number): Promise<ActionItem[]> {
    return this.query<ActionItem>('SELECT * FROM actionItems WHERE user_id = $1', [assignedToUserId]);
  }

  async createActionItem(actionItem: InsertActionItem): Promise<ActionItem> {
    return this.createEntity<InsertActionItem, ActionItem>('actionItems', actionItem);
  }

  async updateActionItem(id: number, actionItem: Partial<ActionItem>): Promise<ActionItem | undefined> {
    return this.updateEntity<Partial<ActionItem>, ActionItem>('actionItems', id, actionItem);
  }

  // ------------------------------------------------------------------------
  // Weekly Update methods
  // ------------------------------------------------------------------------
  async getWeeklyUpdate(id: number): Promise<WeeklyUpdate | undefined> {
    return this.getEntityById<WeeklyUpdate>('weekly_updates', id);
  }

  async getWeeklyUpdatesByProject(projectId: number): Promise<WeeklyUpdate[]> {
    return this.query<WeeklyUpdate>('SELECT * FROM weekly_updates WHERE projectid = $1', [projectId]);
  }

  async createWeeklyUpdate(updateData: InsertWeeklyUpdate): Promise<WeeklyUpdate> {
    const [newUpdate] = await this.query<WeeklyUpdate>(`
      INSERT INTO weekly_updates (projectid, weeknumber, year, summary, status, progresssnapshot, createdat, userid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, projectid, weeknumber, year, summary, status, progresssnapshot, createdat, userid
    `, [updateData.projectid, (updateData as any).weeknumber, updateData.year, updateData.summary, (updateData as any).status, (updateData as any).progresssnapshot, updateData.createdat, (updateData as any).userid]);
    return newUpdate;
  }

  async getWeeklyUpdatesForProject(projectid: number): Promise<WeeklyUpdate[]> {
    return this.query<WeeklyUpdate>(`
      SELECT 
        id,
        projectid,
        weeknumber,
        year,
        summary,
        status,
        progresssnapshot,
        createdat
      FROM weekly_updates
      WHERE projectid = $1
      ORDER BY year DESC, weeknumber DESC
    `, [projectid]);
  }

  // Create an initial snapshot for a project
  async createInitialSnapshot(projectId: number, managerUserId: number): Promise<WeeklyUpdate> {
    const currentDate = new Date();
    const weekNumber = this.getWeekNumber(currentDate);
    const year = currentDate.getFullYear();
    
    // Get current project progress
    const project = await this.getProject(projectId);
    const progressSnapshot = project?.completionPercentage || 0;
    
    const [snapshot] = await this.query<WeeklyUpdate>(`
      INSERT INTO weekly_updates (
        projectid, 
        createdbyuserid,
        weeknumber, 
        year, 
        achievements,
        challenges,
        nextsteps,
        risksissues,
        progresssnapshot, 
        previousweekprogress,
        createdat,
        updatedat
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      projectId, 
      managerUserId,
      weekNumber, 
      year, 
      'Initial project snapshot created',
      'Project initiated',
      'Begin project execution and milestone tracking',
      'No risks identified at project start',
      progressSnapshot,
      0, // Previous week was 0
      currentDate,
      currentDate
    ]);
    
    return snapshot;
  }

  // Helper method to get ISO week number
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  }

  // ------------------------------------------------------------------------
  // Project Cost History methods
  // ------------------------------------------------------------------------
  async getProjectCostHistory(id: number): Promise<ProjectCostHistory | undefined> {
    return this.getEntityById<ProjectCostHistory>('project_cost_history', id);
  }

  async getProjectCostHistoryByProject(projectId: number): Promise<ProjectCostHistory[]> {
    return this.query<ProjectCostHistory>('SELECT * FROM project_cost_history WHERE projectid = $1', [projectId]);
  }

  async createProjectCostHistory(projectCostHistory: InsertProjectCostHistory): Promise<ProjectCostHistory> {
    return this.createEntity<InsertProjectCostHistory, ProjectCostHistory>('projectCostHistory', projectCostHistory);
  }
  
  // ------------------------------------------------------------------------
  // Milestone methods
  // ------------------------------------------------------------------------
  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.getEntityById<Milestone>('milestones', id);
  }

  async getMilestonesByProject(projectId: number): Promise<Milestone[]> {
    return this.query<Milestone>('SELECT * FROM milestones WHERE projectid = $1', [projectId]);
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    // Ensure deadline is null if undefined (to match memory storage behavior)
    const milestoneToCreate = { 
      ...milestone,
      deadline: milestone.deadline === undefined ? null : milestone.deadline
    };
    return this.createEntity<InsertMilestone, Milestone>('milestones', milestoneToCreate);
  }

  async updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined> {
    return this.updateEntity<Partial<Milestone>, Milestone>('milestones', id, milestone);
  }

  // ------------------------------------------------------------------------
  // Task-Milestone relationship methods
  // ------------------------------------------------------------------------
  async getTaskMilestone(id: number): Promise<TaskMilestone | undefined> {
    return this.getEntityById<TaskMilestone>('taskMilestones', id);
  }

  async getTaskMilestonesByTask(taskId: number): Promise<TaskMilestone[]> {
    return this.query<TaskMilestone>('SELECT * FROM taskMilestones WHERE taskid = $1', [taskId]);
  }

  async getTaskMilestonesByMilestone(milestoneId: number): Promise<TaskMilestone[]> {
    return this.query<TaskMilestone>('SELECT * FROM taskMilestones WHERE milestoneid = $1', [milestoneId]);
  }

  async createTaskMilestone(taskMilestone: InsertTaskMilestone): Promise<TaskMilestone> {
    const result = await this.createEntity<InsertTaskMilestone, TaskMilestone>('taskMilestones', taskMilestone);
    await this.recalculateMilestoneProgress(taskMilestone.milestoneid);
    return result;
  }

  async updateTaskMilestone(id: number, taskMilestone: Partial<TaskMilestone>): Promise<TaskMilestone | undefined> {
    const existing = await this.getTaskMilestone(id);
    if (!existing) {
      return undefined;
    }
    
    const result = await this.updateEntity<Partial<TaskMilestone>, TaskMilestone>('taskMilestones', id, taskMilestone);
    await this.recalculateMilestoneProgress(existing.milestoneid);
    return result;
  }

  async deleteTaskMilestone(id: number): Promise<boolean> {
    try {
      const existing = await this.getTaskMilestone(id);
      if (!existing) {
        return false;
      }
      
      const result = await this.query<{ id: number }>('DELETE FROM taskMilestones WHERE id = $1 RETURNING id', [id]);
      if (result.length === 0) {
        return false;
      }
      
      await this.recalculateMilestoneProgress(existing.milestoneid);
      return true;
    } catch (error) {
      console.error('Failed to delete task milestone:', error);
      return false;
    }
  }

  async recalculateMilestoneProgress(milestoneId: number): Promise<void> {
    await this.updateMilestoneProgress(milestoneId);
  }

  private async updateMilestoneProgress(milestoneId: number): Promise<void> {
    try {
      const milestone = await this.getMilestone(milestoneId);
      if (!milestone) {
        return;
      }
      
      const taskMilestones = await this.getTaskMilestonesByMilestone(milestoneId);
      if (taskMilestones.length === 0) {
        // No associated tasks - preserve existing progress value instead of resetting to 0
        // This allows imported milestones to keep their CSV progress values
        // Only update status based on existing completion percentage
        await this.updateMilestone(milestoneId, {
          status: this.getMilestoneStatusFromCompletion(milestone.completionPercentage, milestone)
        });
        return;
      }
      
      // Sum of task milestone weights
      const totalWeight = taskMilestones.reduce((sum, tm) => sum + (tm.weight || 1), 0);
      
      // Calculate weighted completion percentage
      let completionPercentage = 0;
      
      for (const tm of taskMilestones) {
        const task = await this.getTask(tm.taskid);
        if (!task) continue;
        
        // Weight of this task-milestone relationship (default to 1)
        const weight = tm.weight || 1;
        
        // Task completion based on status
        let taskCompletion = 0;
        if (task.status === 'Completed') {
          taskCompletion = 100;
        } else if (task.status === 'Review') {
          taskCompletion = 90;
        } else if (task.status === 'InProgress') {
          taskCompletion = 50;
        } else if (task.status === 'OnHold') {
          taskCompletion = 25;
        } else if (task.status === 'Todo') {
          taskCompletion = 0;
        }
        
        // Add weighted task completion to milestone completion
        completionPercentage += (taskCompletion * weight) / totalWeight;
      }
      
      // Round to nearest integer
      completionPercentage = Math.round(completionPercentage);
      
      // Update milestone completion and status
      await this.updateMilestone(milestoneId, {
        completionPercentage,
        status: this.getMilestoneStatusFromCompletion(completionPercentage, milestone)
      });
    } catch (error) {
      console.error('Failed to update milestone progress:', error);
    }
  }

  private getMilestoneStatusFromCompletion(completionPercentage: number, milestone: Milestone): "NotStarted" | "InProgress" | "Completed" | "Delayed" | "AtRisk" {
    // If milestone is past deadline and not completed, mark as delayed
    if (milestone.deadline && new Date() > new Date(milestone.deadline) && completionPercentage < 100) {
      return "Delayed";
    }
    
    // If milestone is near deadline (within 3 days) and completion is < 75%, mark as at risk
    if (milestone.deadline) {
      const deadlineDate = new Date(milestone.deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3 && completionPercentage < 75) {
        return "AtRisk";
      }
    }
    
    // Otherwise, status based on completion percentage
    if (completionPercentage === 0) {
      return "NotStarted";
    } else if (completionPercentage === 100) {
      return "Completed";
    } else {
      return "InProgress";
    }
  }

  // ------------------------------------------------------------------------
  // Audit Log methods
  // ------------------------------------------------------------------------
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await this.query<AuditLog>(`
      INSERT INTO auditLogs (departmentid, userid, action, relatedentitytype, relatedentityid, details, createdat)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, departmentid, userid, action, relatedentitytype, relatedentityid, details, createdat
    `, [log.departmentid, log.userid, log.action, log.relatedentitytype, log.relatedentityid, log.details, log.createdat]);
    return result;
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    const result = await this.query<AuditLog>(`
      SELECT 
        id,
        departmentid,
        userid,
        action,
        relatedentitytype,
        relatedentityid,
        details,
        createdat
      FROM auditLogs 
      WHERE id = $1
    `, [id]);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getAuditLogs(options: {
    limit?: number;
    offset?: number;
    userId?: number;
    entityType?: string;
    entityId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    departmentId?: number;
  }): Promise<AuditLog[]> {
    const {
      limit = 50,
      offset = 0,
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      departmentId
    } = options;

    let query = `
      SELECT 
        id,
        departmentid,
        userid,
        action,
        entity_type,
        entity_id,
        details,
        createdat
      FROM audit_logs
    `;
    
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      whereClauses.push(`userid = $${paramIndex++}`);
      params.push(userId);
    }
    if (entityType) {
      whereClauses.push(`entity_type = $${paramIndex++}`);
      params.push(entityType);
    }
    if (entityId) {
      whereClauses.push(`entity_id = $${paramIndex++}`);
      params.push(entityId);
    }
    if (action) {
      whereClauses.push(`action = $${paramIndex++}`);
      params.push(action);
    }
    if (startDate) {
      whereClauses.push(`createdat >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push(`createdat <= $${paramIndex++}`);
      params.push(endDate);
    }
    if (departmentId) {
      whereClauses.push(`departmentid = $${paramIndex++}`);
      params.push(departmentId);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY createdat DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    console.log('PgStorage.getAuditLogs - About to execute query:');
    console.log('Query:', query);
    console.log('Params:', params);
    console.log('Options passed:', options);

    try {
      // Use the internal query method that handles row formatting
      const result = await this.query<any>(query, params);
      
      console.log('PgStorage.getAuditLogs - Query executed successfully, rows returned:', result.length);
      
      // The this.query method already maps and formats, so direct return
      return result;
    } catch (error) {
      console.error('PgStorage.getAuditLogs - Query failed:');
      console.error('Error:', error);
      console.error('Query that failed:', query);
      console.error('Params for failed query:', params);
      throw error;
    }
  }

  async getAuditLogsByUser(userId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    return this.getAuditLogs({ userId, limit, offset });
  }

  // Goal Relationships
  async createGoalRelationship(
    relationship: InsertGoalRelationship
  ): Promise<GoalRelationship> {
    return this.createEntity<InsertGoalRelationship, GoalRelationship>(
      'goalRelationships',
      relationship
    );
  }

  async getGoalRelationshipsByParent(parentGoalId: number): Promise<GoalRelationship[]> {
    const result = await this.query<GoalRelationship>(`
      SELECT 
        id,
        parentgoalid as "parentGoalId",
        childgoalid as "childGoalId",
        weight,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM goalRelationships 
      WHERE parentgoalid = $1
    `, [parentGoalId]);
    return result;
  }

  async getGoalRelationshipsByChild(childGoalId: number): Promise<GoalRelationship[]> {
    const result = await this.query<GoalRelationship>(`
      SELECT 
        id,
        parentgoalid as "parentGoalId",
        childgoalid as "childGoalId",
        weight,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM goalRelationships 
      WHERE childgoalid = $1
    `, [childGoalId]);
    return result;
  }

  async deleteGoalRelationship(id: number): Promise<boolean> {
    await this.query("DELETE FROM goalRelationships WHERE id = $1", [id]);
    return true; // Assuming success if no error is thrown
  }

  // Project-Goal Relationships
  async getProjectGoalsByGoal(goalId: number): Promise<ProjectGoal[]> {
    const result = await this.query<ProjectGoal>(`
      SELECT 
        id,
        projectid as "projectId",
        goalid as "goalId",
        weight,
        createdat as "createdAt",
        updatedat as "updatedAt"
      FROM projectGoals 
      WHERE goalid = $1
    `, [goalId]);
    return result;
  }

  async deleteProjectGoal(id: number): Promise<boolean> {
    await this.query("DELETE FROM projectGoals WHERE id = $1", [id]);
    return true; // Assuming success if no error
  }

  // Project Favorites methods
  async addProjectFavorite(favorite: any): Promise<ProjectFavorite> {
    // Convert camelCase properties to snake_case to match database schema
    const favoriteData = {
      user_id: favorite.userId,
      project_id: favorite.projectId,
    };
    return this.createEntity<InsertProjectFavorite, ProjectFavorite>('projectFavorites', favoriteData as InsertProjectFavorite);
  }

  async removeProjectFavorite(userId: number, projectId: number): Promise<boolean> {
    await this.query(
      "DELETE FROM project_favorites WHERE user_id = $1 AND project_id = $2",
      [userId, projectId]
    );
    return true;
  }

  async getUserFavoriteProjects(userId: number): Promise<ProjectFavorite[]> {
    const result = await this.query<ProjectFavorite>(`
      SELECT 
        id,
        user_id as "userId",
        project_id as "projectId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM project_favorites 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    return result;
  }

  async isProjectFavorite(userId: number, projectId: number): Promise<boolean> {
    const result = await this.query<{count: string}>(`
      SELECT COUNT(*) as count 
      FROM project_favorites 
      WHERE user_id = $1 AND project_id = $2
    `, [userId, projectId]);
    
    return parseInt(result[0]?.count || '0') > 0;
  }

  async getTaskMilestonesForMilestone(milestoneid: number): Promise<TaskMilestone[]> {
    return this.query<TaskMilestone>(`
      SELECT * FROM taskMilestones WHERE milestoneid = $1
    `, [milestoneid]);
  }

  async getTaskMilestonesForTask(taskid: number): Promise<any[]> {
    const result = await this.query<any[]>(`
      SELECT 
        id,
        taskid,
        milestoneid,
        milestoneName: milestones.name,
        milestoneDueDate: milestones.duedate,
        milestoneStatus: milestones.status
      FROM taskMilestones
      LEFT JOIN milestones ON taskMilestones.milestoneid = milestones.id
      WHERE taskid = $1
    `, [taskid]);
    return result;
  }

  async getExistingTaskMilestone(taskid: number, milestoneid: number): Promise<TaskMilestone | undefined> {
    const result = await this.query<TaskMilestone>(`
      SELECT * FROM task_milestones 
      WHERE taskid = $1 AND milestoneid = $2
    `, [taskid, milestoneid]);
    
    return result[0];
  }

  // ------------------------------------------------------------------------
  // Project Attachment methods
  // ------------------------------------------------------------------------
  
  async createProjectAttachment(attachment: InsertProjectAttachment): Promise<ProjectAttachment> {
    return this.createEntity<InsertProjectAttachment, ProjectAttachment>('projectAttachments', attachment);
  }

  async getProjectAttachment(id: number): Promise<ProjectAttachment | undefined> {
    return this.getEntityById<ProjectAttachment>('project_attachments', id);
  }

  async getProjectAttachments(projectId: number): Promise<ProjectAttachment[]> {
    return this.query<ProjectAttachment>(`
      SELECT 
        pa.*,
        u.name as uploadedByName
      FROM project_attachments pa
      LEFT JOIN users u ON pa.uploadeduserid = u.id
      WHERE pa.projectid = $1
      ORDER BY pa.createdat DESC
    `, [projectId]);
  }

  async getProjectAttachmentsByCategory(projectId: number, category: string): Promise<ProjectAttachment[]> {
    return this.query<ProjectAttachment>(`
      SELECT 
        pa.*,
        u.name as uploadedByName
      FROM project_attachments pa
      LEFT JOIN users u ON pa.uploadeduserid = u.id
      WHERE pa.projectid = $1 AND pa.filecategory = $2
      ORDER BY pa.createdat DESC
    `, [projectId, category]);
  }

  async getProjectPlan(projectId: number): Promise<ProjectAttachment | undefined> {
    const result = await this.query<ProjectAttachment>(`
      SELECT 
        pa.*,
        u.name as uploadedByName
      FROM project_attachments pa
      LEFT JOIN users u ON pa.uploadeduserid = u.id
      WHERE pa.projectid = $1 AND pa.isprojectplan = true
      ORDER BY pa.createdat DESC
      LIMIT 1
    `, [projectId]);
    
    return result[0];
  }

  async updateProjectAttachment(id: number, attachment: Partial<ProjectAttachment>): Promise<ProjectAttachment | undefined> {
    return this.updateEntity<Partial<ProjectAttachment>, ProjectAttachment>('projectAttachments', id, attachment);
  }

  async deleteProjectAttachment(id: number): Promise<boolean> {
    try {
      const result = await this.query(`DELETE FROM project_attachments WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete project attachment:', error);
      return false;
    }
  }

  async setProjectPlan(projectId: number, attachmentId: number): Promise<boolean> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      
      // First, unset any existing project plan for this project
      await client.query(`
        UPDATE project_attachments 
        SET isprojectplan = false 
        WHERE projectid = $1 AND isprojectplan = true
      `, [projectId]);
      
      // Then set the new project plan
      await client.query(`
        UPDATE project_attachments 
        SET isprojectplan = true, filecategory = 'plan'
        WHERE id = $1 AND projectid = $2
      `, [attachmentId, projectId]);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to set project plan:', error);
      return false;
    } finally {
      client.release();
    }
  }
}