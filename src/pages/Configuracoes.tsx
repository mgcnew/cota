import { useState, useRef, useCallback, Suspense, lazy } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sun, Moon, Monitor, Bell, Palette, Globe, Info, RotateCcw, Settings, Building2, Users, Loader2, Database } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Shield, CreditCard } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Skeleton } from "@/components/ui/skeleton";
import { ds } from "@/styles/design-system";

// Lazy load heavy settings components
const CompanyInfo = lazy(() => import("@/components/settings/CompanyInfo").then(m => ({ default: m.CompanyInfo })));
const CompanyUsersManager = lazy(() => import("@/components/settings/CompanyUsersManager").then(m => ({ default: m.CompanyUsersManager })));
const SuperAdminDashboard = lazy(() => import("@/components/settings/SuperAdminDashboard").then(m => ({ default: m.SuperAdminDashboard })));
const CorporateGroupManager = lazy(() => import("@/components/settings/CorporateGroupManager").then(m => ({ default: m.CorporateGroupManager })));
const BillingSection = lazy(() => import("@/components/settings/BillingSection").then(m => ({ default: m.BillingSection })));
const BackupRestore = lazy(() => import("@/components/settings/BackupRestore").then(m => ({ default: m.BackupRestore })));

type SettingsSection = "empresa" | "usuarios" | "grupo" | "superadmin" | "assinatura" | "backup" | "aparencia" | "notificacoes" | "sistema" | "sobre";

const menuItems: Array<{ id: SettingsSection; label: string; icon: typeof Building2 }> = [
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "grupo", label: "Grupo Corporativo", icon: Building2 },
  { id: "superadmin", label: "Super Admin", icon: Shield },
  { id: "assinatura", label: "Assinatura", icon: CreditCard },
  { id: "backup", label: "Backup", icon: Database },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "sistema", label: "Sistema", icon: Globe },
  { id: "sobre", label: "Sobre", icon: Info },
];

// Loading fallback for lazy components
function SectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("empresa");
  const [expandedSections, setExpandedSections] = useState<string[]>(["empresa"]);
  const [isSaving, setIsSaving] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings, updateNotifications, updateDisplay, updateSystem, resetSettings } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);
  const { isMobile } = useBreakpoint();
  
  // Refs for scroll position preservation
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Preserve scroll position when accordion changes
  const handleAccordionChange = useCallback((value: string[]) => {
    if (contentRef.current) {
      scrollPositionRef.current = contentRef.current.scrollTop;
    }
    setExpandedSections(value);
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = scrollPositionRef.current;
      }
    });
  }, []);

  const handleReset = async () => {
    setIsSaving(true);
    try {
      resetSettings();
      setTheme("system");
      setHasChanges(false);
      toast.success("Configurações restauradas para o padrão");
    } finally {
      setIsSaving(false);
    }
  };

  // Wrapper for settings updates with visual feedback
  const handleSettingChange = useCallback(async (
    updateFn: () => void,
    successMessage?: string
  ) => {
    setIsSaving(true);
    try {
      updateFn();
      setHasChanges(true);
      if (successMessage) {
        toast.success(successMessage);
      }
    } finally {
      // Small delay for visual feedback
      setTimeout(() => setIsSaving(false), 300);
    }
  }, []);

  // Render section content
  const renderSectionContent = (sectionId: SettingsSection) => {
    switch (sectionId) {
      case "empresa":
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <CompanyInfo />
          </Suspense>
        );
      case "usuarios":
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <CompanyUsersManager />
          </Suspense>
        );
      case "grupo":
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <CorporateGroupManager />
          </Suspense>
        );
      case "superadmin":
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <SuperAdminDashboard />
          </Suspense>
        );
      case "assinatura":
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <BillingSection />
          </Suspense>
        );
      case "backup":
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <BackupRestore />
          </Suspense>
        );
      case "aparencia":
        return renderAparenciaSection();
      case "notificacoes":
        return renderNotificacoesSection();
      case "sistema":
        return renderSistemaSection();
      case "sobre":
        return renderSobreSection();
      default:
        return null;
    }
  };


  // Aparência section
  const renderAparenciaSection = () => (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Aparência</CardTitle>
        </div>
        <CardDescription>
          Personalize a aparência do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Tema</Label>
          <RadioGroup 
            value={theme} 
            onValueChange={(value) => handleSettingChange(() => setTheme(value))} 
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="light" id="light" className="peer sr-only" />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all min-h-[88px] touch-target"
              >
                <Sun className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Claro</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all min-h-[88px] touch-target"
              >
                <Moon className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Escuro</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="system" className="peer sr-only" />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all min-h-[88px] touch-target"
              >
                <Monitor className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Sistema</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Preferências de Exibição</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between min-h-[44px]">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode">Modo Compacto</Label>
                <p className="text-sm text-muted-foreground">
                  Reduz o espaçamento entre elementos
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={settings.display.compactMode}
                onCheckedChange={(checked) => {
                  handleSettingChange(() => updateDisplay({ compactMode: checked }));
                }}
                className="touch-target-switch"
              />
            </div>
            <div className="flex items-center justify-between min-h-[44px]">
              <div className="space-y-0.5">
                <Label htmlFor="show-metrics">Exibir Métricas</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar cards de métricas no dashboard
                </p>
              </div>
              <Switch
                id="show-metrics"
                checked={settings.display.showMetrics}
                onCheckedChange={(checked) => {
                  handleSettingChange(() => updateDisplay({ showMetrics: checked }));
                }}
                className="touch-target-switch"
              />
            </div>
            <div className="flex items-center justify-between min-h-[44px]">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Animações</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar animações e transições
                </p>
              </div>
              <Switch
                id="animations"
                checked={settings.display.animationsEnabled}
                onCheckedChange={(checked) => {
                  handleSettingChange(() => updateDisplay({ animationsEnabled: checked }));
                }}
                className="touch-target-switch"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Notificações section
  const renderNotificacoesSection = () => (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notificações</CardTitle>
        </div>
        <CardDescription>
          Configure como você deseja ser notificado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Notificações por Email</Label>
            <p className="text-sm text-muted-foreground">
              Receber atualizações por email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={settings.notifications.email}
            onCheckedChange={(checked) => {
              handleSettingChange(() => updateNotifications({ email: checked }));
            }}
            className="touch-target-switch"
          />
        </div>
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications">Notificações Push</Label>
            <p className="text-sm text-muted-foreground">
              Receber notificações no navegador
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={settings.notifications.push}
            onCheckedChange={(checked) => {
              handleSettingChange(() => updateNotifications({ push: checked }));
            }}
            className="touch-target-switch"
          />
        </div>
        <Separator />
        <div className="space-y-3">
          <Label>Tipos de Notificação</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between min-h-[44px]">
              <Label htmlFor="quotes-notifications" className="font-normal">
                Cotações
              </Label>
              <Switch
                id="quotes-notifications"
                checked={settings.notifications.quotes}
                onCheckedChange={(checked) => {
                  handleSettingChange(() => updateNotifications({ quotes: checked }));
                }}
                className="touch-target-switch"
              />
            </div>
            <div className="flex items-center justify-between min-h-[44px]">
              <Label htmlFor="orders-notifications" className="font-normal">
                Pedidos
              </Label>
              <Switch
                id="orders-notifications"
                checked={settings.notifications.orders}
                onCheckedChange={(checked) => {
                  handleSettingChange(() => updateNotifications({ orders: checked }));
                }}
                className="touch-target-switch"
              />
            </div>
            <div className="flex items-center justify-between min-h-[44px]">
              <Label htmlFor="suppliers-notifications" className="font-normal">
                Fornecedores
              </Label>
              <Switch
                id="suppliers-notifications"
                checked={settings.notifications.suppliers}
                onCheckedChange={(checked) => {
                  handleSettingChange(() => updateNotifications({ suppliers: checked }));
                }}
                className="touch-target-switch"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );


  // Sistema section
  const renderSistemaSection = () => (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Sistema</CardTitle>
        </div>
        <CardDescription>
          Preferências regionais e de sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <Select
            value={settings.system.language}
            onValueChange={(value) => {
              handleSettingChange(() => updateSystem({ language: value }));
            }}
          >
            <SelectTrigger id="language" className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="es-ES">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-format">Formato de Data</Label>
          <Select
            value={settings.system.dateFormat}
            onValueChange={(value) => {
              handleSettingChange(() => updateSystem({ dateFormat: value }));
            }}
          >
            <SelectTrigger id="date-format" className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moeda</Label>
          <Select
            value={settings.system.currency}
            onValueChange={(value) => {
              handleSettingChange(() => updateSystem({ currency: value }));
            }}
          >
            <SelectTrigger id="currency" className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">Real (R$)</SelectItem>
              <SelectItem value="USD">Dólar ($)</SelectItem>
              <SelectItem value="EUR">Euro (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // Sobre section
  const renderSobreSection = () => (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>Informações do Sistema</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between min-h-[44px] items-center">
          <span className="text-muted-foreground">Versão</span>
          <span className="font-medium">1.0.0</span>
        </div>
        <div className="flex justify-between min-h-[44px] items-center">
          <span className="text-muted-foreground">Última atualização</span>
          <span className="font-medium">{new Date().toLocaleDateString("pt-BR")}</span>
        </div>
        <Separator className="my-4" />
        <Button 
          variant="outline" 
          className="w-full min-h-[44px]" 
          onClick={handleReset}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          Restaurar Configurações Padrão
        </Button>
      </CardContent>
    </Card>
  );

  // Mobile accordion view
  const renderMobileAccordion = () => (
    <Accordion 
      type="multiple" 
      value={expandedSections}
      onValueChange={handleAccordionChange}
      className="space-y-2"
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <AccordionItem 
            key={item.id} 
            value={item.id}
            className="border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 min-h-[56px] touch-target">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-medium text-base">{item.label}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderSectionContent(item.id)}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  // Desktop sidebar view
  const renderDesktopSidebar = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Menu Lateral - Desktop */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <Card className="sticky top-6">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 space-y-6">
        {renderSectionContent(activeSection)}
      </div>
    </div>
  );

  return (
    <PageWrapper>
      <div className={ds.layout.container.page} ref={contentRef}>
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
                <Settings className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className={cn(ds.typography.size["2xl"], "font-bold text-foreground")}>
                  Configurações
                </h1>
                <p className={cn(ds.colors.text.secondary, "text-sm mt-0.5")}>
                  Gerencie as preferências e configurações do sistema
                </p>
              </div>
            </div>

            {/* Saving indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                <span>Salvando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Accordion layout / Desktop: Sidebar layout */}
        {isMobile ? renderMobileAccordion() : renderDesktopSidebar()}
      </div>
    </PageWrapper>
  );
}
