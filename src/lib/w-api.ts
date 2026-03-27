/**
 * Utilitário para integração com a W-API de WhatsApp
 */

const W_API_INSTANCE = import.meta.env.VITE_W_API_INSTANCE;
const W_API_TOKEN = import.meta.env.VITE_W_API_TOKEN;

interface SendMessageResponse {
  message: string;
  status: number;
  data?: any;
  success?: boolean;
}

/**
 * Envia uma mensagem via W-API
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<SendMessageResponse> {
  // 1. Limpar o número (apenas dígitos)
  const cleanPhone = phone.replace(/\D/g, '');
  
  // 2. Garantir código do país (Brasil default)
  const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

  if (!W_API_TOKEN || W_API_TOKEN === "COLE_AQUI_O_TOKEN_DA_IMAGEM") {
    throw new Error("W-API Token não configurado no .env");
  }

  // Usar o proxy em desenvolvimento para evitar erro de CORS e <!DOCTYPE (HTML)
  const baseUrl = import.meta.env.PROD ? 'https://api.w-api.app' : '/whatsapp-api';
  const endpoint = `${baseUrl}/v1/message/send-text${W_API_INSTANCE ? `?instanceId=${W_API_INSTANCE}` : ''}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao enviar mensagem via W-API");
    }

    return data;
  } catch (error: any) {
    console.error("[W-API] Erro no envio:", error);
    throw error;
  }
}

/**
 * Envia uma imagem via W-API
 */
export async function sendWhatsAppImage(phone: string, base64Image: string, caption?: string): Promise<SendMessageResponse> {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

  if (!W_API_TOKEN || W_API_TOKEN === "COLE_AQUI_O_TOKEN_DA_IMAGEM") {
    throw new Error("W-API Token não configurado no .env");
  }

  // A W-API geralmente suporta o endpoint send-image ou o send genérico com o tipo correto
  const baseUrl = import.meta.env.PROD ? 'https://api.w-api.app' : '/whatsapp-api';
  const endpoint = `${baseUrl}/v1/message/send-image?instanceId=${W_API_INSTANCE}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${W_API_TOKEN}`
      },
      body: JSON.stringify({
        phone: formattedPhone,
        image: base64Image,
        caption: caption,
        delayMessage: 10
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao enviar imagem via W-API");
    }

    return data;
  } catch (error: any) {
    console.error("[W-API] Erro no envio de imagem:", error);
    throw error;
  }
}

/**
 * Verifica se a API está configurada no ambiente
 */
export const isWApiConfigured = !!W_API_TOKEN && W_API_TOKEN !== "COLE_AQUI_O_TOKEN_DA_IMAGEM";
