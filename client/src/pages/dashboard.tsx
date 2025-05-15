import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";
import { 
  LayoutList,
  CheckSquare,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Bell,
  ChevronRight,
  BarChart3,
  CalendarClock,
  Users2,
  Briefcase
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  
  const {
    data: projects,
    isLoading: isLoadingProjects
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Calculate dashboard metrics
  const getMetrics = () => {
    if (!projects) return {
      activeProjects: 0,
      completedProjects: 0,
      atRiskProjects: 0,
      pendingApproval: 0
    };
    
    const activeProjects = projects.filter(p => p.status === "InProgress").length;
    const completedProjects = projects.filter(p => p.status === "Completed").length;
    const atRiskProjects = projects.filter(p => {
      if (p.status !== "InProgress" || !p.deadline) return false;
      const deadlineDate = new Date(p.deadline);
      return deadlineDate <= new Date();
    }).length;
    const pendingApproval = projects.filter(p => p.status === "Pending").length;
    
    return {
      activeProjects,
      completedProjects,
      atRiskProjects,
      pendingApproval
    };
  };
  
  const metrics = getMetrics();
  
  return (
    <div className="space-y-8">
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-br from-qatar-maroon to-[#741230] dark:from-qatar-maroon/90 dark:to-[#501020] rounded-2xl p-8 shadow-lg text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:var(--grid-size)_var(--grid-size)] [mask-image:radial-gradient(white,transparent_85%)]" style={{"--grid-size": "30px"} as React.CSSProperties}></div>
        
        {/* Top Bar with Search and Actions */}
        <div className="flex flex-wrap justify-between items-center mb-8 relative z-10">
          <div className="relative max-w-md w-full lg:w-1/3 mb-4 lg:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/60" />
            </div>
            <input
              type="text"
              placeholder={t("searchProjects")}
              className="bg-white/10 border-0 text-white placeholder:text-white/60 rounded-lg py-2 pl-10 pr-4 w-full focus:ring-2 focus:ring-white/30 focus:outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 h-10 w-10">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Welcome Message */}
        <div className="mb-8 relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">{t("welcomeBack")}, {user?.name}!</h1>
          <p className="mt-2 text-white/80 max-w-2xl">{t("dashboardIntro")}</p>
        </div>
        
        {/* Stat Cards in Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="bg-white/10 backdrop-filter backdrop-blur-sm rounded-xl p-5 flex flex-col transition-all hover:bg-white/15 group">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white/20 rounded-lg text-white mr-3">
                <LayoutList className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/70">{t("activeProjects")}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{metrics.activeProjects}</span>
              <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                <Link href="/projects?status=InProgress" className="flex items-center">
                  {t("viewAll")}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-filter backdrop-blur-sm rounded-xl p-5 flex flex-col transition-all hover:bg-white/15 group">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white/20 rounded-lg text-white mr-3">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/70">{t("completed")}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{metrics.completedProjects}</span>
              <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                <Link href="/projects?status=Completed" className="flex items-center">
                  {t("viewAll")}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-filter backdrop-blur-sm rounded-xl p-5 flex flex-col transition-all hover:bg-white/15 group">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white/20 rounded-lg text-white mr-3">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/70">{t("atRisk")}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{metrics.atRiskProjects}</span>
              <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                <Link href="/projects?risk=high" className="flex items-center">
                  {t("viewAll")}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-filter backdrop-blur-sm rounded-xl p-5 flex flex-col transition-all hover:bg-white/15 group">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white/20 rounded-lg text-white mr-3">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/70">{t("pendingApproval")}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold">{metrics.pendingApproval}</span>
              <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                <Link href="/projects?status=Pending" className="flex items-center">
                  {t("viewAll")}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Access Section */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-5">
        <Link href="/projects" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group">
          <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
            <Briefcase className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold">{t("projects")}</span>
        </Link>
        <Link href="/departments" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group">
          <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
            <Users2 className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold">{t("departments")}</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group">
          <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
            <CalendarClock className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold">{t("calendar")}</span>
        </Link>
        <Link href="/reports" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group">
          <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
            <BarChart3 className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
          </div>
          <span className="text-gray-900 dark:text-white font-bold">{t("reports")}</span>
        </Link>
      </div>
      
      {/* Budget Overview */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
              <BarChart3 className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
            </div>
            {t("budgetOverview")}
          </h2>
          <Link href="/reports/budget" 
            className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
            flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
            hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors"
          >
            {t("detailedView")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <BudgetOverview />
        </div>
      </div>
      
      {/* Projects and Approvals */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
                <Briefcase className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
              </div>
              {t("recentProjects")}
            </h2>
            <Link href="/projects" 
              className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
              flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
              hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors"
            >
              {t("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <RecentProjects />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
                <Clock className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
              </div>
              {t("pendingApprovals")}
            </h2>
            <Link href="/approvals" 
              className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
              flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
              hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors"
            >
              {t("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <PendingApprovals />
          </div>
        </div>
      </div>
    </div>
  );
}
