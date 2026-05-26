/**
 * Cliente W-API — agora roteia tudo pela edge function `whatsapp-proxy`,
 * para que o token nunca seja embutido no bundle do front.
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
  return {
    status: data?.status ?? 200,
    data: data?.data,
    success: (data?.status ?? 0) >= 200 && (data?.status ?? 0) < 300,
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
