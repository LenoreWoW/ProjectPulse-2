import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { t } = useI18n();
  
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
    const atRiskProjects = projects.filter(p => 
      p.status === "InProgress" && 
      new Date(p.deadline) <= new Date()
    ).length;
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
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard")}</h1>
        <Link href="/projects/new">
          <Button className="bg-maroon-700 hover:bg-maroon-800">
            <Plus className="mr-2 h-4 w-4" />
            <span>{t("newProject")}</span>
          </Button>
        </Link>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title={t("activeProjects")}
          value={metrics.activeProjects}
          icon={<LayoutList className="h-8 w-8" />}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconTextColor="text-blue-600 dark:text-blue-300"
        />
        <StatCard
          title={t("completed")}
          value={metrics.completedProjects}
          icon={<CheckSquare className="h-8 w-8" />}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconTextColor="text-green-600 dark:text-green-300"
        />
        <StatCard
          title={t("atRisk")}
          value={metrics.atRiskProjects}
          icon={<AlertTriangle className="h-8 w-8" />}
          iconBgColor="bg-red-100 dark:bg-red-900/30"
          iconTextColor="text-red-600 dark:text-red-300"
        />
        <StatCard
          title={t("pendingApproval")}
          value={metrics.pendingApproval}
          icon={<Clock className="h-8 w-8" />}
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconTextColor="text-orange-600 dark:text-orange-300"
        />
      </div>
      
      {/* Budget Overview */}
      <BudgetOverview />
      
      {/* Projects and Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentProjects />
        <PendingApprovals />
      </div>
    </>
  );
}
