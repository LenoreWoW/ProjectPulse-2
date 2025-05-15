import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useQuery } from "@tanstack/react-query";
import { Assignment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search,
  Calendar,
  Clock,
  User,
  AlertOctagon,
  AlarmCheck,
  CheckCircle,
  UserCheck
} from "lucide-react";

interface AssignmentsData {
  assignedToMe: Assignment[];
  assignedByMe: Assignment[];
}

export default function AssignmentsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("assigned-to-me");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data, isLoading, error } = useQuery<AssignmentsData>({
    queryKey: ["/api/assignments"],
  });
  
  // Apply filters
  const filterAssignments = (assignments: Assignment[] = []) => {
    return assignments.filter((assignment) => {
      // Filter by status
      if (filterStatus && filterStatus !== "all-statuses" && assignment.status !== filterStatus) {
        return false;
      }
      
      // Filter by priority
      if (filterPriority && filterPriority !== "all-priorities" && assignment.priority !== filterPriority) {
        return false;
      }
      
      // Search by title
      if (searchQuery && !assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  const assignedToMeFiltered = data?.assignedToMe ? filterAssignments(data.assignedToMe) : [];
  const assignedByMeFiltered = data?.assignedByMe ? filterAssignments(data.assignedByMe) : [];
  
  // Get completed assignments
  const completedAssignments = [
    ...(assignedToMeFiltered.filter(a => a.status === "Completed") || []),
    ...(assignedByMeFiltered.filter(a => a.status === "Completed") || [])
  ];
  
  // Filter out completed assignments from active tabs
  const activeAssignedToMe = assignedToMeFiltered.filter(a => a.status !== "Completed");
  const activeAssignedByMe = assignedByMeFiltered.filter(a => a.status !== "Completed");
  
  // Format priority badge
  const getPriorityBadge = (priority: string | null) => {
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
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-xs">{t("high")}</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <AlarmCheck className="w-4 h-4 mr-1" />
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
  const getStatusBadge = (status: string | null) => {
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
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "";
    
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString));
  };
  
  // Get days until deadline
  const getDaysUntilDeadline = (deadline?: string | Date | null) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
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
  };
  
  return (
    <>
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("assignments")}</h1>
        <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
          <Plus className="mr-2 h-4 w-4" />
          <span>{t("newAssignment")}</span>
        </Button>
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
                placeholder={t("searchAssignments")}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-1.5 w-full md:w-40">
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
                <SelectItem value="Todo">{t("todo")}</SelectItem>
                <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                <SelectItem value="Review">{t("review")}</SelectItem>
                <SelectItem value="Completed">{t("completed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-1.5 w-full md:w-40">
            <label htmlFor="priority" className="text-sm font-medium leading-none">{t("priority")}</label>
            <Select 
              value={filterPriority} 
              onValueChange={setFilterPriority}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder={t("allPriorities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-priorities">{t("allPriorities")}</SelectItem>
                <SelectItem value="Critical">{t("critical")}</SelectItem>
                <SelectItem value="High">{t("high")}</SelectItem>
                <SelectItem value="Medium">{t("medium")}</SelectItem>
                <SelectItem value="Low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Assignments Content */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="assigned-to-me" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            {t("assignedToMe")}
          </TabsTrigger>
          <TabsTrigger value="assigned-by-me" className="flex items-center">
            <UserCheck className="mr-2 h-4 w-4" />
            {t("assignedByMe")}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            {t("completed")}
          </TabsTrigger>
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
              {activeAssignedToMe.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noAssignmentsToYou")}</p>
                  </CardContent>
                </Card>
              ) : (
                activeAssignedToMe.map((assignment) => (
                  <Card key={assignment.id} className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{assignment.title}</CardTitle>
                        {getPriorityBadge(assignment.priority)}
                      </div>
                      <CardDescription>
                        {t("assignedBy")}: {assignment.assignedByUserId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        {getStatusBadge(assignment.status)}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(assignment.deadline)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3">
                      {assignment.deadline && getDaysUntilDeadline(assignment.deadline)}
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
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAssignedByMe.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noAssignmentsByYou")}</p>
                  </CardContent>
                </Card>
              ) : (
                activeAssignedByMe.map((assignment) => (
                  <Card key={assignment.id} className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{assignment.title}</CardTitle>
                        {getPriorityBadge(assignment.priority)}
                      </div>
                      <CardDescription>
                        {t("assignedTo")}: {assignment.assignedToUserId}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        {getStatusBadge(assignment.status)}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(assignment.deadline)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3">
                      {assignment.deadline && getDaysUntilDeadline(assignment.deadline)}
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
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedAssignments.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">{t("noCompletedAssignments")}</p>
                  </CardContent>
                </Card>
              ) : (
                completedAssignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:border-maroon-300 dark:hover:border-maroon-700 transition-all cursor-pointer opacity-80">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{assignment.title}</CardTitle>
                        {getPriorityBadge(assignment.priority)}
                      </div>
                      <CardDescription>
                        {assignment.assignedByUserId === user?.id 
                          ? `${t("assignedTo")}: ${assignment.assignedToUserId}`
                          : `${t("assignedBy")}: ${assignment.assignedByUserId}`
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        {getStatusBadge(assignment.status)}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(assignment.deadline)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 text-xs text-gray-500 dark:text-gray-400">
                      {t("completedOn")}: {formatDate(assignment.updatedAt)}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
