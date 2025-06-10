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
  backlog: "Backlog",
  upNext: "Up Next",
  review: "Review",
  done: "Done",
  todo: "To Do",
  
  // Priority Levels
  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  priorityCritical: "Critical",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  
  // UI Components
  close: "Close",
  loading: "Loading...",
  noGoalsAvailable: "No goals available",
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
  actions: "Actions",
  
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
  profile: "Profile",
  user: "User",
  
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
  welcomeMessage: "Hello {{name}}",
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
  favoriteProjects: "Favorite Projects",
  noFavoriteProjects: "No Favorite Projects",
  favoriteProjectsToSeeThemHere: "Favorite projects to see them here",
  failedToLoadFavorites: "Failed to load favorite projects",
  viewAllFavorites: "View {{count}} more favorites",
  project: "Project",
  department: "Department",
  status: "Status",
  progress: "Progress",
  dueIn: "Due in",
  days: "days",
  daysRemaining: "{{days}} days remaining",
  overdueDays: "{{days}} days overdue",
  dueToday: "Due today",
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
  kanbanView: "Kanban View",
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
  addProject: "Add Project",
  projectPlan: "Project Plan",
  projectPlanDescription: "Upload the main project plan document (PDF, Word, Excel, PowerPoint, or text file)",
  additionalAttachments: "Additional Attachments",
  additionalAttachmentsDescription: "Upload additional documents or images related to the project (optional)",
  enterBudget: "Enter budget amount",
  projectName: "Project Name",
  noProjectPlan: "No Project Plan",
  noProjectPlanDescription: "No project plan has been uploaded yet",
  uploadProjectPlan: "Upload Project Plan",
  projectFiles: "Project Files",
  projectFilesDescription: "View and manage project attachments and documents",
  uploadedOn: "Uploaded on",
  download: "Download",
  view: "View",
  noFiles: "No Files",
  uploadFilesInstruction: "Get started by uploading your first file",
  uploadFiles: "Upload Files",
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
  departmentAutoAssigned: "Department will be automatically assigned based on the selected project manager",
  
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
  
  // Reports
  generateReport: "Generate Report",
  reportType: "Report Type",
  selectReportType: "Select Report Type",
  projectStatusReport: "Project Status Report",
  resourceAllocationReport: "Resource Allocation Report",
  budgetReport: "Budget Report",
  issueTrackingReport: "Issue Tracking Report",
  projectTimelineReport: "Project Timeline Report",
  customDateRange: "Custom Date Range",
  filterByDepartment: "Filter by Department",
  exportAs: "Export As",
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
  
  // Budget Report specific translations
  detailedBudgetAnalysis: "Detailed budget analysis and insights",
  filters: "Filters",
  exportPDF: "Export PDF",
  spentToDate: "Spent to date",
  budgetRemaining: "Budget remaining",
  variancePercentage: "Variance %",
  underBudget: "Under Budget",
  overBudget: "Over Budget",
  departmentBudgets: "Department Budgets",
  budgetByDepartment: "Budget breakdown by department",
  spent: "Spent",
  percentSpent: "% Spent",
  monthlySpendingTrends: "Monthly Spending Trends",
  actualVsProjectedSpending: "Actual vs projected spending over time",
  projectedSpend: "Projected Spend",
  budgetAllocationByCategory: "Budget Allocation by Category",
  howBudgetIsAllocated: "How budget is allocated across different categories",
  budgetVsActualByDepartment: "Budget vs Actual by Department",
  compareAllocation: "Compare budget allocation vs actual spending",
  budgetAllocated: "Budget Allocated",
  
  // Custom Analytics translations
  customAnalytics: "Custom Analytics",
  customAnalyticsDescription: "Build and visualize custom reports from your data",
  dataSource: "Data Source",
  selectDataAndVisualization: "Select your data source and visualization type",
  dataCategory: "Data Category",
  selectDataCategory: "Select data category",
  visualizationType: "Visualization Type",
  selectVisualization: "Select visualization",
  barChart: "Bar Chart",
  pieChart: "Pie Chart",
  tableView: "Table View",
  allClients: "All Clients",
  saveReport: "Save Report",
  saveReportDescription: "Save this report for future use",
  reportName: "Report Name",
  enterReportName: "Enter report name",
  shareReport: "Share Report",
  visualization: "Visualization",
  showingDataCount: "Showing {{count}} records",
  noDataDescription: "No data matches your current filters",
  loadingData: "Loading data...",
  count: "Count",
  title: "Title",
  projectId: "Project ID",
  type: "Type",
  noDataAvailable: "No Data Available",
  selectDataAndGenerateReport: "Select your data source and filters, then click Generate Report to see results",
  savedReports: "Saved Reports",
  savedReportsDescription: "Your previously saved custom reports",
  
  // Issue Tracking Report translations
  issueTrackingDescription: "Track and manage project issues and risks",
  projectIssues: "Project Issues",
  issueStatus: "Issue Status",
  comingSoon: "Coming Soon",
  issueTrackingReportUnderDevelopment: "The issue tracking report is currently under development.",
  checkBackSoon: "Please check back soon for updates.",
  
  // Resource Allocation Report translations
  resourceAllocationDescription: "View team and resource allocation across projects",
  resourceAllocation: "Resource Allocation",
  teamAllocation: "Team Allocation",
  resourceAllocationReportUnderDevelopment: "The resource allocation report is currently under development.",
  
  // Project Timeline Report translations
  projectTimelineDescription: "View project timelines and schedules",
  projectTimelines: "Project Timelines",
  projectSchedules: "Project Schedules",
  timelineReportUnderDevelopment: "The timeline report is currently under development.",
  
  // Audit Logs
  auditLogs: "Audit Logs",
  filterAuditLogsDescription: "Filter audit logs by various criteria",
  entityType: "Entity Type",
  allEntityTypes: "All Entity Types",
  action: "Action",
  allActions: "All Actions",
  entityId: "Entity ID",
  enterEntityId: "Enter entity ID",
  selectStartDate: "Select start date",
  endDate: "End Date",
  selectEndDate: "Select end date",
  userId: "User ID",
  enterUserId: "Enter user ID",
  clearFilters: "Clear Filters",
  auditLogsResults: "Audit Logs Results",
  id: "ID",
  timestamp: "Timestamp",
  noAuditLogsFound: "No audit logs found matching your criteria",
  errorLoadingAuditLogs: "Error loading audit logs",
  showing: "Showing",
  ofTotal: "of total",
  previous: "Previous",
  next: "Next",
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  loggedIn: "Logged In",
  loggedOut: "Logged Out",
  changeRequest: "Change Request",
  goal: "Goal",
  riskIssue: "Risk/Issue",
  noManager: "No Manager",
  
  // Search and placeholders
  search: "Search",
  searchRepositoryPlaceholder: "Search repository...",
  searchDependenciesPlaceholder: "Search dependencies...",
  searchGoalsDependenciesPlaceholder: "Search goal dependencies...",
  searchProjects: "Search projects...",
  searchDepartments: "Search departments...",
  searchRisksIssues: "Search risks and issues...",
  
  // Error Messages
  error: "Error",
  somethingWentWrong: "Something went wrong",
  tryAgainLater: "Please try again later",
  tryAgain: "Try Again",
  pageNotFound: "Page Not Found",
  pageNotFoundDescription: "The page you're looking for doesn't exist or has been moved.",
  backToDashboard: "Back to Dashboard",
  actionFailed: "Action failed",
  errorLoadingData: "Error loading data",
  
  // Forms and validation
  enterTitle: "Enter title",
  enterDescription: "Enter description",
  enterFullName: "Enter full name",
  enterUsername: "Enter username",
  enterPassword: "Enter password",
  leaveEmptyToKeep: "Leave empty to keep current password",
  selectLanguage: "Select language",
  enterProjectName: "Enter project name",
  selectNewStatus: "Select new status",
  requestJustification: "Enter request justification",
  
  // User Permissions
  editUserPermissions: "Edit User Permissions",
  editingPermissionsFor: "Editing permissions for",
  role: "Role",
  selectRole: "Select a role",
  useCustomPermissions: "Use custom permissions",
  customPermissions: "Custom Permissions",
  saveChanges: "Save Changes",
  permissionsUpdated: "Permissions Updated",
  userPermissionsUpdatedSuccessfully: "User permissions have been updated successfully",
  searchUsers: "Search users by name, email, or role...",
  noUsersFound: "No users found",
  noUsersMatchSearch: "No users match your search criteria",
  editPermissions: "Edit Permissions",
  
  // User Roles
  User: "User",
  ProjectManager: "Project Manager",
  SubPMO: "Sub PMO",
  MainPMO: "Main PMO",
  DepartmentDirector: "Department Director",
  Executive: "Executive",
  Administrator: "Administrator",
  
  // Access control
  accessDenied: "Access Denied",
  noPermissionToManageUsers: "You don't have permission to manage users",
  errorLoadingUsers: "Error loading users",
  
  // Success Messages
  successfullyCreated: "Successfully created",
  successfullyUpdated: "Successfully updated",
  successfullyDeleted: "Successfully deleted",
  
  // General UI
  notifications: "Notifications",
  noData: "No data available",
  noDescription: "No description provided",
  confirm: "Confirm",
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
  backlog: "قائمة الأعمال المتراكمة",
  upNext: "القادم",
  review: "مراجعة",
  done: "منتهي",
  todo: "للعمل",
  
  // Priority Levels
  priorityLow: "منخفض",
  priorityMedium: "متوسط",
  priorityHigh: "مرتفع",
  priorityCritical: "حرج",
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  critical: "حرج",
  
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
  actions: "الإجراءات",
  
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
  profile: "الملف الشخصي",
  user: "مستخدم",
  
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
  
  // Projects
  newProject: "مشروع جديد",
  recentProjects: "المشاريع الأخيرة",
  project: "مشروع",
  department: "الإدارة",
  status: "الحالة",
  progress: "التقدم",
  dueIn: "مطلوب خلال",
  days: "أيام",
  client: "العميل",
  enterClientName: "أدخل اسم العميل",
  totalProjects: "إجمالي المشاريع",
  totalProjectBudget: "إجمالي ميزانية المشاريع",
  noProjectsFound: "لم يتم العثور على مشاريع",
  createYourFirstProject: "أنشئ مشروعك الأول للبدء",
  
  // Project Details
  projectDetails: "تفاصيل المشروع",
  overview: "نظرة عامة",
  changeRequests: "طلبات التغيير",
  weeklyUpdates: "التحديثات الأسبوعية",
  documentation: "التوثيق",
  costHistory: "تاريخ التكلفة",
  deadline: "الموعد النهائي",
  manager: "المدير",
  budget: "الميزانية",
  actualCost: "التكلفة الفعلية",
  editProject: "تعديل المشروع",
  deleteProject: "حذف المشروع",
  teamMembers: "أعضاء الفريق",
  noTeamMembers: "لا يوجد أعضاء فريق مُعينين لهذا المشروع",
  addTeamMember: "إضافة عضو فريق",
  removeTeamMember: "إزالة",
  projectCardsByStatus: "بطاقات المشاريع حسب الحالة",
  kanbanBoard: "لوحة كانبان",
  kanbanView: "عرض كانبان",
  listView: "عرض القائمة",
  
  // Project and Goal Common Fields
  weight: "الوزن",
  relatedProjects: "المشاريع ذات الصلة",
  relatedGoal: "الهدف المرتبط",
  projectGoals: "أهداف المشروع",
  selectProject: "اختر مشروعًا",
  
  // New Project Form
  projectTitle: "عنوان المشروع",
  enterProjectTitle: "أدخل عنوان المشروع",
  projectDescription: "وصف المشروع",
  enterProjectDescription: "أدخل وصف المشروع",
  projectCreated: "تم إنشاء المشروع",
  projectCreatedDescription: "تم إنشاء المشروع بنجاح",
  createProject: "إنشاء مشروع",
  addProject: "إضافة مشروع",
  projectPlan: "خطة عمل المشروع",
  projectPlanDescription: "رفع مستند خطة عمل المشروع الرئيسية (PDF, Word, Excel, PowerPoint, أو ملف نصي)",
  additionalAttachments: "الإرفاقات الإضافية",
  additionalAttachmentsDescription: "رفع مستندات إضافية أو صور مرتبطة بالمشروع (اختياري)",
  enterBudget: "أدخل مبلغ الميزانية",
  projectName: "اسم المشروع",
  noProjectPlan: "لا يوجد خطة عمل",
  noProjectPlanDescription: "لم ترفع خطة عمل لهذا المشروع بعد",
  uploadProjectPlan: "رفع خطة عمل المشروع",
  projectFiles: "ملفات المشروع",
  projectFilesDescription: "عرض وإدارة مرفقات ومستندات المشروع",
  uploadedOn: "تم الرفع في",
  download: "تحميل",
  view: "عرض",
  noFiles: "لا توجد ملفات",
  uploadFilesInstruction: "ابدأ برفع ملفك الأول",
  uploadFiles: "رفع الملفات",
  linkProjectToGoals: "ربط هذا المشروع بالأهداف الاستراتيجية أو السنوية",
  addGoal: "إضافة هدف",
  selectGoal: "اختر هدفًا",
  linkToExistingProjects: "ربط هذا المشروع بالمشاريع الموجودة التي يعتمد عليها",
  thisProjectDependsOn: "هذا المشروع يعتمد على",
  selectRelatedProject: "اختر مشروعًا مرتبطًا",
  addRelatedProject: "إضافة مشروع مرتبط",
  projectsRelatedToThis: "المشاريع المرتبطة بهذا",
  projectsThatDependOnThis: "المشاريع التي تعتمد على هذا المشروع",
  projectThatDependsOnThis: "مشروع يعتمد على هذا",
  addRelatedToProject: "إضافة مشروع تابع",
  departmentAutoAssigned: "الإدارة ستُعين تلقائيًا بناءً على مدير المشروع المحدد",
  
  // Project Week in Review
  weekInReview: "مراجعة الأسبوع",
  currentStatus: "الحالة الحالية",
  progressUpdate: "تحديث التقدم",
  keyAchievements: "الإنجازات الرئيسية",
  nextSteps: "الخطوات التالية",
  challenges: "التحديات",
  submitWeeklyUpdate: "إرسال التحديث الأسبوعي",
  weeklyUpdateSubmitted: "تم إرسال التحديث الأسبوعي",
  noWeeklyUpdatesYet: "لا توجد تحديثات أسبوعية بعد",
  submitYourFirstWeeklyUpdate: "أرسل تحديثك الأسبوعي الأول لتتبع التقدم",
  
  // Reports
  generateReport: "إنشاء تقرير",
  reportType: "نوع التقرير",
  selectReportType: "اختر نوع التقرير",
  projectStatusReport: "تقرير حالة المشروع",
  resourceAllocationReport: "تقرير تخصيص الموارد",
  budgetReport: "تقرير الميزانية",
  issueTrackingReport: "تقرير تتبع المشاكل",
  projectTimelineReport: "تقرير الجدول الزمني للمشروع",
  customDateRange: "نطاق تاريخ مخصص",
  filterByDepartment: "تصفية حسب الإدارة",
  exportAs: "تصدير كـ",
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
  
  // Budget Report specific translations
  detailedBudgetAnalysis: "تحليل مفصل للميزانية ورؤى",
  filters: "المرشحات",
  exportPDF: "تصدير PDF",
  spentToDate: "المنفق حتى تاريخه",
  budgetRemaining: "المتبقي من الميزانية",
  variancePercentage: "نسبة التباين %",
  underBudget: "تحت الميزانية",
  overBudget: "تجاوز الميزانية",
  departmentBudgets: "ميزانيات الإدارات",
  budgetByDepartment: "تفصيل الميزانية حسب الإدارة",
  spent: "المنفق",
  percentSpent: "% المنفق",
  monthlySpendingTrends: "اتجاهات الإنفاق الشهرية",
  actualVsProjectedSpending: "الإنفاق الفعلي مقابل المتوقع عبر الوقت",
  projectedSpend: "الإنفاق المتوقع",
  budgetAllocationByCategory: "توزيع الميزانية حسب الفئة",
  howBudgetIsAllocated: "كيفية توزيع الميزانية عبر الفئات المختلفة",
  budgetVsActualByDepartment: "الميزانية مقابل الفعلي حسب الإدارة",
  compareAllocation: "مقارنة تخصيص الميزانية مقابل الإنفاق الفعلي",
  budgetAllocated: "الميزانية المخصصة",
  
  // Custom Analytics translations
  customAnalytics: "التحليلات المخصصة",
  customAnalyticsDescription: "إنشاء وتصور تقارير مخصصة من بياناتك",
  dataSource: "مصدر البيانات",
  selectDataAndVisualization: "اختر مصدر البيانات ونوع التصور",
  dataCategory: "فئة البيانات",
  selectDataCategory: "اختر فئة البيانات",
  visualizationType: "نوع التصور",
  selectVisualization: "اختر التصور",
  barChart: "رسم بياني بالأعمدة",
  pieChart: "رسم بياني دائري",
  tableView: "عرض جدولي",
  allClients: "جميع العملاء",
  saveReport: "حفظ التقرير",
  saveReportDescription: "احفظ هذا التقرير للاستخدام المستقبلي",
  reportName: "اسم التقرير",
  enterReportName: "أدخل اسم التقرير",
  shareReport: "مشاركة التقرير",
  visualization: "التصور",
  showingDataCount: "عرض {{count}} سجل",
  noDataDescription: "لا توجد بيانات تطابق المرشحات الحالية",
  loadingData: "جاري تحميل البيانات...",
  count: "العدد",
  title: "العنوان",
  projectId: "معرف المشروع",
  type: "النوع",
  noDataAvailable: "لا توجد بيانات متاحة",
  selectDataAndGenerateReport: "اختر مصدر البيانات والمرشحات، ثم انقر على إنشاء تقرير لرؤية النتائج",
  savedReports: "التقارير المحفوظة",
  savedReportsDescription: "تقاريرك المخصصة المحفوظة مسبقاً",
  
  // Issue Tracking Report translations
  issueTrackingDescription: "تتبع وإدارة مشاكل ومخاطر المشروع",
  projectIssues: "مشاكل المشروع",
  issueStatus: "حالة المشكلة",
  comingSoon: "قريباً",
  issueTrackingReportUnderDevelopment: "تقرير تتبع المشاكل قيد التطوير حالياً.",
  checkBackSoon: "يرجى المراجعة قريباً للحصول على التحديثات.",
  
  // Resource Allocation Report translations
  resourceAllocationDescription: "عرض تخصيص الفريق والموارد عبر المشاريع",
  resourceAllocation: "تخصيص الموارد",
  teamAllocation: "تخصيص الفريق",
  resourceAllocationReportUnderDevelopment: "تقرير تخصيص الموارد قيد التطوير حالياً.",
  
  // Project Timeline Report translations
  projectTimelineDescription: "عرض الجداول الزمنية وبرامج المشاريع",
  projectTimelines: "الجداول الزمنية للمشاريع",
  projectSchedules: "برامج المشاريع",
  timelineReportUnderDevelopment: "تقرير الجدول الزمني قيد التطوير حالياً.",
  
  // Audit Logs
  auditLogs: "سجلات المراجعة",
  filterAuditLogsDescription: "تصفية سجلات المراجعة حسب معايير مختلفة",
  entityType: "نوع الكيان",
  allEntityTypes: "جميع أنواع الكيانات",
  action: "الإجراء",
  allActions: "جميع الإجراءات",
  entityId: "معرف الكيان",
  enterEntityId: "أدخل معرف الكيان",
  selectStartDate: "اختر تاريخ البداية",
  endDate: "تاريخ النهاية",
  selectEndDate: "اختر تاريخ النهاية",
  userId: "معرف المستخدم",
  enterUserId: "أدخل معرف المستخدم",
  clearFilters: "مسح المرشحات",
  auditLogsResults: "نتائج سجلات المراجعة",
  id: "المعرف",
  timestamp: "الطابع الزمني",
  noAuditLogsFound: "لم يتم العثور على سجلات مراجعة تطابق معاييرك",
  errorLoadingAuditLogs: "خطأ في تحميل سجلات المراجعة",
  showing: "عرض",
  ofTotal: "من إجمالي",
  previous: "السابق",
  next: "التالي",
  created: "تم الإنشاء",
  updated: "تم التحديث",
  deleted: "تم الحذف",
  loggedIn: "تسجيل الدخول",
  loggedOut: "تسجيل الخروج",
  changeRequest: "طلب تغيير",
  goal: "هدف",
  riskIssue: "خطر/مشكلة",
  noManager: "لا يوجد مدير",
  
  // Search and placeholders
  search: "البحث",
  searchRepositoryPlaceholder: "البحث في المستودع...",
  searchDependenciesPlaceholder: "البحث في الاعتماديات...",
  searchGoalsDependenciesPlaceholder: "البحث في اعتماديات الأهداف...",
  searchProjects: "البحث في المشاريع...",
  searchDepartments: "البحث في الإدارات...",
  searchRisksIssues: "البحث في المخاطر والمشاكل...",
  
  // Error Messages
  error: "خطأ",
  somethingWentWrong: "حدث خطأ ما",
  tryAgainLater: "يرجى المحاولة مرة أخرى",
  tryAgain: "حاول مرة أخرى",
  pageNotFound: "الصفحة غير موجودة",
  pageNotFoundDescription: "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
  backToDashboard: "العودة إلى لوحة المعلومات",
  actionFailed: "فشل الإجراء",
  errorLoadingData: "خطأ في تحميل البيانات",
  
  // Forms and validation
  enterTitle: "أدخل العنوان",
  enterDescription: "أدخل الوصف",
  enterFullName: "أدخل الاسم الكامل",
  enterUsername: "أدخل اسم المستخدم",
  enterPassword: "أدخل كلمة المرور",
  leaveEmptyToKeep: "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية",
  selectLanguage: "اختر اللغة",
  enterProjectName: "أدخل اسم المشروع",
  selectNewStatus: "اختر الحالة الجديدة",
  requestJustification: "أدخل مبرر الطلب",
  
  // User Permissions
  editUserPermissions: "تعديل صلاحيات المستخدم",
  editingPermissionsFor: "تعديل صلاحيات لـ",
  role: "الدور",
  selectRole: "اختر دوراً",
  useCustomPermissions: "استخدام صلاحيات مخصصة",
  customPermissions: "صلاحيات مخصصة",
  saveChanges: "حفظ التغييرات",
  permissionsUpdated: "تم تحديث الصلاحيات",
  userPermissionsUpdatedSuccessfully: "تم تحديث صلاحيات المستخدم بنجاح",
  searchUsers: "البحث عن المستخدمين بالاسم أو البريد الإلكتروني أو الدور...",
  noUsersFound: "لم يتم العثور على مستخدمين",
  noUsersMatchSearch: "لا يوجد مستخدمين يطابقون معايير البحث",
  editPermissions: "تعديل الصلاحيات",
  
  // User Roles
  User: "مستخدم",
  ProjectManager: "مدير مشروع",
  SubPMO: "مكتب إدارة مشاريع فرعي",
  MainPMO: "مكتب إدارة مشاريع رئيسي",
  DepartmentDirector: "مدير إدارة",
  Executive: "تنفيذي",
  Administrator: "مسؤول النظام",
  
  // Access control
  accessDenied: "تم رفض الوصول",
  noPermissionToManageUsers: "ليس لديك صلاحية لإدارة المستخدمين",
  errorLoadingUsers: "خطأ في تحميل المستخدمين",
  
  // Success Messages
  successfullyCreated: "تم الإنشاء بنجاح",
  successfullyUpdated: "تم التحديث بنجاح",
  successfullyDeleted: "تم الحذف بنجاح",
  
  // General UI
  notifications: "الإشعارات",
  noData: "لا توجد بيانات متاحة",
  noDescription: "لا يوجد وصف",
  confirm: "تأكيد",
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