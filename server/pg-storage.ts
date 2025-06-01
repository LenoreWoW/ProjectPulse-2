import { Pool, PoolClient } from 'pg';
import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  InsertProjectGoal, InsertGoalRelationship, InsertTaskComment, InsertAssignmentComment,
  InsertProjectDependency, InsertMilestone,
  ProjectGoal, GoalRelationship, TaskComment, AssignmentComment, Milestone, TaskMilestone,
  AuditLog, InsertAuditLog
} from '@shared/schema';
import { IStorage } from './storage';
import { Store } from 'express-session';
import { pool } from './db-config';
import pgSession from 'connect-pg-simple';
import session from 'express-session';

// Type for project dependency since it's not exported from schema
interface ProjectDependency {
  id: number;
  projectId: number;
  dependsOnProjectId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define an interface for TaskMilestone insertion since it's not in the shared schema
interface InsertTaskMilestone {
  taskId: number;
  milestoneId: number;
  weight?: number;
}

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
    try {
      const result = await this.pool.query(text, params);
      return result.rows.map(row => formatJsonDates(row)) as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
  
  /**
   * Get a client from the pool and begin a transaction
   */
  private async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }
  
  /**
   * Execute a query within a transaction
   */
  private async queryWithTransaction<T>(
    client: PoolClient, 
    text: string, 
    params: any[] = []
  ): Promise<T[]> {
    try {
      const result = await client.query(text, params);
      return result.rows.map(row => formatJsonDates(row)) as T[];
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Transaction query error:', error);
      throw error;
    }
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
  private async createEntity<T, U>(table: string, entity: T): Promise<U> {
    // Filter out undefined values
    const cleanEntity = Object.entries(entity as Record<string, any>)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const keys = Object.keys(cleanEntity);
    if (keys.length === 0) {
      throw new Error(`Cannot create ${table} with empty entity`);
    }
    
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(cleanEntity);
    const columns = keys.join(', ');
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.query<U>(query, values);
    
    return result[0];
  }
  
  /**
   * Common function to update an entity
   */
  private async updateEntity<T, U>(table: string, id: number, updates: Partial<T>): Promise<U | undefined> {
    // Filter out undefined values
    const cleanUpdates = Object.entries(updates as Record<string, any>)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Add updatedAt if not present
    if (!('updatedAt' in cleanUpdates)) {
      (cleanUpdates as any).updatedAt = new Date();
    }
    
    const keys = Object.keys(cleanUpdates);
    if (keys.length === 0) {
      throw new Error(`Cannot update ${table} with empty updates`);
    }
    
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(cleanUpdates);
    
    const query = `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`;
    const result = await this.query<U>(query, [id, ...values]);
    
    return result.length > 0 ? result[0] : undefined;
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
    
    return result.rows.map(user => ({
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
    
    return result.rows.map(user => ({
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
    
    return result.rows.map(user => ({
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
    return this.createEntity<InsertProjectGoal, ProjectGoal>('project_goals', projectGoal);
  }

  async getProjectGoals(projectId: number): Promise<ProjectGoal[]> {
    return this.query<ProjectGoal>('SELECT * FROM project_goals WHERE projectid = $1', [projectId]);
  }

  // ------------------------------------------------------------------------
  // Project Dependency methods
  // ------------------------------------------------------------------------
  async createProjectDependency(dependency: InsertProjectDependency): Promise<ProjectDependency> {
    return this.createEntity<InsertProjectDependency, ProjectDependency>('project_dependencies', dependency);
  }

  async getProjectDependencies(projectId: number): Promise<ProjectDependency[]> {
    return this.query<ProjectDependency>('SELECT * FROM project_dependencies WHERE projectid = $1', [projectId]);
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
    return this.getEntityById<ChangeRequest>('change_requests', id);
  }

  async getChangeRequestsByProject(projectId: number): Promise<ChangeRequest[]> {
    return this.query<ChangeRequest>('SELECT * FROM change_requests WHERE projectid = $1', [projectId]);
  }

  async getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
    return this.query<ChangeRequest>('SELECT * FROM change_requests WHERE status = $1', [status]);
  }

  async createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    return this.createEntity<InsertChangeRequest, ChangeRequest>('change_requests', changeRequest);
  }

  async updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined> {
    return this.updateEntity<Partial<ChangeRequest>, ChangeRequest>('change_requests', id, changeRequest);
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
    return this.query<Goal>('SELECT * FROM goals WHERE isstrategic = TRUE');
  }

  async getAnnualGoals(): Promise<Goal[]> {
    return this.query<Goal>('SELECT * FROM goals WHERE isstrategic = FALSE');
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
    return this.getEntityById<RiskIssue>('risks_issues', id);
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
    return this.createEntity<InsertRiskIssue, RiskIssue>('risks_issues', riskIssue);
  }

  async updateRiskIssue(id: number, riskIssue: Partial<RiskIssue>): Promise<RiskIssue | undefined> {
    return this.updateEntity<Partial<RiskIssue>, RiskIssue>('risks_issues', id, riskIssue);
  }

  // ------------------------------------------------------------------------
  // Notification methods
  // ------------------------------------------------------------------------
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.getEntityById<Notification>('notifications', id);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return this.query<Notification>('SELECT * FROM notifications WHERE userid = $1 ORDER BY createdat DESC', [userId]);
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
    return this.updateEntity<Partial<Notification>, Notification>('notifications', id, { lastReminderSent: new Date() });
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
    return this.createEntity<InsertAssignment, Assignment>('assignments', assignment);
  }

  async updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined> {
    return this.updateEntity<Partial<Assignment>, Assignment>('assignments', id, assignment);
  }

  // ------------------------------------------------------------------------
  // Action Item methods
  // ------------------------------------------------------------------------
  async getActionItem(id: number): Promise<ActionItem | undefined> {
    return this.getEntityById<ActionItem>('action_items', id);
  }

  async getActionItemsByMeeting(meetingId: number): Promise<ActionItem[]> {
    return this.query<ActionItem>('SELECT * FROM action_items WHERE meetingid = $1', [meetingId]);
  }

  async getActionItemsByAssignee(assignedToUserId: number): Promise<ActionItem[]> {
    return this.query<ActionItem>('SELECT * FROM action_items WHERE userid = $1', [assignedToUserId]);
  }

  async createActionItem(actionItem: InsertActionItem): Promise<ActionItem> {
    return this.createEntity<InsertActionItem, ActionItem>('action_items', actionItem);
  }

  async updateActionItem(id: number, actionItem: Partial<ActionItem>): Promise<ActionItem | undefined> {
    return this.updateEntity<Partial<ActionItem>, ActionItem>('action_items', id, actionItem);
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

  async createWeeklyUpdate(weeklyUpdate: InsertWeeklyUpdate): Promise<WeeklyUpdate> {
    return this.createEntity<InsertWeeklyUpdate, WeeklyUpdate>('weekly_updates', weeklyUpdate);
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
    return this.createEntity<InsertProjectCostHistory, ProjectCostHistory>('project_cost_history', projectCostHistory);
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
    return this.getEntityById<TaskMilestone>('task_milestones', id);
  }

  async getTaskMilestonesByTask(taskId: number): Promise<TaskMilestone[]> {
    return this.query<TaskMilestone>('SELECT * FROM task_milestones WHERE taskid = $1', [taskId]);
  }

  async getTaskMilestonesByMilestone(milestoneId: number): Promise<TaskMilestone[]> {
    return this.query<TaskMilestone>('SELECT * FROM task_milestones WHERE milestoneid = $1', [milestoneId]);
  }

  async createTaskMilestone(taskMilestone: InsertTaskMilestone): Promise<TaskMilestone> {
    const result = await this.createEntity<InsertTaskMilestone, TaskMilestone>('task_milestones', taskMilestone);
    await this.recalculateMilestoneProgress(taskMilestone.milestoneId);
    return result;
  }

  async updateTaskMilestone(id: number, taskMilestone: Partial<TaskMilestone>): Promise<TaskMilestone | undefined> {
    const existing = await this.getTaskMilestone(id);
    if (!existing) {
      return undefined;
    }
    
    const result = await this.updateEntity<Partial<TaskMilestone>, TaskMilestone>('task_milestones', id, taskMilestone);
    await this.recalculateMilestoneProgress(existing.milestoneId);
    return result;
  }

  async deleteTaskMilestone(id: number): Promise<boolean> {
    try {
      const existing = await this.getTaskMilestone(id);
      if (!existing) {
        return false;
      }
      
      const result = await this.query<{ id: number }>('DELETE FROM task_milestones WHERE id = $1 RETURNING id', [id]);
      if (result.length === 0) {
        return false;
      }
      
      await this.recalculateMilestoneProgress(existing.milestoneId);
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
        // No associated tasks, milestone progress is 0
        await this.updateMilestone(milestoneId, {
          completionPercentage: 0,
          status: this.getMilestoneStatusFromCompletion(0, milestone)
        });
        return;
      }
      
      // Sum of task milestone weights
      const totalWeight = taskMilestones.reduce((sum, tm) => sum + (tm.weight || 1), 0);
      
      // Calculate weighted completion percentage
      let completionPercentage = 0;
      
      for (const tm of taskMilestones) {
        const task = await this.getTask(tm.taskId);
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
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    // Map camelCase properties to database column names - but the database actually uses camelCase
    const dbAuditLog = {
      userId: auditLog.userId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      details: auditLog.details,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      departmentId: auditLog.departmentId,
      createdAt: auditLog.createdAt || new Date()
    };

    // Filter out undefined values
    const cleanEntity = Object.entries(dbAuditLog)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const keys = Object.keys(cleanEntity);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = Object.values(cleanEntity);
    const columns = keys.join(', ');
    
    const query = `INSERT INTO audit_logs (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.query<AuditLog>(query, values);
    
    // The query method already handles the camelCase conversion, so direct return
    return result[0];
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    const result = await this.query<AuditLog>(`
      SELECT 
        id,
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
        departmentId,
        createdAt
      FROM audit_logs 
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
        al.id,
        al.userId as "userId",
        u.name as "userName",
        al.action,
        al.entityType as "entityType",
        al.entityId as "entityId",
        al.details,
        al.ipAddress as "ipAddress",
        al.userAgent as "userAgent",
        al.createdAt as "createdAt",
        al.departmentId as "departmentId",
        d.name as "departmentName"
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      LEFT JOIN departments d ON al.departmentId = d.id
    `;
    
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      whereClauses.push(`al.userId = $${paramIndex++}`);
      params.push(userId);
    }
    if (entityType) {
      whereClauses.push(`al.entityType = $${paramIndex++}`);
      params.push(entityType);
    }
    if (entityId) {
      whereClauses.push(`al.entityId = $${paramIndex++}`);
      params.push(entityId);
    }
    if (action) {
      whereClauses.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }
    if (startDate) {
      whereClauses.push(`al.createdAt >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push(`al.createdAt <= $${paramIndex++}`);
      params.push(endDate);
    }
    if (departmentId) {
      whereClauses.push(`al.departmentId = $${paramIndex++}`);
      params.push(departmentId);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY al.createdAt DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    console.log('PgStorage.getAuditLogs - About to execute query:');
    console.log('Query:', query);
    console.log('Params:', params);
    console.log('Options passed:', options);

    try {
      // Use the internal query method that handles row formatting
      const result = await this.query<AuditLog>(query, params);
      
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

  async getAuditLogsByUser(userId: number, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit, offset });
  }

  // Goal Relationships
  async createGoalRelationship(relationship: InsertGoalRelationship): Promise<GoalRelationship> {
    return this.createEntity<InsertGoalRelationship, GoalRelationship>('goal_relationships', relationship);
  }

  async getGoalRelationshipsByParent(parentGoalId: number): Promise<GoalRelationship[]> {
    const result = await this.query<GoalRelationship>(`
      SELECT 
        id,
        "parentGoalId",
        "childGoalId",
        weight,
        "createdAt",
        "updatedAt"
      FROM goal_relationships 
      WHERE "parentGoalId" = $1
    `, [parentGoalId]);
    return result;
  }

  async getGoalRelationshipsByChild(childGoalId: number): Promise<GoalRelationship[]> {
    const result = await this.query<GoalRelationship>(`
      SELECT 
        id,
        "parentGoalId",
        "childGoalId",
        weight,
        "createdAt",
        "updatedAt"
      FROM goal_relationships 
      WHERE "childGoalId" = $1
    `, [childGoalId]);
    return result;
  }

  async deleteGoalRelationship(id: number): Promise<boolean> {
    try {
      const result = await this.query(`
        DELETE FROM goal_relationships 
        WHERE id = $1
      `, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting goal relationship:', error);
      return false;
    }
  }

  // Project-Goal Relationships
  async getProjectGoalsByGoal(goalId: number): Promise<ProjectGoal[]> {
    const result = await this.query<ProjectGoal>(`
      SELECT 
        id,
        "projectId",
        "goalId",
        weight,
        "createdAt",
        "updatedAt"
      FROM project_goals 
      WHERE "goalId" = $1
    `, [goalId]);
    return result;
  }

  async deleteProjectGoal(id: number): Promise<boolean> {
    try {
      const result = await this.query(`
        DELETE FROM project_goals 
        WHERE id = $1
      `, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting project goal:', error);
      return false;
    }
  }
}