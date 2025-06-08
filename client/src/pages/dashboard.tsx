import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PermissionGate, usePermissions } from "@/hooks/use-permissions";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { WeeklyUpdateReminder } from "@/components/dashboard/weekly-update-reminder";
import { FavoriteProjects } from "@/components/dashboard/favorite-projects";
import { Button } from "@/components/ui/button";
import { Project, Department } from "@/lib/schema-types";
import { 
  LayoutList,
  CheckSquare,
  AlertTriangle,
  Clock,
  PauseCircle,
  Factory,
  ArrowUpCircle,
  Plus,
  Search,
  Bell,
  ChevronRight,
  BarChart3,
  CalendarClock,
  Users2,
  Briefcase,
  FileText,
  CalendarX,
  Building2,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const userName = user?.name || t("user");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  
  const {
    data: projects,
    isLoading: isLoadingProjects
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const {
    data: departments,
    isLoading: isLoadingDepartments
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Calculate departments with overdue projects for prioritization
  const departmentOverdueInfo = useMemo(() => {
    if (!projects || !departments) return new Map();
    
    const deptOverdueMap = new Map<number, {
      department: Department;
      overdueCount: number;
      totalProjects: number;
    }>();
    
    departments.forEach(dept => {
      const deptProjects = projects.filter(p => p.departmentId === dept.id);
      const overdueProjects = deptProjects.filter(p => {
        if (p.status === "Completed" || !p.deadline) return false;
        const deadlineDate = new Date(p.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate < today;
      });
      
      deptOverdueMap.set(dept.id, {
        department: dept,
        overdueCount: overdueProjects.length,
        totalProjects: deptProjects.length
      });
    });
    
    return deptOverdueMap;
  }, [projects, departments]);

  // Sort departments prioritizing those with overdue projects
  const sortedDepartments = useMemo(() => {
    if (!departments) return [];
    
    return [...departments].sort((a, b) => {
      const aInfo = departmentOverdueInfo.get(a.id);
      const bInfo = departmentOverdueInfo.get(b.id);
      
      // First sort by overdue count (descending)
      const aOverdue = aInfo?.overdueCount || 0;
      const bOverdue = bInfo?.overdueCount || 0;
      
      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue;
      }
      
      // Then by total projects (descending)
      const aTotal = aInfo?.totalProjects || 0;
      const bTotal = bInfo?.totalProjects || 0;
      
      if (aTotal !== bTotal) {
        return bTotal - aTotal;
      }
      
      // Finally by name alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [departments, departmentOverdueInfo]);

  // Filter projects based on selected department
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (selectedDepartment === "all") return projects;
    
    const departmentId = parseInt(selectedDepartment);
    return projects.filter(p => p.departmentId === departmentId);
  }, [projects, selectedDepartment]);

  // Calculate dashboard metrics
  const getMetrics = () => {
    if (!filteredProjects) return {
      activeProjects: [],
      completedProjects: [],
      planningProjects: [],
      onHoldProjects: [],
      pendingProjects: [],
      atRiskProjects: [],
      overdueProjects: [],
      allProjects: []
    };
    
    const activeProjects = filteredProjects.filter(p => p.status === "InProgress");
    const completedProjects = filteredProjects.filter(p => p.status === "Completed");
    const planningProjects = filteredProjects.filter(p => p.status === "Planning");
    const onHoldProjects = filteredProjects.filter(p => p.status === "OnHold");
    const pendingProjects = filteredProjects.filter(p => p.status === "Pending");
    
    // Calculate at risk projects - consider any InProgress project with passed deadline
    const atRiskProjects = filteredProjects.filter(p => {
      if (p.status !== "InProgress" || !p.deadline) return false;
      const deadlineDate = new Date(p.deadline);
      return deadlineDate <= new Date();
    });
    
    // Calculate overdue projects - any project (except completed) with passed deadline
    const overdueProjects = filteredProjects.filter(p => {
      if (p.status === "Completed" || !p.deadline) return false;
      const deadlineDate = new Date(p.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    });
    
    return {
      activeProjects,
      completedProjects,
      planningProjects,
      onHoldProjects,
      pendingProjects,
      atRiskProjects,
      overdueProjects,
      allProjects: filteredProjects
    };
  };
  
  const metrics = getMetrics();

  // Get department name for display
  const getSelectedDepartmentName = () => {
    if (selectedDepartment === "all") return t("allDepartments");
    const dept = departments?.find(d => d.id.toString() === selectedDepartment);
    return dept?.name || t("unknownDepartment");
  };
  
  return (
    <div className="space-y-8">
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-br from-qatar-maroon to-[#741230] dark:from-qatar-maroon/90 dark:to-[#501020] rounded-2xl p-8 shadow-lg text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:var(--grid-size)_var(--grid-size)] [mask-image:radial-gradient(white,transparent_85%)]" style={{"--grid-size": "30px"} as React.CSSProperties}></div>
        
        {/* Top Bar with Search, Department Filter and Actions */}
        <div className="flex flex-wrap justify-between items-center mb-8 relative z-10">
          <div className="flex flex-wrap items-center space-x-4 space-y-2 sm:space-y-0 w-full lg:w-2/3">
            <div className="relative max-w-md w-full lg:w-1/2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <input
                type="text"
                placeholder={t("searchProjects")}
                className="bg-white/10 border-0 text-white placeholder:text-white/60 rounded-lg py-2 pl-10 pr-4 w-full focus:ring-2 focus:ring-white/30 focus:outline-none"
              />
            </div>
            
            {/* Department Filter */}
            <div className="relative min-w-[200px]">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="bg-white/10 border-0 text-white placeholder:text-white/60 rounded-lg focus:ring-2 focus:ring-white/30 hover:bg-white/20 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-white/80" />
                    <SelectValue placeholder={t("selectDepartment")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>{t("allDepartments")}</span>
                    </div>
                  </SelectItem>
                  {sortedDepartments.map((dept) => {
                    const deptInfo = departmentOverdueInfo.get(dept.id);
                    const hasOverdue = deptInfo && deptInfo.overdueCount > 0;
                    
                    return (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{dept.name}</span>
                          </div>
                          {hasOverdue && (
                            <div className="flex items-center space-x-1 ml-2">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600 font-medium">
                                {deptInfo.overdueCount} {t("overdue")}
                              </span>
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 h-10 w-10">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Welcome Message */}
        <div className="mb-8 relative z-10">
          <h1 className="text-3xl font-bold tracking-tight hero-text text-contrast dark:text-white">{t("welcomeMessage", { name: userName })}</h1>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <p className="text-white/90 max-w-2xl hero-text">{t("dashboardIntro")}</p>
            {selectedDepartment !== "all" && (
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className="text-white/70 text-sm">•</span>
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">{t("showingFor")}: {getSelectedDepartmentName()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stat Cards in Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 relative z-10">
          <StatusCard
            icon={<LayoutList className="h-5 w-5" />}
            title={t("allProjects")}
            count={metrics.allProjects.length}
            status="all"
            projects={metrics.allProjects}
          />
          
          <StatusCard
            icon={<LayoutList className="h-5 w-5" />}
            title={t("activeProjects")}
            count={metrics.activeProjects.length}
            status="InProgress"
            projects={metrics.activeProjects}
            color="green"
          />
          
          <StatusCard
            icon={<CheckSquare className="h-5 w-5" />}
            title={t("completed")}
            count={metrics.completedProjects.length}
            status="Completed"
            projects={metrics.completedProjects}
            color="blue"
          />
          
          <StatusCard
            icon={<Factory className="h-5 w-5" />}
            title={t("planning")}
            count={metrics.planningProjects.length}
            status="Planning"
            projects={metrics.planningProjects}
            color="purple"
          />
          
          <StatusCard
            icon={<PauseCircle className="h-5 w-5" />}
            title={t("onHold")}
            count={metrics.onHoldProjects.length}
            status="OnHold"
            projects={metrics.onHoldProjects}
            color="orange"
          />
          
          <StatusCard
            icon={<Clock className="h-5 w-5" />}
            title={t("pending")}
            count={metrics.pendingProjects.length}
            status="Pending"
            projects={metrics.pendingProjects}
            color="pink"
          />
          
          <StatusCard
            icon={<AlertTriangle className="h-5 w-5" />}
            title={t("overdue")}
            count={metrics.overdueProjects.length}
            status="overdue"
            projects={metrics.overdueProjects}
            color="red"
          />
        </div>
      </div>
      
      {/* Quick Access Section */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-5">
        {/* Projects link is always visible */}
        <Link href="/projects">
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group card-contrast">
            <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
              <Briefcase className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
            </div>
            <span className="text-gray-900 dark:text-white font-bold dashboard-text">{t("projects")}</span>
          </div>
        </Link>
        
        {/* Departments link requires permissions */}
        <PermissionGate permission="canViewAllDepartments">
          <Link href="/departments">
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group card-contrast">
              <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
                <Users2 className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
              </div>
              <span className="text-gray-900 dark:text-white font-bold dashboard-text">{t("departments")}</span>
            </div>
          </Link>
        </PermissionGate>
        
        {/* Calendar link is always visible */}
        <Link href="/calendar">
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group card-contrast">
            <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
              <CalendarClock className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
            </div>
            <span className="text-gray-900 dark:text-white font-bold dashboard-text">{t("calendar")}</span>
          </div>
        </Link>
        
        {/* Reports link requires permissions */}
        <PermissionGate permission="canViewReports">
          <Link href="/reports">
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-maroon-200 dark:hover:border-maroon-700 transition-all group card-contrast">
              <div className="p-3 bg-maroon-50 dark:bg-maroon-900/20 rounded-full mb-3 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/30 transition-colors">
                <BarChart3 className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
              </div>
              <span className="text-gray-900 dark:text-white font-bold dashboard-text">{t("reports")}</span>
            </div>
          </Link>
        </PermissionGate>
      </div>
      
      {/* Budget Overview - Only visible to users with reports permission */}
      <PermissionGate permission="canViewReports">
        <div className="mt-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold dashboard-text flex items-center">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
                <BarChart3 className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
              </div>
              {t("budgetOverview")}
            </h2>
            <Link href="/reports/budget">
              <div className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
              flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
              hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors">
                {t("detailedView")}
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <BudgetOverview />
          </div>
        </div>
      </PermissionGate>
      
      {/* Projects and Favorites */}
      <div className="mt-10 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Projects - Available to all authorized users */}
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold dashboard-text flex items-center">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
                <Briefcase className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
              </div>
              {t("recentProjects")}
            </h2>
            <Link href="/projects">
              <div className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
              flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
              hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors">
                {t("viewAll")}
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <RecentProjects />
          </div>
        </div>
        
        {/* Favorite Projects - Available to all authenticated users */}
        <div>
          <FavoriteProjects className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700" />
        </div>
      </div>
      
      {/* Approvals Section */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Approvals - Only for users who can approve */}
        <PermissionGate permission="canApproveProject">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold dashboard-text flex items-center">
                <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
                  <Clock className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
                </div>
                {t("pendingApprovals")}
              </h2>
              <Link href="/approvals">
                <div className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
                flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
                hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors">
                  {t("viewAll")}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <PendingApprovals />
            </div>
          </div>
        </PermissionGate>
      </div>
      
      {/* Weekly Update Reminders - Only for project managers and above */}
      <PermissionGate permission="canCreateProject">
        <div className="mt-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold dashboard-text flex items-center">
              <div className="p-2 bg-maroon-50 dark:bg-maroon-900/20 rounded-lg mr-3">
                <FileText className="h-6 w-6 text-maroon-700 dark:text-maroon-300" />
              </div>
              {t("weeklyUpdates")}
            </h2>
            <Link href="/projects">
              <div className="text-sm text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 
              flex items-center gap-1 px-3 py-1.5 rounded-full bg-maroon-50 dark:bg-maroon-900/20 
              hover:bg-maroon-100 dark:hover:bg-maroon-900/30 transition-colors">
                {t("viewAll")}
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <WeeklyUpdateReminder />
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}
