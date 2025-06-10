import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/hooks/use-i18n-new";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Clock,
  Building, 
  Briefcase, 
  Shield,
  Server,
  FlaskConical,
  ExternalLink,
  TrendingUp,
  Zap,
  Target
} from "lucide-react";
import { Project } from "@shared/schema";
import { useProjectColorBasic } from "@/hooks/use-project-color";
import { FavoriteButton } from "@/components/projects/favorite-button";

// Extended Project interface with additional properties
interface ExtendedProject extends Project {
  department?: { name: string };
  totalTasks?: number;
  completedTasks?: number;
}

interface RecentProjectsProps {
  className?: string;
}

export function RecentProjects({ className = "" }: RecentProjectsProps) {
  const { t, isRtl } = useI18n();
  
  const { data: projects, isLoading, error } = useQuery<ExtendedProject[]>({
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
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
  
  // Get project icon based on status or type
  const getProjectIcon = (project: ExtendedProject) => {
    switch (project.status) {
      case 'Completed':
        return <Target className="h-5 w-5" />;
      case 'InProgress':
        return <TrendingUp className="h-5 w-5" />;
      case 'Planning':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };
  
  // Format days until deadline
  const getDaysUntilDeadline = (endDate: string | Date) => {
    const today = new Date();
    const deadline = new Date(endDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return t("overdue", { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t("dueToday");
    } else if (diffDays === 1) {
      return t("dueTomorrow");
    } else {
      return t("daysRemaining", { days: diffDays });
    }
  };
  
  // Calculate progress percentage based on milestone completion
  const getProgress = (project: any) => {
    // Use milestone-based completion percentage if available
    if (project.completionPercentage !== null && project.completionPercentage !== undefined) {
      return project.completionPercentage;
    }
    
    // Fallback: if no milestone data, use task-based calculation if available
    if (project.totalTasks && project.totalTasks > 0) {
      return Math.round((project.completedTasks || 0) / project.totalTasks * 100);
    }
    
    return 0;
  };
  
  // Get recent projects (limit to 6)
  const recentProjects = projects?.slice(0, 6) || [];

  // Project card component with new color system
  const ProjectCard = ({ project }: { project: ExtendedProject }) => {
    const colorConfig = useProjectColorBasic(project);
    
    return (
      <div className={`p-4 border-l-4 ${colorConfig.borderClass} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`p-2 ${colorConfig.lightBgClass} rounded-lg mr-3 ${colorConfig.textClass}`}>
              {getProjectIcon(project)}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white flex items-center">
                {project.title}
                {project.endDate && (
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300">
                    {getDaysUntilDeadline(project.endDate)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                <Building className="h-3 w-3 mr-1" />
                {project.department?.name || t("noDepartment")}
              </div>
            </div>
          </div>
          <Badge className={colorConfig.badgeClass}>
            {formatStatus(project.status || '')}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {project.description ? 
              (project.description.length > 60 ? 
                `${project.description.substring(0, 60)}...` : 
                project.description
              ) : 
              t("noDescription")
            }
          </span>
          <div className="flex items-center gap-1">
            <FavoriteButton projectId={project.id} variant="ghost" size="sm" />
            <Link href={`/projects/${project.id}`}>
              <ExternalLink className="h-4 w-4 text-gray-400 hover:text-qatar-maroon transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Briefcase className="h-5 w-5" />
            {t("error")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{t("failedToLoadProjects")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-qatar-maroon" />
            {t("recentProjects")}
          </div>
          <Link href="/projects">
            <span className="text-sm text-qatar-maroon hover:underline cursor-pointer">
              {t("viewAll")}
            </span>
          </Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("noProjects")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}