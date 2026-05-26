import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Restrict CORS to the deployed app origins. Extend via env if needed.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:8087")
  .split(",")
  .map((o) => o.trim());

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

interface Body {
  prompt: string;
  model?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  // 1) AuthN: require a valid Supabase session
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthenticated" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // 2) Validate body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  if (!body.prompt || typeof body.prompt !== "string") {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  // Hard cap to avoid runaway prompts
  if (body.prompt.length > 200_000) {
    return new Response(JSON.stringify({ error: "prompt too large" }), {
      status: 413,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const model = body.model && /^[a-zA-Z0-9.\-_/]+$/.test(body.model)
    ? body.model
    : "gemini-2.5-flash";

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // 3) Call Gemini via REST (avoids bundling the SDK)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: body.prompt }] }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Gemini upstream error", upstream.status, errText);
      return new Response(
        JSON.stringify({ error: `Gemini error ${upstream.status}` }),
        { status: 502, headers: { ...headers, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gemini-proxy fatal", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
