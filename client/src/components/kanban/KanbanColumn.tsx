import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@shared/schema';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CalendarIcon, Clock, AlertOctagon, CheckCircle } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n-new';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask?: () => void;
}

interface SortableTaskProps {
  task: Task;
  users?: any[];
}

function SortableTask({ task, users }: SortableTaskProps) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
    const user = users.find((u: any) => u.id === userId);
    return user ? user.name : "-";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    return format(new Date(date), "MMM d");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2"
    >
      <Card className="shadow-sm hover:shadow transition-shadow duration-200 cursor-grab active:cursor-grabbing">
        <CardHeader className="p-3 pb-1">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-medium">{task.title}</CardTitle>
            <Badge className={getPriorityBadgeClass(task.priority ?? null)}>
              <div className="flex items-center">
                {getPriorityIcon(task.priority ?? null)}
                <span className="text-xs">{t(task.priority?.toLowerCase() ?? '')}</span>
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
                {getUserName(task.assignedUserId).split(' ').map((n: string) => n[0]).join('')}
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
  );
}

export function KanbanColumn({ id, title, tasks, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const taskIds = tasks.map(task => `task-${task.id}`);

  return (
    <div className="kanban-column w-72 min-w-72 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-md shadow flex flex-col">
      <div className="p-3 font-medium flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span>{title}</span>
          <span className="ml-2 text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 px-2 rounded-full">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={onAddTask}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-grow overflow-y-auto p-2 transition-colors ${
            isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {tasks.map((task) => (
            <SortableTask key={`task-${task.id}`} task={task} />
          ))}
        </div>
      </SortableContext>
      {tasks.length === 0 && (
        <div className="p-3 text-center text-gray-500 text-sm italic">
          No tasks
        </div>
      )}
    </div>
  );
} 