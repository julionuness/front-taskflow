import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CheckCircle, Clock, AlertCircle, Users, ArrowLeft, Loader2, TrendingUp, ListTodo } from 'lucide-react';
import { ActivityHistory } from '@/components/ActivityHistory';

interface KanbanStats {
  totalCards: number;
  cardsByColumn: Array<{ columnTitle: string; count: number }>;
  cardsByPriority: Array<{ priority: string; count: number }>;
  cardsByUser: Array<{ userName: string; count: number }>;
  unassignedCards: number;
  workAreaTitle: string;
}

const PRIORITY_COLORS = {
  alta: '#ef4444',
  moderada: '#f59e0b',
  baixa: '#10b981',
};

const CHART_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#6366f1', // indigo
];

export default function ManagerDashboard() {
  const [stats, setStats] = useState<KanbanStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkManagerStatus();
    fetchStats();
  }, []);

  const checkManagerStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const workAreaId = localStorage.getItem('selectedWorkAreaId');

      if (!token || !workAreaId) {
        navigate('/workareas');
        return;
      }

      // Verificar se o usuário é manager
      const userResponse = await fetch('http://localhost:3000/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        navigate('/workareas');
        return;
      }

      const userData = await userResponse.json();

      // Buscar colaboradores da área de trabalho
      const collabResponse = await fetch(`http://localhost:3000/workareas/${workAreaId}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!collabResponse.ok) {
        navigate('/workareas');
        return;
      }

      const collaborators = await collabResponse.json();
      const currentUserInWorkArea = collaborators.find((c: any) => c.id === userData.id);

      if (!currentUserInWorkArea?.isManager) {
        toast({
          title: "Acesso negado",
          description: "Apenas gerentes podem acessar o dashboard",
          variant: "destructive",
        });
        navigate('/kanban-new');
        return;
      }

      setIsManager(true);
    } catch (err: any) {
      toast({
        title: "Erro ao verificar permissões",
        description: err.message,
        variant: "destructive",
      });
      navigate('/workareas');
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const workAreaId = localStorage.getItem('selectedWorkAreaId');

      if (!token || !workAreaId) {
        navigate('/workareas');
        return;
      }

      const response = await fetch(`http://localhost:3000/kanban/stats/${workAreaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !isManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const priorityData = stats.cardsByPriority.map(item => ({
    name: item.priority === 'alta' ? 'Alta' : item.priority === 'moderada' ? 'Moderada' : 'Baixa',
    value: item.count,
    color: PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || '#10b981',
  }));

  const columnData = stats.cardsByColumn.map((item, index) => ({
    name: item.columnTitle,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/kanban-new')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Kanban
            </Button>
            <Button onClick={fetchStats} variant="outline">
              Atualizar
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard do Manager</h1>
            <p className="text-muted-foreground mt-2">
              {stats.workAreaTitle} - Visão geral das tarefas e métricas
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cards</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCards}</div>
              <p className="text-xs text-muted-foreground">
                Cards no quadro kanban
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colunas Ativas</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.cardsByColumn.length}</div>
              <p className="text-xs text-muted-foreground">
                Colunas no quadro
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cards Atribuídos</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalCards - stats.unassignedCards}
              </div>
              <p className="text-xs text-muted-foreground">
                Com responsáveis definidos
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Atribuição</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unassignedCards}</div>
              <p className="text-xs text-muted-foreground">
                Cards aguardando atribuição
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cards por Coluna */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Cards por Coluna</CardTitle>
              <CardDescription>
                Distribuição de cards entre as colunas do kanban
              </CardDescription>
            </CardHeader>
            <CardContent>
              {columnData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={columnData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
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
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {columnData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhuma coluna criada ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards por Prioridade */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Cards por Prioridade</CardTitle>
              <CardDescription>
                Distribuição das tarefas por nível de prioridade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priorityData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum card criado ainda
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cards por Usuário e Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cards por Usuário */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Cards por Colaborador</CardTitle>
              <CardDescription>
                Quantidade de cards atribuídos a cada colaborador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.cardsByUser.length > 0 || stats.unassignedCards > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      ...stats.cardsByUser.map((item, index) => ({
                        name: item.userName,
                        value: item.count,
                        color: CHART_COLORS[index % CHART_COLORS.length],
                      })),
                      ...(stats.unassignedCards > 0 ? [{
                        name: 'Não Atribuído',
                        value: stats.unassignedCards,
                        color: '#9ca3af',
                      }] : [])
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
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
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    >
                      {stats.cardsByUser.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum card atribuído ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Atividades */}
          <ActivityHistory
            workAreaId={localStorage.getItem('selectedWorkAreaId') || ''}
            limit={15}
            showTitle={true}
          />
        </div>
      </div>
    </div>
  );
}
