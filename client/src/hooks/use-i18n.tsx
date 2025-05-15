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
  projectsCompleted: "Completed",
  atRisk: "At Risk",
  pendingApproval: "Pending Approval",
  budgetOverview: "Budget Overview",
  totalBudget: "Total Budget",
  actualSpend: "Actual Spend",
  remaining: "Remaining",
  predictedCost: "Predicted Cost",
  acrossAllActiveProjects: "Across all active projects",
  ofTotalBudget: "of total budget",
  potentialOverspend: "Potential overspend of",
  weeklyUpdateReminder: "Weekly Update Reminder",
  submissionDue: "Submission Due",
  submitUpdate: "Submit Update",
  
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
  
  // Approvals
  pendingApprovals: "Pending Approvals",
  approve: "Approve",
  reject: "Reject",
  budgetIncreaseRequest: "Budget Increase Request",
  timelineExtension: "Timeline Extension",
  projectClosure: "Project Closure",
  
  // Statuses
  pending: "Pending",
  planning: "Planning",
  inProgress: "In Progress",
  onHold: "On Hold",
  statusCompleted: "Completed",
  
  // Project details
  editCost: "Edit Cost",
  details: "Details",
  overview: "Overview",
  projectUpdates: "Weekly Updates",
  changeRequests: "Change Requests",
  logs: "Logs",
  comments: "Comments",
  
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
  deadline: "Deadline",
  startDate: "Start Date",
  
  // Repository & Dependencies
  repositoryDescription: "Access completed projects and templates from the central repository",
  projectTemplates: "Project Templates",
  completedProjects: "Completed Projects",
  searchRepositoryPlaceholder: "Search projects by name, department, or owner...",
  noCompletedProjects: "No completed projects found",
  noCompletedProjectsFound: "No completed projects match your search",
  noTemplates: "No project templates available",
  noTemplatesFound: "No templates match your search criteria",
  copyAsTemplate: "Copy as Template",
  template: "Template",
  download: "Download",
  
  // Dependencies
  dependenciesDescription: "Visualize project dependencies and relationships",
  searchDependenciesPlaceholder: "Search projects, connections, or dependencies...",
  projectDependencies: "Project Dependencies",
  projectDependenciesDescription: "Interactive visualization of project relationships and dependencies",
  noDependencies: "No dependencies to display",
  noDependenciesFound: "No dependencies match your search criteria",
  noDependenciesDescription: "Create relationships between projects to see them visualized here",
  exportGraph: "Export Graph",
  connections: "Connections",
  noDependencyConnections: "No connections to other projects",
  selectNodeToViewDetails: "Select a node to view details",
  legend: "Legend",
  defaultNode: "Default Node",
  hoverOverNodesTip: "Hover over nodes to see their connections",
  
  // Analytics
  analyticsDashboard: "Analytics Dashboard",
  analyticsDescription: "Comprehensive view of project metrics, trends, and performance indicators",
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
  spent: "Spent",
  total: "Total",
  projectStatusDistribution: "Project Status Distribution",
  projectStatusDistributionDesc: "Distribution of projects by their current status",
  departmentProjectDistribution: "Department Project Distribution",
  departmentProjectDistributionDesc: "Number of projects by department",
  projectCompletionTrend: "Project Completion Trend",
  projectCompletionTrendDesc: "Monthly trend of project starts and completions",
  taskCompletionRate: "Task Completion Rate",
  taskCompletionRateDesc: "Weekly trend of completed tasks vs. total tasks",
  riskTrend: "Risk Trend",
  riskTrendDesc: "Monthly distribution of risks by priority level",
  budgetAllocationVsSpend: "Budget Allocation vs. Spend",
  budgetAllocationVsSpendDesc: "Monthly comparison of allocated budget and actual spend",
  departmentBudgetAllocation: "Department Budget Allocation",
  departmentBudgetAllocationDesc: "Distribution of budget across departments",
  
  // Weekly Update Component
  selected: "Selected",
  selectForUpdate: "Select for Update",
  enterWeeklyUpdate: "Enter weekly update details...",
  weeklyUpdates: "Weekly Updates",
};

// Arabic translations
const ar: Record<string, string> = {
  // App name
  "Project Management System": "نظام إدارة المشاريع",
  // Common
  dashboard: "لوحة التحكم",
  calendar: "التقويم",
  projects: "المشاريع",
  tasks: "المهام",
  goals: "الأهداف",
  risksAndIssues: "المخاطر والمشكلات",
  assignments: "التكليفات",
  approvals: "الموافقات",
  dependencies: "الاعتمادات",
  repository: "المستودع المركزي",
  departments: "الأقسام",
  reports: "التقارير",
  analytics: "التحليلات",
  settings: "الإعدادات",
  
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
  projectsCompleted: "المكتملة",
  atRisk: "في خطر",
  pendingApproval: "في انتظار الموافقة",
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
  
  // Approvals
  pendingApprovals: "الموافقات المعلقة",
  approve: "موافقة",
  reject: "رفض",
  budgetIncreaseRequest: "طلب زيادة الميزانية",
  timelineExtension: "تمديد الجدول الزمني",
  projectClosure: "إغلاق المشروع",
  
  // Statuses
  pending: "معلق",
  planning: "التخطيط",
  inProgress: "قيد التنفيذ",
  onHold: "متوقف",
  statusCompleted: "مكتمل",
  
  // Project details
  editCost: "تعديل التكلفة",
  details: "التفاصيل",
  overview: "نظرة عامة",
  weeklyUpdates: "التحديثات الأسبوعية",
  changeRequests: "طلبات التغيير",
  logs: "السجلات",
  comments: "التعليقات",
  
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
  deadline: "الموعد النهائي",
  startDate: "تاريخ البدء",
  
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
  weeklyUpdates: "التحديثات الأسبوعية",
};

const translations: Translations = {
  en,
  ar,
};

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

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

  const t = (key: string): string => {
    if (!translations[language]) {
      return key; // Fallback to key if language not found
    }
    
    if (!translations[language][key]) {
      // If key not found in current language, check English
      if (language !== 'en' && translations['en'] && translations['en'][key]) {
        return translations['en'][key];
      }
      return key; // Fallback to key if translation not found
    }
    
    return translations[language][key];
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
