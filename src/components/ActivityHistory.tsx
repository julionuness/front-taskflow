import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  UserPlus,
  UserMinus,
  Activity,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  actionType: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  description: string;
  metadata: any;
  createdAt: string;
}

interface ActivityHistoryProps {
  workAreaId: string;
  limit?: number;
  showTitle?: boolean;
}

const actionIcons: { [key: string]: React.ReactNode } = {
  create: <Plus className="w-4 h-4" />,
  update: <Pencil className="w-4 h-4" />,
  delete: <Trash2 className="w-4 h-4" />,
  move: <ArrowRight className="w-4 h-4" />,
  add_user: <UserPlus className="w-4 h-4" />,
  remove_user: <UserMinus className="w-4 h-4" />,
};

const actionColors: { [key: string]: string } = {
  create: 'bg-green-100 text-green-800 border-green-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  move: 'bg-purple-100 text-purple-800 border-purple-200',
  add_user: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  remove_user: 'bg-orange-100 text-orange-800 border-orange-200',
};

const entityIcons: { [key: string]: string } = {
  card: '📋',
  column: '📊',
  workarea: '🏢',
  user: '👤',
};

export function ActivityHistory({ workAreaId, limit = 20, showTitle = true }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    fetchActivities();
  }, [workAreaId]);

  useEffect(() => {
    applyFilters();
  }, [activities, selectedFilters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:3000/activity/workarea/${workAreaId}?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico de atividades');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err: any) {
      console.error('Erro ao buscar atividades:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'data inválida';
    }
  };

  const applyFilters = () => {
    if (selectedFilters.length === 0) {
      setFilteredActivities(activities);
      return;
    }

    const filtered = activities.filter(activity => {
      return selectedFilters.includes(activity.actionType);
    });

    setFilteredActivities(filtered);
  };

  const toggleFilter = (filterType: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(filterType)) {
        return prev.filter(f => f !== filterType);
      } else {
        return [...prev, filterType];
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const filterOptions = [
    { value: 'create', label: 'Criações', icon: <Plus className="w-3 h-3" />, color: 'bg-green-100 text-green-800 hover:bg-green-200' },
    { value: 'update', label: 'Atualizações', icon: <Pencil className="w-3 h-3" />, color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    { value: 'delete', label: 'Exclusões', icon: <Trash2 className="w-3 h-3" />, color: 'bg-red-100 text-red-800 hover:bg-red-200' },
    { value: 'move', label: 'Movimentações', icon: <ArrowRight className="w-3 h-3" />, color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
    { value: 'add_user', label: 'Usuários Adicionados', icon: <UserPlus className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
    { value: 'remove_user', label: 'Usuários Removidos', icon: <UserMinus className="w-3 h-3" />, color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  ];

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Histórico de Atividades
            </CardTitle>
            <CardDescription>Carregando atividades...</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Histórico de Atividades
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center gap-2 text-red-600 p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Histórico de Atividades
          </CardTitle>
          <CardDescription>
            {filteredActivities.length > 0
              ? selectedFilters.length > 0
                ? `${filteredActivities.length} de ${activities.length} atividades (filtrado)`
                : `${activities.length} atividades recentes`
              : 'Nenhuma atividade encontrada'}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {/* Filtros */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Filtrar por tipo:</p>
            {selectedFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                onClick={() => toggleFilter(filter.value)}
                className={`
                  flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                  border transition-all duration-200
                  ${selectedFilters.includes(filter.value)
                    ? `${filter.color} border-current ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>
              {activities.length === 0
                ? 'Nenhuma atividade registrada ainda'
                : 'Nenhuma atividade encontrada com os filtros selecionados'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-full border ${actionColors[activity.actionType] || 'bg-gray-100 text-gray-800'}`}>
                    {actionIcons[activity.actionType] || <Activity className="w-4 h-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          <span className="font-semibold">{activity.userName}</span>
                          {' '}
                          <span className="text-gray-700">{activity.description}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span className="whitespace-nowrap">{formatDate(activity.createdAt)}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {activity.metadata.fromColumn && activity.metadata.toColumn && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.fromColumn} → {activity.metadata.toColumn}
                          </Badge>
                        )}
                        {activity.metadata.priority && (
                          <Badge variant="outline" className="text-xs">
                            Prioridade: {activity.metadata.priority}
                          </Badge>
                        )}
                        {activity.metadata.addedUserName && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.addedUserName}
                          </Badge>
                        )}
                        {activity.metadata.removedUserName && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.removedUserName}
                          </Badge>
                        )}
                        {/* Mudanças detalhadas */}
                        {activity.metadata.changes && (
                          <>
                            {activity.metadata.changes.title && (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                <span className="line-through text-gray-500">{activity.metadata.changes.title.old}</span>
                                {' → '}
                                <span className="font-semibold">{activity.metadata.changes.title.new}</span>
                              </Badge>
                            )}
                            {activity.metadata.changes.priority && (
                              <Badge variant="outline" className="text-xs bg-amber-50">
                                Prioridade: <span className="line-through">{activity.metadata.changes.priority.old}</span>
                                {' → '}
                                <span className="font-semibold">{activity.metadata.changes.priority.new}</span>
                              </Badge>
                            )}
                            {activity.metadata.changes.description && (
                              <Badge variant="outline" className="text-xs bg-purple-50">
                                ✏️ Descrição alterada
                              </Badge>
                            )}
                            {activity.metadata.changes.dueDate && (
                              <Badge variant="outline" className="text-xs bg-green-50">
                                📅 Data alterada
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
