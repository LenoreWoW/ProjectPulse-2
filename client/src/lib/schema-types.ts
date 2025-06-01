// Client-side schema types to mirror shared/schema.ts

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
  departmentId?: number | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  targetDate?: Date | null;
  priority?: string | null;
  isStrategic: boolean;
  isAnnual: boolean;
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

// Custom types for components
export type GoalWithProgress = Goal & {
  progress: number;
  createdByUserId?: number | null;
  status?: string | null;
  deadline?: Date | null;
};

export type GoalWithRelationships = Goal & {
  createdByUserId?: number | null;
  status?: string | null;
  deadline?: Date | null;
  relatedProjects?: { project: Project, weight: number }[];
  childGoals?: { goal: Goal, weight: number }[];
  parentGoals?: { goal: Goal, weight: number }[];
}; 