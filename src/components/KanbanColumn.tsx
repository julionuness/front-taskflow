import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { Column, Task } from '@/types';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
}

const columnStyles = {
  todo: 'bg-column-todo border-column-todo-border',
  'in-progress': 'bg-column-progress border-column-progress-border',
  done: 'bg-column-done border-column-done-border',
};

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  return (
    <Card 
      className={cn(
        'h-fit min-h-[500px] shadow-card transition-smooth',
        columnStyles[column.status],
        isOver && 'ring-2 ring-primary/50 shadow-hover'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{column.title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      
      <div 
        ref={setNodeRef} 
        className="px-4 pb-4 space-y-3 min-h-[400px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Nenhuma tarefa</p>
          </div>
        )}
      </div>
    </Card>
  );
}