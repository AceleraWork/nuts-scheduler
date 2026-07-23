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

function tryParse(raw: string): { data: ChatResponse; error?: undefined } | { data?: undefined; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "La respuesta no era JSON válido (posiblemente incompleta o cortada)." };
  }
  const result = chatResponseSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `- en "${issue.path.join(".") || "(raíz)"}": ${issue.message}`)
      .join("\n");
    return { error: `El JSON no tiene la forma esperada { reply, actions }:\n${issues}` };
  }
  return { data: result.data };
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
    const first = tryParse(firstRaw);
    if (first.data) return NextResponse.json(first.data);

    const retryRaw = await callOpenRouter([
      ...baseMessages,
      { role: "assistant", content: firstRaw },
      {
        role: "user",
        content: `Tu respuesta anterior tuvo este problema:\n${first.error}\n\nCorrígelo y responde de nuevo con ÚNICAMENTE el JSON { reply, actions } completo y válido. Si tu respuesta anterior incluía varias instrucciones del usuario, no descartes ninguna al corregir — conserva todas las acciones que sí eran correctas y arregla solo lo que falló.`,
      },
    ]);
    const retry = tryParse(retryRaw);
    return NextResponse.json(retry.data ?? FALLBACK_RESPONSE);
  } catch (error) {
    if (error instanceof OpenRouterConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Error desconocido llamando a OpenRouter.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
