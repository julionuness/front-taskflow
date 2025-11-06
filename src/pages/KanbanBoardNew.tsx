import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Trash2, GripVertical, ArrowLeft, AlertCircle, Users, Edit, BarChart3, Upload } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { CSVImportDialog } from '@/components/CSVImportDialog';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
  priority?: 'baixa' | 'moderada' | 'alta';
  assignedUserId?: string | null;
  assignedUserName?: string;
  dueDate?: string | null;
}

interface KanbanColumn {
  id: string;
  workAreaId: string;
  title: string;
  position: number;
  cards: KanbanCard[];
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  isManager: boolean;
}

// Componente de Card arrastável
function SortableCard({ card, onDelete, onEdit }: { card: KanbanCard; onDelete: (id: string) => void; onEdit: (card: KanbanCard) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'alta': return 'text-red-500 bg-red-50';
      case 'moderada': return 'text-yellow-500 bg-yellow-50';
      default: return 'text-green-500 bg-green-50';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'alta': return 'Alta';
      case 'moderada': return 'Moderada';
      default: return 'Baixa';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow relative"
    >
      {/* Ícone de usuário atribuído no canto superior direito */}
      {card.assignedUserName && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md border-2 border-white"
          title={card.assignedUserName}
        >
          <Users className="w-3 h-3 text-white" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-sm">{card.title}</h4>
              {card.description && (
                <p className="text-xs text-muted-foreground">{card.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {card.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getPriorityColor(card.priority)}`}>
                    <AlertCircle className="w-3 h-3" />
                    {getPriorityLabel(card.priority)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(card)}
            className="h-6 w-6 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(card.id)}
            className="h-6 w-6 p-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente Placeholder para colunas vazias
function DroppablePlaceholder({ columnId }: { columnId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `placeholder-${columnId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`text-center text-muted-foreground text-sm py-12 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-primary bg-primary/10 scale-105' : 'border-muted'
      }`}
    >
      {isOver ? 'Solte aqui' : 'Arraste cards para cá'}
    </div>
  );
}

// Componente de Coluna com zona de drop
function DroppableColumn({ column, onAddCard, onDeleteColumn, onImportCSV, children }: {
  column: KanbanColumn;
  onAddCard: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onImportCSV: (columnId: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">{column.title}</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onImportCSV(column.id)}
            title="Importar CSV"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddCard(column.id)}
            title="Adicionar card"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteColumn(column.id)}
            title="Excluir coluna"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[200px] rounded-lg p-2">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoardNew() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [workAreaTitle, setWorkAreaTitle] = useState<string>('Quadro Kanban');

  // Dialogs states
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false);
  const [isCSVImportDialogOpen, setIsCSVImportDialogOpen] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<'baixa' | 'moderada' | 'alta'>('baixa');
  const [newCardAssignedUser, setNewCardAssignedUser] = useState<string>('none');
  const [newCardDueDate, setNewCardDueDate] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');

  // Edit card states
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardPriority, setEditCardPriority] = useState<'baixa' | 'moderada' | 'alta'>('baixa');
  const [editCardAssignedUser, setEditCardAssignedUser] = useState<string>('');
  const [editCardDueDate, setEditCardDueDate] = useState<string>('');

  // Collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isManager, setIsManager] = useState(false);

  // AlertDialog state
  const [isDeleteColumnAlertOpen, setIsDeleteColumnAlertOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBoard();
    fetchCollaborators();
  }, []);

  const fetchBoard = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const workAreaId = localStorage.getItem('selectedWorkAreaId');

      if (!token || !workAreaId) {
        navigate('/workareas');
        return;
      }

      // Buscar o quadro kanban (agora inclui informações da área de trabalho)
      const response = await fetch(`http://localhost:3000/kanban/board/${workAreaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar quadro');
      }

      const data = await response.json();

      // Atualizar o título da área de trabalho
      if (data.workArea?.title) {
        setWorkAreaTitle(data.workArea.title);
      }

      // Converter IDs para strings
      const normalizedData = data.columns.map((col: any) => ({
        ...col,
        id: String(col.id),
        workAreaId: String(col.workAreaId),
        cards: col.cards.map((card: any) => ({
          ...card,
          id: String(card.id),
          columnId: String(card.columnId),
        })),
      }));
      setColumns(normalizedData);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar quadro",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const token = localStorage.getItem('token');
      const workAreaId = localStorage.getItem('selectedWorkAreaId');

      if (!token || !workAreaId) return;

      const response = await fetch(`http://localhost:3000/workareas/${workAreaId}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setCollaborators(Array.isArray(data) ? data : []);

      // Verificar se o usuário logado é manager
      const userResponse = await fetch('http://localhost:3000/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const currentUserInWorkArea = data.find((c: Collaborator) => c.id === userData.id);
        setIsManager(currentUserInWorkArea?.isManager || false);
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    }
  };

  const handleOpenEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setEditCardTitle(card.title);
    setEditCardDescription(card.description || '');
    setEditCardPriority(card.priority || 'baixa');
    setEditCardAssignedUser(card.assignedUserId ? String(card.assignedUserId) : 'none');
    setEditCardDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
    setIsEditCardDialogOpen(true);
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editCardTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/kanban/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editCardTitle,
          description: editCardDescription,
          priority: editCardPriority,
          assignedUserId: editCardAssignedUser === 'none' ? null : editCardAssignedUser,
          dueDate: editCardDueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar card');

      toast({ title: "Card atualizado!" });
      setIsEditCardDialogOpen(false);
      setEditingCard(null);
      fetchBoard();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const workAreaId = localStorage.getItem('selectedWorkAreaId');

      const response = await fetch('http://localhost:3000/kanban/columns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workAreaId, title: newColumnTitle }),
      });

      if (!response.ok) throw new Error('Erro ao criar coluna');

      toast({ title: "Coluna criada!" });
      setNewColumnTitle('');
      setIsColumnDialogOpen(false);
      fetchBoard();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !selectedColumnId || isCreatingCard) return;

    setIsCreatingCard(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3000/kanban/cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnId: selectedColumnId,
          title: newCardTitle,
          description: newCardDescription,
          priority: newCardPriority,
          assignedUserId: newCardAssignedUser === 'none' ? null : newCardAssignedUser,
          dueDate: newCardDueDate || null,
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar card');

      toast({ title: "Card criado com sucesso!" });
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardPriority('baixa');
      setNewCardAssignedUser('none');
      setNewCardDueDate('');
      setIsCardDialogOpen(false);
      fetchBoard();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsCreatingCard(false);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId);
    setIsDeleteColumnAlertOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/kanban/columns/${columnToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao deletar coluna');

      toast({ title: "Coluna deletada!" });
      setIsDeleteColumnAlertOpen(false);
      setColumnToDelete(null);
      fetchBoard();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/kanban/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao deletar card');

      toast({ title: "Card deletado!" });
      fetchBoard();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenCSVImport = (columnId: string) => {
    setSelectedColumnId(columnId);
    setIsCSVImportDialogOpen(true);
  };

  const handleCSVImportSuccess = (cards: any[]) => {
    toast({
      title: "Importação concluída!",
      description: `${cards.length} card${cards.length !== 1 ? 's' : ''} importado${cards.length !== 1 ? 's' : ''} com sucesso.`
    });
    fetchBoard();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    let overId = String(over.id);

    if (activeId === overId) return;

    setColumns((prevColumns) => {
      // Encontrar a coluna do card ativo
      const activeColumn = prevColumns.find((col) =>
        col.cards.some((card) => card.id === activeId)
      );

      if (!activeColumn) return prevColumns;

      // Determinar se estamos sobre um placeholder
      const isOverPlaceholder = overId.startsWith('placeholder-');
      let overColumn: KanbanColumn | undefined;

      if (isOverPlaceholder) {
        // Se é placeholder, pegar diretamente a coluna pelo ID
        const columnId = overId.replace('placeholder-', '');
        overColumn = prevColumns.find((col) => col.id === columnId);
      } else {
        // Se não é placeholder, procurar a coluna que contém o card
        overColumn = prevColumns.find((col) =>
          col.cards.some((card) => card.id === overId)
        );

        // Se não encontrou nos cards, procurar a coluna diretamente
        if (!overColumn) {
          overColumn = prevColumns.find((col) => col.id === overId);
        }
      }

      if (!overColumn) return prevColumns;

      // Se estamos na mesma coluna, reordena
      if (activeColumn.id === overColumn.id) {
        const activeIndex = activeColumn.cards.findIndex((card) => card.id === activeId);
        const overIndex = overColumn.cards.findIndex((card) => card.id === overId);

        if (activeIndex !== overIndex) {
          const newColumns = prevColumns.map((col) => {
            if (col.id === activeColumn.id) {
              return {
                ...col,
                cards: arrayMove(col.cards, activeIndex, overIndex),
              };
            }
            return col;
          });
          return newColumns;
        }
        return prevColumns;
      }

      // Se estamos movendo entre colunas diferentes
      const activeCards = activeColumn.cards;
      const overCards = overColumn.cards;

      const activeIndex = activeCards.findIndex((card) => card.id === activeId);
      const overIndex = overCards.findIndex((card) => card.id === overId);

      const activeCard = activeCards[activeIndex];

      const newActiveCards = activeCards.filter((card) => card.id !== activeId);
      const newOverCards = [...overCards];

      // Inserir no índice correto ou no final se estiver soltando na coluna vazia
      newOverCards.splice(overIndex >= 0 ? overIndex : overCards.length, 0, {
        ...activeCard,
        columnId: overColumn.id,
      });

      const newColumns = prevColumns.map((col) => {
        if (col.id === activeColumn.id) {
          return { ...col, cards: newActiveCards };
        }
        if (col.id === overColumn.id) {
          return { ...col, cards: newOverCards };
        }
        return col;
      });

      return newColumns;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);

    // Aguardar um pouco para garantir que o estado foi atualizado pelo handleDragOver
    setTimeout(() => {
      setColumns((currentColumns) => {
        saveCardPositions(currentColumns);
        return currentColumns;
      });
    }, 50);
  };

  const saveCardPositions = async (columnsToSave: KanbanColumn[]) => {
    try {
      const token = localStorage.getItem('token');
      const updates: Array<{ id: string; columnId: string; position: number }> = [];

      columnsToSave.forEach((col) => {
        col.cards.forEach((card, index) => {
          updates.push({
            id: card.id,
            columnId: col.id,
            position: index,
          });
        });
      });

      const response = await fetch('http://localhost:3000/kanban/cards/positions/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        console.error('Error saving positions');
      }
    } catch (err: any) {
      console.error('Error saving positions:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCard = activeId
    ? columns.flatMap(col => col.cards).find(card => card.id === activeId)
    : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/workareas')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">{workAreaTitle}</h1>
          </div>
          <div className="flex gap-2">
            <NotificationBell />
            {isManager && (
              <Button variant="outline" onClick={() => navigate('/manager/dashboard')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            )}
            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Coluna
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Coluna</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateColumn} className="space-y-4">
                  <div>
                    <Label htmlFor="columnTitle">Título</Label>
                    <Input
                      id="columnTitle"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="Ex: A Fazer, Em Progresso, Concluído"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsColumnDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Criar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.length === 0 ? (
              <Card className="w-96">
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">Crie sua primeira coluna para começar</p>
                </CardContent>
              </Card>
            ) : (
              columns.map((column) => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  onAddCard={(columnId) => {
                    setSelectedColumnId(columnId);
                    setIsCardDialogOpen(true);
                  }}
                  onDeleteColumn={handleDeleteColumn}
                  onImportCSV={handleOpenCSVImport}
                >
                  {column.cards.length === 0 ? (
                    <DroppablePlaceholder columnId={column.id} />
                  ) : (
                    <SortableContext
                      items={column.cards.map((card) => card.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {column.cards.map((card) => (
                          <SortableCard key={card.id} card={card} onDelete={handleDeleteCard} onEdit={handleOpenEditCard} />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </DroppableColumn>
              ))
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90">
                <h4 className="font-medium text-sm">{activeCard.title}</h4>
                {activeCard.description && (
                  <p className="text-xs text-muted-foreground mt-1">{activeCard.description}</p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Dialog para criar card */}
        <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Card</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <Label htmlFor="cardTitle">Título</Label>
                <Input
                  id="cardTitle"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Título do card"
                />
              </div>
              <div>
                <Label htmlFor="cardDescription">Descrição (opcional)</Label>
                <Textarea
                  id="cardDescription"
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  placeholder="Descrição do card"
                />
              </div>
              <div>
                <Label htmlFor="cardPriority">Prioridade</Label>
                <Select value={newCardPriority} onValueChange={(value: 'baixa' | 'moderada' | 'alta') => setNewCardPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cardDueDate">Data de Entrega</Label>
                <Input
                  id="cardDueDate"
                  type="date"
                  value={newCardDueDate}
                  onChange={(e) => setNewCardDueDate(e.target.value)}
                />
              </div>
              {isManager && (
                <div>
                  <Label htmlFor="cardAssignedUser">Atribuir a (opcional)</Label>
                  <Select value={newCardAssignedUser || 'none'} onValueChange={setNewCardAssignedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {collaborators.map((collab) => (
                        <SelectItem key={collab.id} value={String(collab.id)}>
                          {collab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCardDialogOpen(false)} disabled={isCreatingCard}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingCard}>
                  {isCreatingCard ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar card */}
        <Dialog open={isEditCardDialogOpen} onOpenChange={setIsEditCardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Card</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCard} className="space-y-4">
              <div>
                <Label htmlFor="editCardTitle">Título</Label>
                <Input
                  id="editCardTitle"
                  value={editCardTitle}
                  onChange={(e) => setEditCardTitle(e.target.value)}
                  placeholder="Título do card"
                />
              </div>
              <div>
                <Label htmlFor="editCardDescription">Descrição (opcional)</Label>
                <Textarea
                  id="editCardDescription"
                  value={editCardDescription}
                  onChange={(e) => setEditCardDescription(e.target.value)}
                  placeholder="Descrição do card"
                />
              </div>
              <div>
                <Label htmlFor="editCardPriority">Prioridade</Label>
                <Select value={editCardPriority} onValueChange={(value: 'baixa' | 'moderada' | 'alta') => setEditCardPriority(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCardDueDate">Data de Entrega</Label>
                <Input
                  id="editCardDueDate"
                  type="date"
                  value={editCardDueDate}
                  onChange={(e) => setEditCardDueDate(e.target.value)}
                />
              </div>
              {isManager && (
                <div>
                  <Label htmlFor="editCardAssignedUser">Atribuir a (opcional)</Label>
                  <Select value={editCardAssignedUser} onValueChange={setEditCardAssignedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {collaborators.map((collab) => (
                        <SelectItem key={collab.id} value={String(collab.id)}>
                          {collab.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditCardDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* CSV Import Dialog */}
        <CSVImportDialog
          open={isCSVImportDialogOpen}
          onOpenChange={setIsCSVImportDialogOpen}
          columnId={selectedColumnId}
          onImportSuccess={handleCSVImportSuccess}
        />

        {/* AlertDialog para confirmar exclusão de coluna */}
        <AlertDialog open={isDeleteColumnAlertOpen} onOpenChange={setIsDeleteColumnAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os cards desta coluna serão deletados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
