import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface ReAuthDialogProps {
  open: boolean;
  reason: 'inactivity' | 'update' | 'security';
  onSuccess: () => void;
  timeRemaining?: number; // em segundos, para mostrar countdown
}

export function ReAuthDialog({ open, reason, onSuccess, timeRemaining }: ReAuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(timeRemaining || 0);
  const { user, signIn } = useAuth();
  const { toast } = useToast();

  // Pré-preencher email do usuário atual
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      setCountdown(timeRemaining);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
      
      toast({
        title: "Re-autenticação realizada!",
        description: "Você pode continuar usando o sistema.",
      });
      
      onSuccess();
    } catch (err: any) {
      console.error("Erro na re-autenticação:", err);
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const getReasonInfo = () => {
    switch (reason) {
      case 'inactivity':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          title: "Sessão Expirada por Inatividade",
          description: "Por segurança, sua sessão expirou após 24 horas de inatividade. Por favor, faça login novamente para continuar.",
          alertVariant: "default" as const
        };
      case 'update':
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
          title: "Atualização do Sistema Detectada",
          description: "Uma nova versão do sistema foi detectada. Por segurança, é necessário fazer login novamente para garantir compatibilidade.",
          alertVariant: "default" as const
        };
      case 'security':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          title: "Re-autenticação de Segurança",
          description: "Por motivos de segurança, é necessário confirmar sua identidade para continuar.",
          alertVariant: "destructive" as const
        };
      default:
        return {
          icon: <Shield className="h-5 w-5 text-gray-500" />,
          title: "Re-autenticação Necessária",
          description: "É necessário fazer login novamente para continuar.",
          alertVariant: "default" as const
        };
    }
  };

  const reasonInfo = getReasonInfo();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {reasonInfo.icon}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {reasonInfo.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {reasonInfo.description}
          </DialogDescription>
        </DialogHeader>

        {countdown > 0 && reason === 'inactivity' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Tempo restante antes do logout automático: <strong>{formatTime(countdown)}</strong>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Fazer Login
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Esta é uma medida de segurança para proteger seus dados
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}