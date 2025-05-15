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
  departments: "Departments",
  reports: "Reports",
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
  weeklyUpdates: "Weekly Updates",
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
  departments: "الأقسام",
  reports: "التقارير",
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
