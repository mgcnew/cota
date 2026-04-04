import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ShortLinkRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function resolveShortLink() {
      if (!id) {
        setError(true);
        return;
      }

      try {
        console.log(`[ShortLink] Resolvendo código: ${id}`);
        const { data, error } = await supabase
          .from("short_links")
          .select("original_tokens")
          .eq("short_id", id)
          .single();

        if (error || !data) {
          console.error("[ShortLink] Link não encontrado ou erro:", error);
          setError(true);
          return;
        }

        const tokens = data.original_tokens || "";
        
        if (tokens.startsWith("order_")) {
          const orderId = tokens.replace("order_", "");
          navigate(`/pedido/${orderId}`, { replace: true });
        } else {
          // Redireciona para a página de resposta original (cotação)
          navigate(`/responder/${tokens}`, { replace: true });
        }
      } catch (err) {
        console.error("[ShortLink] Falha crítica:", err);
        setError(true);
      }
    }

    resolveShortLink();
  }, [id, navigate]);

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Link Inválido ou Expirado</h1>
        <p className="text-muted-foreground mb-6">Não conseguimos localizar esta cotação. Por favor, peça um novo link ao comprador.</p>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-brand text-black font-bold rounded-lg"
        >
          Ir para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-brand" />
      <div className="text-center">
        <p className="font-bold text-lg">Acessando Portal de Cotações...</p>
        <p className="text-sm text-muted-foreground">Isso levará apenas um segundo.</p>
      </div>
    </div>
  );
}
