import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Kind = "text" | "image" | "document";

interface Body {
  kind: Kind;
  phone: string;
  message?: string;       // for text
  image?: string;         // base64 (data URI) for image
  caption?: string;       // for image/document
  document?: string;      // base64 (data URI) for document
  fileName?: string;      // for document
}

function formatPhone(raw: string): string {
  const cleaned = (raw ?? "").replace(/\D/g, "");
  return cleaned.length <= 11 ? `55${cleaned}` : cleaned;
}

// Whapi.cloud requires the media as a data URI (data:<mime>;base64,<data>).
// Callers already send data URIs, but wrap raw base64 as a safety net.
function ensureDataUri(value: string, fallbackMime: string): string {
  if (!value) return value;
  return value.startsWith("data:") ? value : `data:${fallbackMime};base64,${value}`;
}

serve(async (req) => {
  const headers = corsHeaders;

  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  // AuthN: require a valid Supabase session
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

  // Parse body
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  if (!body.phone || !body.kind) {
    return new Response(JSON.stringify({ error: "phone and kind are required" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Whapi.cloud channel token. Fallback to the legacy var name for smooth migration.
  const WHAPI_TOKEN = Deno.env.get("WHAPI_TOKEN") ?? Deno.env.get("W_API_TOKEN");
  if (!WHAPI_TOKEN) {
    return new Response(JSON.stringify({ error: "WHAPI_TOKEN not configured" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const to = formatPhone(body.phone);
  const baseUrl = "https://gate.whapi.cloud";

  let endpoint: string;
  let payload: Record<string, unknown>;
  if (body.kind === "text") {
    endpoint = `${baseUrl}/messages/text`;
    payload = { to, body: body.message ?? "" };
  } else if (body.kind === "image") {
    endpoint = `${baseUrl}/messages/image`;
    payload = {
      to,
      media: ensureDataUri(body.image ?? "", "image/jpeg"),
      caption: body.caption,
    };
  } else if (body.kind === "document") {
    endpoint = `${baseUrl}/messages/document`;
    payload = {
      to,
      media: ensureDataUri(body.document ?? "", "application/octet-stream"),
      filename: body.fileName,
      caption: body.caption,
    };
  } else {
    return new Response(JSON.stringify({ error: "Invalid kind" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  console.log("whatsapp-proxy sending", { endpoint, to, kind: body.kind });
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${WHAPI_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    const status = upstream.status;
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* keep raw */ }
    if (!upstream.ok) {
      console.error("whatsapp-proxy upstream error", status, text);
    }
    // Always return 200 from the edge function itself so the Supabase SDK
    // delivers the body to the caller — upstream status is in the payload.
    return new Response(JSON.stringify({ status, data }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-proxy fatal", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
