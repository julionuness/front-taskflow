import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { Task } from '@/types';
import { useToast } from '@/hooks/use-toast';

type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export default function NewTask() {
  const navigate = useNavigate();
  const { addTask, currentUser, isAuthenticated } = useAppStore();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch } = useForm<TaskFormData>();

  const onSubmit = async (data: TaskFormData) => {
    if (!isAuthenticated || !currentUser?.id) {
      toast({
        title: 'Você precisa estar logado',
        description: 'Faça login para criar uma tarefa.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    await addTask({
      ...data,
      createdBy: currentUser.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    toast({
      title: 'Tarefa criada com sucesso!',
      description: 'A tarefa foi adicionada ao quadro Kanban.',
    });

    navigate('/kanban');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Tarefa</h1>
        <p className="text-muted-foreground mt-2">
          Crie uma nova tarefa e atribua a um membro da equipe
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Detalhes da Tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title', { required: true })}
                placeholder="Digite o título da tarefa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Responsável *</Label>
                <Input
                  id="assignedTo"
                  placeholder="Digite o responsável (nome ou ID)"
                  {...register('assignedTo', { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select onValueChange={(value) => setValue('priority', value as Task['priority'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(value) => setValue('status', value as Task['status'])} defaultValue="todo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in-progress">Em Andamento</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="gradient-primary hover:shadow-hover transition-bounce"
              >
                Criar Tarefa
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/kanban')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}