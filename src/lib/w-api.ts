/**
 * Cliente de envio de WhatsApp — roteia tudo pela edge function `whatsapp-proxy`
 * (hoje integrada à Whapi.cloud), para que o token nunca seja embutido no bundle do front.
 */
import { supabase } from "@/integrations/supabase/client";

interface SendMessageResponse {
  message?: string;
  status: number;
  data?: any;
  success?: boolean;
}

async function invokeProxy(payload: Record<string, unknown>): Promise<SendMessageResponse> {
  const { data, error } = await supabase.functions.invoke<{
    status: number;
    data: any;
    error?: string;
  }>("whatsapp-proxy", { body: payload });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  const wApiStatus = data?.status ?? 200;
  console.log("[W-API] status:", wApiStatus, "response:", JSON.stringify(data?.data));
  const ok = wApiStatus >= 200 && wApiStatus < 300;
  if (!ok) {
    const msg = typeof data?.data === "object" && data.data !== null
      ? (data.data as any).message ?? (data.data as any).error ?? JSON.stringify(data.data)
      : String(data?.data ?? `W-API error ${wApiStatus}`);
    throw new Error(`W-API ${wApiStatus}: ${msg}`);
  }
  return {
    status: wApiStatus,
    data: data?.data,
    success: true,
  };
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<SendMessageResponse> {
  return invokeProxy({ kind: "text", phone, message });
}

export async function sendWhatsAppImage(phone: string, base64Image: string, caption?: string): Promise<SendMessageResponse> {
  return invokeProxy({ kind: "image", phone, image: base64Image, caption });
}

export async function sendWhatsAppDocument(phone: string, base64Content: string, fileName: string, caption?: string): Promise<SendMessageResponse> {
  return invokeProxy({ kind: "document", phone, document: base64Content, fileName, caption });
}

// Optimistic: assume the proxy is deployed. Real status comes from the call.
export const isWApiConfigured = true;
