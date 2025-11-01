import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category } = await req.json();

    if (!productName) {
      throw new Error("Nome do produto é obrigatório");
    }

    // Criar prompt otimizado para gerar foto de produto profissional
    const prompt = `Create a professional, realistic product photo for e-commerce of: "${productName}" from category "${category || 'product'}". 

Requirements:
- Clean white background
- Professional studio lighting with soft shadows
- Product centered and in sharp focus
- Slightly angled frontal perspective
- High photographic quality and realistic
- Commercial style like Amazon or Mercado Livre
- Clean and simple composition

DO NOT include text, brands, logos, prices, packaging with labels or people in the image.
The product should be alone on a pure white background.`;

    console.log("Gerando imagem para:", productName);

    // Chamar Lovable AI com modelo de imagem correto
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "b64_json" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API - Status:", response.status);
      console.error("Erro na API - Response:", errorText);
      throw new Error(`Erro ao gerar imagem: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta da API recebida");
    
    // A resposta virá em formato b64_json
    const imageB64 = data.choices?.[0]?.message?.content;

    console.log("Imagem base64 encontrada:", imageB64 ? "Sim" : "Não");

    if (!imageB64 || typeof imageB64 !== 'string' || !imageB64.startsWith('data:image')) {
      console.error("Formato de resposta inválido. Usando geração externa...");
      
      // Fallback: usar imagegen tool do Lovable em vez da API de chat
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Geração de imagem não disponível no momento. Por favor, faça upload manual de uma imagem." 
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Imagem gerada com sucesso!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageB64,
        message: "Imagem gerada com sucesso!" 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});