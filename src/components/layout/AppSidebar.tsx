import { BarChart3, Package, Building2, FileText, ShoppingCart, History, TrendingUp, Users, Settings, LogOut, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
const mainItems = [{
  title: "Dashboard",
  url: "/",
  icon: BarChart3,
  color: "text-primary",
  bgColor: "bg-primary/5",
  hoverBg: "hover:bg-primary/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
}, {
  title: "Produtos",
  url: "/produtos",
  icon: Package,
  color: "text-success",
  bgColor: "bg-success/5",
  hoverBg: "hover:bg-success/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
}, {
  title: "Fornecedores",
  url: "/fornecedores",
  icon: Building2,
  color: "text-warning",
  bgColor: "bg-warning/5",
  hoverBg: "hover:bg-warning/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(251,146,60,0.3)]"
}, {
  title: "Cotações",
  url: "/cotacoes",
  icon: FileText,
  color: "text-info",
  bgColor: "bg-info/5",
  hoverBg: "hover:bg-info/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
}, {
  title: "Pedidos",
  url: "/pedidos",
  icon: ShoppingCart,
  color: "text-primary",
  bgColor: "bg-primary/5",
  hoverBg: "hover:bg-primary/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
}, {
  title: "Histórico",
  url: "/historico",
  icon: History,
  color: "text-muted-foreground",
  bgColor: "bg-muted/5",
  hoverBg: "hover:bg-muted/10",
  glowColor: "group-hover:shadow-[0_0_10px_rgba(100,116,139,0.2)]"
}];
const analyticsItems = [{
  title: "Relatórios",
  url: "/relatorios",
  icon: TrendingUp,
  color: "text-primary",
  bgColor: "bg-primary/5",
  hoverBg: "hover:bg-primary/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
}, {
  title: "Analytics",
  url: "/analytics",
  icon: BarChart3,
  color: "text-primary",
  bgColor: "bg-primary/5",
  hoverBg: "hover:bg-primary/10",
  glowColor: "group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
}];

const systemItems = [{
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings,
  color: "text-muted-foreground",
  bgColor: "bg-muted/5",
  hoverBg: "hover:bg-muted/10",
  glowColor: "group-hover:shadow-[0_0_10px_rgba(100,116,139,0.2)]"
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (path: string) => isActive(path) ? "bg-primary/10 text-primary font-semibold shadow-sm border-l-3 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50";
  return <Sidebar className="border-r border-border/50 bg-card/40 backdrop-blur-md shadow-sm" collapsible="icon">
      {/* Logo */}
      <div className={cn("p-4 border-b border-border/50", isCollapsed ? "flex justify-center" : "px-6")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "flex-col")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 hover:scale-105">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && <div className="transition-opacity duration-200">
              <h2 className="font-bold text-lg text-foreground leading-tight">CotaçõesPro</h2>
              <p className="text-xs text-muted-foreground/80 font-medium">Sistema de Gestão</p>
            </div>}
        </div>
      </div>

      <SidebarContent className="py-4">
        <TooltipProvider delayDuration={0}>
          {/* Main Navigation */}
          <SidebarGroup className="mx-0 px-0">
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : "px-4 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1"}>
              Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map(item => {
                  const isItemActive = isActive(item.url);
                  const navContent = (
                    <NavLink to={item.url} end className={cn(
                      "flex items-center transition-all duration-300 group",
                      isCollapsed 
                        ? "w-full justify-center py-3 rounded-xl" 
                        : "gap-3 px-4 py-2.5 mx-2 rounded-xl",
                      isItemActive 
                        ? `${item.bgColor} ${item.color} font-semibold shadow-sm ${!isCollapsed && `border-l-3 ${item.color.replace('text-', 'border-')}`}`
                        : `text-muted-foreground/70 hover:text-foreground ${item.hoverBg}`
                    )}>
                      <div className={cn(
                        "rounded-lg transition-all duration-300 flex items-center justify-center",
                        isCollapsed ? "p-2" : "p-1.5",
                        item.bgColor,
                        item.hoverBg,
                        item.glowColor
                      )}>
                        <item.icon className={cn(
                          "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                          isCollapsed ? "h-5 w-5" : "h-4 w-4",
                          isItemActive ? item.color : `${item.color}/70`
                        )} />
                      </div>
                      {!isCollapsed && <span className="font-medium transition-colors duration-200">{item.title}</span>}
                    </NavLink>
                  );

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="my-0.5 p-0">
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {navContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          navContent
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Analytics */}
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : "px-4 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1"}>
              Analytics
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {analyticsItems.map(item => {
                  const isItemActive = isActive(item.url);
                  const navContent = (
                    <NavLink to={item.url} className={cn(
                      "flex items-center transition-all duration-300 group",
                      isCollapsed 
                        ? "w-full justify-center py-3 rounded-xl" 
                        : "gap-3 px-4 py-2.5 mx-2 rounded-xl",
                      isItemActive
                        ? `${item.bgColor} ${item.color} font-semibold shadow-sm ${!isCollapsed && `border-l-3 ${item.color.replace('text-', 'border-')}`}`
                        : `text-muted-foreground/70 hover:text-foreground ${item.hoverBg}`
                    )}>
                      <div className={cn(
                        "rounded-lg transition-all duration-300 flex items-center justify-center",
                        isCollapsed ? "p-2" : "p-1.5",
                        item.bgColor,
                        item.hoverBg,
                        item.glowColor
                      )}>
                        <item.icon className={cn(
                          "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                          isCollapsed ? "h-5 w-5" : "h-4 w-4",
                          isItemActive ? item.color : `${item.color}/70`
                        )} />
                      </div>
                      {!isCollapsed && <span className="font-medium transition-colors duration-200">{item.title}</span>}
                    </NavLink>
                  );

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="my-0.5 p-0">
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {navContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          navContent
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Sistema */}
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : "px-4 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1"}>
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map(item => {
                  const isItemActive = isActive(item.url);
                  const navContent = (
                    <NavLink to={item.url} className={cn(
                      "flex items-center transition-all duration-300 group",
                      isCollapsed 
                        ? "w-full justify-center py-3 rounded-xl" 
                        : "gap-3 px-4 py-2.5 mx-2 rounded-xl",
                      isItemActive
                        ? `${item.bgColor} ${item.color} font-semibold shadow-sm ${!isCollapsed && `border-l-3 ${item.color.replace('text-', 'border-')}`}`
                        : `text-muted-foreground/70 hover:text-foreground ${item.hoverBg}`
                    )}>
                      <div className={cn(
                        "rounded-lg transition-all duration-300 flex items-center justify-center",
                        isCollapsed ? "p-2" : "p-1.5",
                        item.bgColor,
                        item.hoverBg,
                        item.glowColor
                      )}>
                        <item.icon className={cn(
                          "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                          isCollapsed ? "h-5 w-5" : "h-4 w-4",
                          isItemActive ? item.color : `${item.color}/70`
                        )} />
                      </div>
                      {!isCollapsed && <span className="font-medium transition-colors duration-200">{item.title}</span>}
                    </NavLink>
                  );

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="my-0.5 p-0">
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {navContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          navContent
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </TooltipProvider>

        {/* User Info */}
        <div className="mt-auto pt-4 border-t border-border/50">
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "w-full flex items-center rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer group",
                isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-3"
              )}>
                <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-md shadow-primary/20 ring-2 ring-primary/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/30">
                  <Users className="h-4 w-4 text-white" />
                </div>
                {!isCollapsed && <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">Admin</p>
                    <p className="text-xs text-muted-foreground/70 truncate font-medium">Sistema Ativo</p>
                  </div>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl" align="end" side="top" sideOffset={8}>
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Admin</p>
                  <p className="text-xs text-muted-foreground">admin@cotacoespro.com</p>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-1">
                <button 
                  onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors text-sm text-foreground group"
                >
                  <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium">Meu Perfil</span>
                </button>
                
                <NavLink 
                  to="/configuracoes"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors text-sm text-foreground group"
                >
                  <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-medium">Configurações</span>
                </NavLink>
                
                <Separator className="my-2" />
                
                <button 
                  onClick={() => toast.success("Logout realizado com sucesso")}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive group"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarContent>
    </Sidebar>;
}