import { 
  User, InsertUser, Department, InsertDepartment, Project, InsertProject,
  Task, InsertTask, ChangeRequest, InsertChangeRequest, Goal, InsertGoal,
  RiskIssue, InsertRiskIssue, Notification, InsertNotification,
  Assignment, InsertAssignment, ActionItem, InsertActionItem,
  WeeklyUpdate, InsertWeeklyUpdate, ProjectCostHistory, InsertProjectCostHistory,
  projectStatusEnum, roleEnum, userStatusEnum,
  TaskComment, InsertTaskComment, AssignmentComment, InsertAssignmentComment
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
  
  // Project Team Members
  getProjectMembers(projectId: number): Promise<User[]>;
  addProjectMember(projectId: number, userId: number): Promise<void>;
  removeProjectMember(projectId: number, userId: number): Promise<void>;
  
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
  
  // Goal relationships
  getChildGoalRelationships(parentGoalId: number): Promise<{ goal: Goal, weight: number }[]>;
  getParentGoalRelationships(childGoalId: number): Promise<{ goal: Goal, weight: number }[]>;
  createGoalRelationship(relationship: { parentGoalId: number, childGoalId: number, weight: number }): Promise<void>;
  
  // Project goals
  getProjectGoalsByGoal(goalId: number): Promise<{ project: Project, weight: number }[]>;
  createProjectGoal(projectGoal: { projectId: number, goalId: number, weight: number }): Promise<void>;
  
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
  
  // Task Comments
  getTaskComment(id: number): Promise<TaskComment | undefined>;
  getTaskCommentsByTask(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // Assignment Comments
  getAssignmentComment(id: number): Promise<AssignmentComment | undefined>;
  getAssignmentCommentsByAssignment(assignmentId: number): Promise<AssignmentComment[]>;
  createAssignmentComment(comment: InsertAssignmentComment): Promise<AssignmentComment>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private projects: Map<number, Project>;
  private projectMembers: Map<number, { projectId: number, userId: number }>;
  private tasks: Map<number, Task>;
  private changeRequests: Map<number, ChangeRequest>;
  private goals: Map<number, Goal>;
  private risksIssues: Map<number, RiskIssue>;
  private notifications: Map<number, Notification>;
  private assignments: Map<number, Assignment>;
  private actionItems: Map<number, ActionItem>;
  private weeklyUpdates: Map<number, WeeklyUpdate>;
  private projectCostHistory: Map<number, ProjectCostHistory>;
  private goalRelationships: Map<number, { id: number, parentGoalId: number, childGoalId: number, weight: number }>;
  private projectGoals: Map<number, { id: number, projectId: number, goalId: number, weight: number }>;
  private taskComments: Map<number, TaskComment>;
  private assignmentComments: Map<number, AssignmentComment>;
  
  // Counters for IDs
  private userIdCounter: number;
  private departmentIdCounter: number;
  private projectIdCounter: number;
  private projectMemberIdCounter: number;
  private taskIdCounter: number;
  private changeRequestIdCounter: number;
  private goalIdCounter: number;
  private riskIssueIdCounter: number;
  private notificationIdCounter: number;
  private assignmentIdCounter: number;
  private actionItemIdCounter: number;
  private weeklyUpdateIdCounter: number;
  private projectCostHistoryIdCounter: number;
  private goalRelationshipIdCounter: number;
  private projectGoalIdCounter: number;
  private taskCommentIdCounter: number;
  private assignmentCommentIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.projects = new Map();
    this.projectMembers = new Map();
    this.tasks = new Map();
    this.changeRequests = new Map();
    this.goals = new Map();
    this.risksIssues = new Map();
    this.notifications = new Map();
    this.assignments = new Map();
    this.actionItems = new Map();
    this.weeklyUpdates = new Map();
    this.projectCostHistory = new Map();
    this.goalRelationships = new Map();
    this.projectGoals = new Map();
    this.taskComments = new Map();
    this.assignmentComments = new Map();
    
    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.projectIdCounter = 1;
    this.projectMemberIdCounter = 1;
    this.taskIdCounter = 1;
    this.changeRequestIdCounter = 1;
    this.goalIdCounter = 1;
    this.riskIssueIdCounter = 1;
    this.notificationIdCounter = 1;
    this.assignmentIdCounter = 1;
    this.actionItemIdCounter = 1;
    this.weeklyUpdateIdCounter = 1;
    this.projectCostHistoryIdCounter = 1;
    this.goalRelationshipIdCounter = 1;
    this.projectGoalIdCounter = 1;
    this.taskCommentIdCounter = 1;
    this.assignmentCommentIdCounter = 1;
    
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
        email: "security@qaf.mil.qa"
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
        email: "operations@qaf.mil.qa"
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
        email: "technology@qaf.mil.qa"
      },
      { 
        id: 4, 
        name: "Project Management Office", 
        nameAr: "مكتب إدارة المشاريع", 
        code: "PMO-004",
        description: "Central office for project management and coordination",
        directorUserId: 7,
        headUserId: null,
        budget: 2500000,
        location: "Building D, Floor 1",
        phone: "+974 5000 4444",
        email: "pmo@qaf.mil.qa"
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

    // Add PMO Department Users (all sharing department 4)
    const pmoDeptId = 4;
    
    // Department Director
    const deptDirector: User = {
      id: 7,
      name: "Sarah Ahmed",
      email: "sarah.ahmed@example.com",
      phone: "+974 5000 7777",
      username: "director",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "DepartmentDirector",
      status: "Active",
      departmentId: pmoDeptId,
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en"
    };
    this.users.set(deptDirector.id, deptDirector);
    
    // Main PMO
    const mainPmo: User = {
      id: 8,
      name: "Mohammed Ali",
      email: "mohammed.ali@example.com",
      phone: "+974 5000 8888",
      username: "mainpmo",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "MainPMO",
      status: "Active",
      departmentId: pmoDeptId,
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en"
    };
    this.users.set(mainPmo.id, mainPmo);
    
    // Sub PMO
    const subPmo: User = {
      id: 9,
      name: "Fatima Khalid",
      email: "fatima.khalid@example.com",
      phone: "+974 5000 9999",
      username: "subpmo",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "SubPMO",
      status: "Active",
      departmentId: pmoDeptId,
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en"
    };
    this.users.set(subPmo.id, subPmo);
    
    // Project Manager
    const projectManager: User = {
      id: 10,
      name: "Ahmad Nasser",
      email: "ahmad.nasser@example.com",
      phone: "+974 5000 1010",
      username: "pmuser",
      password: "5d41402abc4b2a76b9719d911017c592.5eb63bbbe01eeed093cb22bb8f5acdc3", // "admin123"
      role: "ProjectManager",
      status: "Active",
      departmentId: pmoDeptId,
      passportImage: null,
      idCardImage: null,
      preferredLanguage: "en"
    };
    this.users.set(projectManager.id, projectManager);
    
    this.userIdCounter = 11;

    // Seed test projects
    const projects = [
      {
        id: 1,
        title: "Qatar Air Defense System",
        description: "Implementation of advanced air defense system with radar integration, missile defense capabilities, and command center operations.",
        client: "QAF Directorate",
        status: "InProgress",
        priority: "High",
        budget: 5000000,
        startDate: new Date(2023, 9, 15), // October 15, 2023
        deadline: new Date(2024, 11, 30), // December 30, 2024
        departmentId: 1, // Security department
        managerUserId: 4, // Security director
        actualCost: 2100000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        title: "Radar Network Expansion",
        description: "Expanding the current radar network with 5 new stations to improve coverage of coastal areas and enhance early warning capabilities.",
        client: "QAF Technology Division",
        status: "Planning",
        priority: "Medium",
        budget: 3200000,
        startDate: new Date(2024, 5, 1), // June 1, 2024
        deadline: new Date(2025, 4, 30), // May 30, 2025
        departmentId: 3, // Technology department
        managerUserId: 6, // Technology director
        actualCost: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        title: "Personnel Training Program",
        description: "Comprehensive training program for personnel on new communication systems and emergency protocols.",
        client: "QAF Operations",
        status: "Completed",
        priority: "Medium",
        budget: 750000,
        startDate: new Date(2023, 2, 10), // March 10, 2023
        deadline: new Date(2023, 11, 15), // December 15, 2023
        departmentId: 2, // Operations department
        managerUserId: 5, // Operations director
        actualCost: 720000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    projects.forEach(project => {
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

  // Project Member Methods
  async getProjectMembers(projectId: number): Promise<User[]> {
    const memberIds = Array.from(this.projectMembers.values())
      .filter(pm => pm.projectId === projectId)
      .map(pm => pm.userId);
    
    return Array.from(this.users.values())
      .filter(user => memberIds.includes(user.id));
  }

  async addProjectMember(projectId: number, userId: number): Promise<void> {
    const id = this.projectMemberIdCounter++;
    this.projectMembers.set(id, { projectId, userId });
  }

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    const memberEntryId = Array.from(this.projectMembers.entries())
      .find(([_, pm]) => pm.projectId === projectId && pm.userId === userId)?.[0];
    
    if (memberEntryId !== undefined) {
      this.projectMembers.delete(memberEntryId);
    }
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

  // Goal relationships
  async getChildGoalRelationships(parentGoalId: number): Promise<{ goal: Goal, weight: number }[]> {
    const relationships = Array.from(this.goalRelationships.values())
      .filter(rel => rel.parentGoalId === parentGoalId);
    
    const childGoals = relationships.map(rel => {
      const goal = this.goals.get(rel.childGoalId);
      if (!goal) return null;
      
      return {
        goal,
        weight: rel.weight
      };
    }).filter(Boolean) as { goal: Goal, weight: number }[];
    
    return childGoals;
  }

  async getParentGoalRelationships(childGoalId: number): Promise<{ goal: Goal, weight: number }[]> {
    const relationships = Array.from(this.goalRelationships.values())
      .filter(rel => rel.childGoalId === childGoalId);
    
    const parentGoals = relationships.map(rel => {
      const goal = this.goals.get(rel.parentGoalId);
      if (!goal) return null;
      
      return {
        goal,
        weight: rel.weight
      };
    }).filter(Boolean) as { goal: Goal, weight: number }[];
    
    return parentGoals;
  }

  async createGoalRelationship(relationship: { parentGoalId: number, childGoalId: number, weight: number }): Promise<void> {
    const id = this.goalRelationshipIdCounter++;
    
    const parentGoal = this.goals.get(relationship.parentGoalId);
    const childGoal = this.goals.get(relationship.childGoalId);
    
    if (!parentGoal || !childGoal) {
      throw new Error("Parent or child goal does not exist");
    }
    
    this.goalRelationships.set(id, {
      id,
      parentGoalId: relationship.parentGoalId,
      childGoalId: relationship.childGoalId,
      weight: relationship.weight || 1
    });
  }
  
  // Project goals
  async getProjectGoalsByGoal(goalId: number): Promise<{ project: Project, weight: number }[]> {
    const relationships = Array.from(this.projectGoals.values())
      .filter(pg => pg.goalId === goalId);
    
    const projects = relationships.map(rel => {
      const project = this.projects.get(rel.projectId);
      if (!project) return null;
      
      return {
        project,
        weight: rel.weight
      };
    }).filter(Boolean) as { project: Project, weight: number }[];
    
    return projects;
  }

  async createProjectGoal(projectGoal: { projectId: number, goalId: number, weight: number }): Promise<void> {
    const id = this.projectGoalIdCounter++;
    
    const project = this.projects.get(projectGoal.projectId);
    const goal = this.goals.get(projectGoal.goalId);
    
    if (!project || !goal) {
      throw new Error("Project or goal does not exist");
    }
    
    this.projectGoals.set(id, {
      id,
      projectId: projectGoal.projectId,
      goalId: projectGoal.goalId,
      weight: projectGoal.weight || 1
    });
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

  // Task Comment methods
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    return this.taskComments.get(id);
  }
  
  async getTaskCommentsByTask(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
  }
  
  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const id = this.taskCommentIdCounter++;
    const now = new Date();
    const newComment = { ...comment, id, createdAt: now } as TaskComment;
    this.taskComments.set(id, newComment);
    return newComment;
  }
  
  // Assignment Comment methods
  async getAssignmentComment(id: number): Promise<AssignmentComment | undefined> {
    return this.assignmentComments.get(id);
  }
  
  async getAssignmentCommentsByAssignment(assignmentId: number): Promise<AssignmentComment[]> {
    return Array.from(this.assignmentComments.values())
      .filter(comment => comment.assignmentId === assignmentId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
  }
  
  async createAssignmentComment(comment: InsertAssignmentComment): Promise<AssignmentComment> {
    const id = this.assignmentCommentIdCounter++;
    const now = new Date();
    const newComment = { ...comment, id, createdAt: now } as AssignmentComment;
    this.assignmentComments.set(id, newComment);
    return newComment;
  }
}

export const storage = new MemStorage();
