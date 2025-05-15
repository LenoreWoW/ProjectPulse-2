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
  Clock
} from "lucide-react";

export function RecentProjects() {
  const { t, isRtl } = useI18n();
  
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  // Get appropriate icon for department
  const getDepartmentIcon = (departmentName?: string) => {
    switch (departmentName?.toLowerCase()) {
      case 'security':
        return <Shield className="h-6 w-6" />;
      case 'technology':
        return <Server className="h-6 w-6" />;
      case 'operations':
        return <FlaskConical className="h-6 w-6" />;
      default:
        return <Briefcase className="h-6 w-6" />;
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
        return t('onTrack');
      case 'OnHold':
        return t('onHold');
      case 'Completed':
        return t('completed');
      case 'Planning':
        return t('planning');
      case 'Pending':
        return t('reviewNeeded');
      default:
        return status;
    }
  };
  
  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline?: string | Date) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? `${t('dueIn')} ${diffDays} ${t('days')}` : t('overdue');
  };
  
  // Calculate progress percentage
  const getProgress = (project: Project) => {
    // In a real app, this would come from a calculation of completed tasks
    // For now, just base it on a simple calculation
    let progress = 0;
    
    if (project.status === 'Completed') {
      progress = 100;
    } else if (project.status === 'InProgress') {
      // Simple logic: based on time elapsed between start date and deadline
      const start = new Date(project.startDate).getTime();
      const end = project.deadline ? new Date(project.deadline).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      progress = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    } else if (project.status === 'Planning') {
      progress = 20;
    }
    
    return progress;
  };
  
  // Generate project icon based on title
  const getProjectIcon = (project: Project) => {
    if (project.title.includes('Security')) {
      return (
        <div className="flex-shrink-0 h-10 w-10 bg-maroon-100 text-maroon-700 dark:bg-maroon-900/30 dark:text-maroon-300 rounded-lg flex items-center justify-center">
          <Shield className="h-6 w-6" />
        </div>
      );
    }
    
    if (project.title.includes('Logistic')) {
      return (
        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg flex items-center justify-center">
          <FlaskConical className="h-6 w-6" />
        </div>
      );
    }
    
    // Default icon
    return (
      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg flex items-center justify-center">
        <Clock className="h-6 w-6" />
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-darker shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4 flex">
              <Skeleton className="h-10 w-10 rounded-lg mr-4" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !projects) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 shadow rounded-lg border border-red-200 dark:border-red-800">
        <div className="p-6 border-b border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">{t("recentProjects")}</h2>
        </div>
        <div className="p-6">
          <p className="text-red-600 dark:text-red-300">{t("somethingWentWrong")}</p>
          <p className="text-red-500 dark:text-red-400">{error?.message || t("tryAgain")}</p>
        </div>
      </div>
    );
  }
  
  // Sort projects by most recent updated date and take most recent 3
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  
  return (
    <div className="lg:col-span-2 bg-white dark:bg-darker shadow rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("recentProjects")}</h2>
        <Link href="/projects">
          <a className="text-sm text-maroon-700 dark:text-maroon-400 hover:underline">{t("viewAll")}</a>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("project")}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("department")}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("status")}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("progress")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-darker divide-y divide-gray-200 dark:divide-gray-700">
            {recentProjects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {t("noProjects")}
                </td>
              </tr>
            ) : (
              recentProjects.map((project) => {
                const progress = getProgress(project);
                return (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getProjectIcon(project)}
                        <div className={`${isRtl ? 'mr-4' : 'ml-4'}`}>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {getDaysUntilDeadline(project.deadline)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {/* Department name would come from a join with the departments table */}
                        {project.departmentId === 1 ? 'Security' : 
                         project.departmentId === 2 ? 'Operations' : 
                         project.departmentId === 3 ? 'Technology' : 'Other'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(project.status)}`}>
                        {formatStatus(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={`${
                            project.status === 'OnHold' ? 'bg-orange-600' :
                            project.status === 'Pending' ? 'bg-red-600' :
                            'bg-green-600'
                          } h-2.5 rounded-full`} 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1 block">{progress}%</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
