import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Task } from '@shared/schema';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  renderCard: (task: Task, index: number) => React.ReactNode;
  onAddTask?: () => void;
}

export function KanbanColumn({ id, title, tasks, renderCard, onAddTask }: KanbanColumnProps) {
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
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow overflow-y-auto p-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            {tasks.map((task, index) => renderCard(task, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {tasks.length === 0 && (
        <div className="p-3 text-center text-gray-500 text-sm italic">
          No tasks
        </div>
      )}
    </div>
  );
} 