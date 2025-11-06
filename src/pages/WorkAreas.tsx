import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Kanban, Plus, Loader2, Users, FolderKanban, UserPlus, X, Trash2, MoreVertical } from 'lucide-react';

interface WorkArea {
  id: string;
  title: string;
  isManager?: boolean;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  isManager: boolean;
}

export default function WorkAreas() {
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkAreaTitle, setNewWorkAreaTitle] = useState('');
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Collaborators state
  const [isCollabDialogOpen, setIsCollabDialogOpen] = useState(false);
  const [selectedWorkArea, setSelectedWorkArea] = useState<WorkArea | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

  // AlertDialog state
  const [isRemoveCollabAlertOpen, setIsRemoveCollabAlertOpen] = useState(false);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<string | null>(null);

  // Delete WorkArea state
  const [isDeleteWorkAreaDialogOpen, setIsDeleteWorkAreaDialogOpen] = useState(false);
  const [workAreaToDelete, setWorkAreaToDelete] = useState<WorkArea | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkAreas();
  }, []);

  const fetchWorkAreas = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/workareas/my-workareas', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar áreas de trabalho');
      }

      const data = await response.json();
      setWorkAreas(data);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar áreas de trabalho",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newWorkAreaTitle.trim()) {
      setError('Por favor, insira um título para a área de trabalho');
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3000/workareas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newWorkAreaTitle }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar área de trabalho');
      }

      toast({
        title: "Área de trabalho criada!",
        description: "Sua nova área foi criada com sucesso",
      });

      setNewWorkAreaTitle('');
      setIsDialogOpen(false);
      fetchWorkAreas();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar. Tente novamente.');
      toast({
        title: "Erro ao criar área de trabalho",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectWorkArea = (workAreaId: string) => {
    // Salvar o workAreaId selecionado no localStorage
    localStorage.setItem('selectedWorkAreaId', workAreaId);
    // Navegar para o kanban
    navigate('/kanban-new');
  };

  const handleOpenCollaborators = async (workArea: WorkArea) => {
    if (!workArea.isManager) {
      toast({
        title: "Sem permissão",
        description: "Apenas gerentes podem gerenciar colaboradores",
        variant: "destructive",
      });
      return;
    }

    setSelectedWorkArea(workArea);
    setIsCollabDialogOpen(true);
    await fetchCollaborators(workArea.id);
  };

  const fetchCollaborators = async (workAreaId: string) => {
    setIsLoadingCollaborators(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/workareas/${workAreaId}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar colaboradores');

      const data = await response.json();
      // Garantir que data é um array
      setCollaborators(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({
        title: "Erro ao carregar colaboradores",
        description: err.message,
        variant: "destructive",
      });
      setCollaborators([]);
    } finally {
      setIsLoadingCollaborators(false);
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollaboratorEmail.trim() || !selectedWorkArea) return;

    setIsAddingCollaborator(true);
    try {
      const token = localStorage.getItem('token');

      // Primeiro buscar o usuário pelo email
      const userResponse = await fetch(`http://localhost:3000/auth/user-by-email?email=${encodeURIComponent(newCollaboratorEmail)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.error || 'Usuário não encontrado');
      }

      const user = await userResponse.json();

      // Verificar se já é colaborador
      if (collaborators.some(c => c.id === user.id)) {
        throw new Error('Este usuário já é um colaborador');
      }

      // Adicionar como colaborador
      const addResponse = await fetch('http://localhost:3000/workareas/add-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workAreaId: selectedWorkArea.id,
          userId: user.id,
          isManager: false,
        }),
      });

      if (!addResponse.ok) throw new Error('Erro ao adicionar colaborador');

      toast({
        title: "Colaborador adicionado!",
        description: `${user.name} foi adicionado à área de trabalho`,
      });

      setNewCollaboratorEmail('');
      await fetchCollaborators(selectedWorkArea.id);
    } catch (err: any) {
      toast({
        title: "Erro ao adicionar colaborador",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = (userId: string) => {
    setCollaboratorToRemove(userId);
    setIsRemoveCollabAlertOpen(true);
  };

  const confirmRemoveCollaborator = async () => {
    if (!selectedWorkArea || !collaboratorToRemove) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3000/workareas/remove-user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workAreaId: selectedWorkArea.id,
          userId: collaboratorToRemove,
        }),
      });

      if (!response.ok) throw new Error('Erro ao remover colaborador');

      toast({
        title: "Colaborador removido",
      });

      setIsRemoveCollabAlertOpen(false);
      setCollaboratorToRemove(null);
      await fetchCollaborators(selectedWorkArea.id);
    } catch (err: any) {
      toast({
        title: "Erro ao remover colaborador",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkArea = (workArea: WorkArea) => {
    setWorkAreaToDelete(workArea);
    setDeleteConfirmText('');
    setIsDeleteWorkAreaDialogOpen(true);
  };

  const confirmDeleteWorkArea = async () => {
    if (!workAreaToDelete) return;

    if (deleteConfirmText !== workAreaToDelete.title) {
      toast({
        title: "Erro",
        description: "O nome digitado não corresponde ao nome da área de trabalho",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/workareas/${workAreaToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao deletar área de trabalho');

      toast({
        title: "Área de trabalho deletada!",
        description: "A área de trabalho foi removida com sucesso",
      });

      setIsDeleteWorkAreaDialogOpen(false);
      setWorkAreaToDelete(null);
      setDeleteConfirmText('');
      await fetchWorkAreas();
    } catch (err: any) {
      toast({
        title: "Erro ao deletar área de trabalho",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-hover">
                <Kanban className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Áreas de Trabalho</h1>
                <p className="text-muted-foreground">
                  Selecione uma área ou crie uma nova
                </p>
              </div>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:shadow-hover transition-bounce">
                <Plus className="w-4 h-4 mr-2" />
                Nova Área
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Área de Trabalho</DialogTitle>
                <DialogDescription>
                  Crie uma nova área para organizar suas tarefas e colaborar com sua equipe
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorkArea} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Área</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Ex: Projeto Marketing, Desenvolvimento Web..."
                    value={newWorkAreaTitle}
                    onChange={(e) => setNewWorkAreaTitle(e.target.value)}
                    disabled={isCreating}
                    className="transition-smooth"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setError('');
                      setNewWorkAreaTitle('');
                    }}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-primary hover:shadow-hover transition-bounce"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {isCreating ? 'Criando...' : 'Criar Área'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Work Areas Grid */}
        {workAreas.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
                    <FolderKanban className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Nenhuma área de trabalho</h3>
                  <p className="text-muted-foreground mt-2">
                    Crie sua primeira área de trabalho para começar
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary hover:shadow-hover transition-bounce">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Área
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workAreas.map((workArea) => (
              <Card
                key={workArea.id}
                className="shadow-card hover:shadow-hover transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center transition-colors">
                        <FolderKanban className="w-6 h-6 text-primary" />
                      </div>
                      {workArea.isManager && (
                        <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium">
                          Gerente
                        </div>
                      )}
                    </div>
                    {workArea.isManager && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenCollaborators(workArea)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Gerenciar Colaboradores
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteWorkArea(workArea)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deletar Área
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardTitle className="text-xl mt-4">{workArea.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Área de trabalho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleSelectWorkArea(workArea.id)}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Colaboradores */}
        <Dialog open={isCollabDialogOpen} onOpenChange={setIsCollabDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Colaboradores</DialogTitle>
              <DialogDescription>
                {selectedWorkArea?.title} - Adicione ou remova colaboradores desta área
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Formulário para adicionar colaborador */}
              <form onSubmit={handleAddCollaborator} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="collaboratorEmail">Adicionar Colaborador por Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="collaboratorEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      disabled={isAddingCollaborator}
                    />
                    <Button type="submit" disabled={isAddingCollaborator}>
                      {isAddingCollaborator ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Lista de colaboradores */}
              <div className="space-y-2">
                <Label>Colaboradores Atuais</Label>
                {isLoadingCollaborators ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : collaborators.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    Nenhum colaborador ainda. Adicione o primeiro!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{collaborator.name}</p>
                            <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {collaborator.isManager && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Gerente
                            </span>
                          )}
                          {!collaborator.isManager && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCollaborator(collaborator.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AlertDialog para confirmar remoção de colaborador */}
        <AlertDialog open={isRemoveCollabAlertOpen} onOpenChange={setIsRemoveCollabAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O colaborador será removido permanentemente desta área de trabalho.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveCollaborator} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog para confirmar exclusão de área de trabalho */}
        <Dialog open={isDeleteWorkAreaDialogOpen} onOpenChange={setIsDeleteWorkAreaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deletar Área de Trabalho</DialogTitle>
              <DialogDescription>
                Esta ação é irreversível. Todos os dados da área de trabalho serão permanentemente deletados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertDescription>
                  Para confirmar, digite <strong>{workAreaToDelete?.title}</strong> no campo abaixo:
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="confirmDelete">Nome da Área de Trabalho</Label>
                <Input
                  id="confirmDelete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={workAreaToDelete?.title}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteWorkAreaDialogOpen(false);
                  setDeleteConfirmText('');
                  setWorkAreaToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeleteWorkArea}
                disabled={deleteConfirmText !== workAreaToDelete?.title}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Permanentemente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
