import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { useEffect } from 'react';

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b', 
  low: '#10b981'
};

const STATUS_COLORS = {
  done: '#10b981',
  'in-progress': '#f59e0b',
  todo: '#6b7280'
};

export default function Dashboard() {
  const { getDashboardStats, currentUser, fetchTasks } = useAppStore(); 
  const stats = getDashboardStats();

  const statusData = [
    { name: 'Concluídas', value: stats.completedTasks, color: STATUS_COLORS.done },
    { name: 'Em Andamento', value: stats.inProgressTasks, color: STATUS_COLORS['in-progress'] },
    { name: 'A Fazer', value: stats.todoTasks, color: STATUS_COLORS.todo },
  ];

  const priorityData = stats.tasksByPriority.map(item => ({
    name: item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa',
    value: item.count,
    color: PRIORITY_COLORS[item.priority]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {currentUser?.name}! Aqui está um resumo das suas tarefas.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Todas as tarefas no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate.toFixed(1)}% de conclusão
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas sendo executadas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-hover transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Fazer</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.todoTasks}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by User */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Tarefas por Usuário</CardTitle>
            <CardDescription>
              Distribuição de tarefas entre os membros da equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.tasksByUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="userName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Status das Tarefas</CardTitle>
            <CardDescription>
              Distribuição atual das tarefas por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Priority */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Tarefas por Prioridade</CardTitle>
          <CardDescription>
            Distribuição das tarefas por nível de prioridade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}