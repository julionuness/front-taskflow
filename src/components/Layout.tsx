import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAppStore } from "@/store/useAppStore";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, isLoading, initAuth } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    // Initialize supabase session and preload data
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  // Páginas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/register', '/'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Se não está autenticado e não está em rota pública, redireciona para login
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center h-full px-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">TaskFlow - Gerenciamento de Tarefas</h2>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}