import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@/lib/schema-types";
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
import { Plus, Search, Calendar, LayoutList } from "lucide-react";
import { Link } from "wouter";

export default function ProjectsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ["/api/departments"],
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

  // Get color for status badge
  const getStatusClasses = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    
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

  // Format status for display
  const formatStatus = (status: string | null) => {
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

  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("projects")}</h1>
        <PermissionGate permission="canCreateProject">
          <Link href="/projects/new">
            <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "kanban" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("kanban")}
              className={viewMode === "kanban" ? "bg-maroon-700 hover:bg-maroon-800" : ""}
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
                {filteredProjects?.map((project) => {
                  const daysRemaining = getDaysRemaining(project.deadline);
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="w-full hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle>{project.title}</CardTitle>
                          <CardDescription>
                            {departments?.find(d => d.id === project.departmentId)?.name || t("department")} • 
                            {project.deadline ? ` ${t("deadline")}: ${formatDate(project.deadline)}` : ''}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between">
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t("budget")}: {formatBudget(project.budget)} QAR
                              </span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(project.status)}`}>
                              {formatStatus(project.status)}
                            </span>
                          </div>
                          {project.description && (
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          {daysRemaining !== null && (
                            <div className="mt-4">
                              <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {isOverdue 
                                  ? `${Math.abs(daysRemaining)} ${t('daysOverdue')}` 
                                  : `${daysRemaining} ${t('daysRemaining')}`}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
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
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <Card className="h-full hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer">
                            <CardHeader className="pb-2">
                              <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                              <CardDescription>
                                {departments?.find(d => d.id === project.departmentId)?.name || t("department")}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {project.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-auto">
                                <span className="text-sm font-medium">
                                  {project.budget ? `${new Intl.NumberFormat('en-QA', { maximumFractionDigits: 0 }).format(project.budget)} QAR` : ''}
                                </span>
                                {project.deadline && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(project.deadline)}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
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
