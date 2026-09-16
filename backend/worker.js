export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Simple health check
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "vandemo-groq",
          message: "Groq backend is running",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Only POST is used for chat
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
          allowed: ["GET", "POST", "OPTIONS"],
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Make sure the secret exists
    if (!env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "GROQ_API_KEY secret is not configured.",
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

    try {
      const body = await request.json();

      if (!body.messages || !Array.isArray(body.messages)) {
        return new Response(
          JSON.stringify({
            error: "Invalid request",
            message: "messages must be an array.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: body.model || "llama-3.3-70b-versatile",
            messages: body.messages,
            temperature: body.temperature ?? 0.7,
            max_tokens: body.max_tokens ?? 4096,
          }),
        }
      );

      const data = await groqResponse.json();

      return new Response(JSON.stringify(data), {
        status: groqResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Backend error",
          message: error instanceof Error
            ? error.message
            : "Unknown error",
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
  },
};
