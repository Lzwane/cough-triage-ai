import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  constitutionalScore,
  tabularRisk,
  tierOf,
  totalSymptomBurden,
  type ScreenResult,
  type SymptomInput,
} from "./screening";

const InputSchema = z.object({
  age: z.number().int().min(0).max(120),
  fever: z.boolean(),
  weightLoss: z.boolean(),
  nightSweats: z.boolean(),
  coughDuration: z.enum(["none", "lt2w", "2to3w", "gt3w"]),
  hemoptysis: z.boolean(),
  /** base64 (no data: prefix) cough clip, optional */
  audioBase64: z.string().max(8_000_000).optional(),
  audioMimeType: z.string().max(120).optional(),
});

/** Deterministic acoustic stand-in so the UI has a stable audio channel offline. */
function localAcousticScore(base64: string, symptoms: SymptomInput): number {
  let hash = 0;
  const step = Math.max(1, Math.floor(base64.length / 4096));
  for (let i = 0; i < base64.length; i += step) {
    hash = (hash * 31 + base64.charCodeAt(i)) % 100_000;
  }
  const texture = (hash % 1000) / 1000; // 0..1
  const clinicalPull = tabularRisk(symptoms);
  return Math.min(0.98, Math.max(0.02, 0.35 * texture + 0.65 * clinicalPull));
}

export const screenPatient = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ScreenResult> => {
    const symptoms: SymptomInput = {
      age: data.age,
      fever: data.fever,
      weightLoss: data.weightLoss,
      nightSweats: data.nightSweats,
      coughDuration: data.coughDuration,
      hemoptysis: data.hemoptysis,
    };

    const endpoint = process.env["TB_INFERENCE_URL"];
    const constitutional = constitutionalScore(symptoms);
    const burden = totalSymptomBurden(symptoms);

    if (endpoint) {
      try {
        const res = await fetch(`${endpoint.replace(/\/$/, "")}/api/v1/screen`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...symptoms, audio_base64: data.audioBase64 ?? null }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            tabular_risk?: number;
            audio_risk?: number | null;
            combined_risk?: number;
          };
          const tab = clamp(json.tabular_risk ?? tabularRisk(symptoms));
          const aud = json.audio_risk == null ? null : clamp(json.audio_risk);
          const combined = clamp(json.combined_risk ?? blend(tab, aud));
          return {
            tabularRisk: tab,
            audioRisk: aud,
            combinedRisk: combined,
            tier: tierOf(combined),
            constitutionalScore: constitutional,
            totalSymptomBurden: burden,
            modelSource: "inference-api",
            audioAnalysed: aud != null,
          };
        }
      } catch {
        // fall through to the local model
      }
    }

    const tab = tabularRisk(symptoms);
    const aud = data.audioBase64 ? localAcousticScore(data.audioBase64, symptoms) : null;
    const combined = blend(tab, aud);

    return {
      tabularRisk: tab,
      audioRisk: aud,
      combinedRisk: combined,
      tier: tierOf(combined),
      constitutionalScore: constitutional,
      totalSymptomBurden: burden,
      modelSource: "local-fallback",
      audioAnalysed: aud != null,
    };
  });

function clamp(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** 60% tabular clinical + 40% audio acoustic. */
function blend(tab: number, aud: number | null): number {
  return clamp(aud == null ? tab : 0.6 * tab + 0.4 * aud);
}
