import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Project, Department } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Users,
  ChevronRight,
  AlertTriangle,
  Clock,
  LayoutList
} from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProjectColorBasic } from "@/hooks/use-project-color";
import { FavoriteButton } from "@/components/projects/favorite-button";

export default function ProjectsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch users to get project manager names
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  // Use permissions hook for role-based permissions
  const permissions = usePermissions();

  // Apply filters
  const filteredProjects = projects?.filter((project) => {
    // Filter by status
    if (filterStatus && filterStatus !== "all-statuses" && project.status !== filterStatus) {
      return false;
    }
    
    // Filter by department
    if (filterDepartment && filterDepartment !== "all-departments" && project.departmentId !== parseInt(filterDepartment)) {
      return false;
    }
    
    // Search by title
    if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Helper function to get user name
  const getUserName = (userId: number | null) => {
    if (!userId || !users) return t("noManager");
    const user = users.find(u => u.id === userId);
    return user ? user.name : t("noManager");
  };

  // Get color for status badge
  const getStatusClasses = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    
    switch (status) {
      case 'InProgress':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'OnHold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'Planning':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'Pending':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Format status for display
  const formatStatus = (status: string | null | undefined) => {
    if (!status) return "";
    
    switch (status) {
      case 'InProgress':
        return t('inProgress');
      case 'OnHold':
        return t('onHold');
      case 'Completed':
        return t('completed');
      case 'Planning':
        return t('planning');
      case 'Pending':
        return t('pending');
      default:
        return status;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate days until deadline
  const getDaysRemaining = (deadline?: string | Date | null) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Format budget value
  const formatBudget = (budget: number | null) => {
    if (!budget && budget !== 0) return "0";
    return new Intl.NumberFormat('en-QA', { maximumFractionDigits: 0 }).format(budget);
  };

  // Calculate project progress based on milestone completion
  const calculateProgress = (project: any) => {
    // Use milestone-based completion percentage if available
    if (project.completionPercentage !== null && project.completionPercentage !== undefined) {
      return project.completionPercentage;
    }
    
    // Fallback based on project status for projects without milestones/tasks
    switch (project.status) {
      case 'Completed':
        return 100;
      case 'InProgress':
        return 50;
      case 'Planning':
      case 'Proposed':
        return 10;
      case 'OnHold':
        return 25;
      case 'Cancelled':
        return 0;
      default:
        return 0;
    }
  };

  // ProjectCard component with color system
  const ProjectCard = ({ project }: { project: Project }) => {
    const colorConfig = useProjectColorBasic(project);
    const progress = calculateProgress(project);
    const daysRemaining = getDaysRemaining(project.deadline);
    
    return (
      <Card className={`h-full transition-all duration-200 hover:shadow-lg border-l-4 ${colorConfig.borderClass}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg font-semibold line-clamp-2 flex-1 mr-2">
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <FavoriteButton projectId={project.id} variant="ghost" size="sm" />
              <Badge className={colorConfig.badgeClass}>
                {formatStatus(project.status)}
              </Badge>
            </div>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || t("noDescription")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Project metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{departments?.find(d => d.id === project.departmentId)?.name || t("department")}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {project.deadline ? formatDate(project.deadline) : "-"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("progress")}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Deadline warning */}
          {daysRemaining !== null && (
            <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${
              daysRemaining < 0 ? 'bg-red-50 text-red-700' :
              daysRemaining <= 7 ? 'bg-amber-50 text-amber-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {daysRemaining < 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
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

          {/* Project details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{t("manager")}:</span>
              <span>{getUserName(project.managerUserId)}</span>
            </div>
            
            {project.budget && (
              <div className="flex justify-between">
                <span>{t("budget")}:</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {project.budget.toLocaleString()} QAR
                </span>
              </div>
            )}
            
            {project.priority && (
              <div className="flex justify-between">
                <span>{t("priority")}:</span>
                <Badge variant="outline" size="sm">
                  {project.priority}
                </Badge>
              </div>
            )}
          </div>

          {/* Action button */}
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" className="w-full">
              {t("viewDetails")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-contrast dark:text-white">{t("projects")}</h1>
        <PermissionGate permission="canCreateProject">
          <Link href="/projects/new">
            <Button 
              className="text-white font-medium"
              style={{ backgroundColor: '#8a1538' }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#7c1b38'}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#8a1538'}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>{t("newProject")}</span>
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="grid gap-1.5 flex-1">
            <label htmlFor="search" className="text-sm font-medium leading-none">{t("search")}</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="search"
                type="search"
                placeholder={t("searchProjects")}
                className="pl-8"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-1.5 w-full md:w-48">
            <label htmlFor="status" className="text-sm font-medium leading-none">{t("status")}</label>
            <Select 
              value={filterStatus} 
              onValueChange={setFilterStatus}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-statuses">{t("allStatuses")}</SelectItem>
                <SelectItem value="Pending">{t("pending")}</SelectItem>
                <SelectItem value="Planning">{t("planning")}</SelectItem>
                <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                <SelectItem value="OnHold">{t("onHold")}</SelectItem>
                <SelectItem value="Completed">{t("completed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-1.5 w-full md:w-48">
            <label htmlFor="department" className="text-sm font-medium leading-none">{t("department")}</label>
            <Select 
              value={filterDepartment} 
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder={t("allDepartments")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-departments">{t("allDepartments")}</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-maroon-700 hover:bg-maroon-800" : ""}
              title={t("listView")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            
            <Button 
              variant={viewMode === "kanban" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("kanban")}
              className={viewMode === "kanban" ? "bg-maroon-700 hover:bg-maroon-800" : ""}
              title={t("kanbanView")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="mt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300">{t("error")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-300">{t("somethingWentWrong")}</p>
            <p className="text-red-500 dark:text-red-400">{(error as Error).message || t("tryAgain")}</p>
          </CardContent>
        </Card>
      ) : (
        viewMode === "list" ? (
          <>
            {filteredProjects?.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t("noProjects")}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t("noProjectsMatch")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredProjects?.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Tabs defaultValue="InProgress" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="InProgress">{t("inProgress")}</TabsTrigger>
                <TabsTrigger value="Planning">{t("planning")}</TabsTrigger>
                <TabsTrigger value="OnHold">{t("onHold")}</TabsTrigger>
                <TabsTrigger value="Pending">{t("pending")}</TabsTrigger>
                <TabsTrigger value="Completed">{t("completed")}</TabsTrigger>
              </TabsList>
              
              {(["InProgress", "Planning", "OnHold", "Pending", "Completed"] as const).map((status) => (
                <TabsContent key={status} value={status} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProjects?.filter(p => p.status === status).length === 0 ? (
                      <div className="text-center p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg md:col-span-2 lg:col-span-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t("noProjects")}</h3>
                        <p className="text-gray-500 dark:text-gray-400">{t("noProjectsInStatus")}</p>
                      </div>
                    ) : (
                      filteredProjects?.filter(p => p.status === status).map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )
      )}
    </>
  );
}
