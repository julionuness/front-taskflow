import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskCard } from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Column = {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
};

const columns: Column[] = [
  {
    id: 'todo',
    title: 'A Fazer',
    status: 'todo',
    tasks: [],
  },
  {
    id: 'in-progress',
    title: 'Em Andamento',
    status: 'in-progress',
    tasks: [],
  },
  {
    id: 'done',
    title: 'Concluído',
    status: 'done',
    tasks: [],
  },
];

export default function KanbanBoard() {
  const { tasks, moveTask, currentUser } = useAppStore();
  const navigate = useNavigate();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as Record<Task['status'], Task[]>);

    return columns.map(column => ({
      ...column,
      tasks: grouped[column.status] || [],
    }));
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    // over.id can be a column id (status) or a task id inside a column
    let newStatus: Task['status'] | undefined;
    const overId = over.id as string;
    const possibleStatuses: Task['status'][] = ['todo', 'in-progress', 'done'];
    if ((possibleStatuses as string[]).includes(overId)) {
      newStatus = overId as Task['status'];
    } else {
      const overTask = tasks.find(t => t.id === overId);
      newStatus = overTask?.status;
    }

    if (!newStatus) return;

    // Find the task and its current status
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    moveTask(taskId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quadro Kanban</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas tarefas arrastando-as entre as colunas
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button 
            onClick={() => navigate('/task/new')}
            className="gradient-primary hover:shadow-hover transition-bounce"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tasksByStatus.map((column) => (
            <SortableContext
              key={column.id}
              items={column.tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                column={column}
                tasks={column.tasks}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}