import React, { useState } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssignmentDetailDialog from "./assignment-detail-dialog";

export interface AssignmentCardProps {
  assignment: {
    id: number;
    title: string;
    description: string | null;
    status: string;
    dueDate: string | null;
    assignedToUserId: number;
    assignedByUserId: number;
  };
  onEdit?: (assignment: any) => void;
  onDelete?: (id: number) => void;
  onStatusChange?: (id: number, status: string) => void;
  userMap?: Record<number, { name: string }>;
  disableActions?: boolean;
  className?: string;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onEdit,
  onDelete,
  onStatusChange,
  userMap = {},
  disableActions = false,
  className,
}) => {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isPastDue = dueDate && dueDate < new Date();
  const assignedTo = userMap[assignment.assignedToUserId];
  const assignedBy = userMap[assignment.assignedByUserId];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700 hover:bg-amber-200";
      case "InProgress":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "Completed":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

  const handleStatusClick = () => {
    const nextStatus = getNextStatus(assignment.status);
    onStatusChange?.(assignment.id, nextStatus);
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "Pending":
        return "InProgress";
      case "InProgress":
        return "Completed";
      case "Completed":
        return "Pending";
      default:
        return "Pending";
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening the dialog when clicking on actions
    if ((e.target as HTMLElement).closest('.assignment-actions')) {
      return;
    }
    setShowDetailDialog(true);
  };

  const statusDisplay = {
    Pending: t.statusPending || "Pending",
    InProgress: t.statusInProgress || "In Progress",
    Completed: t.statusCompleted || "Completed",
  };

  return (
    <>
      <Card
        className={cn(
          "flex flex-col justify-between transition-shadow hover:shadow-md cursor-pointer",
          className
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between">
            <CardTitle className="text-base truncate">{assignment.title}</CardTitle>
            {!disableActions && (
              <div className="flex gap-1 assignment-actions">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(assignment);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <CardDescription className="line-clamp-2 text-xs mt-1">
            {assignment.description || t.noDescription || "No description"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-3 flex-grow">
          {dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isPastDue && "text-red-500"
              )}
            >
              <span className="font-medium">{t.dueDate || "Due Date"}:</span>
              <span>
                {format(dueDate, "MMM d, yyyy")}
                {isPastDue && ` (${t.overdue || "Overdue"})`}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          <div className="w-full flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {assignedTo?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate max-w-[100px]">
                  {assignedTo?.name || t.unassigned || "Unassigned"}
                </span>
              </div>
              {assignedBy && (
                <div className="text-xs text-muted-foreground">
                  {t.fromUser || "From"}: {assignedBy.name}
                </div>
              )}
            </div>
            <Badge
              className={cn(
                "cursor-pointer",
                getStatusColor(assignment.status),
                !disableActions && "hover:opacity-80"
              )}
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                if (!disableActions) {
                  handleStatusClick();
                }
              }}
            >
              {statusDisplay[assignment.status as keyof typeof statusDisplay] || assignment.status}
            </Badge>
          </div>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteAssignmentTitle || "Delete Assignment"}</DialogTitle>
          </DialogHeader>
          <p>{t.deleteAssignmentConfirmation || "Are you sure you want to delete this assignment?"}</p>
          <p className="font-medium">{assignment.title}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.(assignment.id);
                setShowDeleteConfirm(false);
              }}
            >
              {t.delete || "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Dialog */}
      <AssignmentDetailDialog
        assignmentId={assignment.id}
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
      />
    </>
  );
}; 