import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useI18n } from "@/hooks/use-i18n-new";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";

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
  const i18n = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Create a translation object with the missing keys
  const t = {
    ...i18n,
    commentAdded: "Comment Added",
    commentAddedDescription: "Your comment has been posted successfully",
    error: "Error",
    commentAddError: "Failed to add comment. Please try again.",
    assignmentNotFound: "Assignment not found",
    details: "Details",
    noDescription: "No description provided",
    assignedTo: "Assigned To",
    assignedBy: "Assigned By",
    loading: "Loading...",
    comments: "Comments",
    noComments: "No comments yet",
    unknownUser: "Unknown User",
    writeComment: "Write a comment...",
    posting: "Posting...",
    postComment: "Post Comment",
    close: "Close",
    priority: "Priority",
    medium: "Medium",
    high: "High",
    low: "Low",
    status: "Status",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    statusPending: "Pending",
    statusInProgress: "In Progress",
    statusCompleted: "Completed",
    dueDate: "Due Date"
  };

  // Reset comment field when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setNewComment("");
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
        title: t.commentAdded,
        description: t.commentAddedDescription,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.commentAddError,
        variant: "destructive",
      });
    },
  });

  // Handle submit comment
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {isAssignmentLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : !assignment ? (
          <div className="text-center p-4">{t.assignmentNotFound}</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{assignment.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>
                  {t.status}: {t[`status${assignment.status}`] || assignment.status}
                </Badge>
                {assignment.dueDate && (
                  <Badge variant={new Date(assignment.dueDate) < new Date() ? "destructive" : "outline"} className="flex gap-1 items-center">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            <div className="grid gap-4 py-4 overflow-y-auto">
              {/* Assignment details */}
              <div className="space-y-2">
                <h3 className="font-medium text-lg">{t.details}</h3>
                <p className="text-sm">{assignment.description || t.noDescription}</p>
              </div>

              {/* Assigned To & Assigned By */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">{t.assignedTo}</h3>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {assignedToUser?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignedToUser?.name || t.loading}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">{t.assignedBy}</h3>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {assignedByUser?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignedByUser?.name || t.loading}</span>
                  </div>
                </div>
              </div>

              {/* Comments section */}
              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg">{t.comments}</h3>
                
                <div className="space-y-4 max-h-[200px] overflow-y-auto p-1">
                  {isCommentsLoading ? (
                    <div className="flex justify-center p-4">
                      <Spinner />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t.noComments}
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
                              {comment.user?.name || t.unknownUser}
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
                    placeholder={t.writeComment}
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
                          {t.posting}
                        </>
                      ) : (
                        t.postComment
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                {t.close}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailDialog; 