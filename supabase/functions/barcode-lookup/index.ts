import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  code?: string;
}

// Proxy da Bluesoft Cosmos. O token fica como secret do Supabase
// (BLUESOFT_COSMOS_TOKEN) e NUNCA vai pro frontend. A função sempre responde
// 200 com { found, name?, reason? } para o SDK entregar o corpo ao chamador —
// o frontend decide o próximo passo da cascata (nunca trava).
serve(async (req) => {
  const headers = corsHeaders;

  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  // AuthN: exige sessão Supabase válida — protege a cota diária da Bluesoft
  // de ser queimada por chamadas anônimas.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthenticated" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const code = (body.code ?? "").replace(/\D/g, "");
  if (!code) {
    return new Response(JSON.stringify({ error: "code is required" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const token = Deno.env.get("BLUESOFT_COSMOS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ found: false, reason: "not_configured" }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${code}.json`, {
      method: "GET",
      headers: {
        "X-Cosmos-Token": token,
        "Content-Type": "application/json",
        "User-Agent": "CotaJa/1.0",
      },
    });

    // 429 = cota diária esgotada; 404 = não encontrado. Em ambos, degrada
    // graciosamente para o próximo passo da cascata no frontend.
    if (upstream.status === 429) {
      return new Response(JSON.stringify({ found: false, reason: "rate_limited" }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 404) {
      return new Response(JSON.stringify({ found: false, reason: "not_found" }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("bluesoft upstream error", upstream.status, text);
      return new Response(JSON.stringify({ found: false, reason: "upstream_error" }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const data = await upstream.json();
    const name: string = (data?.description ?? "").trim();
    if (!name) {
      return new Response(JSON.stringify({ found: false, reason: "no_name" }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ found: true, name, brand: data?.brand?.name ?? null }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("barcode-lookup fatal", err);
    return new Response(JSON.stringify({ found: false, reason: "exception" }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
