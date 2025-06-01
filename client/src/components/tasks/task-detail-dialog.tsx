import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useI18n } from "@/hooks/use-i18n-new";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, Flag, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Add the Spinner component inline since it's missing
const Spinner = ({ className = "", size = "default" }: { className?: string; size?: "default" | "sm" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };
  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
};

interface TaskDetailDialogProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
  };
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ taskId, isOpen, onClose }) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);

  // Reset comment field when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setNewComment("");
      setNewStatus(null);
      setSelectedMilestoneId(null);
    }
  }, [isOpen]);

  // Fetch task details
  const { data: task, isLoading: isTaskLoading } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }
      return response.json();
    },
    enabled: !!taskId && isOpen,
  });

  // Set initial status from task when data is loaded
  useEffect(() => {
    if (task && task.status) {
      setNewStatus(task.status);
    }
  }, [task]);

  // Fetch task comments
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["taskComments", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: !!taskId && isOpen,
  });

  // Fetch assignee details
  const { data: assignee } = useQuery({
    queryKey: ["users", task?.assignedUserId],
    queryFn: async () => {
      if (!task?.assignedUserId) return null;
      const response = await fetch(`/api/users/${task.assignedUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assignee");
      }
      return response.json();
    },
    enabled: !!task?.assignedUserId && isOpen,
  });

  // Fetch creator details
  const { data: creator } = useQuery({
    queryKey: ["users", task?.createdByUserId],
    queryFn: async () => {
      if (!task?.createdByUserId) return null;
      const response = await fetch(`/api/users/${task.createdByUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch creator");
      }
      return response.json();
    },
    enabled: !!task?.createdByUserId && isOpen,
  });

  // Fetch task milestones
  const { data: taskMilestones = [], refetch: refetchTaskMilestones } = useQuery({
    queryKey: ["taskMilestones", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const response = await fetch(`/api/tasks/${taskId}/milestones`);
      if (!response.ok) {
        throw new Error("Failed to fetch task milestones");
      }
      return response.json();
    },
    enabled: !!taskId && isOpen,
  });

  // Fetch project milestones for linking
  const { data: projectMilestones = [] } = useQuery({
    queryKey: ["projectMilestones", task?.projectId],
    queryFn: async () => {
      if (!task?.projectId) return [];
      const response = await fetch(`/api/projects/${task.projectId}/milestones`);
      if (!response.ok) {
        throw new Error("Failed to fetch project milestones");
      }
      return response.json();
    },
    enabled: !!task?.projectId && isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!taskId) throw new Error("Task ID is required");
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add comment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: t("commentAdded"),
        description: t("commentAddedDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("commentAddError"),
        variant: "destructive",
      });
    },
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!taskId) throw new Error("Task ID is required");
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
      
      return response.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.setQueryData(["tasks", taskId], updatedTask);
      toast({
        title: t("taskUpdated"),
        description: t("taskStatusUpdated"),
      });
      
      // Add a comment automatically when status changes
      if (newStatus && task && newStatus !== task.status) {
        // Get readable status labels
        const getStatusLabel = (status: string): string => {
          switch (status) {
            case "Todo": return t("todo");
            case "InProgress": return t("inProgress");
            case "Review": return t("review");
            case "Completed": return t("completed");
            case "OnHold": return t("onHold");
            default: return status;
          }
        };
        
        const statusChangeComment = `${t("statusChangedFrom")} ${getStatusLabel(task.status)} ${t("to")} ${getStatusLabel(newStatus)}`;
        addCommentMutation.mutate(statusChangeComment);
      }
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("taskUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  // Link task to milestone mutation
  const linkToMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: number) => {
      if (!taskId) throw new Error("Task ID is required");
      const response = await fetch(`/api/tasks/${taskId}/milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ milestoneId, weight: 1 }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to link task to milestone");
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchTaskMilestones();
      setSelectedMilestoneId(null);
      toast({
        title: t("success"),
        description: t("taskLinkedToMilestone"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedToLinkTaskToMilestone"),
        variant: "destructive",
      });
    },
  });

  // Unlink task from milestone mutation
  const unlinkFromMilestoneMutation = useMutation({
    mutationFn: async (taskMilestoneId: number) => {
      const response = await fetch(`/api/task-milestones/${taskMilestoneId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to unlink task from milestone");
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchTaskMilestones();
      toast({
        title: t("success"),
        description: t("taskUnlinkedFromMilestone"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("failedToUnlinkTaskFromMilestone"),
        variant: "destructive",
      });
    },
  });

  // Handle submit comment
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };
  
  // Handle status update
  const handleStatusUpdate = () => {
    if (!newStatus || newStatus === task?.status) return;
    updateTaskMutation.mutate(newStatus);
  };

  // Handle milestone linking
  const handleLinkToMilestone = () => {
    if (!selectedMilestoneId) return;
    linkToMilestoneMutation.mutate(selectedMilestoneId);
  };

  // Handle milestone unlinking
  const handleUnlinkFromMilestone = (taskMilestoneId: number) => {
    unlinkFromMilestoneMutation.mutate(taskMilestoneId);
  };

  // Get available milestones (not already linked)
  const availableMilestones = projectMilestones.filter(
    (milestone: any) => !taskMilestones.some((tm: any) => tm.milestoneId === milestone.id)
  );
  
  // Check if current user is the assignee
  const isAssignee = user && task?.assignedUserId === user.id;
  
  // Check if current user can update the task (assignee, creator, or admin)
  const canUpdateTask = user && (
    isAssignee || 
    task?.createdByUserId === user.id || 
    ["Administrator", "MainPMO"].includes(user.role || "")
  );

  if (!isOpen) return null;

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "secondary";
    switch (status) {
      case "Completed": return "default";
      case "Todo": return "secondary";
      case "InProgress": return "secondary";
      case "Review": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {isTaskLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : !task ? (
          <div className="text-center p-4">{t("taskNotFound")}</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant={getStatusBadgeVariant(task.status)}>
                  {task.status ? t(`taskStatus_${task.status.toLowerCase()}`) || task.status : ""}
                </Badge>
                <Badge variant="outline">
                  {t("priority")}: {task.priority ? t(`priority_${task.priority.toLowerCase()}`) || task.priority : ""}
                </Badge>
                {task.deadline && (
                  <Badge variant={new Date(task.deadline) < new Date() ? "destructive" : "outline"} className="flex gap-1 items-center">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(task.deadline), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="grid gap-4 py-4 overflow-y-auto">
              {/* Task details */}
              <div className="space-y-2">
                <h3 className="font-medium text-lg">{t("details")}</h3>
                <p className="text-sm">{task.description || t("noDescription")}</p>
              </div>

              {/* Assignee & Creator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{t("assignedTo")}</h3>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {assignee?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignee?.name || t("loading")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">{t("createdBy")}</h3>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {creator?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{creator?.name || t("loading")}</span>
                  </div>
                </div>
              </div>
              
              {/* Status Update Section (only visible to assignee) */}
              {canUpdateTask && (
                <div className="mt-2 border rounded-md p-4 bg-muted/50">
                  <h3 className="font-medium text-lg mb-3">{t("updateProgress")}</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="status" className="text-sm font-medium mb-2 block">
                        {t("status")}
                      </label>
                      <Select
                        value={newStatus || undefined}
                        onValueChange={setNewStatus}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder={t("selectStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todo">{t("todo")}</SelectItem>
                          <SelectItem value="InProgress">{t("inProgress")}</SelectItem>
                          <SelectItem value="Review">{t("review")}</SelectItem>
                          <SelectItem value="Completed">{t("completed")}</SelectItem>
                          <SelectItem value="OnHold">{t("onHold")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="self-end">
                      <Button 
                        onClick={handleStatusUpdate}
                        disabled={!newStatus || newStatus === task.status || updateTaskMutation.isPending}
                        className="mt-4 sm:mt-0"
                      >
                        {updateTaskMutation.isPending ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            {t("updating")}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t("updateStatus")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestones Section */}
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  {t("linkedMilestones")}
                </h3>
                
                {/* Existing linked milestones */}
                <div className="space-y-2">
                  {taskMilestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noLinkedMilestones")}</p>
                  ) : (
                    taskMilestones.map((tm: any) => (
                      <div key={tm.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{tm.milestone?.title}</span>
                          {tm.milestone?.deadline && (
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(tm.milestone.deadline), "MMM d, yyyy")}
                            </Badge>
                          )}
                        </div>
                        {canUpdateTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkFromMilestone(tm.id)}
                            disabled={unlinkFromMilestoneMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Link to new milestone */}
                {canUpdateTask && availableMilestones.length > 0 && (
                  <div className="border rounded-md p-4 bg-muted/30">
                    <h4 className="font-medium mb-3">{t("linkToMilestone")}</h4>
                    <div className="flex gap-2">
                      <Select
                        value={selectedMilestoneId?.toString() || undefined}
                        onValueChange={(value: string) => setSelectedMilestoneId(parseInt(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={t("selectMilestone")} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMilestones.map((milestone: any) => (
                            <SelectItem key={milestone.id} value={milestone.id.toString()}>
                              {milestone.title}
                              {milestone.deadline && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({format(new Date(milestone.deadline), "MMM d")})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleLinkToMilestone}
                        disabled={!selectedMilestoneId || linkToMilestoneMutation.isPending}
                        size="sm"
                      >
                        {linkToMilestoneMutation.isPending ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments section */}
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg">{t("comments")}</h3>
                
                <div className="space-y-4 max-h-[200px] overflow-y-auto p-1">
                  {isCommentsLoading ? (
                    <div className="flex justify-center p-4">
                      <Spinner />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("noComments")}
                    </p>
                  ) : (
                    comments.map((comment: TaskComment) => (
                      <div key={comment.id} className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {comment.user?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {comment.user?.name || t("unknownUser")}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {comment.createdAt && format(new Date(comment.createdAt), "MMM d, yyyy HH:mm")}
                          </div>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder={t("writeComment")}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          {t("posting")}
                        </>
                      ) : (
                        t("postComment")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog; 