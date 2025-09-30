import { BarChart3, Package, Building2, FileText, ShoppingCart, History, TrendingUp, Users, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
const mainItems = [{
  title: "Dashboard",
  url: "/",
  icon: BarChart3
}, {
  title: "Produtos",
  url: "/produtos",
  icon: Package
}, {
  title: "Fornecedores",
  url: "/fornecedores",
  icon: Building2
}, {
  title: "Cotações",
  url: "/cotacoes",
  icon: FileText
}, {
  title: "Pedidos",
  url: "/pedidos",
  icon: ShoppingCart
}, {
  title: "Histórico",
  url: "/historico",
  icon: History
}];
const analyticsItems = [{
  title: "Relatórios",
  url: "/relatorios",
  icon: TrendingUp
}, {
  title: "Analytics",
  url: "/analytics",
  icon: BarChart3
}];

const systemItems = [{
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (path: string) => isActive(path) ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50";
  return <Sidebar className={`transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"} border-r border-border bg-card/30 backdrop-blur-sm`} collapsible="icon">
      {/* Logo */}
      <div className="p-6 border-b border-border py-[9px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && <div>
              <h2 className="font-bold text-lg text-foreground">CotaçõesPro</h2>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>}
        </div>
      </div>

      <SidebarContent className="px-[2px] py-[15px]">
        {/* Main Navigation */}
        <SidebarGroup className="mx-0 px-0">
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => <SidebarMenuItem key={item.title} className="mx-[7px] px-0">
                  <SidebarMenuButton asChild className="my-1">
                    <NavLink to={item.url} end className={`${getNavClasses(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics */}
        {!isCollapsed && <SidebarGroup className="mt-8">
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {analyticsItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="my-1">
                      <NavLink to={item.url} className={`${getNavClasses(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Sistema */}
        {!isCollapsed && <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Sistema</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="my-1">
                      <NavLink to={item.url} className={`${getNavClasses(item.url)} flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200`}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* User Info */}
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Admin</p>
                <p className="text-xs text-muted-foreground truncate">Sistema Ativo</p>
              </div>}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>;
}