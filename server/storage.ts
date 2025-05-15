import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  projectStatusEnum, roleEnum, userStatusEnum
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByDepartment(departmentId: number): Promise<User[]>;
  
  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByDepartment(departmentId: number): Promise<Project[]>;
  getProjectsByManager(managerUserId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  
  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByAssignee(assignedUserId: number): Promise<Task[]>;
  getTasksByCreator(createdByUserId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Change Requests
  getChangeRequest(id: number): Promise<ChangeRequest | undefined>;
  getChangeRequestsByProject(projectId: number): Promise<ChangeRequest[]>;
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
  
  // Risks & Issues
  getRiskIssue(id: number): Promise<RiskIssue | undefined>;
  getRiskIssuesByProject(projectId: number): Promise<RiskIssue[]>;
  getRisks(): Promise<RiskIssue[]>;
  getIssues(): Promise<RiskIssue[]>;
  createRiskIssue(riskIssue: InsertRiskIssue): Promise<RiskIssue>;
  updateRiskIssue(id: number, riskIssue: Partial<RiskIssue>): Promise<RiskIssue | undefined>;
  
  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Assignments
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByAssignee(assignedToUserId: number): Promise<Assignment[]>;
  getAssignmentsByAssigner(assignedByUserId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined>;
  
  // Action Items
  getActionItem(id: number): Promise<ActionItem | undefined>;
  getActionItemsByUser(userId: number): Promise<ActionItem[]>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: number, actionItem: Partial<ActionItem>): Promise<ActionItem | undefined>;
  
  // Weekly Updates
  getWeeklyUpdate(id: number): Promise<WeeklyUpdate | undefined>;
  getWeeklyUpdatesByProject(projectId: number): Promise<WeeklyUpdate[]>;
  createWeeklyUpdate(weeklyUpdate: InsertWeeklyUpdate): Promise<WeeklyUpdate>;
  
  // Project Cost History
  getProjectCostHistory(id: number): Promise<ProjectCostHistory | undefined>;
  getProjectCostHistoryByProject(projectId: number): Promise<ProjectCostHistory[]>;
  createProjectCostHistory(projectCostHistory: InsertProjectCostHistory): Promise<ProjectCostHistory>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private changeRequests: Map<number, ChangeRequest>;
  private goals: Map<number, Goal>;
  private risksIssues: Map<number, RiskIssue>;
  private notifications: Map<number, Notification>;
  private assignments: Map<number, Assignment>;
  private actionItems: Map<number, ActionItem>;
  private weeklyUpdates: Map<number, WeeklyUpdate>;
  private projectCostHistory: Map<number, ProjectCostHistory>;
  
  // Counters for IDs
  private userIdCounter: number;
  private departmentIdCounter: number;
  private projectIdCounter: number;
  private taskIdCounter: number;
  private changeRequestIdCounter: number;
  private goalIdCounter: number;
  private riskIssueIdCounter: number;
  private notificationIdCounter: number;
  private assignmentIdCounter: number;
  private actionItemIdCounter: number;
  private weeklyUpdateIdCounter: number;
  private projectCostHistoryIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.changeRequests = new Map();
    this.goals = new Map();
    this.risksIssues = new Map();
    this.notifications = new Map();
    this.assignments = new Map();
    this.actionItems = new Map();
    this.weeklyUpdates = new Map();
    this.projectCostHistory = new Map();
    
    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.projectIdCounter = 1;
    this.taskIdCounter = 1;
    this.changeRequestIdCounter = 1;
    this.goalIdCounter = 1;
    this.riskIssueIdCounter = 1;
    this.notificationIdCounter = 1;
    this.assignmentIdCounter = 1;
    this.actionItemIdCounter = 1;
    this.weeklyUpdateIdCounter = 1;
    this.projectCostHistoryIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Seed initial data
    this.seedInitialData();
  }

  // Seed some initial data
  private seedInitialData() {
    // Add departments
    const departments = [
      { id: 1, name: "Security", nameAr: "الأمن", directorUserId: 4 },
      { id: 2, name: "Operations", nameAr: "العمليات", directorUserId: 5 },
      { id: 3, name: "Technology", nameAr: "التكنولوجيا", directorUserId: 6 }
    ];
    
    departments.forEach(dept => {
      this.departments.set(dept.id, dept as Department);
      this.departmentIdCounter = Math.max(this.departmentIdCounter, dept.id + 1);
    });
    
    // Add admin user
    const adminUser: User = {
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      phone: "+974 5000 0000",
      username: "admin",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "Administrator",
      status: "Active",
      departmentId: null,
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en"
    };
    
    this.users.set(adminUser.id, adminUser);
    
    // Add super admin user with specified credentials
    const superAdmin: User = {
      id: 2,
      name: "Super Admin",
      email: "superadmin@example.com",
      phone: "+974 5000 1111",
      username: "Hdmin",
      password: "3c58ae9f39453437cab08e77c7235bd3.39f4f327b0d4df36279680a1898fcd21", // "Hdmin1738!@"
      role: "Administrator",
      status: "Active",
      departmentId: null,
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en"
    };
    
    this.users.set(superAdmin.id, superAdmin);
    this.userIdCounter = 3;
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser = { ...user, id } as User;
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.role === role
    );
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.departmentId === departmentId
    );
  }

  // Department Methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const newDepartment = { ...department, id } as Department;
    this.departments.set(id, newDepartment);
    return newDepartment;
  }

  async updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined> {
    const existingDepartment = this.departments.get(id);
    if (!existingDepartment) return undefined;
    
    const updatedDepartment = { ...existingDepartment, ...department };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  // Project Methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByDepartment(departmentId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.departmentId === departmentId
    );
  }

  async getProjectsByManager(managerUserId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.managerUserId === managerUserId
    );
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const newProject = { 
      ...project, 
      id, 
      createdAt: now, 
      updatedAt: now 
    } as Project;
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { 
      ...existingProject, 
      ...project, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Task Methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.projectId === projectId
    );
  }

  async getTasksByAssignee(assignedUserId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.assignedUserId === assignedUserId
    );
  }

  async getTasksByCreator(createdByUserId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.createdByUserId === createdByUserId
    );
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const newTask = { 
      ...task, 
      id, 
      createdAt: now, 
      updatedAt: now 
    } as Task;
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { 
      ...existingTask, 
      ...task, 
      updatedAt: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Change Request Methods
  async getChangeRequest(id: number): Promise<ChangeRequest | undefined> {
    return this.changeRequests.get(id);
  }

  async getChangeRequestsByProject(projectId: number): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequests.values()).filter(
      cr => cr.projectId === projectId
    );
  }

  async getChangeRequestsByStatus(status: string): Promise<ChangeRequest[]> {
    return Array.from(this.changeRequests.values()).filter(
      cr => cr.status === status
    );
  }

  async createChangeRequest(changeRequest: InsertChangeRequest): Promise<ChangeRequest> {
    const id = this.changeRequestIdCounter++;
    const now = new Date();
    const newChangeRequest = { 
      ...changeRequest, 
      id, 
      requestedAt: now
    } as ChangeRequest;
    this.changeRequests.set(id, newChangeRequest);
    return newChangeRequest;
  }

  async updateChangeRequest(id: number, changeRequest: Partial<ChangeRequest>): Promise<ChangeRequest | undefined> {
    const existingChangeRequest = this.changeRequests.get(id);
    if (!existingChangeRequest) return undefined;
    
    const updatedChangeRequest = { 
      ...existingChangeRequest, 
      ...changeRequest
    };
    
    if (changeRequest.status === "Approved" || changeRequest.status === "Rejected") {
      updatedChangeRequest.reviewedAt = new Date();
    }
    
    this.changeRequests.set(id, updatedChangeRequest);
    return updatedChangeRequest;
  }

  // Goal Methods
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values());
  }

  async getStrategicGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      goal => goal.isStrategic
    );
  }

  async getAnnualGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(
      goal => !goal.isStrategic
    );
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const now = new Date();
    const newGoal = { 
      ...goal, 
      id, 
      createdAt: now, 
      updatedAt: now 
    } as Goal;
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) return undefined;
    
    const updatedGoal = { 
      ...existingGoal, 
      ...goal, 
      updatedAt: new Date() 
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  // Risk & Issue Methods
  async getRiskIssue(id: number): Promise<RiskIssue | undefined> {
    return this.risksIssues.get(id);
  }

  async getRiskIssuesByProject(projectId: number): Promise<RiskIssue[]> {
    return Array.from(this.risksIssues.values()).filter(
      ri => ri.projectId === projectId
    );
  }

  async getRisks(): Promise<RiskIssue[]> {
    return Array.from(this.risksIssues.values()).filter(
      ri => ri.type === "Risk"
    );
  }

  async getIssues(): Promise<RiskIssue[]> {
    return Array.from(this.risksIssues.values()).filter(
      ri => ri.type === "Issue"
    );
  }

  async createRiskIssue(riskIssue: InsertRiskIssue): Promise<RiskIssue> {
    const id = this.riskIssueIdCounter++;
    const now = new Date();
    const newRiskIssue = { 
      ...riskIssue, 
      id, 
      createdAt: now, 
      updatedAt: now 
    } as RiskIssue;
    this.risksIssues.set(id, newRiskIssue);
    return newRiskIssue;
  }

  async updateRiskIssue(id: number, riskIssue: Partial<RiskIssue>): Promise<RiskIssue | undefined> {
    const existingRiskIssue = this.risksIssues.get(id);
    if (!existingRiskIssue) return undefined;
    
    const updatedRiskIssue = { 
      ...existingRiskIssue, 
      ...riskIssue, 
      updatedAt: new Date() 
    };
    this.risksIssues.set(id, updatedRiskIssue);
    return updatedRiskIssue;
  }

  // Notification Methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      notification => notification.userId === userId
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const newNotification = { 
      ...notification, 
      id, 
      createdAt: now 
    } as Notification;
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const existingNotification = this.notifications.get(id);
    if (!existingNotification) return undefined;
    
    const updatedNotification = { 
      ...existingNotification, 
      isRead: true 
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Assignment Methods
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentsByAssignee(assignedToUserId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.assignedToUserId === assignedToUserId
    );
  }

  async getAssignmentsByAssigner(assignedByUserId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.assignedByUserId === assignedByUserId
    );
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentIdCounter++;
    const now = new Date();
    const newAssignment = { 
      ...assignment, 
      id, 
      createdAt: now, 
      updatedAt: now 
    } as Assignment;
    this.assignments.set(id, newAssignment);
    return newAssignment;
  }

  async updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined> {
    const existingAssignment = this.assignments.get(id);
    if (!existingAssignment) return undefined;
    
    const updatedAssignment = { 
      ...existingAssignment, 
      ...assignment, 
      updatedAt: new Date() 
    };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  // Action Item Methods
  async getActionItem(id: number): Promise<ActionItem | undefined> {
    return this.actionItems.get(id);
  }

  async getActionItemsByUser(userId: number): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(
      actionItem => actionItem.userId === userId
    );
  }

  async createActionItem(actionItem: InsertActionItem): Promise<ActionItem> {
    const id = this.actionItemIdCounter++;
    const now = new Date();
    const newActionItem = { 
      ...actionItem, 
      id, 
      createdAt: now, 
      updatedAt: now 
    } as ActionItem;
    this.actionItems.set(id, newActionItem);
    return newActionItem;
  }

  async updateActionItem(id: number, actionItem: Partial<ActionItem>): Promise<ActionItem | undefined> {
    const existingActionItem = this.actionItems.get(id);
    if (!existingActionItem) return undefined;
    
    const updatedActionItem = { 
      ...existingActionItem, 
      ...actionItem, 
      updatedAt: new Date() 
    };
    this.actionItems.set(id, updatedActionItem);
    return updatedActionItem;
  }

  // Weekly Update Methods
  async getWeeklyUpdate(id: number): Promise<WeeklyUpdate | undefined> {
    return this.weeklyUpdates.get(id);
  }

  async getWeeklyUpdatesByProject(projectId: number): Promise<WeeklyUpdate[]> {
    return Array.from(this.weeklyUpdates.values()).filter(
      weeklyUpdate => weeklyUpdate.projectId === projectId
    );
  }

  async createWeeklyUpdate(weeklyUpdate: InsertWeeklyUpdate): Promise<WeeklyUpdate> {
    const id = this.weeklyUpdateIdCounter++;
    const now = new Date();
    const newWeeklyUpdate = { 
      ...weeklyUpdate, 
      id, 
      createdAt: now 
    } as WeeklyUpdate;
    this.weeklyUpdates.set(id, newWeeklyUpdate);
    return newWeeklyUpdate;
  }

  // Project Cost History Methods
  async getProjectCostHistory(id: number): Promise<ProjectCostHistory | undefined> {
    return this.projectCostHistory.get(id);
  }

  async getProjectCostHistoryByProject(projectId: number): Promise<ProjectCostHistory[]> {
    return Array.from(this.projectCostHistory.values()).filter(
      pch => pch.projectId === projectId
    );
  }

  async createProjectCostHistory(projectCostHistory: InsertProjectCostHistory): Promise<ProjectCostHistory> {
    const id = this.projectCostHistoryIdCounter++;
    const now = new Date();
    const newProjectCostHistory = { 
      ...projectCostHistory, 
      id, 
      updatedAt: now 
    } as ProjectCostHistory;
    this.projectCostHistory.set(id, newProjectCostHistory);
    
    // Update the project's actual cost
    const project = this.projects.get(projectCostHistory.projectId);
    if (project) {
      project.actualCost = projectCostHistory.amount;
      project.updatedAt = now;
      this.projects.set(project.id, project);
    }
    
    return newProjectCostHistory;
  }
}

export const storage = new MemStorage();
