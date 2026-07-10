const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4.1";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenRouterConfigError extends Error {}

export async function callOpenRouter(messages: OpenRouterMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterConfigError(
      "Falta configurar OPENROUTER_API_KEY en .env.local para activar el chat."
    );
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://nutsabouty.com",
      "X-Title": "Nuts About You - Horarios",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter respondió ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenRouter no devolvió contenido de texto.");
  }
  return content;
}
