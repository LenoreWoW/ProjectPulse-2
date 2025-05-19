import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useI18n } from "@/hooks/use-i18n-new";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

// Add the Spinner component
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

// Add a simple toast implementation
const useToast = () => {
  const showToast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    // In a real implementation, this would show a toast notification
    console.log('Toast:', props);
  };

  return { toast: showToast };
};

interface AssignmentDetailDialogProps {
  assignmentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AssignmentComment {
  id: number;
  assignmentId: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
  };
}

const AssignmentDetailDialog: React.FC<AssignmentDetailDialogProps> = ({ assignmentId, isOpen, onClose }) => {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);

  // Reset comment field when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setNewComment("");
      setNewStatus(null);
    }
  }, [isOpen]);

  // Fetch assignment details
  const { data: assignment, isLoading: isAssignmentLoading } = useQuery({
    queryKey: ["assignments", assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;
      const response = await fetch(`/api/assignments/${assignmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assignment");
      }
      return response.json();
    },
    enabled: !!assignmentId && isOpen,
  });

  // Set initial status from assignment when data is loaded
  useEffect(() => {
    if (assignment && assignment.status) {
      setNewStatus(assignment.status);
    }
  }, [assignment]);

  // Fetch assignment comments
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["assignmentComments", assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const response = await fetch(`/api/assignments/${assignmentId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
    enabled: !!assignmentId && isOpen,
  });

  // Fetch assigned to user details
  const { data: assignedToUser } = useQuery({
    queryKey: ["users", assignment?.assignedToUserId],
    queryFn: async () => {
      if (!assignment?.assignedToUserId) return null;
      const response = await fetch(`/api/users/${assignment.assignedToUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assigned user");
      }
      return response.json();
    },
    enabled: !!assignment?.assignedToUserId && isOpen,
  });

  // Fetch assigned by user details
  const { data: assignedByUser } = useQuery({
    queryKey: ["users", assignment?.assignedByUserId],
    queryFn: async () => {
      if (!assignment?.assignedByUserId) return null;
      const response = await fetch(`/api/users/${assignment.assignedByUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assigner");
      }
      return response.json();
    },
    enabled: !!assignment?.assignedByUserId && isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!assignmentId) throw new Error("Assignment ID is required");
      const response = await fetch(`/api/assignments/${assignmentId}/comments`, {
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
        title: "Comment Added",
        description: "Your comment has been posted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update assignment status mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!assignmentId) throw new Error("Assignment ID is required");
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update assignment status");
      }
      
      return response.json();
    },
    onSuccess: (updatedAssignment) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.setQueryData(["assignments", assignmentId], updatedAssignment);
      toast({
        title: "Assignment Updated",
        description: "Status has been updated successfully",
      });
      
      // Add a comment automatically when status changes
      if (newStatus && assignment && newStatus !== assignment.status) {
        // Convert status to readable format for the comment
        const getReadableStatus = (status: string): string => {
          switch(status) {
            case "Todo": return "To Do";
            case "InProgress": return "In Progress";
            case "Review": return "Review";
            case "Completed": return "Completed";
            case "OnHold": return "On Hold";
            default: return status;
          }
        };
        
        const statusChangeComment = `Status changed from ${getReadableStatus(assignment.status)} to ${getReadableStatus(newStatus)}`;
        addCommentMutation.mutate(statusChangeComment);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update assignment status",
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
    if (!newStatus || newStatus === assignment?.status) return;
    updateAssignmentMutation.mutate(newStatus);
  };
  
  // Check if current user is the assignee
  const isAssignee = user && assignment?.assignedToUserId === user.id;
  
  // Check if current user has permission to update (assignee, assigner, or admin)
  const canUpdateAssignment = user && (
    isAssignee || 
    assignment?.assignedByUserId === user.id || 
    ["Administrator", "MainPMO"].includes(user.role || "")
  );

  if (!isOpen) return null;

  // Convert status to readable format for display
  const getReadableStatus = (status: string | undefined | null): string => {
    if (!status) return "";
    
    switch(status) {
      case "Todo": return "To Do";
      case "InProgress": return "In Progress";
      case "Review": return "Review";
      case "Completed": return "Completed";
      case "OnHold": return "On Hold";
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {isAssignmentLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : !assignment ? (
          <div className="text-center p-4">Assignment not found</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{assignment.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>
                  Status: {getReadableStatus(assignment.status)}
                </Badge>
                {assignment.deadline && (
                  <Badge variant={new Date(assignment.deadline) < new Date() ? "destructive" : "outline"} className="flex gap-1 items-center">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(assignment.deadline), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="grid gap-4 py-4 overflow-y-auto">
              {/* Assignment details */}
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Details</h3>
                <p className="text-sm">{assignment.description || "No description provided"}</p>
              </div>

              {/* Assigned To & Assigned By */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Assigned To</h3>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {assignedToUser?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignedToUser?.name || "Loading..."}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Assigned By</h3>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {assignedByUser?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignedByUser?.name || "Loading..."}</span>
                  </div>
                </div>
              </div>
              
              {/* Status Update Section (only visible to assignee or creator) */}
              {canUpdateAssignment && (
                <div className="mt-2 border rounded-md p-4 bg-muted/50">
                  <h3 className="font-medium text-lg mb-3">Update Progress</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="status" className="text-sm font-medium mb-2 block">
                        Status
                      </label>
                      <Select
                        value={newStatus || undefined}
                        onValueChange={setNewStatus}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todo">To Do</SelectItem>
                          <SelectItem value="InProgress">In Progress</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="OnHold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="self-end">
                      <Button 
                        onClick={handleStatusUpdate}
                        disabled={!newStatus || newStatus === assignment.status || updateAssignmentMutation.isPending}
                        className="mt-4 sm:mt-0"
                      >
                        {updateAssignmentMutation.isPending ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Update Status
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments section */}
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg">Comments</h3>
                
                <div className="space-y-4 max-h-[200px] overflow-y-auto p-1">
                  {isCommentsLoading ? (
                    <div className="flex justify-center p-4">
                      <Spinner />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment: AssignmentComment) => (
                      <div key={comment.id} className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {comment.user?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {comment.user?.name || "Unknown User"}
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
                    placeholder="Write a comment..."
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
                          Posting...
                        </>
                      ) : (
                        "Post Comment"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailDialog; 