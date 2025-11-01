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
    const prompt = `Crie uma foto profissional e realista de produto para e-commerce do seguinte item: "${productName}" da categoria "${category || 'produto'}". 

    Requisitos:
    - Fundo branco limpo e minimalista
    - Iluminação profissional de estúdio com sombras suaves
    - Produto centralizado e em foco nítido
    - Perspectiva frontal levemente inclinada
    - Alta qualidade fotográfica e realista
    - Estilo comercial e profissional tipo Amazon ou Mercado Livre
    - Composição limpa e simples
    
    NÃO incluir texto, marcas, logos, preços, embalagens com rótulos ou pessoas na imagem.
    O produto deve estar sozinho em um fundo branco puro.`;

    console.log("Gerando imagem para:", productName);

    // Chamar Lovable AI (Gemini 2.5 Flash Image Preview)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API:", errorText);
      throw new Error(`Erro ao gerar imagem: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("Nenhuma imagem foi gerada pela IA");
    }

    console.log("Imagem gerada com sucesso!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
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