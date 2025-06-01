import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  ProjectGoal, InsertProjectGoal,
  Milestone, InsertMilestone, TaskMilestone,
  AuditLog, InsertAuditLog, GoalRelationship, InsertGoalRelationship
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// Define a type for project dependencies since it's not imported directly
interface ProjectDependency {
  id: number;
  projectId: number;
  dependsOnProjectId: number;
}

interface InsertProjectDependency {
  projectId: number;
  dependsOnProjectId: number;
}

// Define an interface for TaskMilestone insertion since it's not in the shared schema
interface InsertTaskMilestone {
  taskId: number;
  milestoneId: number;
  weight?: number;
}

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
  getDepartmentByName(name: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByDepartment(departmentId: number): Promise<Project[]>;
  getProjectsByManager(managerUserId: number): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  
  // Project Goals
  createProjectGoal(projectGoal: InsertProjectGoal): Promise<ProjectGoal>;
  getProjectGoals(projectId: number): Promise<ProjectGoal[]>;
  
  // Project Dependencies
  createProjectDependency(dependency: InsertProjectDependency): Promise<ProjectDependency>;
  getProjectDependencies(projectId: number): Promise<ProjectDependency[]>;
  
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
  
  // Goal Relationships
  createGoalRelationship(relationship: InsertGoalRelationship): Promise<GoalRelationship>;
  getGoalRelationshipsByParent(parentGoalId: number): Promise<GoalRelationship[]>;
  getGoalRelationshipsByChild(childGoalId: number): Promise<GoalRelationship[]>;
  deleteGoalRelationship(id: number): Promise<boolean>;
  
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
  getPendingApprovalNotifications(): Promise<Notification[]>;
  updateNotificationReminderSent(id: number): Promise<Notification | undefined>;
  getNotificationsNeedingReminders(hoursThreshold?: number): Promise<Notification[]>;
  
  // Assignments
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByAssignee(assignedToUserId: number): Promise<Assignment[]>;
  getAssignmentsByAssigner(assignedByUserId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<Assignment>): Promise<Assignment | undefined>;
  
  // Action Items
  getActionItem(id: number): Promise<ActionItem | undefined>;
  getActionItemsByMeeting(meetingId: number): Promise<ActionItem[]>;
  getActionItemsByAssignee(assignedToUserId: number): Promise<ActionItem[]>;
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
  
  // Milestones
  getMilestone(id: number): Promise<Milestone | undefined>;
  getMilestonesByProject(projectId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined>;
  
  // Task-Milestone relationships
  getTaskMilestone(id: number): Promise<TaskMilestone | undefined>;
  getTaskMilestonesByTask(taskId: number): Promise<TaskMilestone[]>;
  getTaskMilestonesByMilestone(milestoneId: number): Promise<TaskMilestone[]>;
  createTaskMilestone(taskMilestone: InsertTaskMilestone): Promise<TaskMilestone>;
  updateTaskMilestone(id: number, taskMilestone: Partial<TaskMilestone>): Promise<TaskMilestone | undefined>;
  deleteTaskMilestone(id: number): Promise<boolean>;
  recalculateMilestoneProgress(milestoneId: number): Promise<void>;

  // Audit Logs
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLog(id: number): Promise<AuditLog | undefined>;
  getAuditLogs(options: {
    limit?: number;
    offset?: number;
    userId?: number;
    entityType?: string;
    entityId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    departmentId?: number;
  }): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number, limit?: number, offset?: number): Promise<AuditLog[]>;

  // Project-Goal Relationships
  getProjectGoalsByGoal(goalId: number): Promise<ProjectGoal[]>;
  deleteProjectGoal(id: number): Promise<boolean>;
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
  private projectGoals: Map<number, ProjectGoal>;
  private projectDependencies: Map<number, ProjectDependency>;
  private milestones: Map<number, Milestone>;
  private taskMilestones: Map<number, TaskMilestone>;
  private auditLogs: Map<number, AuditLog>;
  private goalRelationships: Map<number, GoalRelationship>;
  
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
  private projectGoalIdCounter: number;
  private projectDependencyIdCounter: number;
  private milestoneIdCounter: number;
  private taskMilestoneIdCounter: number;
  private auditLogIdCounter: number;
  private goalRelationshipIdCounter: number;
  
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
    this.projectGoals = new Map();
    this.projectDependencies = new Map();
    this.milestones = new Map();
    this.taskMilestones = new Map();
    this.auditLogs = new Map();
    this.goalRelationships = new Map();
    
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
    this.projectGoalIdCounter = 1;
    this.projectDependencyIdCounter = 1;
    this.milestoneIdCounter = 1;
    this.taskMilestoneIdCounter = 1;
    this.auditLogIdCounter = 1;
    this.goalRelationshipIdCounter = 1;
    
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
      { 
        id: 1, 
        name: "Security", 
        nameAr: "الأمن", 
        code: "SEC-001",
        description: "Responsible for all security related operations",
        directorUserId: 4,
        headUserId: null,
        budget: 1000000,
        location: "Building A, Floor 2",
        phone: "+974 5000 1111",
        email: "security@qaf.mil.qa",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 2, 
        name: "Operations", 
        nameAr: "العمليات", 
        code: "OPS-002",
        description: "Handles day-to-day operational activities",
        directorUserId: 5,
        headUserId: null,
        budget: 1500000,
        location: "Building B, Floor 1",
        phone: "+974 5000 2222",
        email: "operations@qaf.mil.qa",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: 3, 
        name: "Technology", 
        nameAr: "التكنولوجيا", 
        code: "TECH-003",
        description: "Manages all IT and technology systems",
        directorUserId: 6,
        headUserId: null,
        budget: 2000000,
        location: "Building C, Floor 3",
        phone: "+974 5000 3333",
        email: "technology@qaf.mil.qa",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
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
      preferredLanguage: "en",
      createdAt: new Date(),
      updatedAt: new Date()
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
      preferredLanguage: "en",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(superAdmin.id, superAdmin);
    
    // Add sample project managers
    const projectManager1: User = {
      id: 3,
      name: "Ahmed Al-Mansouri",
      email: "ahmed.mansouri@qaf.mil.qa",
      phone: "+974 5000 2222",
      username: "ahmed.mansouri",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "ProjectManager",
      status: "Active",
      departmentId: 1, // Security
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const projectManager2: User = {
      id: 4,
      name: "Sarah Al-Thani",
      email: "sarah.thani@qaf.mil.qa",
      phone: "+974 5000 3333",
      username: "sarah.thani",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "ProjectManager",
      status: "Active",
      departmentId: 2, // Operations
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(projectManager1.id, projectManager1);
    this.users.set(projectManager2.id, projectManager2);
    this.userIdCounter = 5;
    
    // Add sample projects with actual costs and project managers
    const sampleProjects = [
      {
        id: 1,
        title: "Security System Upgrade",
        titleAr: "تطوير نظام الأمان",
        description: "Comprehensive upgrade of the security infrastructure",
        managerUserId: 3, // Ahmed Al-Mansouri
        departmentId: 1, // Security
        client: "Qatar Armed Forces",
        budget: 500000,
        actualCost: 350000, // 70% of budget spent
        priority: "High",
        status: "InProgress",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        deadline: new Date("2024-06-30"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: "Communication Network Enhancement",
        titleAr: "تحسين شبكة الاتصالات",
        description: "Upgrade and expansion of communication systems",
        managerUserId: 4, // Sarah Al-Thani
        departmentId: 2, // Operations
        client: "Ministry of Defense",
        budget: 750000,
        actualCost: 625000, // About 83% spent
        priority: "Critical",
        status: "InProgress",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-08-31"),
        deadline: new Date("2024-08-31"),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: "Training Facility Construction",
        titleAr: "بناء مرافق التدريب",
        description: "Construction of new training facilities",
        managerUserId: 3, // Ahmed Al-Mansouri
        departmentId: 1, // Security
        client: "Qatar Armed Forces",
        budget: 1200000,
        actualCost: 1100000, // Almost completed, 92% spent
        priority: "Medium",
        status: "Completed",
        startDate: new Date("2023-06-01"),
        endDate: new Date("2024-03-31"),
        deadline: new Date("2024-03-31"),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    sampleProjects.forEach(project => {
      this.projects.set(project.id, project as Project);
      this.projectIdCounter = Math.max(this.projectIdCounter, project.id + 1);
    });
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

  async getDepartmentByName(name: string): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(
      department => department.name.toLowerCase() === name.toLowerCase()
    );
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

  async getProjectsByStatus(status: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.status === status);
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

    // Get all task-milestone relationships for this task and update milestone progress
    const taskMilestones = await this.getTaskMilestonesByTask(id);
    for (const tm of taskMilestones) {
      await this.updateMilestoneProgress(tm.milestoneId);
    }
    
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

  async getPendingApprovalNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      notification => 
        notification.requiresApproval === true && 
        notification.isRead === false
    );
  }

  async updateNotificationReminderSent(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { 
      ...notification, 
      lastReminderSent: new Date()
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async getNotificationsNeedingReminders(hoursThreshold: number = 24): Promise<Notification[]> {
    const now = new Date();
    return Array.from(this.notifications.values()).filter(notification => {
      // Only process approval notifications that haven't been read yet
      if (!notification.requiresApproval || notification.isRead) {
        return false;
      }
      
      // If no reminder has been sent yet, check against creation time
      if (!notification.lastReminderSent) {
        const createdAt = notification.createdAt || new Date(); // Default to now if not set
        const hoursSinceCreation = 
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation >= hoursThreshold;
      }
      
      // Otherwise, check against the last reminder time
      const hoursSinceLastReminder = 
        (now.getTime() - notification.lastReminderSent.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastReminder >= hoursThreshold;
    });
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

  async getActionItemsByMeeting(meetingId: number): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(
      (actionItem: any) => actionItem.meetingId === meetingId
    );
  }

  async getActionItemsByAssignee(assignedToUserId: number): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values()).filter(
      (actionItem: any) => actionItem.assignedToUserId === assignedToUserId
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
      createdAt: now,
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

  // Project Goal Methods
  async createProjectGoal(projectGoal: InsertProjectGoal): Promise<ProjectGoal> {
    const id = this.projectGoalIdCounter++;
    const now = new Date();
    
    const newProjectGoal: ProjectGoal = {
      id,
      projectId: projectGoal.projectId,
      goalId: projectGoal.goalId,
      weight: projectGoal.weight || 1,
      createdAt: now,
      updatedAt: now
    };
    
    this.projectGoals.set(id, newProjectGoal);
    return newProjectGoal;
  }
  
  async getProjectGoals(projectId: number): Promise<ProjectGoal[]> {
    return Array.from(this.projectGoals.values()).filter(
      projectGoal => projectGoal.projectId === projectId
    );
  }
  
  // Project Dependency Methods
  async createProjectDependency(dependency: InsertProjectDependency): Promise<ProjectDependency> {
    const id = this.projectDependencyIdCounter++;
    
    const newDependency: ProjectDependency = {
      id,
      projectId: dependency.projectId,
      dependsOnProjectId: dependency.dependsOnProjectId,
    };
    
    this.projectDependencies.set(id, newDependency);
    return newDependency;
  }
  
  async getProjectDependencies(projectId: number): Promise<ProjectDependency[]> {
    return Array.from(this.projectDependencies.values()).filter(
      dependency => dependency.projectId === projectId
    );
  }

  // Milestone Methods
  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }

  async getMilestonesByProject(projectId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(
      milestone => milestone.projectId === projectId
    );
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneIdCounter++;
    const now = new Date();
    
    const newMilestone: Milestone = {
      id,
      title: milestone.title,
      titleAr: milestone.titleAr ?? null,
      description: milestone.description ?? null,
      descriptionAr: milestone.descriptionAr ?? null,
      projectId: milestone.projectId,
      deadline: milestone.deadline ?? null,
      status: milestone.status ?? "NotStarted",
      completionPercentage: 0,
      createdByUserId: milestone.createdByUserId,
      createdAt: now,
      updatedAt: now
    };
    
    this.milestones.set(id, newMilestone);
    return newMilestone;
  }

  async updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined> {
    const existingMilestone = this.milestones.get(id);
    if (!existingMilestone) return undefined;
    
    const updatedMilestone = {
      ...existingMilestone,
      ...milestone,
      updatedAt: new Date()
    };
    
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }

  // Task-Milestone relationships
  async getTaskMilestone(id: number): Promise<TaskMilestone | undefined> {
    return this.taskMilestones.get(id);
  }

  async getTaskMilestonesByTask(taskId: number): Promise<TaskMilestone[]> {
    return Array.from(this.taskMilestones.values()).filter(
      taskMilestone => taskMilestone.taskId === taskId
    );
  }

  async getTaskMilestonesByMilestone(milestoneId: number): Promise<TaskMilestone[]> {
    return Array.from(this.taskMilestones.values()).filter(
      taskMilestone => taskMilestone.milestoneId === milestoneId
    );
  }

  async createTaskMilestone(taskMilestone: InsertTaskMilestone): Promise<TaskMilestone> {
    const id = this.taskMilestoneIdCounter++;
    
    const newTaskMilestone: TaskMilestone = {
      id,
      taskId: taskMilestone.taskId,
      milestoneId: taskMilestone.milestoneId,
      weight: taskMilestone.weight ?? 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.taskMilestones.set(id, newTaskMilestone);

    // Update milestone progress
    await this.updateMilestoneProgress(taskMilestone.milestoneId);
    
    return newTaskMilestone;
  }

  async updateTaskMilestone(id: number, taskMilestone: Partial<TaskMilestone>): Promise<TaskMilestone | undefined> {
    const existingTaskMilestone = this.taskMilestones.get(id);
    if (!existingTaskMilestone) return undefined;
    
    const updatedTaskMilestone = {
      ...existingTaskMilestone,
      ...taskMilestone
    };
    
    this.taskMilestones.set(id, updatedTaskMilestone);

    // Update milestone progress
    await this.updateMilestoneProgress(updatedTaskMilestone.milestoneId);
    
    return updatedTaskMilestone;
  }
  
  async deleteTaskMilestone(id: number): Promise<boolean> {
    const taskMilestone = this.taskMilestones.get(id);
    if (!taskMilestone) return false;
    
    const success = this.taskMilestones.delete(id);
    
    if (success) {
      // Update milestone progress since a task was removed
      await this.updateMilestoneProgress(taskMilestone.milestoneId);
    }
    
    return success;
  }
  
  // Public version of the updateMilestoneProgress method
  async recalculateMilestoneProgress(milestoneId: number): Promise<void> {
    await this.updateMilestoneProgress(milestoneId);
  }

  // Helper method to calculate and update milestone progress based on task completion
  private async updateMilestoneProgress(milestoneId: number): Promise<void> {
    const milestone = await this.getMilestone(milestoneId);
    if (!milestone) return;

    const taskMilestones = await this.getTaskMilestonesByMilestone(milestoneId);
    if (taskMilestones.length === 0) {
      // If no tasks are linked to this milestone, set progress to 0
      await this.updateMilestone(milestoneId, { completionPercentage: 0 });
      return;
    }

    let totalWeight = 0;
    let totalCompletion = 0;

    for (const tm of taskMilestones) {
      const task = await this.getTask(tm.taskId);
      if (!task) continue;

      // Get the weight for this task in the milestone
      const weight = tm.weight || 1;
      totalWeight += weight;

      // Calculate completion based on task status
      let taskCompletion = 0;
      switch (task.status) {
        case 'Completed':
          taskCompletion = 1; // 100%
          break;
        case 'Review':
          taskCompletion = 0.9; // 90%
          break;
        case 'InProgress':
          taskCompletion = 0.5; // 50%
          break;
        case 'OnHold':
          taskCompletion = 0.25; // 25%
          break;
        case 'Todo':
        default:
          taskCompletion = 0; // 0%
          break;
      }

      totalCompletion += taskCompletion * weight;
    }

    // Calculate the overall completion percentage
    const completionPercentage = totalWeight > 0 ? (totalCompletion / totalWeight) * 100 : 0;

    // Update the milestone's completion percentage
    await this.updateMilestone(milestoneId, { 
      completionPercentage,
      // Update milestone status based on completion percentage
      status: this.getMilestoneStatusFromCompletion(completionPercentage, milestone)
    });
  }

  // Helper to determine milestone status based on completion percentage and deadline
  private getMilestoneStatusFromCompletion(completionPercentage: number, milestone: Milestone): "NotStarted" | "InProgress" | "Completed" | "Delayed" | "AtRisk" {
    if (completionPercentage >= 100) {
      return "Completed";
    }
    
    if (completionPercentage === 0) {
      return "NotStarted";
    }
    
    // Check if the milestone is past its deadline
    const now = new Date();
    if (milestone.deadline && new Date(milestone.deadline) < now) {
      return "Delayed";
    }
    
    // Check if the milestone is at risk (e.g., close to deadline but low completion)
    if (milestone.deadline) {
      const deadline = new Date(milestone.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // If less than 7 days until deadline but completion is less than 70%, mark as at risk
      if (daysUntilDeadline <= 7 && completionPercentage < 70) {
        return "AtRisk";
      }
    }
    
    return "InProgress";
  }

  // Audit Logs
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogIdCounter++;
    const now = new Date();
    const newAuditLog: AuditLog = {
      id,
      userId: auditLog.userId || null,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId || null,
      details: auditLog.details || null,
      ipAddress: auditLog.ipAddress || null,
      userAgent: auditLog.userAgent || null,
      departmentId: auditLog.departmentId || null,
      createdAt: now
    };
    this.auditLogs.set(id, newAuditLog);
    return newAuditLog;
  }

  async getAuditLog(id: number): Promise<AuditLog | undefined> {
    return this.auditLogs.get(id);
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
    let logs = Array.from(this.auditLogs.values());
    
    // Apply filters
    if (options.userId !== undefined) {
      logs = logs.filter(log => log.userId === options.userId);
    }
    
    if (options.entityType !== undefined) {
      logs = logs.filter(log => log.entityType === options.entityType);
    }
    
    if (options.entityId !== undefined) {
      logs = logs.filter(log => log.entityId === options.entityId);
    }
    
    if (options.action !== undefined) {
      logs = logs.filter(log => log.action === options.action);
    }
    
    if (options.startDate) {
      logs = logs.filter(log => {
        if (!log.createdAt) return false;
        const logDate = new Date(log.createdAt);
        return logDate >= options.startDate!;
      });
    }
    
    if (options.endDate) {
      logs = logs.filter(log => {
        if (!log.createdAt) return false;
        const logDate = new Date(log.createdAt);
        return logDate <= options.endDate!;
      });
    }
    
    if (options.departmentId !== undefined) {
      logs = logs.filter(log => log.departmentId === options.departmentId);
    }
    
    // Sort by most recent first
    logs.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    
    return logs.slice(offset, offset + limit);
  }

  async getAuditLogsByUser(userId: number, limit?: number, offset?: number): Promise<AuditLog[]> {
    return this.getAuditLogs({ userId, limit, offset });
  }

  // Goal Relationships
  async createGoalRelationship(relationship: InsertGoalRelationship): Promise<GoalRelationship> {
    const id = this.goalRelationshipIdCounter++;
    const now = new Date();
    const newGoalRelationship: GoalRelationship = {
      id,
      parentGoalId: relationship.parentGoalId,
      childGoalId: relationship.childGoalId,
      weight: relationship.weight || 1,
      createdAt: now,
      updatedAt: now
    };
    this.goalRelationships.set(id, newGoalRelationship);
    return newGoalRelationship;
  }

  async getGoalRelationshipsByParent(parentGoalId: number): Promise<GoalRelationship[]> {
    return Array.from(this.goalRelationships.values()).filter(
      relationship => relationship.parentGoalId === parentGoalId
    );
  }

  async getGoalRelationshipsByChild(childGoalId: number): Promise<GoalRelationship[]> {
    return Array.from(this.goalRelationships.values()).filter(
      relationship => relationship.childGoalId === childGoalId
    );
  }

  async deleteGoalRelationship(id: number): Promise<boolean> {
    const relationship = this.goalRelationships.get(id);
    if (!relationship) return false;
    
    const success = this.goalRelationships.delete(id);
    
    return success;
  }

  // Project-Goal Relationships
  async getProjectGoalsByGoal(goalId: number): Promise<ProjectGoal[]> {
    return Array.from(this.projectGoals.values()).filter(
      projectGoal => projectGoal.goalId === goalId
    );
  }

  async deleteProjectGoal(id: number): Promise<boolean> {
    const projectGoal = this.projectGoals.get(id);
    if (!projectGoal) return false;
    
    const success = this.projectGoals.delete(id);
    
    return success;
  }
}

export const storage = new MemStorage();
