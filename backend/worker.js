export default {
  async fetch(request, env) {
    // CORS
    const origin = request.headers.get("Origin") || "";

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Hanya menerima POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      if (!env.GROQ_API_KEY) {
        return new Response(
          JSON.stringify({ error: "GROQ_API_KEY belum dikonfigurasi di Worker." }),
          { status: 500, headers: corsHeaders }
        );
      }

      const body = await request.json();

      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(
          JSON.stringify({ error: "messages tidak valid." }),
          { status: 400, headers: corsHeaders }
        );
      }

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: body.model || "llama-3.3-70b-versatile",
            messages: body.messages,
            temperature: body.temperature ?? 0.7,
            max_tokens: body.max_tokens ?? 4096
          })
        }
      );

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Backend error",
          message: error.message
        }),
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};
