import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/hooks/use-i18n-new';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  ExternalLink, 
  Calendar, 
  Building, 
  Users,
  Star
} from 'lucide-react';
import { useProjectColorBasic } from '@/hooks/use-project-color';
import { Project } from '@shared/schema';

interface FavoriteProjectsProps {
  className?: string;
}

interface FavoriteProjectData {
  id: number;
  userId: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  project: Project;
}

export function FavoriteProjects({ className = "" }: FavoriteProjectsProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  
  const { data: favoriteProjects, isLoading, error } = useQuery<FavoriteProjectData[]>({
    queryKey: [`/api/users/${user?.id}/favorite-projects`],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const ProjectCard = ({ favoriteData }: { favoriteData: FavoriteProjectData }) => {
    const { project } = favoriteData;
    const colorConfig = useProjectColorBasic(project);
    
    const formatDate = (dateString: string | Date | null) => {
      if (!dateString) return "-";
      return new Date(dateString).toLocaleDateString();
    };
    
    const getDaysRemaining = (deadline?: string | Date | null) => {
      if (!deadline) return null;
      
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    };
    
    const daysRemaining = getDaysRemaining(project.deadline);
    
    return (
      <div className={`p-4 border-l-4 ${colorConfig.borderClass} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-r-lg`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                {project.title}
              </h3>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{project.departmentId === 1 ? 'Security' : 
                      project.departmentId === 2 ? 'Operations' : 
                      project.departmentId === 3 ? 'Technology' : 'Other'}</span>
              </div>
              {project.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.deadline)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={colorConfig.badgeClass}>
              {project.status === 'InProgress' ? t('inProgress') :
               project.status === 'Completed' ? t('completed') :
               project.status === 'OnHold' ? t('onHold') :
               project.status === 'Planning' ? t('planning') :
               project.status === 'Pending' ? t('pending') :
               project.status || t('unknown')}
            </Badge>
            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
        
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
            {project.description}
          </p>
        )}
        
        {daysRemaining !== null && (
          <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
            daysRemaining < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
            daysRemaining <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
            'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
          }`}>
            <Calendar className="h-3 w-3" />
            <span>
              {daysRemaining < 0 
                ? t("overdueDays", { days: Math.abs(daysRemaining) })
                : daysRemaining === 0 
                  ? t("dueToday")
                  : t("daysRemaining", { days: daysRemaining })
              }
            </span>
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Heart className="h-5 w-5" />
            {t("error")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{t("failedToLoadFavorites")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {t("favoriteProjects")}
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !favoriteProjects || favoriteProjects.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">{t("noFavoriteProjects")}</p>
            <p className="text-sm">{t("favoriteProjectsToSeeThemHere")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {favoriteProjects.slice(0, 5).map((favorite) => (
              <ProjectCard key={favorite.id} favoriteData={favorite} />
            ))}
            {favoriteProjects.length > 5 && (
              <div className="p-4 text-center">
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    {t("viewAllFavorites", { count: favoriteProjects.length - 5 })}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 