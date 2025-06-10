import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum, varchar, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRole = pgEnum('user_role', ['User', 'ProjectManager', 'SubPMO', 'MainPMO', 'DepartmentDirector', 'Executive', 'Administrator']);
export const userStatus = pgEnum('user_status', ['Active', 'Inactive', 'Pending']);
export const projectStatus = pgEnum('project_status', ['Pending', 'Approved', 'Rejected', 'InProgress', 'Completed', 'OnHold']);
export const taskStatus = pgEnum('task_status', ['Pending', 'InProgress', 'Completed', 'OnHold']);
export const priorityEnum = pgEnum('priority', ['Low', 'Medium', 'High', 'Critical']);
export const changeRequestTypeEnum = pgEnum('change_request_type', ['Schedule', 'Budget', 'Scope', 'Delegation', 'Status', 'Closure', 'AdjustTeam', 'Faculty']);
export const changeRequestStatus = pgEnum('change_request_status', ['Pending', 'Approved', 'Rejected']);
export const riskIssueType = pgEnum('risk_issue_type', ['Risk', 'Issue']);
export const riskIssueSeverity = pgEnum('risk_issue_severity', ['Low', 'Medium', 'High']);
export const riskIssueStatus = pgEnum('risk_issue_status', ['Open', 'InProgress', 'Closed']);
export const milestoneStatusEnum = pgEnum('milestone_status', ['NotStarted', 'InProgress', 'Completed', 'Delayed', 'AtRisk']);
export const actionItemStatus = pgEnum('action_item_status', ['Open', 'Completed']);

// TABLES

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  namear: text('namear'),
  code: varchar('code', { length: 50 }),
  description: text('description'),
  descriptionar: text('descriptionar'),
  directoruserid: integer('directoruserid'),
  headuserid: integer('headuserid'),
  budget: doublePrecision('budget').default(0),
  location: text('location'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  isactive: boolean('isactive').default(true),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 50 }),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: text('password').notNull(),
  role: userRole('role').default('User'),
  status: userStatus('status').default('Pending'),
  departmentid: integer('departmentid'),
  passportimage: text('passportimage'),
  idcardimage: text('idcardimage'),
  language: varchar('language', { length: 10 }).default('en'),
  lastlogin: timestamp('lastlogin'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  titlear: text('titlear'),
  description: text('description'),
  descriptionar: text('descriptionar'),
  manageruserid: integer('manageruserid').notNull(),
  departmentid: integer('departmentid').notNull(),
  client: text('client').notNull(),
  budget: integer('budget'),
  priority: priorityEnum('priority').default('Medium'),
  startdate: timestamp('startdate'),
  enddate: timestamp('enddate'),
  deadline: timestamp('deadline'),
  status: projectStatus('status').default('Pending'),
  actualcost: doublePrecision('actualcost').default(0),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  userid: integer('userid').notNull(),
});

export const projectDependencies = pgTable('project_dependencies', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  dependsonprojectid: integer('dependsonprojectid').notNull(),
});

export const projectCostHistory = pgTable('project_cost_history', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  amount: doublePrecision('amount').notNull(),
  updatedbyuserid: integer('updatedbyuserid').notNull(),
  notes: text('notes'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const weeklyUpdates = pgTable('weekly_updates', {
    id: serial('id').primaryKey(),
    projectid: integer('projectid').notNull(),
    weeknumber: integer('weeknumber').notNull(),
    year: integer('year').notNull(),
    summary: text('summary'),
    status: text('status'),
    progresssnapshot: jsonb('progresssnapshot'),
    userid: integer('userid').notNull(),
    createdat: timestamp('createdat').defaultNow(),
    updatedat: timestamp('updatedat').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  titlear: text('titlear'),
  description: text('description'),
  descriptionar: text('descriptionar'),
  assigneduserid: integer('assigneduserid'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  status: taskStatus('status').default('Pending'),
  createdbyuserid: integer('createdbyuserid').notNull(),
  priorityorder: integer('priorityorder'),
  startdate: timestamp('startdate'),
  enddate: timestamp('enddate'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskid: integer('taskid').notNull(),
  userid: integer('userid').notNull(),
  content: text('content').notNull(),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const assignmentComments = pgTable('assignment_comments', {
  id: serial('id').primaryKey(),
  assignmentid: integer('assignmentid').notNull(),
  userid: integer('userid').notNull(),
  content: text('content').notNull(),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const changeRequests = pgTable('change_requests', {
  id: serial('id').primaryKey(),
  projectid: integer('projectId').notNull(),
  type: text('type').notNull(),
  details: text('details'),
  status: changeRequestStatus('status').default('Pending'),
  impact: text('impact'),
  requestedbyuserid: integer('requestedByUserId').notNull(),
  reviewedbyuserid: integer('reviewedByUserId'),
  reviewedat: timestamp('reviewedAt'),
  createdat: timestamp('createdAt').defaultNow(),
  updatedat: timestamp('updatedAt').defaultNow(),
});

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  titlear: text('titlear'),
  description: text('description'),
  descriptionar: text('descriptionar'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  createdbyuserid: integer('createdbyuserid').notNull(),
  isstrategic: boolean('isstrategic').default(false),
  departmentid: integer('departmentid'),
  isannual: boolean('isannual').default(true),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const projectGoals = pgTable('projectgoals', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  goalid: integer('goalid').notNull(),
  weight: doublePrecision('weight').default(1),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const goalRelationships = pgTable('goalrelationships', {
  id: serial('id').primaryKey(),
  parentgoalid: integer('parentgoalid').notNull(),
  childgoalid: integer('childgoalid').notNull(),
  weight: doublePrecision('weight').default(1),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const risksIssues = pgTable('risks_issues', {
  id: serial('id').primaryKey(),
  projectid: integer('projectId').notNull(),
  type: riskIssueType('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  severity: text('severity').default('Medium'),
  status: riskIssueStatus('status').default('Open'),
  impact: text('impact'),
  mitigationplan: text('mitigationPlan'),
  createdbyuserid: integer('createdByUserId').notNull(),
  resolvedat: timestamp('resolvedAt'),
  createdat: timestamp('createdAt').defaultNow(),
  updatedat: timestamp('updatedAt').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userid: integer('userid').notNull(),
  relatedentity: text('relatedentity'),
  relatedentityid: integer('relatedentityid'),
  message: text('message').notNull(),
  messagear: text('messagear'),
  isread: boolean('isread').default(false),
  requiresapproval: boolean('requiresapproval').default(false),
  lastremindersent: timestamp('lastremindersent'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  assignedbyuserid: integer('assignedbyuserid').notNull(),
  assignedtouserid: integer('assignedtouserid').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  titlear: text('titlear'),
  description: text('description'),
  descriptionar: text('descriptionar'),
  deadline: timestamp('deadline'),
  priority: priorityEnum('priority').default('Medium'),
  status: taskStatus('status').default('Pending'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const actionItems = pgTable('actionitems', {
  id: serial('id').primaryKey(),
  userid: integer('userid').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  titlear: text('titlear'),
  description: text('description'),
  descriptionar: text('descriptionar'),
  deadline: timestamp('deadline'),
  projectid: integer('projectid'),
  assignedtouserid: integer('assignedtouserid'),
  status: actionItemStatus('status').default('Open'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  titlear: text('titlear'),
  description: text('description'),
  descriptionar: text('descriptionar'),
  deadline: timestamp('deadline'),
  status: milestoneStatusEnum('status').default('NotStarted'),
  completionpercentage: integer('completionpercentage').default(0),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const taskMilestones = pgTable('taskmilestones', {
  id: serial('id').primaryKey(),
    taskid: integer('taskid').notNull(),
    milestoneid: integer('milestoneid').notNull(),
    weight: doublePrecision('weight').default(1),
    createdat: timestamp('createdat').defaultNow(),
    updatedat: timestamp('updatedat').defaultNow(),
}, (t) => ({
    unq: unique().on(t.taskid, t.milestoneid),
}));

export const auditLogs = pgTable('auditlogs', {
  id: serial('id').primaryKey(),
  userid: integer('userid'),
  action: varchar('action', { length: 255 }).notNull(),
  relatedentitytype: varchar('relatedentitytype', { length: 100 }),
  relatedentityid: integer('relatedentityid'),
  details: jsonb('details'),
  departmentid: integer('departmentid'),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});

export const projectFavorites = pgTable('project_favorites', {
  id: serial('id').primaryKey(),
    user_id: integer('user_id').notNull(),
    project_id: integer('project_id').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (t) => ({
    unq: unique().on(t.user_id, t.project_id),
}));

export const projectAttachments = pgTable('project_attachments', {
  id: serial('id').primaryKey(),
  projectid: integer('projectid').notNull(),
  uploadeduserid: integer('uploadeduserid').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalname: varchar('originalname', { length: 255 }).notNull(),
  filesize: integer('filesize').notNull(),
  filetype: varchar('filetype', { length: 100 }).notNull(),
  filepath: text('filepath').notNull(),
  filecategory: varchar('filecategory', { length: 50 }).default('general'), // 'plan', 'general', 'document', etc.
  description: text('description'),
  isprojectplan: boolean('isprojectplan').default(false),
  createdat: timestamp('createdat').defaultNow(),
  updatedat: timestamp('updatedat').defaultNow(),
});


// ZOD INSERT SCHEMAS
export const insertDepartmentSchema = createInsertSchema(departments) as z.AnyZodObject;
export const insertUserSchema = createInsertSchema(users) as z.AnyZodObject;
export const insertProjectSchema = createInsertSchema(projects) as z.AnyZodObject;
export const insertProjectMemberSchema = createInsertSchema(projectMembers) as z.AnyZodObject;
export const insertProjectDependencySchema = createInsertSchema(projectDependencies) as z.AnyZodObject;
export const insertProjectCostHistorySchema = createInsertSchema(projectCostHistory) as z.AnyZodObject;
export const insertWeeklyUpdateSchema = createInsertSchema(weeklyUpdates, { progresssnapshot: (schema) => schema.optional() }) as z.AnyZodObject;
export const insertTaskSchema = createInsertSchema(tasks) as z.AnyZodObject;
export const insertTaskCommentSchema = createInsertSchema(taskComments) as z.AnyZodObject;
export const insertAssignmentCommentSchema = createInsertSchema(assignmentComments) as z.AnyZodObject;
export const insertChangeRequestSchema = createInsertSchema(changeRequests) as z.AnyZodObject;
export const insertGoalSchema = createInsertSchema(goals) as z.AnyZodObject;
export const insertProjectGoalSchema = createInsertSchema(projectGoals) as z.AnyZodObject;
export const insertGoalRelationshipSchema = createInsertSchema(goalRelationships) as z.AnyZodObject;
export const insertRiskIssueSchema = createInsertSchema(risksIssues) as z.AnyZodObject;
export const insertNotificationSchema = createInsertSchema(notifications) as z.AnyZodObject;
export const insertAssignmentSchema = createInsertSchema(assignments) as z.AnyZodObject;
export const insertActionItemSchema = createInsertSchema(actionItems) as z.AnyZodObject;
export const insertMilestoneSchema = createInsertSchema(milestones) as z.AnyZodObject;
export const insertTaskMilestoneSchema = createInsertSchema(taskMilestones) as z.AnyZodObject;
export const insertAuditLogSchema = createInsertSchema(auditLogs) as z.AnyZodObject;
export const insertProjectFavoriteSchema = createInsertSchema(projectFavorites) as z.AnyZodObject;
export const insertProjectAttachmentSchema = createInsertSchema(projectAttachments) as z.AnyZodObject;

// ZOD SELECT SCHEMAS
export const departmentSchema = createSelectSchema(departments) as z.AnyZodObject;
export const userSchema = createSelectSchema(users) as z.AnyZodObject;
export const projectSchema = createSelectSchema(projects) as z.AnyZodObject;
export const projectMemberSchema = createSelectSchema(projectMembers) as z.AnyZodObject;
export const projectDependencySchema = createSelectSchema(projectDependencies) as z.AnyZodObject;
export const projectCostHistorySchema = createSelectSchema(projectCostHistory) as z.AnyZodObject;
export const weeklyUpdateSchema = createSelectSchema(weeklyUpdates) as z.AnyZodObject;
export const taskSchema = createSelectSchema(tasks) as z.AnyZodObject;
export const taskCommentSchema = createSelectSchema(taskComments) as z.AnyZodObject;
export const assignmentCommentSchema = createSelectSchema(assignmentComments) as z.AnyZodObject;
export const changeRequestSchema = createSelectSchema(changeRequests) as z.AnyZodObject;
export const goalSchema = createSelectSchema(goals) as z.AnyZodObject;
export const projectGoalSchema = createSelectSchema(projectGoals) as z.AnyZodObject;
export const goalRelationshipSchema = createSelectSchema(goalRelationships) as z.AnyZodObject;
export const riskIssueSchema = createSelectSchema(risksIssues) as z.AnyZodObject;
export const notificationSchema = createSelectSchema(notifications) as z.AnyZodObject;
export const assignmentSchema = createSelectSchema(assignments) as z.AnyZodObject;
export const actionItemSchema = createSelectSchema(actionItems) as z.AnyZodObject;
export const milestoneSchema = createSelectSchema(milestones) as z.AnyZodObject;
export const taskMilestoneSchema = createSelectSchema(taskMilestones) as z.AnyZodObject;
export const auditLogSchema = createSelectSchema(auditLogs) as z.AnyZodObject;
export const projectFavoriteSchema = createSelectSchema(projectFavorites) as z.AnyZodObject;
export const projectAttachmentSchema = createSelectSchema(projectAttachments) as z.AnyZodObject;


// INSERT TYPES
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type InsertProjectDependency = z.infer<typeof insertProjectDependencySchema>;
export type InsertProjectCostHistory = z.infer<typeof insertProjectCostHistorySchema>;
export type InsertWeeklyUpdate = z.infer<typeof insertWeeklyUpdateSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type InsertAssignmentComment = z.infer<typeof insertAssignmentCommentSchema>;
export type InsertChangeRequest = z.infer<typeof insertChangeRequestSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertProjectGoal = z.infer<typeof insertProjectGoalSchema>;
export type InsertGoalRelationship = z.infer<typeof insertGoalRelationshipSchema>;
export type InsertRiskIssue = z.infer<typeof insertRiskIssueSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type InsertTaskMilestone = z.infer<typeof insertTaskMilestoneSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertProjectFavorite = z.infer<typeof insertProjectFavoriteSchema>;
export type InsertProjectAttachment = z.infer<typeof insertProjectAttachmentSchema>;


// SELECT TYPES (MODELS)
export type Department = z.infer<typeof departmentSchema>;
export type User = z.infer<typeof userSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectMember = z.infer<typeof projectMemberSchema>;
export type ProjectDependency = z.infer<typeof projectDependencySchema>;
export type ProjectCostHistory = z.infer<typeof projectCostHistorySchema>;
export type WeeklyUpdate = z.infer<typeof weeklyUpdateSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskComment = z.infer<typeof taskCommentSchema>;
export type AssignmentComment = z.infer<typeof assignmentCommentSchema>;
export type ChangeRequest = z.infer<typeof changeRequestSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type ProjectGoal = z.infer<typeof projectGoalSchema>;
export type GoalRelationship = z.infer<typeof goalRelationshipSchema>;
export type RiskIssue = z.infer<typeof riskIssueSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type TaskMilestone = z.infer<typeof taskMilestoneSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type ProjectFavorite = z.infer<typeof projectFavoriteSchema>;
export type ProjectAttachment = z.infer<typeof projectAttachmentSchema>;


// OTHER ZOD SCHEMAS
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data: any) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type RegisterData = z.infer<typeof registerSchema>;

export const updateTaskSchema = insertTaskSchema.partial();
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export const updateChangeRequestSchema = insertChangeRequestSchema.partial();
export type UpdateChangeRequest = z.infer<typeof updateChangeRequestSchema>;

export const updateAssignmentSchema = insertAssignmentSchema.partial();
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;

export const updateActionItemSchema = insertActionItemSchema.partial();
export type UpdateActionItem = z.infer<typeof updateActionItemSchema>;

export const updateProjectSchema = insertProjectSchema.partial();
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export const updateWeeklyUpdateSchema = insertWeeklyUpdateSchema.partial();
export type UpdateWeeklyUpdate = z.infer<typeof updateWeeklyUpdateSchema>;

export const updateMilestoneSchema = insertMilestoneSchema.partial();
export type UpdateMilestone = z.infer<typeof updateMilestoneSchema>;