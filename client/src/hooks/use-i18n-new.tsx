import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// English translations
const enTranslations = {
  // Common
  dashboard: "Dashboard",
  calendar: "Calendar",
  projects: "Projects",
  tasks: "Tasks",
  goals: "Goals",
  risksAndIssues: "Risks & Issues",
  assignments: "Assignments",
  approvals: "Approvals",
  dependencies: "Dependencies",
  repository: "Central Repository",
  departments: "Departments",
  reports: "Reports",
  analytics: "Analytics",
  settings: "Settings",
  userPermissions: "User Permissions",
  projectManagementSystem: "Project Management System",
  
  // Status and States
  statusPending: "Pending",
  statusInProgress: "In Progress",
  statusCompleted: "Completed",
  taskStatus_Pending: "Pending",
  taskStatus_InProgress: "In Progress",
  taskStatus_Completed: "Completed",
  returnedToProjectManager: "Returned to PM",
  returnedToSubPMO: "Returned to Sub PMO",
  actionRequired: "Action required",
  editRequest: "Edit Request",
  awaitingRevisions: "Awaiting revisions",
  planning: "Planning",
  inProgress: "In Progress",
  onHold: "On Hold",
  cancelled: "Cancelled",
  onTrack: "On Track",
  reviewNeeded: "Review Needed",
  completed: "Completed",
  atRisk: "At Risk",
  pendingApproval: "Pending Approval",
  pendingApprovalStatus: "Pending Approval",
  
  // Priority Levels
  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  priorityCritical: "Critical",
  
  // UI Components
  close: "Close",
  loading: "Loading...",
  details: "Details",
  projectManager: "Project Manager",
  subPMO: "Sub PMO",
  assignedTo: "Assigned To",
  createdBy: "Created By",
  assignedBy: "Assigned By",
  fromUser: "From",
  comments: "Comments",
  cancel: "Cancel",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  submit: "Submit",
  save: "Save",
  selectDate: "Select Date",
  selectDepartment: "Select Department",
  selectManager: "Select Manager",
  selectPriority: "Select Priority",
  selectStatus: "Select Status",
  selectAssignee: "Select Assignee",
  
  // User
  login: "Login",
  register: "Register",
  username: "Username",
  password: "Password",
  confirmPassword: "Confirm Password",
  email: "Email",
  phone: "Phone",
  name: "Full Name",
  logout: "Logout",
  
  // Document Upload
  requiredDocuments: "Required Documents",
  passportUpload: "Passport",
  idCardUpload: "ID Card",
  passportRequired: "Passport is required",
  idCardRequired: "ID Card is required",
  documentRequirementNote: "Please upload clear images of your original documents. Files must be less than 5 MB.",
  dropFileHere: "Drop file here",
  orClickToBrowse: "Or click to browse",
  removeFile: "Remove",
  
  // Dashboard
  activeProjects: "Active Projects",
  allProjects: "All Projects",
  projectsCompleted: "Completed",
  viewAll: "View All",
  budgetOverview: "Budget Overview",
  totalBudget: "Total Budget",
  actualSpend: "Actual Spend",
  remaining: "Remaining",
  predictedCost: "Predicted Cost",
  acrossAllActiveProjects: "Across all active projects",
  ofTotalBudget: "of total budget",
  potentialOverspend: "Potential overspend",
  weeklyUpdateReminder: "Weekly Update Reminder",
  submissionDue: "Submission due",
  submitUpdate: "Submit Update",
  welcomeBack: "Welcome back",
  dashboardIntro: "Track your project portfolio, monitor progress, and stay on top of approvals.",
  allProjectsDescription: "View all projects in the system",
  projectsInStatus: "Projects in {{status}} status",
  
  // Projects
  newProject: "New Project",
  recentProjects: "Recent Projects",
  project: "Project",
  department: "Department",
  status: "Status",
  progress: "Progress",
  dueIn: "Due in",
  days: "days",
  client: "Client",
  enterClientName: "Enter client name",
  totalProjects: "Total Projects",
  totalProjectBudget: "Total Project Budget",
  noProjectsFound: "No projects found",
  createYourFirstProject: "Create your first project to get started",
  
  // Project Details
  projectDetails: "Project Details",
  overview: "Overview",
  changeRequests: "Change Requests",
  weeklyUpdates: "Weekly Updates",
  documentation: "Documentation",
  costHistory: "Cost History",
  startDate: "Start Date",
  deadline: "Deadline",
  manager: "Manager",
  budget: "Budget",
  actualCost: "Actual Cost",
  editProject: "Edit Project",
  deleteProject: "Delete Project",
  teamMembers: "Team Members",
  noTeamMembers: "No team members assigned to this project",
  addTeamMember: "Add Team Member",
  removeTeamMember: "Remove",
  projectCardsByStatus: "Project Cards by Status",
  kanbanBoard: "Kanban Board",
  listView: "List View",
  
  // Project and Goal Common Fields
  weight: "Weight",
  relatedProjects: "Related Projects",
  relatedGoal: "Related Goal",
  projectGoals: "Project Goals",
  selectProject: "Select Project",
  
  // New Project Form
  projectTitle: "Project Title",
  enterProjectTitle: "Enter project title",
  projectDescription: "Project Description",
  enterProjectDescription: "Enter project description",
  projectCreated: "Project Created",
  projectCreatedDescription: "Project has been created successfully",
  createProject: "Create Project",
  linkProjectToGoals: "Link this project to strategic or annual goals",
  addGoal: "Add Goal",
  selectGoal: "Select Goal",
  linkToExistingProjects: "Link this project to existing projects it depends on",
  thisProjectDependsOn: "This project depends on",
  selectRelatedProject: "Select Related Project",
  addRelatedProject: "Add Related Project",
  projectsRelatedToThis: "Projects Related to This",
  projectsThatDependOnThis: "Projects that depend on this one",
  projectThatDependsOnThis: "Project that depends on this",
  addRelatedToProject: "Add Dependent Project",
  
  // Project Week in Review
  weekInReview: "Week in Review",
  currentStatus: "Current Status",
  progressUpdate: "Progress Update",
  keyAchievements: "Key Achievements",
  nextSteps: "Next Steps",
  challenges: "Challenges",
  submitWeeklyUpdate: "Submit Weekly Update",
  weeklyUpdateSubmitted: "Weekly Update Submitted",
  noWeeklyUpdatesYet: "No weekly updates yet",
  submitYourFirstWeeklyUpdate: "Submit your first weekly update to track progress",
  weeklyUpdatesDescription: "Weekly progress reports for this project",
  
  // Project Team Management
  projectTeam: "Project Team",
  addMember: "Add Member",
  memberAdded: "Member Added",
  memberAddedDescription: "Team member has been added successfully",
  memberRemoved: "Member Removed",
  memberRemovedDescription: "Team member has been removed successfully",
  teamMembersDescription: "Manage the team members assigned to this project",
  changeTeamNotice: "Changes to the team require approval",
  
  // Tasks
  newTask: "New Task",
  taskCreated: "Task Created",
  taskCreatedDescription: "Task has been created successfully",
  taskCreatedSuccessfully: "Task created successfully",
  failedToCreateTask: "Failed to create task",
  createTaskDescription: "Create a new task for your project",
  taskTitle: "Task Title",
  enterTaskTitle: "Enter task title",
  description: "Description",
  enterTaskDescription: "Enter task description",
  createTask: "Create Task",
  assignTo: "Assign To",
  dueDate: "Due Date",
  priority: "Priority",
  taskDetails: "Task Details",
  editTask: "Edit Task",
  deleteTask: "Delete Task",
  markAsCompleted: "Mark as Completed",
  reopenTask: "Reopen Task",
  commentSection: "Add Comment",
  enterComment: "Enter comment...",
  viewTasks: "View Tasks",
  noTasksFound: "No tasks found",
  createYourFirstTask: "Create your first task to get started",
  tasksDescription: "Manage tasks for this project",
  
  // Milestones
  milestones: "Milestones",
  projectMilestones: "Project Milestones",
  addMilestone: "Add Milestone",
  addNewMilestone: "Add New Milestone",
  addNewMilestoneDescription: "Create a new milestone for this project",
  enterMilestoneTitle: "Enter milestone title",
  enterMilestoneDescription: "Enter milestone description",
  createMilestone: "Create Milestone",
  milestoneCreatedSuccessfully: "Milestone created successfully",
  failedToCreateMilestone: "Failed to create milestone",
  noMilestones: "No Milestones",
  noMilestonesDescription: "No milestones have been created for this project yet",
  creating: "Creating...",
  titleRequired: "Title is required",
  descriptionRequired: "Description is required",
  deadlineRequired: "Deadline is required",
  linkTasks: "Link Tasks",
  selectTasksToLink: "Select tasks to link to this milestone",
  noTasksAvailable: "No tasks available to link",
  selectedTasks: "{{count}} task(s) selected",
  
  // Comments
  addComment: "Add Comment",
  postComment: "Post Comment",
  enterYourComment: "Enter your comment...",
  commentAdded: "Comment Added",
  commentAddedDescription: "Your comment has been added successfully",
  commentsDescription: "Discussion thread for this item",
  noCommentsYet: "No comments yet",
  beTheFirstToComment: "Be the first to add a comment",
  
  // Delete Confirmations
  confirmDelete: "Confirm Delete",
  deleteWarningGeneric: "This action cannot be undone. Are you sure you want to proceed?",
  deleteProjectWarning: "This will permanently delete the project and all associated tasks, documents, and history. This action cannot be undone.",
  deleteTaskWarning: "This will permanently delete the task and all associated comments. This action cannot be undone.",
  confirmDeleteButton: "Yes, Delete",
  cancelDeleteButton: "Cancel",
  
  // Project Change Requests
  newChangeRequest: "New Change Request",
  changeRequestCreated: "Change Request Created",
  changeRequestCreatedDescription: "Change request has been submitted for approval",
  changeType: "Change Type",
  requestedChange: "Requested Change",
  justification: "Justification",
  impactDescription: "Impact",
  approvedBy: "Approved By",
  rejectionReason: "Rejection Reason",
  enterRejectionReason: "Enter detailed reason for rejection...",
  rejectionReasonRequired: "Please provide a reason for rejection",
  changeDetails: "Change Details",
  createChangeRequest: "Create Change Request",
  viewChangeRequests: "View Change Requests",
  noChangeRequestsFound: "No change requests found",
  createYourFirstChangeRequest: "Create your first change request",
  changeRequestsDescription: "Manage change requests for this project",
  statusChange: "Status Change",
  budgetChange: "Budget Change",
  deadlineChange: "Deadline Change",
  scopeChange: "Scope Change",
  resourceChange: "Resource Change",
  otherChange: "Other Change",
  currentValue: "Current Value",
  newValue: "New Value",
  approve: "Approve",
  approveRequest: "Approve Request",
  reject: "Reject",
  rejectRequest: "Reject Request",
  returnTo: "Return To",
  returnToProjectManager: "Return to Project Manager",
  returnToSubPMO: "Return to Sub-PMO",
  provideRevisions: "Provide Revisions",
  
  // Goals
  newGoal: "New Goal",
  goalCreated: "Goal Created",
  goalCreatedDescription: "Goal has been created successfully",
  createGoalDescription: "Create a new goal for your organization",
  goalTitle: "Goal Title",
  enterGoalTitle: "Enter goal title",
  enterGoalDescription: "Enter goal description",
  createGoal: "Create Goal",
  viewGoals: "View Goals",
  noGoalsFound: "No goals found",
  createYourFirstGoal: "Create your first goal",
  goalsDescription: "Manage organizational goals",
  strategicGoals: "Strategic Goals",
  annualGoals: "Annual Goals",
  departmentGoals: "Department Goals",
  departmentGoalNote: "This goal will be specific to a department",
  isStrategic: "Strategic Goal",
  isAnnual: "Annual Goal",
  strategicGoal: "Strategic Goal",
  annualGoal: "Annual Goal",
  strategicGoalDescription: "Strategic goals span multiple years and align with long-term organizational objectives",
  annualGoalDescription: "Annual goals are completed within one year and support strategic initiatives",
  relatedGoals: "Related Goals",
  addRelatedGoal: "Add Related Goal",
  noRelatedGoals: "No related goals",
  noRelatedProjects: "No related projects",
  
  // Risks & Issues
  newRiskIssue: "New Risk/Issue",
  riskIssueCreated: "Risk/Issue Created",
  riskIssueCreatedDescription: "Risk/Issue has been created successfully",
  createRiskIssueDescription: "Document a new risk or issue for your project",
  riskIssueTitle: "Risk/Issue Title",
  enterRiskIssueTitle: "Enter risk/issue title",
  enterRiskIssueDescription: "Enter risk/issue description",
  riskIssueType: "Type",
  selectRiskIssueType: "Select Type",
  riskType: "Risk",
  issueType: "Issue",
  probabilityLevel: "Probability",
  selectProbabilityLevel: "Select Probability",
  riskImpactLevel: "Impact",
  selectRiskImpactLevel: "Select Impact",
  mitigationPlan: "Mitigation Plan",
  enterMitigationPlan: "Enter mitigation plan",
  createRiskIssue: "Create Risk/Issue",
  viewRisksIssues: "View Risks & Issues",
  noRisksIssuesFound: "No risks or issues found",
  createYourFirstRiskIssue: "Document your first risk or issue",
  risksIssuesDescription: "Manage risks and issues for this project",
  
  // Assignments
  newAssignment: "New Assignment",
  assignmentCreated: "Assignment Created",
  assignmentCreatedDescription: "Assignment has been created successfully",
  createAssignmentDescription: "Create a new assignment for a team member",
  createNewAssignment: "Create New Assignment",
  assignmentTitle: "Assignment Title",
  enterAssignmentTitle: "Enter assignment title",
  enterAssignmentDescription: "Enter assignment description",
  createAssignment: "Create Assignment",
  viewAssignments: "View Assignments",
  noAssignmentsFound: "No assignments found",
  createYourFirstAssignment: "Create your first assignment",
  assignmentsDescription: "Manage assignments for team members",
  assignedToMe: "Assigned to Me",
  assignedByMe: "Assigned by Me",
  noAssignmentsToYou: "No assignments assigned to you",
  searchAssignments: "Search assignments...",
  allStatuses: "All Statuses",
  allPriorities: "All Priorities",
  daysOverdue: "days overdue",
  dueToday: "Due today",
  daysLeft: "days left",
  
  // Error Messages
  error: "Error",
  somethingWentWrong: "Something went wrong",
  tryAgainLater: "Please try again later",
  pageNotFound: "Page Not Found",
  pageNotFoundDescription: "The page you are looking for does not exist or has been moved.",
  backToDashboard: "Back to Dashboard",
  
  // Notifications
  notificationSettings: "Notification Settings",
  emailNotifications: "Email Notifications",
  inAppNotifications: "In-App Notifications",
  notificationPreferences: "Notification Preferences",
  taskAssignments: "Task Assignments",
  projectUpdates: "Project Updates",
  approvalRequests: "Approval Requests",
  riskIssueAlerts: "Risk & Issue Alerts",
  deadlineReminders: "Deadline Reminders",
  notificationFrequency: "Notification Frequency",
  immediately: "Immediately",
  daily: "Daily Digest",
  weekly: "Weekly Digest",
  savePreferences: "Save Preferences",
  preferencesUpdated: "Preferences Updated",
  preferencesUpdatedDescription: "Your notification preferences have been updated",
  
  // Settings
  accountSettings: "Account Settings",
  profileInformation: "Profile Information",
  updateProfile: "Update Profile",
  changePassword: "Change Password",
  currentPassword: "Current Password",
  newPassword: "New Password",
  confirmNewPassword: "Confirm New Password",
  profileUpdated: "Profile Updated",
  profileUpdatedDescription: "Your profile information has been updated",
  passwordChanged: "Password Changed",
  passwordChangedDescription: "Your password has been changed successfully",
  
  // Reports
  generateReport: "Generate Report",
  reportType: "Report Type",
  selectReportType: "Select Report Type",
  projectStatusReport: "Project Status Report",
  resourceAllocationReport: "Resource Allocation Report",
  budgetReport: "Budget Report",
  customDateRange: "Custom Date Range",
  filterByDepartment: "Filter by Department",
  exportAs: "Export As",
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
  
  // Approvals
  pendingApprovals: "Pending Approvals",
  noPendingApprovals: "No pending approvals",
  approvalsDescription: "Review and approve change requests",
  
  // Weekly Updates
  weeklyUpdateTitle: "Weekly Update - Week of {{startDate}} to {{endDate}}",
  submitWeeklyStatus: "Submit Weekly Status",
  progressDetails: "Progress Details",
  weeklyStatusSubmitted: "Weekly Status Submitted",
  weeklyStatusSubmittedDescription: "Your weekly status update has been submitted",
  enterProgressDetails: "Provide details on progress made this week",
  enterNextSteps: "Outline the next steps and upcoming work",
  enterChallenges: "Document any blockers or challenges faced",
  enterKeyAchievements: "List key milestones or achievements completed",
  
  // Additional translations for UI consistency
  todo: "To Do",
  review: "Review",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  
  // New task translations
  noTasksAssigned: "No tasks assigned to you",
  noTasksCreated: "No tasks created by you",
  noCompletedTasks: "No completed tasks",
  selfAssigned: "Self-assigned",
  assignedByYou: "Assigned by you",
  assignedToYou: "Assigned to you",
  
  // Assignment translations
  noAssignmentsByYou: "No assignments created by you", 
  noCompletedAssignments: "No completed assignments",
  
  // Additional form fields
  enterTitle: "Enter title",
  enterDescription: "Enter description",
  
  // Milestone linking translations
  linkedMilestones: "Linked Milestones",
  noLinkedMilestones: "No milestones linked to this task",
  linkToMilestone: "Link to Milestone",
  selectMilestone: "Select milestone",
  taskLinkedToMilestone: "Task linked to milestone successfully",
  taskUnlinkedFromMilestone: "Task unlinked from milestone successfully",
  failedToLinkTaskToMilestone: "Failed to link task to milestone",
  failedToUnlinkTaskFromMilestone: "Failed to unlink task from milestone",
  
  // Goal relationship translations
  linkedGoals: "Linked Goals",
  noLinkedGoals: "No goals linked to this goal",
  linkToGoal: "Link to Goal",
  selectGoalToLink: "Select goal to link",
  goalLinkedToGoal: "Goal linked successfully",
  goalUnlinkedFromGoal: "Goal unlinked successfully",
  failedToLinkGoalToGoal: "Failed to link goal",
  failedToUnlinkGoalFromGoal: "Failed to unlink goal",
  linkedProjects: "Linked Projects",
  noLinkedProjects: "No projects linked to this goal",
  linkToProject: "Link to Project",
  selectProjectToLink: "Select project to link",
  goalLinkedToProject: "Project linked to goal successfully",
  goalUnlinkedFromProject: "Project unlinked from goal successfully",
  failedToLinkGoalToProject: "Failed to link project to goal",
  failedToUnlinkGoalFromProject: "Failed to unlink project from goal",
  editGoalRelationships: "Edit Goal Relationships",
  manageRelationships: "Manage Relationships",
};

// Arabic translations
const arTranslations = {
  // Common
  dashboard: "لوحة المعلومات",
  calendar: "التقويم",
  projects: "المشاريع",
  tasks: "المهام",
  goals: "الأهداف",
  risksAndIssues: "المخاطر والمشاكل",
  assignments: "التكليفات",
  approvals: "الموافقات",
  dependencies: "الاعتماديات",
  repository: "المستودع المركزي",
  departments: "الإدارات",
  reports: "التقارير",
  analytics: "التحليلات",
  settings: "الإعدادات",
  userPermissions: "صلاحيات المستخدمين",
  projectManagementSystem: "نظام إدارة المشاريع",
  
  // Status and States
  statusPending: "قيد الانتظار",
  statusInProgress: "قيد التنفيذ",
  statusCompleted: "مكتمل",
  taskStatus_Pending: "قيد الانتظار",
  taskStatus_InProgress: "قيد التنفيذ",
  taskStatus_Completed: "مكتمل",
  returnedToProjectManager: "أُعيد إلى مدير المشروع",
  returnedToSubPMO: "أُعيد إلى مكتب إدارة المشاريع الفرعي",
  actionRequired: "يتطلب إجراء",
  editRequest: "تعديل الطلب",
  awaitingRevisions: "بانتظار المراجعات",
  planning: "التخطيط",
  inProgress: "قيد التنفيذ",
  onHold: "معلق",
  cancelled: "ملغي",
  onTrack: "على المسار الصحيح",
  reviewNeeded: "يحتاج إلى مراجعة",
  completed: "مكتمل",
  atRisk: "في خطر",
  pendingApproval: "في انتظار الموافقة",
  pendingApprovalStatus: "في انتظار الموافقة",
  
  // Priority Levels
  priorityLow: "منخفض",
  priorityMedium: "متوسط",
  priorityHigh: "مرتفع",
  priorityCritical: "حرج",
  
  // UI Components
  close: "إغلاق",
  loading: "جاري التحميل...",
  details: "التفاصيل",
  projectManager: "مدير المشروع",
  subPMO: "مكتب إدارة المشاريع الفرعي",
  assignedTo: "مُسند إلى",
  createdBy: "أنشئ بواسطة",
  assignedBy: "أُسند بواسطة",
  fromUser: "من",
  comments: "التعليقات",
  cancel: "إلغاء",
  create: "إنشاء",
  edit: "تعديل",
  delete: "حذف",
  submit: "إرسال",
  save: "حفظ",
  selectDate: "اختر التاريخ",
  selectDepartment: "اختر الإدارة",
  selectManager: "اختر المدير",
  selectPriority: "اختر الأولوية",
  selectStatus: "اختر الحالة",
  selectAssignee: "اختر المسؤول",
  
  // User
  login: "تسجيل الدخول",
  register: "تسجيل",
  username: "اسم المستخدم",
  password: "كلمة المرور",
  confirmPassword: "تأكيد كلمة المرور",
  email: "البريد الإلكتروني",
  phone: "الهاتف",
  name: "الاسم الكامل",
  logout: "تسجيل الخروج",
  
  // Document Upload
  requiredDocuments: "المستندات المطلوبة",
  passportUpload: "جواز السفر",
  idCardUpload: "بطاقة الهوية",
  passportRequired: "جواز السفر مطلوب",
  idCardRequired: "بطاقة الهوية مطلوبة",
  documentRequirementNote: "يرجى تحميل صور واضحة من المستندات الأصلية. يجب أن تكون الملفات أقل من 5 ميجابايت.",
  dropFileHere: "أسقط الملف هنا",
  orClickToBrowse: "أو انقر للتصفح",
  removeFile: "إزالة",
  
  // Dashboard
  activeProjects: "المشاريع النشطة",
  allProjects: "جميع المشاريع",
  projectsCompleted: "مكتملة",
  viewAll: "عرض الكل",
  budgetOverview: "نظرة عامة على الميزانية",
  totalBudget: "إجمالي الميزانية",
  actualSpend: "الإنفاق الفعلي",
  remaining: "المتبقي",
  predictedCost: "التكلفة المتوقعة",
  acrossAllActiveProjects: "عبر جميع المشاريع النشطة",
  ofTotalBudget: "من إجمالي الميزانية",
  potentialOverspend: "تجاوز محتمل للميزانية",
  weeklyUpdateReminder: "تذكير بالتحديث الأسبوعي",
  submissionDue: "موعد التسليم",
  submitUpdate: "إرسال التحديث",
  welcomeBack: "مرحبًا بعودتك",
  dashboardIntro: "تتبع محفظة مشاريعك، وراقب التقدم، وابق على اطلاع بالموافقات.",
  allProjectsDescription: "عرض جميع المشاريع في النظام",
  projectsInStatus: "المشاريع في حالة {{status}}",
  
  // For Risks & Issues section
  riskIssueType: "النوع",
  selectRiskIssueType: "اختر النوع",
  riskType: "خطر",
  issueType: "مشكلة",
  probabilityLevel: "احتمالية",
  selectProbabilityLevel: "اختر الاحتمالية",
  riskImpactLevel: "التأثير",
  selectRiskImpactLevel: "اختر التأثير",
  
  // Additional Arabic translations for UI consistency
  todo: "للعمل",
  review: "مراجعة",
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  critical: "حرج",
  
  // Reports
  budgetAndCostReport: "تقرير الميزانية والتكلفة",
  projectStatusReport: "تقرير حالة المشروع",
  
  // Project and Goal Common Fields
  weight: "الوزن",
  relatedProjects: "المشاريع ذات الصلة",
  projectGoals: "أهداف المشروع",
  linkProjectToGoals: "ربط هذا المشروع بالأهداف الاستراتيجية أو السنوية",
  relatedGoal: "الهدف المرتبط",
  addGoal: "إضافة هدف",
  selectGoal: "اختر هدفًا",
  linkToExistingProjects: "ربط هذا المشروع بالمشاريع الموجودة التي يعتمد عليها",
  thisProjectDependsOn: "هذا المشروع يعتمد على",
  selectRelatedProject: "اختر مشروعًا مرتبطًا",
  addRelatedProject: "إضافة مشروع مرتبط",
  projectsRelatedToThis: "المشاريع المرتبطة بهذا",
  projectsThatDependOnThis: "المشاريع التي تعتمد على هذا المشروع",
  projectThatDependsOnThis: "مشروع يعتمد على هذا",
  selectProject: "اختر مشروعًا",
  addRelatedToProject: "إضافة مشروع تابع",
  
  // Assignment Dialog
  assignmentNotFound: "التكليف غير موجود",
  
  // Task Card
  taskNotFound: "المهمة غير موجودة",
  noDescription: "لا يوجد وصف",
  unassigned: "غير معين",
  overdue: "متأخر",
  
  // Dialog Controls
  deleteTaskTitle: "حذف المهمة",
  deleteTaskConfirmation: "هل أنت متأكد أنك تريد حذف هذه المهمة؟",
  deleteAssignmentTitle: "حذف التكليف",
  deleteAssignmentConfirmation: "هل أنت متأكد أنك تريد حذف هذا التكليف؟",
  
  // Comment System
  writeComment: "اكتب تعليقًا...",
  posting: "جاري النشر...",
  noComments: "لا توجد تعليقات",
  unknownUser: "مستخدم غير معروف",
  commentAddError: "فشل في إضافة التعليق"
};

// Merge translations
const translations: Translations = {
  en: enTranslations,
  ar: arTranslations
};

// Create the context
const I18nContext = createContext<{
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isRtl: boolean;
}>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isRtl: false,
});

// Provider component
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  
  // Change language
  const changeLanguage = (lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      // Store language preference
      localStorage.setItem('language', lang);
      
      // Update document direction for RTL languages
      if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
    }
  };
  
  // Get translation
  const t = (key: string, params?: Record<string, string>): string => {
    const translation = translations[language]?.[key] || key;
    
    if (params) {
      return Object.keys(params).reduce((acc, paramKey) => {
        const placeholder = `{{${paramKey}}}`;
        const value = params[paramKey];
        return acc.replace(placeholder, value);
      }, translation);
    }
    
    return translation;
  };
  
  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    changeLanguage(savedLanguage);
  }, []);

  return (
    <I18nContext.Provider 
      value={{ 
        language, 
        setLanguage: changeLanguage, 
        t,
        isRtl: language === 'ar' 
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// Custom hook for using i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}