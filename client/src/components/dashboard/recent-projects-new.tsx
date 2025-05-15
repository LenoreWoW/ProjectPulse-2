import { useI18n } from "@/hooks/use-i18n";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@shared/schema";
import { Link } from "wouter";
import { 
  Shield, 
  FlaskConical, 
  Server, 
  Briefcase,
  Clock,
  ArrowRight,
  Folder,
  Building
} from "lucide-react";

interface RecentProjectsProps {
  className?: string;
}

export function RecentProjects({ className = "" }: RecentProjectsProps) {
  const { t, isRtl } = useI18n();
  
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Get appropriate icon for department
  const getDepartmentIcon = (departmentName?: string) => {
    switch (departmentName?.toLowerCase()) {
      case 'security':
        return <Shield className="h-5 w-5" />;
      case 'technology':
        return <Server className="h-5 w-5" />;
      case 'operations':
        return <FlaskConical className="h-5 w-5" />;
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };
  
  // Get color classes based on status
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'InProgress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'OnHold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Planning':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Pending':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };
  
  // Format status text
  const formatStatus = (status: string) => {
    switch (status) {
      case 'InProgress':
        return t("inProgress");
      case 'OnHold':
        return t("onHold");
      case 'Completed':
        return t("completed");
      case 'Planning':
        return t("planning");
      case 'Pending':
        return t("pending");
      default:
        return status;
    }
  };
  
  // Get days until deadline
  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    
    // Reset both dates to just the date part, no time
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${t("daysOverdue")}`;
    } else if (diffDays === 0) {
      return t("dueToday");
    } else if (diffDays === 1) {
      return t("dueTomorrow");
    } else {
      return `${diffDays} ${t("daysLeft")}`;
    }
  };
  
  // Get project icon based on type
  const getProjectIcon = (project: Project) => {
    switch (project.type?.toLowerCase()) {
      case 'security':
        return <Shield className="h-5 w-5" />;
      case 'infrastructure':
        return <Server className="h-5 w-5" />;
      case 'research':
        return <FlaskConical className="h-5 w-5" />;
      default:
        return <Briefcase className="h-5 w-5" />;
    }
  };
  
  // Calculate progress percentage
  const getProgress = (project: Project) => {
    if (!project.totalTasks || project.totalTasks === 0) return 0;
    return Math.round((project.completedTasks || 0) / project.totalTasks * 100);
  };
  
  if (isLoading) {
    return (
      <div className={`lg:col-span-2 bg-white dark:bg-gray-900 shadow-md rounded-xl border ${className || 'border-gray-100 dark:border-gray-800'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-lg mr-3" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !projects) {
    return (
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl border-l-4 border-red-500 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Briefcase className="h-5 w-5 text-red-500 mr-2" />
            {t("recentProjects")}
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center text-red-500 mb-2">
            <p className="font-medium">{t("somethingWentWrong")}</p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error?.message || t("tryAgain")}</p>
        </div>
      </div>
    );
  }
  
  // Sort projects by most recent updated date and take most recent 3
  const recentProjects = [...projects]
    .sort((a, b) => {
      if (!a.updatedAt || !b.updatedAt) return 0;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 3);
  
  return (
    <div className={`lg:col-span-2 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden ${className || 'border border-gray-100 dark:border-gray-800'}`}>
      <div className="px-6 py-4 border-b border-qatar-maroon/20 dark:border-qatar-maroon/10 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-qatar-maroon dark:text-white flex items-center">
          <Briefcase className="h-5 w-5 mr-2" />
          {t("recentProjects")}
        </h2>
        <Link href="/projects">
          <a className="text-sm text-qatar-maroon dark:text-white hover:bg-qatar-maroon/10 py-1 px-3 rounded-md transition-colors flex items-center">
            {t("viewAll")}
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Link>
      </div>
      
      <div className="px-4 py-2">
        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Folder className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t("noProjects")}</p>
            <Link href="/projects/new">
              <a className="mt-4 px-4 py-2 bg-qatar-maroon text-white rounded-lg text-sm hover:bg-qatar-maroon/90 transition-colors">
                {t("createProject")}
              </a>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {recentProjects.map((project) => {
              const progress = getProgress(project);
              return (
                <div key={project.id} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:shadow-md transition-all border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="p-2 bg-qatar-maroon/10 rounded-lg mr-3 text-qatar-maroon dark:text-white">
                        {getProjectIcon(project)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center">
                          {project.title}
                          {project.deadline && (
                            <span className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300">
                              {getDaysUntilDeadline(project.deadline)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <Building className="h-3 w-3 mr-1" />
                          {project.department?.name || t("noDepartment")}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${getStatusClasses(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{t("progress")}</span>
                      <span className="text-gray-700 dark:text-gray-200 font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-qatar-maroon dark:bg-qatar-maroon h-1.5 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}