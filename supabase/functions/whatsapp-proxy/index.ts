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
  image?: string;         // base64 for image
  caption?: string;       // for image/document
  document?: string;      // base64 for document
  fileName?: string;      // for document
}

function formatPhone(raw: string): string {
  const cleaned = (raw ?? "").replace(/\D/g, "");
  return cleaned.length <= 11 ? `55${cleaned}` : cleaned;
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

  const W_API_INSTANCE = Deno.env.get("W_API_INSTANCE");
  const W_API_TOKEN = Deno.env.get("W_API_TOKEN");
  if (!W_API_TOKEN) {
    return new Response(JSON.stringify({ error: "W_API_TOKEN not configured" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const phone = formatPhone(body.phone);
  const baseUrl = "https://api.w-api.app";
  const qs = W_API_INSTANCE ? `?instanceId=${W_API_INSTANCE}` : "";

  let endpoint: string;
  let payload: Record<string, unknown>;
  if (body.kind === "text") {
    endpoint = `${baseUrl}/v1/message/send-text${qs}`;
    payload = { phone, message: body.message ?? "" };
  } else if (body.kind === "image") {
    endpoint = `${baseUrl}/v1/message/send-image${qs}`;
    payload = { phone, image: body.image, caption: body.caption, delayMessage: 10 };
  } else if (body.kind === "document") {
    endpoint = `${baseUrl}/v1/message/send-document${qs}`;
    const extension = body.fileName?.includes(".") ? body.fileName.split(".").pop() : "html";
    payload = {
      phone,
      document: body.document,
      fileName: body.fileName,
      extension,
      caption: body.caption,
      delayMessage: 10,
    };
  } else {
    return new Response(JSON.stringify({ error: "Invalid kind" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  console.log("whatsapp-proxy sending", { endpoint, phone, kind: body.kind });
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${W_API_TOKEN}`,
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
