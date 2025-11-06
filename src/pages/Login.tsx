import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/useAppStore';
import { Kanban, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, isLoading, fetchTasks } = useAppStore();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/workareas" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    const result = await login(email, password);
    console.log('Login result:', result);

    if (result.success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao TaskFlow",
      });
    } else {
      const errorMessage = result.error || 'Credenciais inválidas. Tente novamente.';
      console.log('Setting error:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-hover">
              <Kanban className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TaskFlow</h1>
            <p className="text-muted-foreground mt-2">
              Sistema de gerenciamento de tarefas
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="transition-smooth"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="transition-smooth"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary hover:shadow-hover transition-bounce"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Criar conta
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}