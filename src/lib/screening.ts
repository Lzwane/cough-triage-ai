export type CoughDuration = "none" | "lt2w" | "2to3w" | "gt3w";

export type SymptomInput = {
  age: number;
  fever: boolean;
  weightLoss: boolean;
  nightSweats: boolean;
  coughDuration: CoughDuration;
  hemoptysis: boolean;
};

export const emptySymptoms: SymptomInput = {
  age: 32,
  fever: false,
  weightLoss: false,
  nightSweats: false,
  coughDuration: "none",
  hemoptysis: false,
};

export const coughDurationLabels: Record<CoughDuration, string> = {
  none: "No persistent cough",
  lt2w: "Less than 2 weeks",
  "2to3w": "2 to 3 weeks",
  gt3w: "More than 3 weeks",
};

export const coughDurationWeight: Record<CoughDuration, number> = {
  none: 0,
  lt2w: 1,
  "2to3w": 2,
  gt3w: 3,
};

/** Fever + unintentional weight loss + night sweats (0-3). */
export function constitutionalScore(s: SymptomInput): number {
  return Number(s.fever) + Number(s.weightLoss) + Number(s.nightSweats);
}

/** Constitutional + cough duration weight + red flag (0-8). */
export function totalSymptomBurden(s: SymptomInput): number {
  return (
    constitutionalScore(s) + coughDurationWeight[s.coughDuration] + (s.hemoptysis ? 2 : 0)
  );
}

export const MAX_BURDEN = 8;

/** Deterministic clinical (tabular) probability used for the local model. */
export function tabularRisk(s: SymptomInput): number {
  const logit =
    -3.2 +
    1.05 * Number(s.fever) +
    1.25 * Number(s.weightLoss) +
    1.1 * Number(s.nightSweats) +
    0.85 * coughDurationWeight[s.coughDuration] +
    1.9 * Number(s.hemoptysis) +
    (s.age >= 45 ? 0.45 : 0) +
    (s.age <= 15 ? 0.3 : 0);
  return 1 / (1 + Math.exp(-logit));
}

export type ScreenResult = {
  tabularRisk: number;
  audioRisk: number | null;
  combinedRisk: number;
  tier: "high" | "low";
  constitutionalScore: number;
  totalSymptomBurden: number;
  modelSource: "inference-api" | "local-fallback";
  audioAnalysed: boolean;
};

export function tierOf(risk: number): "high" | "low" {
  return risk >= 0.5 ? "high" : "low";
}
