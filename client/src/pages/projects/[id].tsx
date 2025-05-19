import { useState } from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CalendarIcon, 
  ClockIcon, 
  FilesIcon, 
  UsersIcon, 
  ListTodoIcon,
  CheckIcon,
  BarChart4Icon,
  AlertCircleIcon,
  HistoryIcon,
  ArrowLeftIcon,
  PencilIcon,
  ClipboardPenIcon,
  PlusCircle,
  X,
  Trello,
  List,
  InfoIcon
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n-new";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions, PermissionGate, ProjectOwnershipGate } from "@/hooks/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Project, Task } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default function ProjectDetailsPage() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const { t } = useI18n();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [requestType, setRequestType] = useState<string>("Status");
  const [requestDescription, setRequestDescription] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [newBudget, setNewBudget] = useState<string>("");
  const [newDeadline, setNewDeadline] = useState<string>("");
  
  // New faculty change request states
  const [facultyChangeType, setFacultyChangeType] = useState<string>("Delegate");
  const [newManagerId, setNewManagerId] = useState<string>("");
  const [teamMemberId, setTeamMemberId] = useState<string>("");
  
  // State for task creation
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  
  // State for task form field validation errors
  const [taskTitleError, setTaskTitleError] = useState('');
  const [taskDescriptionError, setTaskDescriptionError] = useState('');
  const [taskDeadlineError, setTaskDeadlineError] = useState('');
  const [taskPriorityError, setTaskPriorityError] = useState('');
  
  // Tasks Tab
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban'>('list');
  
  const queryClient = useQueryClient();
  
  // Fetch project details
  const { 
    data: project, 
    isLoading: isLoadingProject, 
    error: projectError 
  } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Fetch project department
  const { data: departments } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });
  
  // Fetch project manager info
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch project team members
  const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });
  
  // Fetch project tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId,
  });
  
  // Fetch weekly updates
  const { data: weeklyUpdates, isLoading: isLoadingUpdates } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/weekly-updates`],
    enabled: !!projectId,
  });
  
  // Fetch change requests
  const { data: changeRequests, isLoading: isLoadingChangeRequests } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/change-requests`],
    enabled: !!projectId,
  });
  
  // Fetch risks and issues
  const { data: risksIssues, isLoading: isLoadingRisksIssues } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/risks-issues`],
    enabled: !!projectId,
  });
  
  // Fetch project cost history
  const { data: costHistory, isLoading: isLoadingCostHistory } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/cost-history`],
    enabled: !!projectId,
  });
  
  // Create change request mutation
  const createChangeRequest = useMutation({
    mutationFn: async (changeRequest: any) => {
      const response = await fetch(`/api/projects/${projectId}/change-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changeRequest),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create change request' }));
        if (errorData.errors && errorData.errors.length > 0) {
          // More detailed error message if available
          const errorMessages = errorData.errors.map((err: any) => err.message || err.path).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(errorData.message || 'Failed to create change request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch change requests
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/change-requests`] });
      setIsChangeRequestOpen(false);
      resetChangeRequestForm();
      toast({
        title: t("changeRequestSubmitted"),
        description: t("changeRequestSubmittedDescription"),
      });
    }
  });
  
  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (task: any) => {
      try {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to create task' }));
          if (errorData.errors && errorData.errors.length > 0) {
            // More detailed error message if available
            const errorMessages = errorData.errors.map((err: any) => err.message || err.path).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
          }
          throw new Error(errorData.message || 'Failed to create task');
        }
        
        const createdTask = await response.json();
        
        // Create notification for assignee if one is set
        if (task.assignedUserId) {
          try {
            // Create notification for the assignee
            await fetch('/api/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: task.assignedUserId,
                relatedEntity: 'Task',
                relatedEntityId: createdTask.id,
                message: `You have been assigned a new task: "${task.title}" in project "${project?.title}"`,
              }),
            });
          } catch (error) {
            console.error('Failed to create notification:', error);
            // Don't fail the whole operation if notification creation fails
          }
        }
        
        return createdTask;
      } catch (error) {
        console.error('Error creating task:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      setIsAddTaskOpen(false);
      resetTaskForm();
      toast({
        title: t("taskCreated"),
        description: t("taskCreatedDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message || t("failedToCreateTask"),
        variant: "destructive",
      });
    }
  });
  
  const resetChangeRequestForm = () => {
    setRequestType("Status");
    setRequestDescription("");
    setNewStatus("");
    setNewBudget("");
    setNewDeadline("");
  };
  
  const handleChangeRequestSubmit = () => {
    // Gather validation errors
    const validationErrors = [];
    
    if (!requestType) {
      validationErrors.push(t("requestTypeRequired"));
    }
    
    if (!requestDescription || requestDescription.trim() === '') {
      validationErrors.push(t("descriptionRequired"));
    }
    
    // Validate specific fields based on request type
    if (requestType === "Status" && !newStatus) {
      validationErrors.push(t("newStatusRequired"));
    } else if (requestType === "Budget" && (!newBudget || isNaN(parseFloat(newBudget)))) {
      validationErrors.push(t("validBudgetRequired"));
    } else if (requestType === "Deadline" && !newDeadline) {
      validationErrors.push(t("newDeadlineRequired"));
    } else if (requestType === "Faculty") {
      if (facultyChangeType === "Delegate" && !newManagerId) {
        validationErrors.push(t("newManagerRequired"));
      } else if ((facultyChangeType === "AddMember" || facultyChangeType === "RemoveMember") && !teamMemberId) {
        validationErrors.push(t("teamMemberRequired"));
      }
    }
    
    if (validationErrors.length > 0) {
      toast({
        title: t("validationError"),
        description: validationErrors.join('\n'),
        variant: "destructive",
      });
      return;
    }
    
    const changeRequest: any = {
      type: requestType,
      description: requestDescription.trim(),
    };
    
    // Add specific details based on type
    if (requestType === "Status" && newStatus) {
      changeRequest.newStatus = newStatus;
    } else if (requestType === "Budget" && newBudget) {
      changeRequest.newBudget = parseFloat(newBudget);
    } else if (requestType === "Deadline" && newDeadline) {
      changeRequest.newDeadline = new Date(newDeadline);
    } else if (requestType === "Faculty") {
      changeRequest.facultyChangeType = facultyChangeType;
      
      if (facultyChangeType === "Delegate") {
        changeRequest.newManagerId = parseInt(newManagerId);
      } else if (facultyChangeType === "AddMember" || facultyChangeType === "RemoveMember") {
        changeRequest.teamMemberId = parseInt(teamMemberId);
      }
    }
    
    createChangeRequest.mutate(changeRequest);
  };
  
  // Reset task form
  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskDeadline('');
    setTaskPriority('Medium');
    setTaskAssignee('');
    // Clear any error states
    setTaskTitleError('');
    setTaskDescriptionError('');
    setTaskDeadlineError('');
    setTaskPriorityError('');
  };
  
  const handleTaskSubmit = () => {
    // Initialize validation errors object to track field-specific errors
    const validationErrors: Record<string, string> = {};
    
    // Title validation
    if (!taskTitle || taskTitle.trim() === '') {
      validationErrors.title = t("titleRequired");
    } else if (taskTitle.trim().length < 3) {
      validationErrors.title = t("titleTooShort");
    } else if (taskTitle.trim().length > 100) {
      validationErrors.title = t("titleTooLong");
    }
    
    // Description validation - optional but if provided, validate
    if (taskDescription && taskDescription.trim().length > 500) {
      validationErrors.description = t("descriptionTooLong");
    }
    
    // Deadline validation
    if (taskDeadline) {
      const deadlineDate = new Date(taskDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (deadlineDate < today) {
        validationErrors.deadline = t("deadlineMustBeFuture");
      }
      
      // Check if deadline is more than 1 year in the future
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (deadlineDate > oneYearFromNow) {
        validationErrors.deadline = t("deadlineTooFarInFuture");
      }
    }
    
    // Priority validation
    if (!taskPriority) {
      validationErrors.priority = t("priorityRequired");
    }
    
    // If there are validation errors, display them and stop submission
    if (Object.keys(validationErrors).length > 0) {
      // Find the first field with an error to show in the toast
      const firstErrorField = Object.keys(validationErrors)[0];
      const firstErrorMessage = validationErrors[firstErrorField];
      
      toast({
        title: t("validationError"),
        description: firstErrorMessage,
        variant: "destructive",
      });
      
      // Set field validation states to show error indicators
      // (Note: You would need to add state variables for these if not already present)
      if (validationErrors.title) setTaskTitleError(validationErrors.title);
      if (validationErrors.description) setTaskDescriptionError(validationErrors.description);
      if (validationErrors.deadline) setTaskDeadlineError(validationErrors.deadline);
      if (validationErrors.priority) setTaskPriorityError(validationErrors.priority);
      
      return;
    }
    
    // Clear any previous validation errors
    setTaskTitleError('');
    setTaskDescriptionError('');
    setTaskDeadlineError('');
    setTaskPriorityError('');
    
    const task = {
      title: taskTitle.trim(),
      description: taskDescription ? taskDescription.trim() : "",
      deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
      priority: taskPriority || "Medium",
      assignedUserId: taskAssignee ? parseInt(taskAssignee) : null,
      projectId,
      status: "Todo"
    };
    
    createTask.mutate(task, {
      onSuccess: () => {
        // Reset form after successful submission
        resetTaskForm();
        setIsAddTaskOpen(false);
        toast({
          title: t("taskCreated"),
          description: t("taskCreatedDescription"),
        });
      },
      onError: (error) => {
        toast({
          title: t("error"),
          description: error instanceof Error ? error.message : t("failedToCreateTask"),
          variant: "destructive",
        });
      }
    });
  };
  
  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return format(new Date(date), "PPP");
  };
  
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat('en-QA', { maximumFractionDigits: 0 }).format(amount);
  };
  
  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId || !departments) return "-";
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : "-";
  };
  
  const getUserName = (userId: number | null) => {
    if (!userId || !users) return "-";
    const user = users.find(u => u.id === userId);
    return user ? user.name : "-";
  };
  
  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status) {
      case 'InProgress':
        return "bg-green-100 text-green-800";
      case 'OnHold':
        return "bg-orange-100 text-orange-800";
      case 'Completed':
        return "bg-blue-100 text-blue-800";
      case 'Planning':
        return "bg-purple-100 text-purple-800";
      case 'Pending':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getPriorityBadgeClass = (priority: string | null) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    
    switch (priority) {
      case 'Low':
        return "bg-blue-100 text-blue-800";
      case 'Medium':
        return "bg-green-100 text-green-800";
      case 'High':
        return "bg-orange-100 text-orange-800";
      case 'Critical':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    return Math.floor((completedTasks / tasks.length) * 100);
  };
  
  const removeTeamMember = async (userId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to remove team member");
      }
      
      toast({
        title: t("teamMemberRemoved"),
        description: t("teamMemberRemovedDescription"),
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };
  
  if (isLoadingProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (projectError) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">{t("error")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{t("projectNotFound")}</p>
          <Button className="mt-4" asChild>
            <Link href="/projects">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              {t("backToProjects")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!project) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-700">{t("noData")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600">{t("projectNotFound")}</p>
          <Button className="mt-4" asChild>
            <Link href="/projects">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              {t("backToProjects")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
            <Badge className={getStatusBadgeClass(project.status)}>{t(project.status?.toLowerCase() || "")}</Badge>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {getDepartmentName(project.departmentId)} • {t("managedBy")}: {getUserName(project.managerUserId)}
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Change Request Button */}
          <PermissionGate permission="canSubmitChangeRequest">
            <Dialog open={isChangeRequestOpen} onOpenChange={setIsChangeRequestOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ClipboardPenIcon className="mr-2 h-4 w-4" />
                  {t("requestChange")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("requestProjectChange")}</DialogTitle>
                  <DialogDescription>
                    {t("requestProjectChangeDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="request-type" className="text-right">
                      {t("type")}
                    </Label>
                    <Select 
                      value={requestType} 
                      onValueChange={setRequestType}
                    >
                      <SelectTrigger id="request-type" className="col-span-3">
                        <SelectValue placeholder={t("selectChangeType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Status">{t("statusChange")}</SelectItem>
                        <SelectItem value="Budget">{t("budgetChange")}</SelectItem>
                        <SelectItem value="Deadline">{t("deadlineChange")}</SelectItem>
                        <SelectItem value="Scope">{t("scopeChange")}</SelectItem>
                        <SelectItem value="Faculty">{t("facultyChange")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="request-description" className="text-right">
                      {t("description")}
                    </Label>
                    <Textarea
                      id="request-description"
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      placeholder={t("requestJustification")}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                  
                  {/* Status-specific fields */}
                  {requestType === "Status" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-status" className="text-right">
                        {t("newStatus")}
                      </Label>
                      <Select 
                        value={newStatus} 
                        onValueChange={setNewStatus}
                      >
                        <SelectTrigger id="new-status" className="col-span-3">
                          <SelectValue placeholder={t("selectNewStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">{t("planning")}</SelectItem>
                          <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                          <SelectItem value="OnHold">{t("onHold")}</SelectItem>
                          <SelectItem value="Completed">{t("completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Budget-specific fields */}
                  {requestType === "Budget" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-budget" className="text-right">
                        {t("newBudget")}
                      </Label>
                      <div className="col-span-3 flex items-center">
                        <Input
                          id="new-budget"
                          type="number"
                          value={newBudget}
                          onChange={(e) => setNewBudget(e.target.value)}
                          placeholder={project.budget?.toString() || "0"}
                        />
                        <span className="ml-2">QAR</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Deadline-specific fields */}
                  {requestType === "Deadline" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-deadline" className="text-right">
                        {t("newDeadline")}
                      </Label>
                      <Input
                        id="new-deadline"
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  )}
                  
                  {/* Faculty-change specific fields */}
                  {requestType === "Faculty" && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="faculty-change-type" className="text-right">
                          {t("changeType")}
                        </Label>
                        <Select
                          value={facultyChangeType}
                          onValueChange={setFacultyChangeType}
                        >
                          <SelectTrigger id="faculty-change-type" className="col-span-3">
                            <SelectValue placeholder={t("selectFacultyChangeType")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Delegate">{t("delegateToAnotherManager")}</SelectItem>
                            <SelectItem value="AddMember">{t("addTeamMember")}</SelectItem>
                            <SelectItem value="RemoveMember">{t("removeTeamMember")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Info about SubPMO approval */}
                      <div className="col-span-4 rounded-md p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm flex items-start">
                        <InfoIcon className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                        <div>
                          {t("facultyChangeApprovalNote")}
                        </div>
                      </div>
                      
                      {/* Delegate to another manager */}
                      {facultyChangeType === "Delegate" && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="new-manager" className="text-right">
                            {t("newManager")}
                          </Label>
                          <Select
                            value={newManagerId}
                            onValueChange={setNewManagerId}
                          >
                            <SelectTrigger id="new-manager" className="col-span-3">
                              <SelectValue placeholder={t("selectNewManager")} />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                ?.filter((u: any) => 
                                  (u.role === "ProjectManager" || u.role === "SubPMO" || u.role === "MainPMO") && 
                                  u.id !== project.managerUserId)
                                .map((u: any) => (
                                  <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* Add or remove team member */}
                      {(facultyChangeType === "AddMember" || facultyChangeType === "RemoveMember") && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="team-member" className="text-right">
                            {facultyChangeType === "AddMember" ? t("memberToAdd") : t("memberToRemove")}
                          </Label>
                          <Select
                            value={teamMemberId}
                            onValueChange={setTeamMemberId}
                          >
                            <SelectTrigger id="team-member" className="col-span-3">
                              <SelectValue placeholder={facultyChangeType === "AddMember" ? t("selectMemberToAdd") : t("selectMemberToRemove")} />
                            </SelectTrigger>
                            <SelectContent>
                              {facultyChangeType === "AddMember" 
                                ? users
                                    ?.filter((u: any) => 
                                      u.departmentId === project.departmentId && 
                                      !teamMembers.some(t => t.id === u.id) &&
                                      u.id !== project.managerUserId)
                                    .map((u: any) => (
                                      <SelectItem key={u.id} value={u.id.toString()}>
                                        {u.name}
                                      </SelectItem>
                                    ))
                                : teamMembers.map((member: any) => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                      {member.name}
                                    </SelectItem>
                                  ))
                            }
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsChangeRequestOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={handleChangeRequestSubmit}
                    className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                    disabled={createChangeRequest.isPending}
                  >
                    {createChangeRequest.isPending ? t("submitting") : t("submitRequest")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PermissionGate>
          
          {/* Edit button - Show if user has general edit permission or owns this project */}
          <PermissionGate permission="canEditProject">
            <Link href={`/projects/${projectId}/edit`}>
              <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                <PencilIcon className="mr-2 h-4 w-4" />
                {t("editProject")}
              </Button>
            </Link>
          </PermissionGate>
          
          {/* Project manager specific edit button */}
          <ProjectOwnershipGate 
            projectId={projectId} 
            managerId={project.managerUserId}
            requiredPermission="canEditOwnProject"
          >
            <Link href={`/projects/${projectId}/edit`}>
              <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                <PencilIcon className="mr-2 h-4 w-4" />
                {t("editProject")}
              </Button>
            </Link>
          </ProjectOwnershipGate>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("tasks")}</TabsTrigger>
          <TabsTrigger value="team">{t("team")}</TabsTrigger>
          <TabsTrigger value="updates">{t("weeklyUpdates")}</TabsTrigger>
          <TabsTrigger value="files">{t("files")}</TabsTrigger>
          <TabsTrigger value="logs">{t("activityLog")}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Project Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("projectDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("client")}</h3>
                  <p className="mt-1 text-base">{project.client || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("priority")}</h3>
                  <p className="mt-1">
                    <Badge className={getPriorityBadgeClass(project.priority)}>
                      {t(project.priority?.toLowerCase() || "")}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("startDate")}</h3>
                  <p className="mt-1 text-base flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(project.startDate)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("deadline")}</h3>
                  <p className="mt-1 text-base flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {formatDate(project.deadline)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("budget")}</h3>
                  <p className="mt-1 text-base">{formatCurrency(project.budget)} QAR</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("actualCost")}</h3>
                  <p className="mt-1 text-base">{formatCurrency(project.actualCost)} QAR</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Project Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t("description")}</h3>
                <p className="text-base whitespace-pre-line">{project.description || t("noDescription")}</p>
              </div>
              
              {/* Project Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("progress")}</h3>
                  <span className="text-sm font-medium">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-qatar-maroon h-2.5 rounded-full" 
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingChangeRequests ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : changeRequests && changeRequests.length > 0 ? (
                <ul className="space-y-4">
                  {changeRequests.slice(0, 5).map((cr) => (
                    <li key={cr.id} className="flex items-start gap-3">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 mt-0.5">
                        <HistoryIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{cr.type} {t("changeRequested")}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(cr.requestedAt)} • {t("by")} {getUserName(cr.requestedByUserId)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t("noRecentActivity")}</p>
              )}
            </CardContent>
          </Card>
          
          {/* Key Metrics Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("tasksCompleted")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckIcon className="h-8 w-8 text-green-500 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">
                      {tasks ? tasks.filter(t => t.status === "Completed").length : 0} / {tasks?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("budgetUtilization")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart4Icon className="h-8 w-8 text-blue-500 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">
                      {project.budget && project.actualCost 
                        ? Math.round((project.actualCost / project.budget) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("openIssues")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircleIcon className="h-8 w-8 text-red-500 mr-2" />
                  <div>
                    <p className="text-2xl font-bold">
                      {risksIssues 
                        ? risksIssues.filter(ri => ri.type === "Issue" && ri.status !== "Resolved").length
                        : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <CardTitle>{t("projectTasks")}</CardTitle>
                <div className="ml-4 flex border rounded-md overflow-hidden">
                  <Button
                    variant={taskViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setTaskViewMode('list')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    {t("listView")}
                  </Button>
                  <Button
                    variant={taskViewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setTaskViewMode('kanban')}
                  >
                    <Trello className="h-4 w-4 mr-2" />
                    {t("kanbanView")}
                  </Button>
                </div>
              </div>
              
              {/* Add Task Button - Show if user has general create task permission */}
              <PermissionGate permission="canCreateTask">
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                      <ListTodoIcon className="mr-2 h-4 w-4" />
                      {t("addTask")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{t("addNewTask")}</DialogTitle>
                      <DialogDescription>
                        {t("addNewTaskDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-title" className="text-right">
                          {t("title")} *
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="task-title"
                            value={taskTitle}
                            onChange={(e) => {
                              setTaskTitle(e.target.value);
                              if (taskTitleError) setTaskTitleError('');
                            }}
                            placeholder={t("enterTaskTitle")}
                            className={`${taskTitleError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          />
                          {taskTitleError && (
                            <p className="text-xs text-red-500">{taskTitleError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-description" className="text-right">
                          {t("description")}
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Textarea
                            id="task-description"
                            value={taskDescription}
                            onChange={(e) => {
                              setTaskDescription(e.target.value);
                              if (taskDescriptionError) setTaskDescriptionError('');
                            }}
                            placeholder={t("enterTaskDescription")}
                            className={`${taskDescriptionError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            rows={3}
                          />
                          {taskDescriptionError && (
                            <p className="text-xs text-red-500">{taskDescriptionError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-deadline" className="text-right">
                          {t("deadline")}
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="task-deadline"
                            type="date"
                            value={taskDeadline}
                            onChange={(e) => {
                              setTaskDeadline(e.target.value);
                              if (taskDeadlineError) setTaskDeadlineError('');
                            }}
                            className={`${taskDeadlineError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          />
                          {taskDeadlineError && (
                            <p className="text-xs text-red-500">{taskDeadlineError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-priority" className="text-right">
                          {t("priority")}
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Select 
                            value={taskPriority} 
                            onValueChange={(value) => {
                              setTaskPriority(value);
                              if (taskPriorityError) setTaskPriorityError('');
                            }}
                          >
                            <SelectTrigger 
                              id="task-priority" 
                              className={`${taskPriorityError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            >
                              <SelectValue placeholder={t("selectPriority")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">{t("low")}</SelectItem>
                              <SelectItem value="Medium">{t("medium")}</SelectItem>
                              <SelectItem value="High">{t("high")}</SelectItem>
                              <SelectItem value="Critical">{t("critical")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {taskPriorityError && (
                            <p className="text-xs text-red-500">{taskPriorityError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-assignee" className="text-right">
                          {t("assignTo")}
                        </Label>
                        <Select 
                          value={taskAssignee} 
                          onValueChange={setTaskAssignee}
                        >
                          <SelectTrigger id="task-assignee" className="col-span-3">
                            <SelectValue placeholder={t("selectAssignee")} />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Only show team members of the project as options */}
                            {teamMembers?.map(member => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name}
                              </SelectItem>
                            ))}
                            {/* Also include the project manager if not already in team members */}
                            {project?.managerUserId && !teamMembers?.some(member => member.id === project.managerUserId) && users?.find(user => user.id === project.managerUserId) && (
                              <SelectItem key={project.managerUserId} value={project.managerUserId.toString()}>
                                {getUserName(project.managerUserId)} {t("projectManager")}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddTaskOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button 
                        type="submit" 
                        onClick={handleTaskSubmit}
                        className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                        disabled={createTask.isPending}
                      >
                        {createTask.isPending ? t("creating") : t("createTask")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </PermissionGate>
              
              {/* Project manager specific task button */}
              <ProjectOwnershipGate 
                projectId={projectId} 
                managerId={project.managerUserId}
                requiredPermission="canManageOwnProjectTasks"
              >
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-qatar-maroon hover:bg-maroon-800 text-white">
                      <ListTodoIcon className="mr-2 h-4 w-4" />
                      {t("addTask")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{t("addNewTask")}</DialogTitle>
                      <DialogDescription>
                        {t("addNewTaskDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-title-pm" className="text-right">
                          {t("title")} *
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="task-title-pm"
                            value={taskTitle}
                            onChange={(e) => {
                              setTaskTitle(e.target.value);
                              if (taskTitleError) setTaskTitleError('');
                            }}
                            placeholder={t("enterTaskTitle")}
                            className={`${taskTitleError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          />
                          {taskTitleError && (
                            <p className="text-xs text-red-500">{taskTitleError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-description-pm" className="text-right">
                          {t("description")}
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Textarea
                            id="task-description-pm"
                            value={taskDescription}
                            onChange={(e) => {
                              setTaskDescription(e.target.value);
                              if (taskDescriptionError) setTaskDescriptionError('');
                            }}
                            placeholder={t("enterTaskDescription")}
                            className={`${taskDescriptionError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            rows={3}
                          />
                          {taskDescriptionError && (
                            <p className="text-xs text-red-500">{taskDescriptionError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-deadline-pm" className="text-right">
                          {t("deadline")}
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="task-deadline-pm"
                            type="date"
                            value={taskDeadline}
                            onChange={(e) => {
                              setTaskDeadline(e.target.value);
                              if (taskDeadlineError) setTaskDeadlineError('');
                            }}
                            className={`${taskDeadlineError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          />
                          {taskDeadlineError && (
                            <p className="text-xs text-red-500">{taskDeadlineError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-priority-pm" className="text-right">
                          {t("priority")}
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Select 
                            value={taskPriority} 
                            onValueChange={(value) => {
                              setTaskPriority(value);
                              if (taskPriorityError) setTaskPriorityError('');
                            }}
                          >
                            <SelectTrigger 
                              id="task-priority-pm" 
                              className={`${taskPriorityError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            >
                              <SelectValue placeholder={t("selectPriority")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">{t("low")}</SelectItem>
                              <SelectItem value="Medium">{t("medium")}</SelectItem>
                              <SelectItem value="High">{t("high")}</SelectItem>
                              <SelectItem value="Critical">{t("critical")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {taskPriorityError && (
                            <p className="text-xs text-red-500">{taskPriorityError}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task-assignee-pm" className="text-right">
                          {t("assignTo")}
                        </Label>
                        <Select 
                          value={taskAssignee} 
                          onValueChange={setTaskAssignee}
                        >
                          <SelectTrigger id="task-assignee-pm" className="col-span-3">
                            <SelectValue placeholder={t("selectAssignee")} />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Only show team members of the project as options */}
                            {teamMembers?.map(member => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name}
                              </SelectItem>
                            ))}
                            {/* Also include the project manager if not already in team members */}
                            {project?.managerUserId && !teamMembers?.some(member => member.id === project.managerUserId) && users?.find(user => user.id === project.managerUserId) && (
                              <SelectItem key={project.managerUserId} value={project.managerUserId.toString()}>
                                {getUserName(project.managerUserId)} {t("projectManager")}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddTaskOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button 
                        type="submit" 
                        onClick={handleTaskSubmit}
                        className="bg-qatar-maroon hover:bg-maroon-800 text-white"
                        disabled={createTask.isPending}
                      >
                        {createTask.isPending ? t("creating") : t("createTask")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </ProjectOwnershipGate>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : tasks && tasks.length > 0 ? (
                taskViewMode === 'list' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                          <th scope="col" className="px-6 py-3">{t("title")}</th>
                          <th scope="col" className="px-6 py-3">{t("assignedTo")}</th>
                          <th scope="col" className="px-6 py-3">{t("deadline")}</th>
                          <th scope="col" className="px-6 py-3">{t("status")}</th>
                          <th scope="col" className="px-6 py-3">{t("priority")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </td>
                            <td className="px-6 py-4">
                              {getUserName(task.assignedUserId)}
                            </td>
                            <td className="px-6 py-4">
                              {formatDate(task.deadline)}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getStatusBadgeClass(task.status)}>
                                {t(task.status?.toLowerCase() || "")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getPriorityBadgeClass(task.priority)}>
                                {t(task.priority?.toLowerCase() || "")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4">
                    <KanbanBoard 
                      tasks={tasks} 
                      projectId={projectId} 
                      users={users || []} 
                    />
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">{t("noTasks")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("projectTeam")}</CardTitle>
              <CardDescription>{t("projectTeamDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Project Manager */}
                <div>
                  <h3 className="text-lg font-medium mb-3">{t("projectManager")}</h3>
                  {users && project.managerUserId ? (
                    <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-qatar-maroon text-white">
                          {getUserName(project.managerUserId).split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getUserName(project.managerUserId)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("department")}: {getDepartmentName(users.find(u => u.id === project.managerUserId)?.departmentId)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t("noManagerAssigned")}</p>
                  )}
                </div>
                
                {/* Team Members */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">{t("teamMembers")}</h3>
                    
                    {/* Add team member button - Show if user has general edit permission */}
                    <PermissionGate permission="canEditProject">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t("addTeamMember")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("addTeamMember")}</DialogTitle>
                            <DialogDescription>
                              {t("addTeamMemberDescription")}
                            </DialogDescription>
                          </DialogHeader>
                          <AddTeamMemberForm projectId={projectId} departmentId={project?.departmentId} />
                        </DialogContent>
                      </Dialog>
                    </PermissionGate>
                    
                    {/* Project manager specific team control */}
                    <ProjectOwnershipGate 
                      projectId={projectId} 
                      managerId={project.managerUserId}
                      requiredPermission="canEditOwnProject"
                    >
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t("addTeamMember")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("addTeamMember")}</DialogTitle>
                            <DialogDescription>
                              {t("addTeamMemberDescription")}
                            </DialogDescription>
                          </DialogHeader>
                          <AddTeamMemberForm projectId={projectId} departmentId={project?.departmentId} />
                        </DialogContent>
                      </Dialog>
                    </ProjectOwnershipGate>
                  </div>
                  
                  {isLoadingTeamMembers ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : teamMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gray-500 text-white">
                              {member.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {member.role && t(member.role.toLowerCase())}
                            </p>
                          </div>
                          
                          {/* Regular permission users */}
                          <PermissionGate permission="canEditProject">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeTeamMember(member.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          
                          {/* Project managers for their own projects */}
                          <ProjectOwnershipGate 
                            projectId={projectId} 
                            managerId={project.managerUserId}
                            requiredPermission="canEditOwnProject"
                          >
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeTeamMember(member.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </ProjectOwnershipGate>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t("noTeamMembers")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Weekly Updates Tab */}
        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("weeklyUpdates")}</CardTitle>
              <CardDescription>{t("weeklyUpdatesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUpdates ? (
                <div className="space-y-6">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : weeklyUpdates && weeklyUpdates.length > 0 ? (
                <div className="space-y-6">
                  {weeklyUpdates.map((update) => (
                    <Card key={update.id} className="bg-gray-50 dark:bg-gray-800">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {t("weekOf")} {formatDate(update.weekStartDate)}
                          </CardTitle>
                          <Badge variant="outline">
                            {formatDate(update.createdAt)}
                          </Badge>
                        </div>
                        <CardDescription>
                          {t("by")} {getUserName(update.createdByUserId)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              {t("accomplishments")}
                            </h4>
                            <p className="text-gray-900 dark:text-white whitespace-pre-line">
                              {update.accomplishments || "-"}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              {t("plannedWork")}
                            </h4>
                            <p className="text-gray-900 dark:text-white whitespace-pre-line">
                              {update.plannedWork || "-"}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              {t("issuesRisks")}
                            </h4>
                            <p className="text-gray-900 dark:text-white whitespace-pre-line">
                              {update.issues || "-"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">{t("noWeeklyUpdates")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("projectFiles")}</CardTitle>
              <CardDescription>{t("projectFilesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FilesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t("noFiles")}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("uploadFilesInstruction")}</p>
                <div className="mt-6">
                  <Button>
                    <FilesIcon className="mr-2 h-4 w-4" />
                    {t("uploadFiles")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Log Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("activityLog")}</CardTitle>
              <CardDescription>{t("activityLogDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-5 border-l-2 border-gray-200 dark:border-gray-700"></div>
                <ul className="space-y-6">
                  {/* Project creation */}
                  <li className="ml-10 relative">
                    <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full bg-qatar-maroon"></div>
                    <div>
                      <p className="font-medium">{t("projectCreated")}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(project.createdAt)} • {t("by")} {getUserName(project.managerUserId)}
                      </p>
                    </div>
                  </li>
                  
                  {/* Change requests */}
                  {changeRequests && changeRequests.length > 0 && changeRequests.map((cr) => (
                    <li key={cr.id} className="ml-10 relative">
                      <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium">
                          {cr.type} {t("changeRequested")} 
                          {cr.status === "Approved" && ` - ${t("approved")}`}
                          {cr.status === "Rejected" && ` - ${t("rejected")}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(cr.requestedAt)} • {t("by")} {getUserName(cr.requestedByUserId)}
                        </p>
                        {cr.reviewedByUserId && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t("reviewedBy")} {getUserName(cr.reviewedByUserId)} 
                            {cr.reviewedAt && ` ${t("on")} ${formatDate(cr.reviewedAt)}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                  
                  {/* Cost updates */}
                  {costHistory && costHistory.length > 0 && costHistory.map((cost) => (
                    <li key={cost.id} className="ml-10 relative">
                      <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-medium">{t("costUpdated")}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(cost.updatedAt)} • {t("by")} {getUserName(cost.updatedByUserId)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("newAmount")}: {formatCurrency(cost.amount)} QAR
                        </p>
                      </div>
                    </li>
                  ))}
                  
                  {/* If no additional activity */}
                  {(!changeRequests || changeRequests.length === 0) && 
                   (!costHistory || costHistory.length === 0) && (
                    <li className="ml-10 relative">
                      <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full bg-gray-300"></div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t("noAdditionalActivity")}</p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function AddTeamMemberForm({ projectId, departmentId }: { projectId: number, departmentId: number }) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch department users who are not already team members
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/members`],
    enabled: !!projectId,
  });
  
  // Filter users from same department who are not already team members
  const availableUsers = users.filter(user => 
    user.departmentId === departmentId && 
    !teamMembers.some(member => member.id === user.id) &&
    user.status === "Active"
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUser }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add team member");
      }
      
      toast({
        title: t("teamMemberAdded"),
        description: t("teamMemberAddedDescription"),
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
      setSelectedUser("");
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="space-y-2">
        <Label htmlFor="user">{t("selectUser")}</Label>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectUserPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.length > 0 ? (
              availableUsers.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                {t("noAvailableUsers")}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !selectedUser}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("addMember")}
        </Button>
      </div>
    </form>
  );
} 