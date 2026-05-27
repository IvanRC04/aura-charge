import { groq } from "@ai-sdk/groq";
import { streamText, convertToCoreMessages } from "ai";
import { loadSessionParams } from "@/lib/session-params";
import { snapshot } from "@/lib/derive-state";
import { formatDuration } from "@aura/simulation";
import { checkChatLimit } from "@aura/kv";
import { db, schema } from "@aura/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_BASE = `Eres AURA, el asistente IA de la red de cargadores AURA Charge.
Hablas en español, breve y claro. Tono cercano pero profesional, como un técnico amable.
Conoces en tiempo real el estado de la sesión de carga del usuario (vehículo, SoC, potencia, tiempo, coste).
Cuando el usuario pregunte algo, **siempre apóyate en el contexto JSON proporcionado**. No inventes números.
Si la pregunta no tiene relación con la carga del coche, ayuda igualmente pero recuerda brevemente que tu especialidad es EV charging.
Cuando expliques fases (rampa, meseta, tapering) usa analogías sencillas. Evita jerga sin contexto.
Responde en máximo 4 frases salvo que el usuario pida más detalle.`;

function ipFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = await checkChatLimit(ip).catch(() => ({ ok: true as const }));
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        error: "Demasiadas preguntas. Espera un momento antes de continuar.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = await req.json();
  const sessionId = body.sessionId as string | undefined;
  const messages = body.messages as Array<{ role: string; content: string }> | undefined;
  if (!messages || !Array.isArray(messages)) {
    return new Response("Bad request", { status: 400 });
  }

  let contextBlock = "";
  if (sessionId) {
    const sp = await loadSessionParams(sessionId);
    if (sp) {
      const snap = snapshot(sp, Date.now(), 30);
      contextBlock = JSON.stringify(
        {
          chargerCode: sp.chargerCode,
          chargerMaxKw: sp.chargerMaxKw,
          vehicleModel: sp.vehicleModel,
          batteryKwh: sp.batteryKwh,
          startSocPct: sp.startSocPct,
          targetSocPct: sp.targetSocPct,
          currentSocPct: Number(snap.current.socPct.toFixed(1)),
          powerKw: Number(snap.current.powerKw.toFixed(1)),
          voltageV: Number(snap.current.voltageV.toFixed(0)),
          currentA: Number(snap.current.currentA.toFixed(0)),
          tempBatteryC: Number(snap.current.tempC.toFixed(1)),
          kwhDelivered: Number(snap.current.kwhDelivered.toFixed(2)),
          phaseFactorPct: Math.round(snap.factor * 100),
          costEur: Number(snap.costEur.toFixed(2)),
          co2AvoidedKg: Number(snap.co2AvoidedKg.toFixed(2)),
          finished: snap.finished,
          etaSimSec: Math.round(snap.etaSec),
          etaRealReadable: formatDuration(snap.etaSec / sp.timeAccel),
          electricityPriceEurPerKwh: 0.39,
          timeAccel: sp.timeAccel,
          elapsedRealSec: Math.round(snap.realSecElapsed),
        },
        null,
        0,
      );

      // Flag the visit reachedChat — best-effort, fire-and-forget
      try {
        await db
          .update(schema.visits)
          .set({ reachedChat: true })
          .where(eq(schema.visits.sessionId, sessionId));
      } catch {
        // swallow
      }
    }
  }

  const systemPrompt = contextBlock
    ? `${SYSTEM_BASE}\n\nCONTEXTO EN VIVO (JSON):\n${contextBlock}`
    : SYSTEM_BASE;

  const result = streamText({
    model: groq("llama-3.1-8b-instant"),
    system: systemPrompt,
    messages: convertToCoreMessages(messages as never),
    temperature: 0.4,
    maxTokens: 320,
  });

  return result.toDataStreamResponse();
}
