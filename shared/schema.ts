import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['User', 'ProjectManager', 'SubPMO', 'MainPMO', 'DepartmentDirector', 'Executive', 'Administrator']);
export const userStatusEnum = pgEnum('user_status', ['Pending', 'Active', 'Inactive', 'Rejected']);
export const projectStatusEnum = pgEnum('project_status', ['Pending', 'Planning', 'InProgress', 'OnHold', 'Completed']);
export const taskStatusEnum = pgEnum('task_status', ['Todo', 'InProgress', 'Review', 'Completed', 'OnHold']);
export const priorityEnum = pgEnum('priority', ['Low', 'Medium', 'High', 'Critical']);
export const changeRequestTypeEnum = pgEnum('change_request_type', ['Schedule', 'Budget', 'Scope', 'Delegation', 'Status', 'Closure', 'AdjustTeam', 'Faculty']);
export const changeRequestStatusEnum = pgEnum('change_request_status', ['Pending', 'PendingMainPMO', 'Approved', 'Rejected', 'ReturnedToProjectManager', 'ReturnedToSubPMO']);
export const riskTypeEnum = pgEnum('risk_type', ['Risk', 'Issue']);
export const riskStatusEnum = pgEnum('risk_status', ['Open', 'InProgress', 'Resolved', 'Closed']);
export const milestoneStatusEnum = pgEnum('milestone_status', ['NotStarted', 'InProgress', 'Completed', 'Delayed', 'AtRisk']);

// Department
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar'),
  code: text('code').notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  directorUserId: integer('director_user_id'),
  headUserId: integer('head_user_id'),
  budget: doublePrecision('budget').default(0),
  location: text('location'),
  phone: text('phone'),
  email: text('email'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create insertDepartmentSchema
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });

// User
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('User'),
  status: userStatusEnum('status').default('Pending'),
  departmentId: integer('department_id'),
  passportImage: text('passport_image'),
  idCardImage: text('id_card_image'),
  preferredLanguage: text('preferred_language').default('en'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  managerUserId: integer('manager_user_id').notNull(),
  departmentId: integer('department_id').notNull(),
  client: text('client').notNull(),
  budget: doublePrecision('budget').default(0),
  priority: priorityEnum('priority').default('Medium'),
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date'),
  deadline: timestamp('deadline'),
  status: projectStatusEnum('status').default('Pending'),
  actualCost: doublePrecision('actual_cost').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Team Members (Many-to-Many)
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  userId: integer('user_id').notNull(),
});

// Project Dependencies (Self-referencing Many-to-Many)
export const projectDependencies = pgTable('project_dependencies', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  dependsOnProjectId: integer('depends_on_project_id').notNull(),
});

// Project Cost History
export const projectCostHistory = pgTable('project_cost_history', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  amount: doublePrecision('amount').notNull(),
  updatedByUserId: integer('updated_by_user_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  assignedUserId: integer('assigned_user_id'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  status: taskStatusEnum('status').default('Todo'),
  createdByUserId: integer('created_by_user_id').notNull(),
  priorityOrder: integer('priority_order'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task Comments
export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Assignment Comments
export const assignmentComments = pgTable('assignment_comments', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Change Requests
export const changeRequests = pgTable('change_requests', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  type: changeRequestTypeEnum('type').notNull(),
  details: text('details').notNull(),
  detailsAr: text('details_ar'),
  requestedByUserId: integer('requested_by_user_id').notNull(),
  requestedAt: timestamp('requested_at').defaultNow(),
  status: changeRequestStatusEnum('status').default('Pending'),
  reviewedByUserId: integer('reviewed_by_user_id'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  returnTo: varchar('return_to', { length: 50 }),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Goals
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  createdByUserId: integer('created_by_user_id').notNull(),
  isStrategic: boolean('is_strategic').default(false),
  departmentId: integer('department_id'),
  isAnnual: boolean('is_annual').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Goals (Many-to-Many with weight)
export const projectGoals = pgTable('project_goals', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  goalId: integer('goal_id').notNull(),
  weight: doublePrecision('weight').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Goal-to-Goal relationships (with weight)
export const goalRelationships = pgTable('goal_relationships', {
  id: serial('id').primaryKey(),
  parentGoalId: integer('parent_goal_id').notNull(),
  childGoalId: integer('child_goal_id').notNull(),
  weight: doublePrecision('weight').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Risks & Issues
export const risksIssues = pgTable('risks_issues', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  type: riskTypeEnum('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  descriptionAr: text('description_ar'),
  priority: priorityEnum('priority').default('Medium'),
  status: riskStatusEnum('status').default('Open'),
  createdByUserId: integer('created_by_user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  relatedEntity: text('related_entity'),
  relatedEntityId: integer('related_entity_id'),
  message: text('message').notNull(),
  messageAr: text('message_ar'),
  isRead: boolean('is_read').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  lastReminderSent: timestamp('last_reminder_sent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Assignments
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  assignedByUserId: integer('assigned_by_user_id').notNull(),
  assignedToUserId: integer('assigned_to_user_id').notNull(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  status: taskStatusEnum('status').default('Todo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Action Items (Personal To-dos)
export const actionItems = pgTable('action_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  status: taskStatusEnum('status').default('Todo'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Weekly Updates
export const weeklyUpdates = pgTable('weekly_updates', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  week: text('week').notNull(),
  comments: text('comments').notNull(),
  commentsAr: text('comments_ar'),
  createdByUserId: integer('created_by_user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Milestones
export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  title: text('title').notNull(),
  titleAr: text('title_ar'),
  description: text('description'),
  descriptionAr: text('description_ar'),
  deadline: timestamp('deadline'),
  status: milestoneStatusEnum('status').default('NotStarted'),
  completionPercentage: doublePrecision('completion_percentage').default(0),
  createdByUserId: integer('created_by_user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task-Milestone Relationship
export const taskMilestones = pgTable('task_milestones', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  milestoneId: integer('milestone_id').notNull(),
  weight: doublePrecision('weight').default(1), // Weight for milestone completion calculation
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  departmentId: integer('department_id').references(() => departments.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// ===== Insert Schemas =====

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .refine((data: any) => {
    // Ensure startDate is provided when creating a project
    return data.startDate !== null && data.startDate !== undefined;
  }, {
    message: "Start date is required for new projects",
    path: ["startDate"]
  })
  .transform((data: any) => {
    // Convert date strings to Date objects, ensuring startDate is always a Date
    return {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : data.endDate,
    };
  });

// Define updateProjectSchema for partial updates
export const updateProjectSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  managerUserId: z.number().optional(),
  departmentId: z.number().optional(),
  client: z.string().optional(),
  budget: z.number().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  status: z.enum(['Pending', 'Planning', 'InProgress', 'OnHold', 'Completed', 'Cancelled']).optional(),
  actualCost: z.number().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).transform((data: any) => {
  // Ensure date fields are properly converted
  return {
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : data.startDate,
    endDate: data.endDate ? new Date(data.endDate) : data.endDate,
  };
});

export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({ id: true, requestedAt: true, reviewedAt: true });

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .transform((data: any) => {
    // Convert date strings to Date objects
    return {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline,
    };
  });

export const insertRiskIssueSchema = createInsertSchema(risksIssues).omit({ id: true, createdAt: true, updatedAt: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

export const insertAssignmentSchema = createInsertSchema(assignments)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .transform((data: any) => {
    // Convert date strings to Date objects
    return {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline,
    };
  });

export const insertActionItemSchema = createInsertSchema(actionItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWeeklyUpdateSchema = createInsertSchema(weeklyUpdates).omit({ id: true, createdAt: true });
export const insertProjectCostHistorySchema = createInsertSchema(projectCostHistory).omit({ id: true, updatedAt: true });
export const insertProjectGoalSchema = createInsertSchema(projectGoals).omit({ id: true });
export const insertGoalRelationshipSchema = createInsertSchema(goalRelationships).omit({ id: true });

export const insertTaskCommentSchema = createInsertSchema(taskComments)
  .omit({ id: true, createdAt: true });

export const insertAssignmentCommentSchema = createInsertSchema(assignmentComments)
  .omit({ id: true, createdAt: true });

export const insertProjectDependencySchema = createInsertSchema(projectDependencies).omit({ id: true });

export const insertMilestoneSchema = createInsertSchema(milestones)
  .omit({ id: true, createdAt: true, updatedAt: true, completionPercentage: true })
  .transform((data: any) => {
    // Convert date strings to Date objects
    return {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline,
    };
  });

export const insertTaskMilestoneSchema = createInsertSchema(taskMilestones).omit({ id: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ 
  id: true,
  createdAt: true 
}).extend({
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  departmentId: z.number().optional(),
  userId: z.number().optional(),
});

// Login schema (subset of user)
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// ===== Types =====

// Insert Types
export type InsertUser = {
  name: string;
  email: string;
  phone?: string | null;
  username: string;
  password: string;
  role?: "User" | "ProjectManager" | "SubPMO" | "MainPMO" | "DepartmentDirector" | "Executive" | "Administrator" | null;
  status?: "Pending" | "Active" | "Inactive" | "Rejected" | null;
  departmentId?: number | null;
  passportImage?: string | null;
  idCardImage?: string | null;
  preferredLanguage?: string | null;
};

export type InsertDepartment = {
  name: string;
  nameAr?: string | null;
  code: string;
  description?: string | null;
  descriptionAr?: string | null;
  directorUserId?: number | null;
  headUserId?: number | null;
  budget?: number | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
};

export type InsertProject = {
  status?: "Pending" | "Planning" | "InProgress" | "OnHold" | "Completed" | null;
  title: string;
  titleAr?: string | null;
  managerUserId: number;
  description?: string | null;
  descriptionAr?: string | null;
  startDate: Date;
  endDate?: Date | null;
  departmentId: number;
  client: string;
  priority?: "Low" | "Medium" | "High" | "Critical" | null;
  budget?: number | null;
  actualCost?: number | null;
};

export type InsertTask = {
  status?: "Todo" | "InProgress" | "Review" | "Completed" | "OnHold" | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  deadline?: Date | null;
  projectId: number;
  assignedUserId?: number | null;
  priority?: "Low" | "Medium" | "High" | "Critical" | null;
  createdByUserId: number;
  priorityOrder?: number | null;
};

export type InsertChangeRequest = {
  projectId: number;
  type: 'Schedule' | 'Budget' | 'Scope' | 'Delegation' | 'Status' | 'Closure' | 'AdjustTeam' | 'Faculty';
  details: string;
  detailsAr?: string | null;
  requestedByUserId: number;
  status?: 'Pending' | 'PendingMainPMO' | 'Approved' | 'Rejected' | 'ReturnedToProjectManager' | 'ReturnedToSubPMO' | null;
  reviewedByUserId?: number | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  returnTo?: string | null;
  comments?: string | null;
};

export type InsertGoal = {
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  createdByUserId: number;
  isStrategic?: boolean;
  isAnnual?: boolean;
  departmentId?: number | null;
  startDate?: Date | null;
  deadline?: Date | null;
  status?: 'Active' | 'Completed' | 'OnHold' | 'Cancelled' | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  progress?: number;
};

export type InsertRiskIssue = {
  status?: 'InProgress' | 'Resolved' | 'Open' | 'Closed' | null;
  type: 'Risk' | 'Issue';
  title: string;
  description: string;
  impact?: string | null;
  mitigation?: string | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  projectId: number;
  createdByUserId: number;
};

export type InsertNotification = {
  message: string;
  userId: number;
  relatedEntity?: string | null;
  relatedEntityId?: number | null;
  messageAr?: string | null;
  isRead?: boolean;
  requiresApproval?: boolean;
  lastReminderSent?: Date | null;
};

export type InsertAssignment = {
  status?: 'Todo' | 'InProgress' | 'Review' | 'Completed' | 'OnHold' | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  assignedByUserId: number;
  assignedToUserId: number;
  deadline?: Date | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | null;
};

export type InsertActionItem = {
  status?: 'Todo' | 'InProgress' | 'Review' | 'Completed' | 'OnHold' | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  meetingId?: number | null;
  deadline?: Date | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  userId: number;
};

export type InsertWeeklyUpdate = {
  week: string;
  projectId: number;
  comments: string;
  commentsAr?: string | null;
  createdByUserId: number;
};

export type InsertProjectCostHistory = {
  projectId: number;
  amount: number;
  updatedByUserId: number;
  notes?: string | null;
};

export type InsertProjectGoal = {
  projectId: number;
  goalId: number;
  weight?: number | null;
};

export type InsertGoalRelationship = {
  parentGoalId: number;
  childGoalId: number;
  weight?: number | null;
};

export type InsertTaskComment = {
  content: string;
  taskId: number;
  userId: number;
};

export type InsertAssignmentComment = {
  content: string;
  assignmentId: number;
  userId: number;
};

export type InsertProjectDependency = {
  projectId: number;
  dependsOnProjectId: number;
};

export type InsertMilestone = {
  status?: 'NotStarted' | 'InProgress' | 'Completed' | 'Delayed' | 'AtRisk' | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  projectId: number;
  deadline?: Date | null;
  completionPercentage?: number;
  createdByUserId: number;
};

export type InsertAuditLog = {
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  departmentId?: number | null;
  userId?: number | null;
  createdAt: Date;
};

// Login Type
export type LoginData = z.infer<typeof loginSchema>;

export const updateTaskSchema = z.object({
  id: z.number().optional(),
  projectId: z.number().optional(),
  assignedUserId: z.number().optional().nullable(),
  title: z.string().optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  deadline: z.date().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.enum(['Todo', 'InProgress', 'Review', 'Completed', 'OnHold']).optional(),
  createdByUserId: z.number().optional(),
  priorityOrder: z.number().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).transform((data: any) => {
  // Ensure date fields are properly converted
  return {
    ...data,
    deadline: data.deadline ? new Date(data.deadline) : data.deadline,
  };
});

export const updateChangeRequestSchema = z.object({
  id: z.number().optional(),
  projectId: z.number().optional(),
  type: z.enum(['Schedule', 'Budget', 'Scope', 'Delegation', 'Status', 'Closure', 'AdjustTeam', 'Faculty']).optional(),
  details: z.string().optional(),
  detailsAr: z.string().optional().nullable(),
  requestedByUserId: z.number().optional(),
  requestedAt: z.date().optional(),
  status: z.enum(['Pending', 'PendingMainPMO', 'Approved', 'Rejected', 'ReturnedToProjectManager', 'ReturnedToSubPMO']).optional(),
  reviewedByUserId: z.number().optional().nullable(),
  reviewedAt: z.date().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  returnTo: z.string().optional().nullable(),
  comments: z.string().optional().nullable()
});

export const updateAssignmentSchema = z.object({
  id: z.number().optional(),
  assignedByUserId: z.number().optional(),
  assignedToUserId: z.number().optional(),
  title: z.string().optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  deadline: z.date().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.enum(['Todo', 'InProgress', 'Review', 'Completed', 'OnHold']).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).transform((data: any) => {
  // Ensure date fields are properly converted
  return {
    ...data,
    deadline: data.deadline ? new Date(data.deadline) : data.deadline,
  };
});

export const updateActionItemSchema = z.object({
  id: z.number().optional(),
  userId: z.number().optional(),
  title: z.string().optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  deadline: z.date().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.enum(['Todo', 'InProgress', 'Review', 'Completed', 'OnHold']).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).transform((data: any) => {
  // Ensure date fields are properly converted
  return {
    ...data,
    deadline: data.deadline ? new Date(data.deadline) : data.deadline,
  };
});

export const updateWeeklyUpdateSchema = z.object({
  id: z.number().optional(),
  projectId: z.number().optional(),
  week: z.string().optional(),
  comments: z.string().optional(),
  commentsAr: z.string().optional().nullable(),
  createdByUserId: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).transform((data: any) => {
  // Ensure date fields are properly converted
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : data.createdAt,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : data.updatedAt,
  };
});

export const updateMilestoneSchema = z.object({
  id: z.number().optional(),
  projectId: z.number().optional(),
  title: z.string().optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  deadline: z.date().optional().nullable(),
  status: z.enum(['NotStarted', 'InProgress', 'Completed', 'Delayed', 'AtRisk']).optional(),
  completionPercentage: z.number().optional(),
  createdByUserId: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}).transform((data: any) => {
  // Ensure date fields are properly converted
  return {
    ...data,
    deadline: data.deadline ? new Date(data.deadline) : data.deadline,
  };
});

// Add types for update schemas
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type UpdateChangeRequest = z.infer<typeof updateChangeRequestSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;
export type UpdateActionItem = z.infer<typeof updateActionItemSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type UpdateWeeklyUpdate = z.infer<typeof updateWeeklyUpdateSchema>;
export type UpdateMilestone = z.infer<typeof updateMilestoneSchema>;

// Select Types
export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  username: string;
  password: string;
  role?: string | null;
  status?: string | null;
  departmentId?: number | null;
  passportImage?: string | null;
  idCardImage?: string | null;
  preferredLanguage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Department = {
  id: number;
  name: string;
  nameAr?: string | null;
  code: string;
  description?: string | null;
  descriptionAr?: string | null;
  directorUserId?: number | null;
  headUserId?: number | null;
  budget?: number | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Project = {
  id: number;
  status?: string | null;
  title: string;
  titleAr?: string | null;
  managerUserId: number;
  description?: string | null;
  descriptionAr?: string | null;
  startDate: Date;
  endDate?: Date | null;
  deadline?: Date | null;
  departmentId: number;
  client: string;
  priority?: string | null;
  budget?: number | null;
  actualCost?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Task = {
  id: number;
  status?: string | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  deadline?: Date | null;
  projectId: number;
  assignedUserId?: number | null;
  priority?: string | null;
  createdByUserId: number;
  priorityOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChangeRequest = {
  id: number;
  projectId: number;
  type: string;
  details: string;
  detailsAr?: string | null;
  requestedByUserId: number;
  requestedAt: Date;
  status?: string | null;
  reviewedByUserId?: number | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  returnTo?: string | null;
  comments?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Goal = {
  id: number;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  createdByUserId: number;
  isStrategic: boolean;
  isAnnual: boolean;
  departmentId?: number | null;
  startDate?: Date | null;
  deadline?: Date | null;
  status?: string | null;
  priority?: string | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RiskIssue = {
  id: number;
  status?: string | null;
  type: string;
  title: string;
  description: string;
  impact?: string | null;
  mitigation?: string | null;
  priority?: string | null;
  projectId: number;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Notification = {
  id: number;
  message: string;
  userId: number;
  relatedEntity?: string | null;
  relatedEntityId?: number | null;
  messageAr?: string | null;
  isRead: boolean;
  requiresApproval: boolean;
  lastReminderSent?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Assignment = {
  id: number;
  status?: string | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  assignedByUserId: number;
  assignedToUserId: number;
  deadline?: Date | null;
  priority?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActionItem = {
  id: number;
  status?: string | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  meetingId?: number | null;
  deadline?: Date | null;
  priority?: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type WeeklyUpdate = {
  id: number;
  week: string;
  projectId: number;
  comments: string;
  commentsAr?: string | null;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectCostHistory = {
  id: number;
  projectId: number;
  amount: number;
  updatedByUserId: number;
  notes?: string | null;
  createdAt: Date;
};

export type ProjectGoal = {
  id: number;
  projectId: number;
  goalId: number;
  weight?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GoalRelationship = {
  id: number;
  parentGoalId: number;
  childGoalId: number;
  weight?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskComment = {
  id: number;
  content: string;
  taskId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AssignmentComment = {
  id: number;
  content: string;
  assignmentId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Milestone = {
  id: number;
  status?: string | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  projectId: number;
  deadline?: Date | null;
  completionPercentage: number;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskMilestone = {
  id: number;
  taskId: number;
  milestoneId: number;
  weight?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  departmentId?: number | null;
  userId?: number | null;
  createdAt: Date;
};
