import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CalendarIcon, Clock, AlertOctagon, CheckCircle } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n-new';
import { KanbanColumn } from './KanbanColumn';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  tasks: Task[];
  projectId: number;
  users: any[];
}

// Define all possible task statuses
type TaskStatus = 'Todo' | 'InProgress' | 'Review' | 'Completed' | 'OnHold';

const COLUMN_DEFINITIONS = [
  { id: 'backlog', title: 'Backlog', status: 'Todo' as TaskStatus },
  { id: 'up-next', title: 'Up Next', status: 'Todo' as TaskStatus },
  { id: 'in-progress', title: 'In Progress', status: 'InProgress' as TaskStatus },
  { id: 'on-hold', title: 'On Hold', status: 'OnHold' as TaskStatus },
  { id: 'review', title: 'Review', status: 'Review' as TaskStatus },
  { id: 'done', title: 'Done', status: 'Completed' as TaskStatus },
];

export function KanbanBoard({ tasks, projectId, users }: KanbanBoardProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<Record<string, Task[]>>(() => {
    const initialColumns: Record<string, Task[]> = {};
    
    // Initialize the columns based on definitions
    COLUMN_DEFINITIONS.forEach((column) => {
      initialColumns[column.id] = tasks.filter(task => {
        // Special case for backlog and up-next which both use Todo status
        if (column.id === 'backlog') {
          return task.status === 'Todo' && !task.priorityOrder;
        } else if (column.id === 'up-next') {
          return task.status === 'Todo' && !!task.priorityOrder;
        } else {
          return task.status === column.status;
        }
      });
    });
    
    return initialColumns;
  });

  // Mutation for updating a task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, priorityOrder }: { 
      taskId: number, 
      status: TaskStatus,
      priorityOrder?: number | null
    }) => {
      const requestBody: any = { status };
      
      // Only include priorityOrder if it's explicitly provided
      if (priorityOrder !== undefined) {
        requestBody.priorityOrder = priorityOrder;
      }
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : 'Failed to update task status',
        variant: "destructive",
      });
    }
  });

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

  const getPriorityIcon = (priority: string | null) => {
    if (!priority) return null;
    
    switch (priority) {
      case 'Critical':
        return <AlertOctagon className="w-4 h-4 mr-1" />;
      case 'High':
        return <AlertOctagon className="w-4 h-4 mr-1" />;
      case 'Medium':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'Low':
        return <CheckCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId || !users) return "-";
    const user = users.find(u => u.id === userId);
    return user ? user.name : "-";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    return format(new Date(date), "MMM d");
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back to its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the task that was dragged
    const taskId = parseInt(draggableId.replace('task-', ''));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Clone the columns
    const newColumns = { ...columns };

    // Remove the task from the source column
    newColumns[source.droppableId] = newColumns[source.droppableId].filter(
      t => t.id !== taskId
    );

    // Add the task to the destination column
    // Find the target column definition to get its associated status
    const targetColumnDef = COLUMN_DEFINITIONS.find(col => col.id === destination.droppableId);
    if (!targetColumnDef) return;

    // Update the task with the new status
    const updatedTask = { ...task };
    
    // If moving between Backlog and Up Next (both are Todo status), update priorityOrder field
    if (destination.droppableId === 'up-next' && source.droppableId === 'backlog') {
      // We're moving from backlog to up-next, so set priority order
      updateTaskMutation.mutate({ 
        taskId: task.id, 
        status: 'Todo',
        priorityOrder: 1
      });
    } else if (destination.droppableId === 'backlog' && source.droppableId === 'up-next') {
      // We're moving from up-next to backlog, so clear priority order
      updateTaskMutation.mutate({ 
        taskId: task.id, 
        status: 'Todo',
        priorityOrder: null
      });
    } else {
      // For other moves, update the status
      updatedTask.status = targetColumnDef.status;
      
      // Update the task in the backend
      updateTaskMutation.mutate({ 
        taskId: task.id, 
        status: updatedTask.status 
      });
    }

    // If moving to Up Next, assign a priority order
    if (destination.droppableId === 'up-next') {
      updatedTask.priorityOrder = 1;
    } else if (destination.droppableId === 'backlog') {
      updatedTask.priorityOrder = null;
    }

    // Add to the new column at the destination index
    newColumns[destination.droppableId] = [
      ...newColumns[destination.droppableId].slice(0, destination.index),
      updatedTask,
      ...newColumns[destination.droppableId].slice(destination.index)
    ];

    // Update the state
    setColumns(newColumns);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMN_DEFINITIONS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={t(column.title.toLowerCase())}
            tasks={columns[column.id] || []}
            renderCard={(task, index) => (
              <Draggable
                key={`task-${task.id}`}
                draggableId={`task-${task.id}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-2 ${snapshot.isDragging ? 'opacity-70' : ''}`}
                  >
                    <Card className="shadow-sm hover:shadow transition-shadow duration-200">
                      <CardHeader className="p-3 pb-1">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">{task.title}</CardTitle>
                          <Badge className={getPriorityBadgeClass(task.priority)}>
                            <div className="flex items-center">
                              {getPriorityIcon(task.priority)}
                              <span className="text-xs">{t(task.priority?.toLowerCase() || '')}</span>
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      {task.description && (
                        <CardContent className="p-3 pt-1 pb-1">
                          <CardDescription className="line-clamp-2 text-xs">
                            {task.description}
                          </CardDescription>
                        </CardContent>
                      )}
                      <CardFooter className="p-3 pt-1 flex justify-between items-center">
                        {task.assignedUserId && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getUserName(task.assignedUserId).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {task.deadline && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {formatDate(task.deadline)}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </div>
                )}
              </Draggable>
            )}
          />
        ))}
      </div>
    </DragDropContext>
  );
} 