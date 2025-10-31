import { useState } from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Monitor, Bell, Palette, Globe, Info, RotateCcw, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { CompanyInfo } from "@/components/settings/CompanyInfo";
import { CompanyUsersManager } from "@/components/settings/CompanyUsersManager";

export default function Configuracoes() {
  const {
    theme,
    setTheme
  } = useTheme();
  const {
    settings,
    updateNotifications,
    updateDisplay,
    updateSystem,
    resetSettings
  } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);
  const handleReset = () => {
    resetSettings();
    setTheme("system");
    setHasChanges(false);
    toast.success("Configurações restauradas para o padrão");
  };
  return <div className="page-container">
      {/* Header Configurações com Tema Violeta */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-3xl bg-gradient-to-r from-violet-900 to-purple-700 bg-clip-text text-transparent">
                    Configurações
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 shadow-sm">
                      <Palette className="h-3 w-3" />
                      Preferências do Sistema
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Settings className="h-4 w-4 text-violet-600" />
                <span className="font-medium">Gerencie as preferências e configurações do sistema</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Globe className="h-4 w-4 text-purple-500" />
                <span>Personalização completa disponível</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empresa e Usuários */}
      <div className="space-y-6">
        <CompanyInfo />
        <CompanyUsersManager />
      </div>

      {/* Tema */}
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
            <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all">
                  <Sun className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Claro</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all">
                  <Moon className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">Escuro</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all">
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Modo Compacto</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduz o espaçamento entre elementos
                  </p>
                </div>
                <Switch id="compact-mode" checked={settings.display.compactMode} onCheckedChange={checked => {
                updateDisplay({
                  compactMode: checked
                });
                setHasChanges(true);
              }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-metrics">Exibir Métricas</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar cards de métricas no dashboard
                  </p>
                </div>
                <Switch id="show-metrics" checked={settings.display.showMetrics} onCheckedChange={checked => {
                updateDisplay({
                  showMetrics: checked
                });
                setHasChanges(true);
              }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animações</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar animações e transições
                  </p>
                </div>
                <Switch id="animations" checked={settings.display.animationsEnabled} onCheckedChange={checked => {
                updateDisplay({
                  animationsEnabled: checked
                });
                setHasChanges(true);
              }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber atualizações por email
              </p>
            </div>
            <Switch id="email-notifications" checked={settings.notifications.email} onCheckedChange={checked => {
            updateNotifications({
              email: checked
            });
            setHasChanges(true);
          }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações no navegador
              </p>
            </div>
            <Switch id="push-notifications" checked={settings.notifications.push} onCheckedChange={checked => {
            updateNotifications({
              push: checked
            });
            setHasChanges(true);
          }} />
          </div>
          <Separator />
          <div className="space-y-3">
            <Label>Tipos de Notificação</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quotes-notifications" className="font-normal">
                  Cotações
                </Label>
                <Switch id="quotes-notifications" checked={settings.notifications.quotes} onCheckedChange={checked => {
                updateNotifications({
                  quotes: checked
                });
                setHasChanges(true);
              }} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="orders-notifications" className="font-normal">
                  Pedidos
                </Label>
                <Switch id="orders-notifications" checked={settings.notifications.orders} onCheckedChange={checked => {
                updateNotifications({
                  orders: checked
                });
                setHasChanges(true);
              }} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="suppliers-notifications" className="font-normal">
                  Fornecedores
                </Label>
                <Switch id="suppliers-notifications" checked={settings.notifications.suppliers} onCheckedChange={checked => {
                updateNotifications({
                  suppliers: checked
                });
                setHasChanges(true);
              }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sistema */}
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
            <Select value={settings.system.language} onValueChange={value => {
            updateSystem({
              language: value
            });
            setHasChanges(true);
          }}>
              <SelectTrigger id="language">
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
            <Select value={settings.system.dateFormat} onValueChange={value => {
            updateSystem({
              dateFormat: value
            });
            setHasChanges(true);
          }}>
              <SelectTrigger id="date-format">
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
            <Select value={settings.system.currency} onValueChange={value => {
            updateSystem({
              currency: value
            });
            setHasChanges(true);
          }}>
              <SelectTrigger id="currency">
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

      {/* Informações */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>Informações do Sistema</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última atualização</span>
            <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <Separator className="my-4" />
          <Button variant="outline" className="w-full" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar Configurações Padrão
          </Button>
        </CardContent>
      </Card>
    </div>;
}