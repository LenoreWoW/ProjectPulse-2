import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Task } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import TaskDetailDialog from "@/components/tasks/task-detail-dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  AlertOctagon,
  Clock,
  CheckCircle,
  User,
  Calendar,
  LayoutGrid,
  List
} from "lucide-react";
import { PermissionGate } from "@/hooks/use-permissions";

// API response type where dates are strings (serialized)
interface ApiTask extends Omit<Task, 'deadline' | 'createdAt' | 'updatedAt'> {
  deadline?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

interface TasksData {
  assignedToMe: ApiTask[];
  assignedByMe: ApiTask[];
}

export default function TasksPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("assigned-to-me");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery<TasksData>({
    queryKey: ["/api/tasks"],
  });
  
  // Handle task click
  const handleTaskClick = (taskId: number) => {
    setSelectedTaskId(taskId);
    setIsTaskDialogOpen(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
  };
  
  // Format priority badge
  const getPriorityBadge = (priority: string | null | undefined) => {
    if (!priority) return null;
    switch (priority) {
      case 'Critical':
        return (
          <div className="flex items-center text-red-700 dark:text-red-400">
            <AlertOctagon className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("critical")}</span>
          </div>
        );
      case 'High':
        return (
          <div className="flex items-center text-orange-600 dark:text-orange-400">
            <AlertOctagon className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("high")}</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("medium")}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("low")}</span>
          </div>
        );
    }
  };
  
  // Format status badge
  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    switch (status) {
      case 'Todo':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">
            {t("todo")}
          </span>
        );
      case 'InProgress':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
            {t("inProgress")}
          </span>
        );
      case 'Review':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded-full">
            {t("review")}
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
            {t("completed")}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };
  
  // Format date for display
  const formatDate = (dateString?: string | Date | null | undefined) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return "";
    }
  };
  
  // Get days until deadline
  const getDaysUntilDeadline = (deadline?: string | Date | null | undefined) => {
    if (!deadline) return null;
    
    try {
      const deadlineDate = new Date(deadline);
      // Check if the date is valid
      if (isNaN(deadlineDate.getTime())) {
        return null;
      }
      
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return (
          <span className="text-red-600 dark:text-red-400 text-xs font-medium">
            {Math.abs(diffDays)} {t("daysOverdue")}
          </span>
        );
      } else if (diffDays === 0) {
        return (
          <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">
            {t("dueToday")}
          </span>
        );
      } else if (diffDays <= 3) {
        return (
          <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">
            {diffDays} {t("daysLeft")}
          </span>
        );
      } else {
        return (
          <span className="text-gray-600 dark:text-gray-400 text-xs">
            {diffDays} {t("daysLeft")}
          </span>
        );
      }
    } catch (error) {
      console.warn('Invalid deadline format:', deadline);
      return null;
    }
  };
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-contrast dark:text-white">{t("tasks")}</h1>
        <PermissionGate permission="canCreateTask">
          <Link href="/tasks/new">
            <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              <span>{t("newTask")}</span>
            </Button>
          </Link>
        </PermissionGate>
      </div>
      
      {/* Tasks Content */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="assigned-to-me">{t("assignedToMe")}</TabsTrigger>
          <TabsTrigger value="assigned-by-me">{t("assignedByMe")}</TabsTrigger>
          <TabsTrigger value="completed">{t("completed")}</TabsTrigger>
        </TabsList>
        
        {/* Assigned To Me Tab */}
        <TabsContent value="assigned-to-me">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(!data?.assignedToMe || data.assignedToMe.length === 0) ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noTasksAssigned")}</p>
                  </CardContent>
                </Card>
              ) : (
                data.assignedToMe
                  .filter(task => task.status !== "Completed")
                  .map((task) => (
                    <Card 
                      key={task.id} 
                      className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer"
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{task.title}</CardTitle>
                          {getPriorityBadge(task.priority)}
                        </div>
                        <CardDescription>
                          Project ID: {task.projectId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          {getStatusBadge(task.status)}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(task.deadline)}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-3 flex justify-between">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <User className="h-4 w-4 mr-1" />
                          <span className="text-xs">ID: {task.createdByUserId}</span>
                        </div>
                        {task.deadline && getDaysUntilDeadline(task.deadline)}
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Assigned By Me Tab */}
        <TabsContent value="assigned-by-me">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(!data?.assignedByMe || data.assignedByMe.length === 0) ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noTasksCreated")}</p>
                  </CardContent>
                </Card>
              ) : (
                data.assignedByMe
                  .filter(task => task.status !== "Completed")
                  .map((task) => (
                    <Card 
                      key={task.id} 
                      className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer"
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle>{task.title}</CardTitle>
                          {getPriorityBadge(task.priority)}
                        </div>
                        <CardDescription>
                          Project ID: {task.projectId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          {getStatusBadge(task.status)}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(task.deadline)}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t pt-3 flex justify-between">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <User className="h-4 w-4 mr-1" />
                          <span className="text-xs">ID: {task.assignedUserId}</span>
                        </div>
                        {task.deadline && getDaysUntilDeadline(task.deadline)}
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Completed Tab */}
        <TabsContent value="completed">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!data || 
               ((data.assignedToMe?.filter(t => t.status === "Completed").length || 0) +
               (data.assignedByMe?.filter(t => t.status === "Completed").length || 0) === 0) ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noCompletedTasks")}</p>
                  </CardContent>
                </Card>
              ) : (
                [
                  ...(data.assignedToMe?.filter(t => t.status === "Completed") || []),
                  ...(data.assignedByMe?.filter(t => t.status === "Completed") || [])
                ].map((task) => (
                  <Card 
                    key={task.id} 
                    className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer opacity-75"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{task.title}</CardTitle>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <CardDescription>
                        Project ID: {task.projectId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        {getStatusBadge(task.status)}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(task.deadline)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <User className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {task.assignedUserId === task.createdByUserId 
                            ? t("selfAssigned")
                            : user && task.createdByUserId === user.id 
                            ? t("assignedByYou")
                            : t("assignedToYou")
                          }
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t("completed")}
                      </span>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Task Detail Dialog */}
      <TaskDetailDialog
        taskId={selectedTaskId}
        isOpen={isTaskDialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
