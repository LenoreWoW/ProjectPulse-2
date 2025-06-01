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
import TaskDetailDialog from "./task-detail-dialog";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignedUserId?: number;
    createdByUserId: number;
  };
  onEdit?: (task: any) => void;
  onDelete?: (taskId: number) => void;
  onStatusChange?: (taskId: number, status: string) => void;
  assigneeMap?: Record<number, { name: string }>;
  creatorMap?: Record<number, { name: string }>;
  priorities: Array<{ value: string; label: string }>;
  disableActions?: boolean;
  className?: string;
}

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  assigneeMap,
  creatorMap,
  priorities,
  disableActions,
  className,
}: TaskCardProps) => {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isPastDue = dueDate && dueDate < new Date();
  const assignee = task.assignedUserId ? assigneeMap?.[task.assignedUserId] : undefined;
  const creator = creatorMap?.[task.createdByUserId];

  const getPriorityLabel = (priority: string) => {
    return priorities.find((p) => p.value === priority)?.label || priority;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NotStarted":
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
      case "InProgress":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "Completed":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

  const handleStatusClick = () => {
    const nextStatus = getNextStatus(task.status);
    onStatusChange?.(task.id, nextStatus);
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "NotStarted":
        return "InProgress";
      case "InProgress":
        return "Completed";
      case "Completed":
        return "NotStarted";
      default:
        return "NotStarted";
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening the dialog when clicking on actions
    if ((e.target as HTMLElement).closest('.task-actions')) {
      return;
    }
    setShowDetailDialog(true);
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
            <CardTitle className="text-base truncate">{task.title}</CardTitle>
            {!disableActions && (
              <div className="flex gap-1 task-actions">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEdit?.(task);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e: React.MouseEvent) => {
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
            {task.description || t.noDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-3 flex-grow">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium">{t.priority}:</span>
            <span>{getPriorityLabel(task.priority)}</span>
          </div>
          {dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs mt-1",
                isPastDue && "text-red-500"
              )}
            >
              <span className="font-medium">{t.dueDate}:</span>
              <span>
                {format(dueDate, "MMM d, yyyy")}
                {isPastDue && ` (${t.overdue})`}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">
                  {assignee?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate max-w-[100px]">
                {assignee?.name || t.unassigned}
              </span>
            </div>
            <Badge
              className={cn(
                "cursor-pointer",
                getStatusColor(task.status),
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
              {t[`taskStatus_${task.status}`] || task.status}
            </Badge>
          </div>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTaskTitle}</DialogTitle>
          </DialogHeader>
          <p>{t.deleteTaskConfirmation}</p>
          <p className="font-medium">{task.title}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.(task.id);
                setShowDeleteConfirm(false);
              }}
            >
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        taskId={task.id}
        isOpen={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
      />
    </>
  );
};

export default TaskCard; 