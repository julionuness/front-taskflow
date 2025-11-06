import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityConfig = {
  high: { 
    label: 'Alta', 
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300', 
    icon: AlertCircle 
  },
  medium: { 
    label: 'Média', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300', 
    icon: Clock 
  },
  low: { 
    label: 'Baixa', 
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300', 
    icon: Clock 
  },
};

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  // Configuração da prioridade (fallback para "low" se não houver)
  const priorityInfo = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.low;
  const PriorityIcon = priorityInfo.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing shadow-card hover:shadow-hover transition-smooth',
        'gradient-card border border-border/50',
        isBeingDragged && 'shadow-drag rotate-3 scale-105 opacity-90'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {task.title}
          </h3>
          <Badge 
            variant="outline" 
            className={cn('text-xs shrink-0', priorityInfo.color)}
          >
            <PriorityIcon className="w-3 h-3 mr-1" />
            {priorityInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-end">
          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(task.dueDate), 'dd/MM', { locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
