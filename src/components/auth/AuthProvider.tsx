import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInactivityDetector } from "@/hooks/useInactivityDetector";
import { useUpdateDetector } from "@/hooks/useUpdateDetector";
import { ReAuthDialog } from "./ReAuthDialog";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceReAuth: (reason: 'inactivity' | 'update' | 'security') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reAuthRequired, setReAuthRequired] = useState(false);
  const [reAuthReason, setReAuthReason] = useState<'inactivity' | 'update' | 'security'>('security');
  const { toast } = useToast();

  // Constantes de configuração
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas em milissegundos

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
              setSession(session);
              setUser(session?.user ?? null);
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
            setSession(session);
            setUser(session?.user ?? null);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("❌ Auth initialization error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize auth");
          setLoading(false);
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
    
    if (error) throw error;
    
    toast({
      title: "Conta criada com sucesso!",
      description: "Você já pode fazer login.",
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) throw error;
    
    toast({
      title: "Login realizado!",
      description: "Bem-vindo de volta.",
    });
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
    enabled: !!user && !!session && !reAuthRequired
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
