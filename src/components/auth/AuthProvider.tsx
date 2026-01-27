import { useEffect, useState, startTransition } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInactivityDetector } from "@/hooks/useInactivityDetector";
import { useUpdateDetector } from "@/hooks/useUpdateDetector";
import { ReAuthDialog } from "./ReAuthDialog";
import { Loader2 } from "lucide-react";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reAuthRequired, setReAuthRequired] = useState(false);
  const [reAuthReason, setReAuthReason] = useState<'inactivity' | 'update' | 'security'>('security');
  const { toast } = useToast();

  // Constantes de configuração
  const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (mounted) {
              console.log("🔐 Auth state changed:", _event, session?.user?.id);
              startTransition(() => {
                setSession(session);
                setUser(session?.user ?? null);
              });
            }
          }
        );

        // THEN check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Error getting session:", sessionError);
          setError(sessionError.message);
        } else {
          console.log("✅ Session loaded:", session?.user?.id || "no user");
          if (mounted) {
            startTransition(() => {
              setSession(session);
              setUser(session?.user ?? null);
            });
          }
        }
        
        if (mounted) {
          startTransition(() => {
            setLoading(false);
          });
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("❌ Auth initialization error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize auth");
          startTransition(() => {
            setLoading(false);
          });
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      return { error };
    }
    
    toast({
      title: "Conta criada com sucesso!",
      description: "Você já pode fazer login.",
    });
    
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      return { error };
    }
    
    toast({
      title: "Login realizado!",
      description: "Bem-vindo de volta.",
    });
    
    return { error: null };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const forceReAuth = (reason: 'inactivity' | 'update' | 'security') => {
    console.log(`Re-autenticação forçada por: ${reason}`);
    setReAuthReason(reason);
    setReAuthRequired(true);
  };

  const handleReAuthSuccess = () => {
    setReAuthRequired(false);
    toast({
      title: "Re-autenticação bem-sucedida!",
      description: "Você pode continuar usando o sistema normalmente.",
    });
  };

  // Hook para detectar inatividade (apenas se usuário estiver logado)
  useInactivityDetector({
    timeout: INACTIVITY_TIMEOUT,
    onInactive: () => {
      if (user && session) {
        forceReAuth('inactivity');
      }
    },
    enabled: !!user && !!session && !reAuthRequired
  });

  // Hook para detectar atualizações do sistema
  useUpdateDetector({
    onUpdateDetected: () => {
      if (user && session) {
        forceReAuth('update');
      }
    },
    enabled: false // Desabilitado para evitar re-autenticação desnecessária
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-destructive">Erro ao conectar: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        forceReAuth,
      }}
    >
      {children}
      
      {/* Modal de re-autenticação */}
      <ReAuthDialog
        open={reAuthRequired}
        reason={reAuthReason}
        onSuccess={handleReAuthSuccess}
      />
    </AuthContext.Provider>
  );
}

export { useAuth } from './AuthContext';
