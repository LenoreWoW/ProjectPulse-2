import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  ProjectGoal, InsertProjectGoal,
  Milestone, InsertMilestone, TaskMilestone, InsertTaskMilestone,
  AuditLog, InsertAuditLog, GoalRelationship, InsertGoalRelationship,
  ProjectFavorite, InsertProjectFavorite, ProjectDependency, InsertProjectDependency
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { PgStorage } from "./pg-storage";

const MemoryStore = createMemoryStore(session);

export const storage: IStorage = new PgStorage();

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByDepartment(departmentid: number): Promise<User[]>;
  
  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByDepartment(departmentid: number): Promise<Project[]>;
  getProjectsByManager(manageruserid: number): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  
  // Project Goals
  createProjectGoal(projectGoal: InsertProjectGoal): Promise<ProjectGoal>;
  getProjectGoals(projectid: number): Promise<ProjectGoal[]>;
  
  // Project Dependencies
  createProjectDependency(dependency: InsertProjectDependency): Promise<ProjectDependency>;
  getProjectDependencies(projectid: number): Promise<ProjectDependency[]>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectid: number): Promise<Task[]>;
  getTasksByAssignee(assigneduserid: number): Promise<Task[]>;
  getTasksByCreator(createdbyuserid: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Change Requests
  getChangeRequest(id: number): Promise<ChangeRequest | undefined>;
  getChangeRequestsByProject(projectid: number): Promise<ChangeRequest[]>;
  getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]>;
  createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest>;
  updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined>;
  
  // Goals
  getGoal(id: number): Promise<Goal | undefined>;
  getGoals(): Promise<Goal[]>;
  getStrategicGoals(): Promise<Goal[]>;
  getAnnualGoals(): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  
  // Goal Relationships
  createGoalRelationship(relationship: InsertGoalRelationship): Promise<GoalRelationship>;
  getGoalRelationshipsByParent(parentgoalid: number): Promise<GoalRelationship[]>;
  getGoalRelationshipsByChild(childgoalid: number): Promise<GoalRelationship[]>;
  deleteGoalRelationship(id: number): Promise<boolean>;
  
  // Risks & Issues
  getRiskIssue(id: number): Promise<RiskIssue | undefined>;
  getRiskIssuesByProject(projectid: number): Promise<RiskIssue[]>;
  getRisks(): Promise<RiskIssue[]>;
  getIssues(): Promise<RiskIssue[]>;
  createRiskIssue(riskIssue: InsertRiskIssue): Promise<RiskIssue>;
  updateRiskIssue(id: number, riskIssue: Partial<RiskIssue>): Promise<RiskIssue | undefined>;
  
  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userid: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  getPendingApprovalNotifications(): Promise<Notification[]>;
  updateNotificationReminderSent(id: number): Promise<Notification | undefined>;
  getNotificationsNeedingReminders(hoursThreshold?: number): Promise<Notification[]>;
  
  // Assignments
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByAssignee(assignedtouserid: number): Promise<Assignment[]>;
  getAssignmentsByAssigner(assignedbyuserid: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined>;
  
  // Action Items
  getActionItem(id: number): Promise<ActionItem | undefined>;
  getActionItemsByMeeting(meetingid: number): Promise<ActionItem[]>;
  getActionItemsByAssignee(assignedtouserid: number): Promise<ActionItem[]>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: number, actionItem: Partial<ActionItem>): Promise<ActionItem | undefined>;
  
  // Weekly Updates
  getWeeklyUpdate(id: number): Promise<WeeklyUpdate | undefined>;
  getWeeklyUpdatesByProject(projectid: number): Promise<WeeklyUpdate[]>;
  createWeeklyUpdate(weeklyUpdate: InsertWeeklyUpdate): Promise<WeeklyUpdate>;
  
  // Project Cost History
  getProjectCostHistory(id: number): Promise<ProjectCostHistory | undefined>;
  getProjectCostHistoryByProject(projectid: number): Promise<ProjectCostHistory[]>;
  createProjectCostHistory(projectCostHistory: InsertProjectCostHistory): Promise<ProjectCostHistory>;
  
  // Milestones
  getMilestone(id: number): Promise<Milestone | undefined>;
  getMilestonesByProject(projectid: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined>;
  
  // Task-Milestone relationships
  getTaskMilestone(id: number): Promise<TaskMilestone | undefined>;
  getTaskMilestonesByTask(taskid: number): Promise<TaskMilestone[]>;
  getTaskMilestonesByMilestone(milestoneid: number): Promise<TaskMilestone[]>;
  createTaskMilestone(taskMilestone: InsertTaskMilestone): Promise<TaskMilestone>;
  updateTaskMilestone(id: number, taskMilestone: Partial<TaskMilestone>): Promise<TaskMilestone | undefined>;
  deleteTaskMilestone(id: number): Promise<boolean>;
  recalculateMilestoneProgress(milestoneid: number): Promise<void>;

  // Audit Logs
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLog(id: number): Promise<AuditLog | undefined>;
  getAuditLogs(options: {
    limit?: number;
    offset?: number;
    userid?: number;
    entitytype?: string;
    entityid?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    departmentid?: number;
  }): Promise<AuditLog[]>;
  getAuditLogsByUser(userid: number, limit?: number, offset?: number): Promise<AuditLog[]>;

  // Project-Goal Relationships
  getProjectGoalsByGoal(goalid: number): Promise<ProjectGoal[]>;
  deleteProjectGoal(id: number): Promise<boolean>;
  
  // Project Favorites
  addProjectFavorite(favorite: InsertProjectFavorite): Promise<ProjectFavorite>;
  removeProjectFavorite(userid: number, projectid: number): Promise<boolean>;
  getUserFavoriteProjects(userid: number): Promise<ProjectFavorite[]>;
  isProjectFavorite(userid: number, projectid: number): Promise<boolean>;
}
