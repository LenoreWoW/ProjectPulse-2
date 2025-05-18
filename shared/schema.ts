import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['User', 'ProjectManager', 'SubPMO', 'MainPMO', 'DepartmentDirector', 'Executive', 'Administrator']);
export const userStatusEnum = pgEnum('user_status', ['Pending', 'Active', 'Inactive', 'Rejected']);
export const projectStatusEnum = pgEnum('project_status', ['Pending', 'Planning', 'InProgress', 'OnHold', 'Completed']);
export const taskStatusEnum = pgEnum('task_status', ['Todo', 'InProgress', 'Review', 'Completed', 'OnHold']);
export const priorityEnum = pgEnum('priority', ['Low', 'Medium', 'High', 'Critical']);
export const changeRequestTypeEnum = pgEnum('change_request_type', ['Schedule', 'Budget', 'Scope', 'Delegation', 'Status', 'Closure', 'AdjustTeam']);
export const changeRequestStatusEnum = pgEnum('change_request_status', ['Pending', 'Approved', 'Rejected']);
export const riskTypeEnum = pgEnum('risk_type', ['Risk', 'Issue']);
export const riskStatusEnum = pgEnum('risk_status', ['Open', 'InProgress', 'Resolved', 'Closed']);

// Department
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  code: text('code'),
  description: text('description'),
  directorUserId: integer('director_user_id'),
  headUserId: integer('head_user_id'),
  budget: doublePrecision('budget'),
  location: text('location'),
  phone: text('phone'),
  email: text('email'),
});

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
  updatedAt: timestamp('updated_at').defaultNow(),
  notes: text('notes'),
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
});

// Assignment Comments
export const assignmentComments = pgTable('assignment_comments', {
  id: serial('id').primaryKey(),
  assignmentId: integer('assignment_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
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
  comments: text('comments'),
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
});

// Goal-to-Goal relationships (with weight)
export const goalRelationships = pgTable('goal_relationships', {
  id: serial('id').primaryKey(),
  parentGoalId: integer('parent_goal_id').notNull(),
  childGoalId: integer('child_goal_id').notNull(),
  weight: doublePrecision('weight').default(1),
});

// Risks & Issues
export const risksIssues = pgTable('risks_issues', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  type: riskTypeEnum('type').notNull(),
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
  createdAt: timestamp('created_at').defaultNow(),
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
});

// ===== Insert Schemas =====

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });

// Modify insertProjectSchema to handle date strings
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .transform((data) => {
    // Convert date strings to Date objects
    return {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : data.startDate,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline,
    };
  });

export const insertChangeRequestSchema = createInsertSchema(changeRequests).omit({ id: true, requestedAt: true, reviewedAt: true });

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .transform((data) => {
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
  .transform((data) => {
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

// Login schema (subset of user)
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// ===== Types =====

// Insert Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertRiskIssue = z.infer<typeof insertRiskIssueSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type InsertWeeklyUpdate = z.infer<typeof insertWeeklyUpdateSchema>;
export type InsertProjectCostHistory = z.infer<typeof insertProjectCostHistorySchema>;
export type InsertProjectGoal = z.infer<typeof insertProjectGoalSchema>;
export type InsertGoalRelationship = z.infer<typeof insertGoalRelationshipSchema>;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type InsertAssignmentComment = z.infer<typeof insertAssignmentCommentSchema>;

// Select Types
export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ChangeRequest = typeof changeRequests.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type RiskIssue = typeof risksIssues.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type ActionItem = typeof actionItems.$inferSelect;
export type WeeklyUpdate = typeof weeklyUpdates.$inferSelect;
export type ProjectCostHistory = typeof projectCostHistory.$inferSelect;
export type ProjectGoal = typeof projectGoals.$inferSelect;
export type GoalRelationship = typeof goalRelationships.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type AssignmentComment = typeof assignmentComments.$inferSelect;

// Login Type
export type LoginData = z.infer<typeof loginSchema>;
