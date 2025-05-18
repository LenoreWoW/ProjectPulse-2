import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// English translations
const en: Record<string, string> = {
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
  "Project Management System": "Project Management System",
  
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
  idCardUpload: "National ID",
  passportRequired: "Passport is required",
  idCardRequired: "National ID is required",
  documentRequirementNote: "Please upload clear scans or photos of your original documents. Files must be less than 5MB.",
  dropFileHere: "Drop file here",
  orClickToBrowse: "or click to browse",
  removeFile: "Remove",
  
  // Dashboard
  activeProjects: "Active Projects",
  allProjects: "All Projects",
  projectsCompleted: "Completed",
  completed: "Completed",
  atRisk: "At Risk",
  pendingApproval: "Pending Approval",
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
  onTrack: "On Track",
  reviewNeeded: "Review Needed",
  client: "Client",
  enterClientName: "Enter client name",
  
  // Goals
  newGoal: "New Goal",
  strategicGoals: "Strategic Goals",
  annualGoals: "Annual Goals",
  departmentGoals: "Department Goals",
  noStrategicGoals: "No strategic goals found",
  noAnnualGoals: "No annual goals found",
  goalCreated: "Goal Created",
  goalCreatedDescription: "The goal has been created successfully",
  enterGoalTitle: "Enter goal title",
  selectGoalType: "Select goal type",
  selectProjects: "Select related projects",
  selectGoals: "Select related goals",
  relatedProjects: "Related Projects",
  relatedGoals: "Related Goals",
  targetDate: "Target Date",
  selectDate: "Select date",
  weight: "Weight",
  goalWeight: "Goal Weight",
  projectWeight: "Project Weight",
  isAnnual: "Annual Goal",
  isStrategic: "Strategic Goal",
  addRelatedProject: "Add Related Project",
  addRelatedGoal: "Add Related Goal",
  departmentGoalNote: "Only department directors can add or edit department goals",
  
  // Approvals
  pendingApprovals: "Pending Approvals",
  approve: "Approve",
  reject: "Reject",
  budgetIncreaseRequest: "Budget Increase Request",
  timelineExtension: "Timeline Extension",
  projectClosure: "Project Closure",
  
  // Statuses
  statusPending: "Pending",
  statusPlanning: "Planning",
  inProgress: "In Progress",
  statusOnHold: "On Hold",
  statusCompleted: "Completed",
  
  // Project details
  editCost: "Edit Cost",
  details: "Details",
  viewDetails: "View Details",
  overview: "Overview",
  weeklyUpdates: "Weekly Updates",
  changeRequests: "Change Requests",
  logs: "Logs",
  comments: "Comments",
  projectManager: "Project Manager",
  noProjectsFound: "No projects found",
  
  // Form fields
  submit: "Submit",
  cancel: "Cancel",
  save: "Save",
  search: "Search",
  
  // Notifications
  notificationsTitle: "Notifications",
  markAsRead: "Mark as Read",
  markAllAsRead: "Mark All as Read",
  
  // Errors
  error: "Error",
  somethingWentWrong: "Something went wrong",
  tryAgain: "Please try again",
  
  // User Permissions
  userPermissionsManagement: "User Permissions Management",
  manageUserRolesAndPermissions: "Manage user roles and custom permissions",
  editPermissions: "Edit Permissions",
  searchUsers: "Search users by name, email, or role...",
  noUsersFound: "No users found",
  noUsersMatchSearch: "No users match your search criteria",
  editUserPermissions: "Edit User Permissions",
  editingPermissionsFor: "Editing permissions for",
  role: "Role",
  selectRole: "Select a role",
  useCustomPermissions: "Use custom permissions",
  customPermissions: "Custom Permissions",
  saveChanges: "Save Changes",
  permissionsUpdated: "Permissions Updated",
  userPermissionsUpdatedSuccessfully: "User permissions have been updated successfully",
  errorLoadingUsers: "Error loading users",
  accessDenied: "Access Denied",
  noPermissionToManageUsers: "You don't have permission to manage users",
  
  // User Roles
  User: "User",
  ProjectManager: "Project Manager",
  SubPMO: "Sub-PMO",
  MainPMO: "Main PMO",
  DepartmentDirector: "Department Director",
  Executive: "Executive",
  Administrator: "Administrator",
  
  // Languages and theme
  language: "Language",
  english: "English",
  arabic: "Arabic",
  darkMode: "Dark Mode",
  lightMode: "Light Mode",
  
  // Budget
  budget: "Budget",
  cost: "Cost",
  
  // Date and time
  date: "Date",
  time: "Time",
  
  // Assignments
  newAssignment: "New Assignment",
  createNewAssignment: "Create New Assignment",
  fillDetailsBelow: "Fill in the details below",
  assignmentName: "Assignment Name",
  enterAssignmentName: "Enter assignment name",
  description: "Description",
  enterDescription: "Enter description",
  assignee: "Assignee",
  selectAssignee: "Select assignee",
  assignedToMe: "Assigned to Me",
  assignedByMe: "Assigned by Me",
  assignedTo: "Assigned to",
  assignedBy: "Assigned by",
  priority: "Priority",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  selectPriority: "Select priority",
  deadline: "Deadline",
  daysLeft: "days left",
  daysOverdue: "days overdue",
  dueToday: "Due today",
  loading: "Loading...",
  createAssignment: "Create Assignment",
  creating: "Creating...",
  searchAssignments: "Search assignments...",
  noCompletedAssignments: "No completed assignments found",
  completedOn: "Completed on",
  
  // Repository & Dependencies
  repositoryDescription: "Access completed projects and templates from the central repository",
  projectTemplates: "Project Templates",
  completedProjects: "Completed Projects",
  searchRepositoryPlaceholder: "Search projects by name, department, or owner...",
  noCompletedProjects: "No completed projects available",
  noCompletedProjectsFound: "No completed projects match your search",
  noTemplates: "No project templates available",
  noTemplatesFound: "No templates match your search criteria",
  copyAsTemplate: "Copy as Template",
  template: "Template",
  download: "Download",
  
  // Dependencies
  dependenciesDescription: "Visualize project dependencies and relationships",
  searchDependenciesPlaceholder: "Search for projects, connections, or dependencies...",
  projectDependencies: "Project Dependencies",
  projectDependenciesDescription: "Interactive visualization of project relationships and dependencies",
  goalDependencies: "Goal Dependencies",
  goalDependenciesDescription: "Interactive visualization of how goals relate to projects and other goals",
  noDependencies: "No dependencies to display",
  noDependenciesFound: "No dependencies match your search criteria",
  noDependenciesDescription: "Create relationships between projects to see them here",
  exportGraph: "Export Graph",
  connections: "Connections",
  noDependencyConnections: "No connections to other projects",
  selectNodeToViewDetails: "Select a node to view details",
  legend: "Legend",
  defaultNode: "Default Node",
  hoverOverNodesTip: "Hover over nodes to see their connections",
  noGoalDependencies: "No goal dependencies to display",
  noGoalDependenciesDescription: "Create relationships between goals and projects to see them here",
  searchGoalsDependenciesPlaceholder: "Search for goals, projects, or connections...",
  strategicGoal: "Strategic Goal",
  annualGoal: "Annual Goal",
  supportsGoal: "Supports",
  contributesTo: "Contributes to",
  goalType: "Goal Type",
  strategic: "Strategic",
  annual: "Annual",
  goalDetails: "Goal Details",
  highPriority: "High Priority",
  relationshipWeight: "Relationship Weight",
  noGoalConnections: "No connections to other goals or projects",
  contributesToProjects: "Contributes to Projects",
  parentTo: "Parent to",
  childOf: "Child of",
  
  // Analytics
  analyticsDashboard: "Analytics Dashboard",
  analyticsDescription: "Comprehensive view of project metrics, trends, and KPIs",
  projectAnalytics: "Project Analytics",
  taskAnalytics: "Task Analytics",
  budgetAnalytics: "Budget Analytics",
  thisWeek: "This Week",
  thisMonth: "This Month",
  thisQuarter: "This Quarter",
  thisYear: "This Year",
  export: "Export",
  ofTotalProjects: "of total projects",
  completedThisMonth: "completed this month",
  needsAttention: "needs immediate attention",
  spent: "spent",
  total: "total",
  projectStatusDistribution: "Project Status Distribution",
  projectStatusDistributionDesc: "Distribution of projects by their current status",
  departmentProjectDistribution: "Department Project Distribution",
  departmentProjectDistributionDesc: "Number of projects by department",
  projectCompletionTrend: "Project Completion Trend",
  projectCompletionTrendDesc: "Monthly trend of project starts and completions",
  taskCompletionRate: "Task Completion Rate",
  taskCompletionRateDesc: "Weekly trend of tasks completed vs total tasks",
  riskTrend: "Risk Trend",
  riskTrendDesc: "Monthly distribution of risks by priority level",
  budgetAllocationVsSpend: "Budget Allocation vs Spend",
  budgetAllocationVsSpendDesc: "Monthly comparison of allocated budget and actual spend",
  departmentBudgetAllocation: "Department Budget Allocation",
  departmentBudgetAllocationDesc: "Budget distribution across departments",
  
  // Weekly Update Component
  selected: "Selected",
  selectForUpdate: "Select for update",
  enterWeeklyUpdate: "Enter weekly update details...",
  
  // 404 page
  page_not_found: "404 Page Not Found",
  page_not_found_message: "Did you forget to add the page to the router?",

  // Comments and Notifications
  comments: "Comments",
  noComments: "No comments yet",
  writeComment: "Write a comment...",
  postComment: "Post Comment",
  posting: "Posting...",
  commentAdded: "Comment Added",
  commentAddedDescription: "Your comment has been posted successfully",
  commentAddError: "Failed to add comment. Please try again.",
  unknownUser: "Unknown User",
  
  // Task Dialog
  taskNotFound: "Task not found",
  noDescription: "No description provided",
  assignedTo: "Assigned To",
  createdBy: "Created By",
  loading: "Loading...",
  details: "Details",
  
  // Assignment Dialog
  assignmentNotFound: "Assignment not found",
  assignedBy: "Assigned By",
  fromUser: "From",
  
  // Common UI Elements
  close: "Close",
  
  // Status and Priority Labels
  statusPending: "Pending",
  statusInProgress: "In Progress",
  statusCompleted: "Completed",
  taskStatus_Pending: "Pending",
  taskStatus_InProgress: "In Progress",
  taskStatus_Completed: "Completed",
  
  // Delete Confirmations
  deleteTaskTitle: "Delete Task",
  deleteTaskConfirmation: "Are you sure you want to delete this task?",
  deleteAssignmentTitle: "Delete Assignment",
  deleteAssignmentConfirmation: "Are you sure you want to delete this assignment?",
};

// Arabic translations
const ar: Record<string, string> = {
  // Common
  dashboard: "لوحة التحكم",
  calendar: "التقويم",
  projects: "المشاريع",
  tasks: "المهام",
  goals: "الأهداف",
  risksAndIssues: "المخاطر والمشكلات",
  assignments: "التكليفات",
  approvals: "الموافقات",
  dependencies: "الاعتماديات",
  repository: "المستودع المركزي",
  departments: "الأقسام",
  reports: "التقارير",
  analytics: "التحليلات",
  settings: "الإعدادات",
  userPermissions: "صلاحيات المستخدمين",
  "Project Management System": "نظام إدارة المشاريع",
  
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
  documentRequirementNote: "يرجى تحميل صور واضحة من مستنداتك الأصلية. يجب أن تكون الملفات أقل من 5 ميجابايت.",
  dropFileHere: "ضع الملف هنا",
  orClickToBrowse: "أو انقر للتصفح",
  removeFile: "إزالة",
  
  // Dashboard
  activeProjects: "المشاريع النشطة",
  allProjects: "جميع المشاريع",
  projectsCompleted: "المكتملة",
  completed: "مكتمل",
  atRisk: "في خطر",
  pendingApproval: "في انتظار الموافقة",
  viewAll: "عرض الكل",
  budgetOverview: "نظرة عامة على الميزانية",
  totalBudget: "إجمالي الميزانية",
  actualSpend: "الإنفاق الفعلي",
  remaining: "المتبقي",
  predictedCost: "التكلفة المتوقعة",
  acrossAllActiveProjects: "عبر جميع المشاريع النشطة",
  ofTotalBudget: "من إجمالي الميزانية",
  potentialOverspend: "تجاوز محتمل للميزانية",
  weeklyUpdateReminder: "تذكير التحديث الأسبوعي",
  submissionDue: "موعد التسليم",
  submitUpdate: "إرسال التحديث",
  welcomeBack: "أهلاً بعودتك",
  dashboardIntro: "تتبع محفظة مشاريعك، راقب التقدم، وحافظ على متابعة الموافقات.",
  allProjectsDescription: "عرض جميع المشاريع في النظام",
  projectsInStatus: "المشاريع بحالة: {{status}}",
  
  // Projects
  newProject: "مشروع جديد",
  recentProjects: "المشاريع الحديثة",
  project: "المشروع",
  department: "القسم",
  status: "الحالة",
  progress: "التقدم",
  dueIn: "مستحق في",
  days: "أيام",
  onTrack: "على المسار",
  reviewNeeded: "بحاجة للمراجعة",
  client: "العميل",
  enterClientName: "أدخل اسم العميل",
  
  // Goals
  newGoal: "هدف جديد",
  strategicGoals: "هدف إستراتيجي",
  annualGoals: "هدف سنوي",
  departmentGoals: "هدف القسم",
  noStrategicGoals: "لم يتم العثور على هدف إستراتيجي",
  noAnnualGoals: "لم يتم العثور على هدف سنوي",
  goalCreated: "هدف إنشاء",
  goalCreatedDescription: "تم إنشاء الهدف بنجاح",
  enterGoalTitle: "أدخل عنوان الهدف",
  selectGoalType: "اختر نوع الهدف",
  selectProjects: "اختر المشاريع المرتبطة",
  selectGoals: "اختر الهدف المرتبط",
  relatedProjects: "المشاريع المرتبطة",
  relatedGoals: "الهدف المرتبط",
  targetDate: "تاريخ الهدف",
  selectDate: "اختر التاريخ",
  weight: "الوزن",
  goalWeight: "وزن الهدف",
  projectWeight: "وزن المشروع",
  isAnnual: "هدف سنوي",
  isStrategic: "هدف إستراتيجي",
  addRelatedProject: "إضافة مشروع مرتبط",
  addRelatedGoal: "إضافة هدف مرتبط",
  departmentGoalNote: "يمكن لمدير القسم إضافة أو تعديل هدف القسم فقط",
  
  // Approvals
  pendingApprovals: "الموافقات المعلقة",
  approve: "موافقة",
  reject: "رفض",
  budgetIncreaseRequest: "طلب زيادة الميزانية",
  timelineExtension: "تمديد الجدول الزمني",
  projectClosure: "إغلاق المشروع",
  
  // Statuses
  statusPending: "معلق",
  statusPlanning: "التخطيط",
  inProgress: "قيد التنفيذ",
  statusOnHold: "متوقف",
  statusCompleted: "مكتمل",
  
  // Project details
  editCost: "تعديل التكلفة",
  details: "التفاصيل",
  viewDetails: "عرض التفاصيل",
  overview: "نظرة عامة",
  weeklyUpdates: "التحديثات الأسبوعية",
  changeRequests: "طلبات التغيير",
  logs: "السجلات",
  comments: "التعليقات",
  projectManager: "مدير المشروع",
  noProjectsFound: "لم يتم العثور على مشاريع",
  
  // Form fields
  submit: "إرسال",
  cancel: "إلغاء",
  save: "حفظ",
  search: "بحث",
  
  // Notifications
  notificationsTitle: "الإشعارات",
  markAsRead: "تحديد كمقروء",
  markAllAsRead: "تحديد الكل كمقروء",
  
  // Errors
  error: "خطأ",
  somethingWentWrong: "حدث خطأ ما",
  tryAgain: "يرجى المحاولة مرة أخرى",
  
  // User Permissions
  userPermissionsManagement: "إدارة صلاحيات المستخدمين",
  manageUserRolesAndPermissions: "إدارة أدوار المستخدمين والصلاحيات المخصصة",
  editPermissions: "تعديل الصلاحيات",
  searchUsers: "البحث عن المستخدمين بالاسم أو البريد الإلكتروني أو الدور...",
  noUsersFound: "لم يتم العثور على مستخدمين",
  noUsersMatchSearch: "لا يوجد مستخدمين يطابقون معايير البحث",
  editUserPermissions: "تعديل صلاحيات المستخدم",
  editingPermissionsFor: "تعديل صلاحيات المستخدم",
  role: "الدور",
  selectRole: "اختر دورًا",
  useCustomPermissions: "استخدام صلاحيات مخصصة",
  customPermissions: "صلاحيات مخصصة",
  saveChanges: "حفظ التغييرات",
  permissionsUpdated: "تم تحديث الصلاحيات",
  userPermissionsUpdatedSuccessfully: "تم تحديث صلاحيات المستخدم بنجاح",
  errorLoadingUsers: "خطأ في تحميل المستخدمين",
  accessDenied: "تم رفض الوصول",
  noPermissionToManageUsers: "ليس لديك صلاحية لإدارة المستخدمين",
  
  // User Roles
  User: "مستخدم",
  ProjectManager: "مدير مشروع",
  SubPMO: "مكتب إدارة مشاريع فرعي",
  MainPMO: "مكتب إدارة مشاريع رئيسي",
  DepartmentDirector: "مدير قسم",
  Executive: "تنفيذي",
  Administrator: "مسؤول النظام",
  
  // Languages and theme
  language: "اللغة",
  english: "الإنجليزية",
  arabic: "العربية",
  darkMode: "الوضع الداكن",
  lightMode: "الوضع الفاتح",
  
  // Budget
  budget: "الميزانية",
  cost: "التكلفة",
  
  // Date and time
  date: "التاريخ",
  time: "الوقت",
  
  // Assignments
  newAssignment: "مهمة جديدة",
  createNewAssignment: "إنشاء مهمة جديدة",
  fillDetailsBelow: "أدخل التفاصيل أدناه",
  assignmentName: "اسم المهمة",
  enterAssignmentName: "أدخل اسم المهمة",
  description: "الوصف",
  enterDescription: "أدخل الوصف",
  assignee: "المسؤل",
  selectAssignee: "اختر المسؤل",
  assignedToMe: "مسند إلي",
  assignedByMe: "مسند بواسطتي",
  assignedTo: "مسند إلى",
  assignedBy: "مسند بواسطة",
  priority: "الأولوية",
  low: "منخفض",
  medium: "متوسط",
  high: "عالي",
  critical: "حرج",
  selectPriority: "اختر الأولوية",
  deadline: "الموعد النهائي",
  daysLeft: "يتبقى أيام",
  daysOverdue: "يتأخر أيام",
  dueToday: "مستحق اليوم",
  loading: "جاري التحميل...",
  createAssignment: "إنشاء المهمة",
  creating: "جاري الإنشاء...",
  searchAssignments: "البحث عن المهام...",
  noCompletedAssignments: "لم تجد مهام مكتملة",
  completedOn: "مكتمل في",
  
  // Repository & Dependencies
  repositoryDescription: "الوصول إلى المشاريع المكتملة والقوالب من المستودع المركزي",
  projectTemplates: "قوالب المشاريع",
  completedProjects: "المشاريع المكتملة",
  searchRepositoryPlaceholder: "البحث عن المشاريع حسب الاسم أو القسم أو المالك...",
  noCompletedProjects: "لا توجد مشاريع مكتملة",
  noCompletedProjectsFound: "لا توجد مشاريع مكتملة تطابق بحثك",
  noTemplates: "لا تتوفر قوالب للمشاريع",
  noTemplatesFound: "لا توجد قوالب تطابق معايير البحث الخاصة بك",
  copyAsTemplate: "نسخ كقالب",
  template: "قالب",
  download: "تنزيل",
  
  // Dependencies
  dependenciesDescription: "تصور تبعيات المشروع والعلاقات",
  searchDependenciesPlaceholder: "البحث عن المشاريع أو الاتصالات أو التبعيات...",
  projectDependencies: "تبعيات المشروع",
  projectDependenciesDescription: "تصور تفاعلي لعلاقات المشروع والتبعيات",
  goalDependencies: "تبعيات الأهداف",
  goalDependenciesDescription: "تصور تفاعلي لعلاقات الأهداف والمشاريع",
  noDependencies: "لا توجد تبعيات للعرض",
  noDependenciesFound: "لا توجد تبعيات تطابق معايير البحث الخاصة بك",
  noDependenciesDescription: "قم بإنشاء علاقات بين المشاريع لرؤيتها هنا",
  exportGraph: "تصدير الرسم البياني",
  connections: "الاتصالات",
  noDependencyConnections: "لا توجد اتصالات بمشاريع أخرى",
  selectNodeToViewDetails: "حدد عقدة لعرض التفاصيل",
  legend: "المفتاح",
  defaultNode: "العقدة الافتراضية",
  hoverOverNodesTip: "مرر مؤشر الماوس فوق العقد لرؤية اتصالاتها",
  searchGoalsDependenciesPlaceholder: "البحث عن الأهداف أو المشاريع أو الاتصالات...",
  strategicGoal: "هدف إستراتيجي",
  annualGoal: "هدف سنوي",
  supportsGoal: "يدعم",
  contributesTo: "يساهم في",
  goalType: "نوع الهدف",
  strategic: "إستراتيجي",
  annual: "سنوي",
  goalDetails: "تفاصيل الهدف",
  highPriority: "أولوية عالية",
  relationshipWeight: "وزن العلاقة",
  noGoalConnections: "لا توجد علاقات بين الأهداف والمشاريع",
  contributesToProjects: "يساهم في المشاريع",
  parentTo: "أبو",
  childOf: "طفل",
  
  // Analytics
  analyticsDashboard: "لوحة التحليلات",
  analyticsDescription: "نظرة شاملة على مقاييس المشروع والاتجاهات ومؤشرات الأداء",
  projectAnalytics: "تحليلات المشروع",
  taskAnalytics: "تحليلات المهام",
  budgetAnalytics: "تحليلات الميزانية",
  thisWeek: "هذا الأسبوع",
  thisMonth: "هذا الشهر",
  thisQuarter: "هذا الربع",
  thisYear: "هذا العام",
  export: "تصدير",
  ofTotalProjects: "من إجمالي المشاريع",
  completedThisMonth: "اكتمل هذا الشهر",
  needsAttention: "يحتاج إلى اهتمام فوري",
  spent: "أنفق",
  total: "الإجمالي",
  projectStatusDistribution: "توزيع حالة المشروع",
  projectStatusDistributionDesc: "توزيع المشاريع حسب حالتها الحالية",
  departmentProjectDistribution: "توزيع مشاريع الأقسام",
  departmentProjectDistributionDesc: "عدد المشاريع حسب القسم",
  projectCompletionTrend: "اتجاه إكمال المشروع",
  projectCompletionTrendDesc: "الاتجاه الشهري لبدء المشاريع واكمالها",
  taskCompletionRate: "معدل إكمال المهام",
  taskCompletionRateDesc: "الاتجاه الأسبوعي للمهام المكتملة مقابل إجمالي المهام",
  riskTrend: "اتجاه المخاطر",
  riskTrendDesc: "التوزيع الشهري للمخاطر حسب مستوى الأولوية",
  budgetAllocationVsSpend: "تخصيص الميزانية مقابل الإنفاق",
  budgetAllocationVsSpendDesc: "مقارنة شهرية للميزانية المخصصة والإنفاق الفعلي",
  departmentBudgetAllocation: "تخصيص ميزانية القسم",
  departmentBudgetAllocationDesc: "توزيع الميزانية عبر الأقسام",
  
  // Weekly Update Component
  selected: "محدد",
  selectForUpdate: "حدد للتحديث",
  enterWeeklyUpdate: "أدخل تفاصيل التحديث الأسبوعي...",
  
  // 404 page
  page_not_found: "404 الصفحة غير موجودة",
  page_not_found_message: "هل نسيت إضافة الصفحة إلى جهاز التوجيه؟",

  // Comments and Notifications
  comments: "التعليقات",
  noComments: "لا يوجد تعليقات حتى الآن",
  writeComment: "اكتب تعليقًا...",
  postComment: "نشر التعليق",
  posting: "جاري النشر...",
  commentAdded: "تمت إضافة التعليق",
  commentAddedDescription: "تم نشر تعليقك بنجاح",
  commentAddError: "فشل في إضافة التعليق. يرجى المحاولة مرة أخرى.",
  unknownUser: "مستخدم غير معروف",
  
  // Task Dialog
  taskNotFound: "المهمة غير موجودة",
  noDescription: "لا يوجد وصف",
  assignedTo: "مكلف إلى",
  createdBy: "أنشئت بواسطة",
  loading: "جاري التحميل...",
  details: "التفاصيل",
  
  // Assignment Dialog
  assignmentNotFound: "التكليف غير موجود",
  assignedBy: "تم التكليف بواسطة",
  fromUser: "من",
  
  // Common UI Elements
  close: "إغلاق",
  
  // Status and Priority Labels
  statusPending: "قيد الانتظار",
  statusInProgress: "قيد التنفيذ",
  statusCompleted: "مكتمل",
  taskStatus_Pending: "قيد الانتظار",
  taskStatus_InProgress: "قيد التنفيذ",
  taskStatus_Completed: "مكتمل",
  
  // Delete Confirmations
  deleteTaskTitle: "حذف المهمة",
  deleteTaskConfirmation: "هل أنت متأكد من رغبتك في حذف هذه المهمة؟",
  deleteAssignmentTitle: "حذف التكليف",
  deleteAssignmentConfirmation: "هل أنت متأكد من رغبتك في حذف هذا التكليف؟",
};

// Add translations for reports
const reportsTranslations = {
  comingSoon: "Coming Soon",
  timelineReportUnderDevelopment: "The Project Timeline report is under development and will be available soon.",
  resourceReportUnderDevelopment: "The Resource Allocation report is under development and will be available soon.",
  utilizationReportUnderDevelopment: "The Resource Utilization report is under development and will be available soon.",
  riskReportUnderDevelopment: "The Risk Assessment report is under development and will be available soon.",
  issueReportUnderDevelopment: "The Issue Tracking report is under development and will be available soon.",
  
  projectTimelineReport: "Project Timeline Report",
  projectTimelineInDevelopment: "Track project timelines and milestones",
  
  resourceAllocationReport: "Resource Allocation Report",
  resourceAllocationInDevelopment: "Analyze resource allocation across projects",
  
  resourceUtilizationReport: "Resource Utilization Report",
  resourceUtilizationInDevelopment: "Track resource utilization efficiency",
  
  riskAssessmentReport: "Risk Assessment Report",
  riskAssessmentInDevelopment: "Evaluate project risk levels",
  
  issueTrackingReport: "Issue Tracking Report",
  issueTrackingInDevelopment: "Monitor and track project issues",
  
  // Budget and Cost Reports
  plannedCosts: "Planned Costs",
  actualCosts: "Actual Costs",
  costVariance: "Cost Variance",
  fromPlannedCosts: "From planned costs",
  costsByCategory: "Costs by Category",
  plannedVsActualCostsByCategory: "Comparison of planned vs actual costs by category",
  category: "Category",
  costTrends: "Cost Trends",
  plannedVsActualCostTrends: "Historical trends of planned vs actual costs",
  costBreakdown: "Cost Breakdown",
  costBreakdownByCategory: "Distribution of costs by category",
  planned: "Planned",
  actual: "Actual",
  toDate: "To date",
  
  // Forecast Reports
  currentYearForecast: "Current Year Forecast",
  nextYearForecast: "Next Year Forecast",
  forecastChange: "Forecast Change",
  yearOverYear: "Year over year",
  varianceFromBudget: "Variance from Budget",
  quarterlyFinancialForecast: "Quarterly Financial Forecast",
  forecastVsActualByQuarter: "Comparison of forecasted vs actual figures by quarter",
  forecastedRevenue: "Forecasted Revenue",
  actualRevenue: "Actual Revenue",
  forecastedCost: "Forecasted Cost",
  actualCost: "Actual Cost",
  projectForecasts: "Project Forecasts",
  forecastsByProject: "Financial forecasts by project",
  fiscalYear2023: "Fiscal Year 2023",
  fiscalYear2024: "Fiscal Year 2024",
  profitForecast: "Profit Forecast",
  forecastedVsActualProfit: "Comparison of forecasted vs actual profit",
  forecastedProfit: "Forecasted Profit",
  actualProfit: "Actual Profit",
  
  // Project Status
  totalProjects: "Total Projects",
  activeProjects: "Active projects",
  inProgress: "In Progress",
  currentlyInProgress: "Currently in progress",
  completed: "Completed",
  successfullyCompleted: "Successfully completed",
  delayed: "Delayed",
  behindSchedule: "Behind schedule",
  projectStatusDistribution: "Project Status Distribution",
  projectsByStatus: "Distribution of projects by status",
  riskDistribution: "Risk Distribution",
  projectsByRiskLevel: "Distribution of projects by risk level",
  projectsByDepartment: "Projects by Department",
  departmentProjectStatus: "Status of projects in each department",
  planning: "Planning",
  projectsList: "Projects List",
  detailedProjectInformation: "Detailed information for each project",
  projectName: "Project Name",
  riskLevel: "Risk Level",
  progress: "Progress",
  dueDate: "Due Date",
  completion: "Completion",
};

// Merge with existing translations
const enTranslations = {
  // ... existing English translations ...
  ...reportsTranslations,
};

// Add Arabic translations for reports
const reportsTranslationsArabic = {
  comingSoon: "قريبا",
  timelineReportUnderDevelopment: "تقرير الجدول الزمني للمشروع قيد التطوير وسيكون متاحًا قريبًا.",
  resourceReportUnderDevelopment: "تقرير تخصيص الموارد قيد التطوير وسيكون متاحًا قريبًا.",
  utilizationReportUnderDevelopment: "تقرير استخدام الموارد قيد التطوير وسيكون متاحًا قريبًا.",
  riskReportUnderDevelopment: "تقرير تقييم المخاطر قيد التطوير وسيكون متاحًا قريبًا.",
  issueReportUnderDevelopment: "تقرير تتبع المشكلات قيد التطوير وسيكون متاحًا قريبًا.",
  
  projectTimelineReport: "تقرير الجدول الزمني للمشروع",
  projectTimelineInDevelopment: "تتبع الجداول الزمنية للمشروع والمعالم الرئيسية",
  
  resourceAllocationReport: "تقرير تخصيص الموارد",
  resourceAllocationInDevelopment: "تحليل تخصيص الموارد عبر المشاريع",
  
  resourceUtilizationReport: "تقرير استخدام الموارد",
  resourceUtilizationInDevelopment: "تتبع كفاءة استخدام الموارد",
  
  riskAssessmentReport: "تقرير تقييم المخاطر",
  riskAssessmentInDevelopment: "تقييم مستويات مخاطر المشروع",
  
  issueTrackingReport: "تقرير تتبع المشكلات",
  issueTrackingInDevelopment: "مراقبة وتتبع مشكلات المشروع",
  
  // Budget and Cost Reports
  plannedCosts: "التكاليف المخططة",
  actualCosts: "التكاليف الفعلية",
  costVariance: "تباين التكلفة",
  fromPlannedCosts: "من التكاليف المخططة",
  costsByCategory: "التكاليف حسب الفئة",
  plannedVsActualCostsByCategory: "مقارنة التكاليف المخططة مقابل الفعلية حسب الفئة",
  category: "الفئة",
  costTrends: "اتجاهات التكلفة",
  plannedVsActualCostTrends: "الاتجاهات التاريخية للتكاليف المخططة مقابل الفعلية",
  costBreakdown: "تفصيل التكلفة",
  costBreakdownByCategory: "توزيع التكاليف حسب الفئة",
  planned: "مخطط",
  actual: "فعلي",
  toDate: "حتى الآن",
  
  // Forecast Reports
  currentYearForecast: "توقعات العام الحالي",
  nextYearForecast: "توقعات العام القادم",
  forecastChange: "تغير التوقعات",
  yearOverYear: "سنة بعد سنة",
  varianceFromBudget: "التباين عن الميزانية",
  quarterlyFinancialForecast: "التوقعات المالية الربعية",
  forecastVsActualByQuarter: "مقارنة الأرقام المتوقعة مقابل الفعلية حسب الربع",
  forecastedRevenue: "الإيرادات المتوقعة",
  actualRevenue: "الإيرادات الفعلية",
  forecastedCost: "التكلفة المتوقعة",
  projectForecasts: "توقعات المشروع",
  forecastsByProject: "التوقعات المالية حسب المشروع",
  fiscalYear2023: "السنة المالية 2023",
  fiscalYear2024: "السنة المالية 2024",
  profitForecast: "توقعات الربح",
  forecastedVsActualProfit: "مقارنة الربح المتوقع مقابل الفعلي",
  forecastedProfit: "الربح المتوقع",
  actualProfit: "الربح الفعلي",
  
  // Project Status
  totalProjects: "إجمالي المشاريع",
  activeProjects: "المشاريع النشطة",
  inProgress: "قيد التنفيذ",
  currentlyInProgress: "قيد التنفيذ حاليًا",
  completed: "مكتمل",
  successfullyCompleted: "اكتمل بنجاح",
  delayed: "متأخر",
  behindSchedule: "متأخر عن الجدول الزمني",
  projectStatusDistribution: "توزيع حالة المشروع",
  projectsByStatus: "توزيع المشاريع حسب الحالة",
  riskDistribution: "توزيع المخاطر",
  projectsByRiskLevel: "توزيع المشاريع حسب مستوى المخاطر",
  projectsByDepartment: "المشاريع حسب القسم",
  departmentProjectStatus: "حالة المشاريع في كل قسم",
  planning: "التخطيط",
  projectsList: "قائمة المشاريع",
  detailedProjectInformation: "معلومات مفصلة لكل مشروع",
  projectName: "اسم المشروع",
  riskLevel: "مستوى المخاطر",
  progress: "التقدم",
  dueDate: "تاريخ الاستحقاق",
  completion: "الإكمال",
};

// Merge with existing Arabic translations
const arTranslations = {
  // ... existing Arabic translations ...
  ...reportsTranslationsArabic,
};

const translations: Translations = {
  en,
  ar,
};

type I18nContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isRtl: boolean;
};

const I18nContext = createContext<I18nContextType | null>(null);

// Named export for the provider
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(() => {
    // Try to load user's preferred language from localStorage
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en'; // Default to English
  });
  
  const isRtl = language === 'ar';

  useEffect(() => {
    // Set language direction
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
    
    // Save language preference
    localStorage.setItem('language', language);
  }, [language, isRtl]);

  const t = (key: string, params?: Record<string, string>): string => {
    if (!translations[language]) {
      return key; // Fallback to key if language not found
    }
    
    let text = '';
    if (!translations[language][key]) {
      // If key not found in current language, check English
      if (language !== 'en' && translations['en'] && translations['en'][key]) {
        text = translations['en'][key];
      } else {
        return key; // Fallback to key if translation not found
      }
    } else {
      text = translations[language][key];
    }
    
    // Handle parameter substitution
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return text;
  };

  const context = {
    language,
    setLanguage,
    t,
    isRtl
  };

  return (
    <I18nContext.Provider value={context}>
      {children}
    </I18nContext.Provider>
  );
}

// Separate named export for the hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}