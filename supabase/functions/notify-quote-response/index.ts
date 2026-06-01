import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Notificação de resposta de cotação — chamada por trigger no banco (pg_net).
// Pública (verify_jwt=false) mas validada pelo quote_supplier_id (UUID não-adivinhável)
// que deve existir e ter status 'respondido'. Reusa as envs do whatsapp-proxy.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUYER_PHONE = "11966670314";

function formatPhone(raw: string): string {
  const cleaned = (raw ?? "").replace(/\D/g, "");
  return cleaned.length <= 11 ? `55${cleaned}` : cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  let body: { quote_supplier_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const qsId = body.quote_supplier_id;
  if (!qsId) {
    return new Response(JSON.stringify({ error: "quote_supplier_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Valida o quote_supplier usando service role
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: qs, error: qsErr } = await admin
    .from("quote_suppliers")
    .select("id, supplier_name, status")
    .eq("id", qsId)
    .single();

  if (qsErr || !qs) {
    return new Response(JSON.stringify({ error: "quote_supplier not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (qs.status !== "respondido") {
    return new Response(JSON.stringify({ ok: true, skipped: "status not respondido" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const W_API_INSTANCE = Deno.env.get("W_API_INSTANCE");
  const W_API_TOKEN = Deno.env.get("W_API_TOKEN");
  if (!W_API_TOKEN) {
    return new Response(JSON.stringify({ error: "W_API_TOKEN not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const message = `🔔 *Nova Resposta de Cotação!*\n\nO fornecedor *${qs.supplier_name}* acaba de preencher uma cotação no portal.\n\nOs preços já estão disponíveis no sistema para conferência.`;
  const phone = formatPhone(BUYER_PHONE);
  const qsParam = W_API_INSTANCE ? `?instanceId=${W_API_INSTANCE}` : "";
  const endpoint = `https://api.w-api.app/v1/message/send-text${qsParam}`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${W_API_TOKEN}`,
      },
      body: JSON.stringify({ phone, message }),
    });
    const text = await upstream.text();
    return new Response(JSON.stringify({ ok: upstream.ok, status: upstream.status, data: text }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-quote-response fatal", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
