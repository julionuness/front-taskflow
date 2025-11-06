import { Kanban, LogOut, FolderKanban } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/store/useAppStore";

const navigationItems = [
  { title: "Áreas de Trabalho", url: "/workareas", icon: FolderKanban },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { currentUser, logout } = useAppStore();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-card" 
      : "hover:bg-accent hover:text-accent-foreground transition-smooth";

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || currentUser?.role === 'admin'
  );

  return (
    <Sidebar
      className="transition-smooth border-r bg-card"
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Header */}
        <div className={`mb-6 ${isCollapsed ? "text-center" : ""}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Kanban className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold">TaskFlow</h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Kanban className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* User Info */}
        {currentUser && (
          <div className={`mb-6 ${isCollapsed ? "flex justify-center" : ""}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {currentUser.avatar || currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
                </div>
              </div>
            ) : (
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {currentUser.avatar || currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center gap-3 p-3 rounded-lg transition-smooth
                        ${getNavCls({ isActive })}
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-smooth"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}