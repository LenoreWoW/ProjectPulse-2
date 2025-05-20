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
  
  // Convert PostgreSQL timestamp strings to JavaScript Date objects
  Object.keys(result).forEach(key => {
    const value = result[key];
    
    // Check if the value is a string that looks like a date
    if (typeof value === 'string' && 
        (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || 
         value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/))) {
      try {
        const date = new Date(value);
        // Ensure it's a valid date before replacing
        if (!isNaN(date.getTime())) {
          result[key] = date;
        }
      } catch (e) {
        // Keep the original value if date parsing fails
      }
    } else if (value && typeof value === 'object') {
      // Recursively process nested objects
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
    return this.getEntityById<User>('users', id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.query<User>('SELECT * FROM users WHERE username = $1', [username]);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.query<User>('SELECT * FROM users WHERE email = $1', [email]);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.createEntity<InsertUser, User>('users', user);
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    return this.updateEntity<Partial<User>, User>('users', id, user);
  }

  async getUsers(): Promise<User[]> {
    return this.query<User>('SELECT * FROM users');
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.query<User>('SELECT * FROM users WHERE role = $1', [role]);
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return this.query<User>('SELECT * FROM users WHERE "departmentId" = $1', [departmentId]);
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
    return this.getEntityById<Project>('projects', id);
  }

  async getProjects(): Promise<Project[]> {
    return this.query<Project>('SELECT * FROM projects');
  }

  async getProjectsByDepartment(departmentId: number): Promise<Project[]> {
    return this.query<Project>('SELECT * FROM projects WHERE "departmentId" = $1', [departmentId]);
  }

  async getProjectsByManager(managerUserId: number): Promise<Project[]> {
    return this.query<Project>('SELECT * FROM projects WHERE "managerUserId" = $1', [managerUserId]);
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return this.query<Project>('SELECT * FROM projects WHERE status = $1', [status]);
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
    return this.query<ProjectGoal>('SELECT * FROM project_goals WHERE "projectId" = $1', [projectId]);
  }

  // ------------------------------------------------------------------------
  // Project Dependency methods
  // ------------------------------------------------------------------------
  async createProjectDependency(dependency: InsertProjectDependency): Promise<ProjectDependency> {
    return this.createEntity<InsertProjectDependency, ProjectDependency>('project_dependencies', dependency);
  }

  async getProjectDependencies(projectId: number): Promise<ProjectDependency[]> {
    return this.query<ProjectDependency>('SELECT * FROM project_dependencies WHERE "projectId" = $1', [projectId]);
  }

  // ------------------------------------------------------------------------
  // Task methods
  // ------------------------------------------------------------------------
  async getTask(id: number): Promise<Task | undefined> {
    return this.getEntityById<Task>('tasks', id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return this.query<Task>('SELECT * FROM tasks WHERE "projectId" = $1', [projectId]);
  }

  async getTasksByAssignee(assignedUserId: number): Promise<Task[]> {
    return this.query<Task>('SELECT * FROM tasks WHERE "assignedUserId" = $1', [assignedUserId]);
  }

  async getTasksByCreator(createdByUserId: number): Promise<Task[]> {
    return this.query<Task>('SELECT * FROM tasks WHERE "createdByUserId" = $1', [createdByUserId]);
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
    return this.query<ChangeRequest>('SELECT * FROM change_requests WHERE "projectId" = $1', [projectId]);
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
    return this.query<Goal>('SELECT * FROM goals WHERE "isStrategic" = TRUE');
  }

  async getAnnualGoals(): Promise<Goal[]> {
    return this.query<Goal>('SELECT * FROM goals WHERE "isStrategic" = FALSE');
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
    return this.query<RiskIssue>('SELECT * FROM risks_issues WHERE "projectId" = $1', [projectId]);
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
    return this.query<Notification>('SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC', [userId]);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.createEntity<InsertNotification, Notification>('notifications', notification);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    return this.updateEntity<Partial<Notification>, Notification>('notifications', id, { isRead: true });
  }

  async getPendingApprovalNotifications(): Promise<Notification[]> {
    return this.query<Notification>('SELECT * FROM notifications WHERE "requiresApproval" = TRUE AND "isRead" = FALSE');
  }

  async updateNotificationReminderSent(id: number): Promise<Notification | undefined> {
    return this.updateEntity<Partial<Notification>, Notification>('notifications', id, { lastReminderSent: new Date() });
  }

  async getNotificationsNeedingReminders(hoursThreshold: number = 24): Promise<Notification[]> {
    const thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
    
    return this.query<Notification>(
      `SELECT * FROM notifications
       WHERE "requiresApproval" = TRUE
       AND "isRead" = FALSE
       AND ("lastReminderSent" IS NULL OR "lastReminderSent" < $1)`,
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
    return this.query<Assignment>('SELECT * FROM assignments WHERE "assignedToUserId" = $1', [assignedToUserId]);
  }

  async getAssignmentsByAssigner(assignedByUserId: number): Promise<Assignment[]> {
    return this.query<Assignment>('SELECT * FROM assignments WHERE "assignedByUserId" = $1', [assignedByUserId]);
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
    return this.query<ActionItem>('SELECT * FROM action_items WHERE "meetingId" = $1', [meetingId]);
  }

  async getActionItemsByAssignee(assignedToUserId: number): Promise<ActionItem[]> {
    return this.query<ActionItem>('SELECT * FROM action_items WHERE "userId" = $1', [assignedToUserId]);
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
    return this.query<WeeklyUpdate>('SELECT * FROM weekly_updates WHERE "projectId" = $1', [projectId]);
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
    return this.query<ProjectCostHistory>('SELECT * FROM project_cost_history WHERE "projectId" = $1', [projectId]);
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
    return this.query<Milestone>('SELECT * FROM milestones WHERE "projectId" = $1', [projectId]);
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
    return this.query<TaskMilestone>('SELECT * FROM task_milestones WHERE "taskId" = $1', [taskId]);
  }

  async getTaskMilestonesByMilestone(milestoneId: number): Promise<TaskMilestone[]> {
    return this.query<TaskMilestone>('SELECT * FROM task_milestones WHERE "milestoneId" = $1', [milestoneId]);
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
    return this.createEntity<InsertAuditLog, AuditLog>('audit_logs', auditLog);
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    return this.getEntityById<AuditLog>('audit_logs', id);
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
    const params: any[] = [];
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    
    if (options.userId !== undefined) {
      params.push(options.userId);
      query += ` AND user_id = $${params.length}`;
    }
    
    if (options.entityType !== undefined) {
      params.push(options.entityType);
      query += ` AND entity_type = $${params.length}`;
    }
    
    if (options.entityId !== undefined) {
      params.push(options.entityId);
      query += ` AND entity_id = $${params.length}`;
    }
    
    if (options.action !== undefined) {
      params.push(options.action);
      query += ` AND action = $${params.length}`;
    }
    
    if (options.startDate !== undefined) {
      params.push(options.startDate);
      query += ` AND created_at >= $${params.length}`;
    }
    
    if (options.endDate !== undefined) {
      params.push(options.endDate);
      query += ` AND created_at <= $${params.length}`;
    }
    
    if (options.departmentId !== undefined) {
      params.push(options.departmentId);
      query += ` AND department_id = $${params.length}`;
    }
    
    // Add ordering
    query += ' ORDER BY created_at DESC';
    
    // Add pagination
    if (options.limit !== undefined) {
      params.push(options.limit);
      query += ` LIMIT $${params.length}`;
    } else {
      query += ' LIMIT 100'; // Default limit
    }
    
    if (options.offset !== undefined) {
      params.push(options.offset);
      query += ` OFFSET $${params.length}`;
    }
    
    return this.query<AuditLog>(query, params);
  }

  async getAuditLogsByUser(userId: number, limit?: number, offset?: number): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit, offset });
  }
} 