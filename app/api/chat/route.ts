import { NextResponse } from "next/server";
import { callOpenRouter, OpenRouterConfigError, type OpenRouterMessage } from "@/lib/ai/openrouter";
import { buildSystemPrompt, type ChatStateSnapshot } from "@/lib/ai/systemPrompt";
import { chatResponseSchema, type ChatResponse } from "@/lib/ai/chatActionSchema";

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  stateSnapshot: ChatStateSnapshot;
}

const FALLBACK_RESPONSE: ChatResponse = {
  reply: "No entendí bien esa instrucción, ¿puedes reformularla?",
  actions: [],
};

function tryParse(raw: string): ChatResponse | null {
  try {
    const json = JSON.parse(raw);
    const result = chatResponseSchema.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido en la solicitud." }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(body.stateSnapshot);
  const baseMessages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const firstRaw = await callOpenRouter(baseMessages);
    const parsed = tryParse(firstRaw);
    if (parsed) return NextResponse.json(parsed);

    const retryRaw = await callOpenRouter([
      ...baseMessages,
      {
        role: "user",
        content:
          "Tu respuesta anterior no era JSON válido con la forma { reply, actions }. Responde de nuevo, únicamente con ese JSON.",
      },
    ]);
    const retryParsed = tryParse(retryRaw);
    return NextResponse.json(retryParsed ?? FALLBACK_RESPONSE);
  } catch (error) {
    if (error instanceof OpenRouterConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Error desconocido llamando a OpenRouter.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
