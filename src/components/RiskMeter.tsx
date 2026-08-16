import { AlertTriangle, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTip } from "@/components/InfoTip";
import type { ScreenResult } from "@/lib/screening";
import { cn } from "@/lib/utils";

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function RiskMeter({
  result,
  loading,
}: {
  result: ScreenResult | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="card-clinical gap-3 p-4 sm:p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="card-clinical items-center gap-2 p-6 text-center">
        <Stethoscope className="size-8 text-primary" />
        <h2 className="text-sm font-semibold">No assessment yet</h2>
        <p className="max-w-xs text-xs text-muted-foreground">
          Complete the questionnaire and add a cough clip, then run the multi-modal
          assessment to see the combined risk score.
        </p>
      </Card>
    );
  }

  const high = result.tier === "high";

  return (
    <Card className="card-clinical gap-4 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          Combined TB risk
          <InfoTip label="How the score is combined">
            60% clinical questionnaire + 40% cough acoustics. Audio-free screenings fall back
            to the clinical model alone.
          </InfoTip>
        </h2>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide uppercase",
            high
              ? "bg-crimson-soft text-destructive"
              : "bg-success-soft text-success",
          )}
        >
          {high ? "High risk" : "Low risk"}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-end justify-between">
          <span className="text-5xl font-semibold tabular-nums">
            {pct(result.combinedRisk)}
          </span>
          <span className="text-xs text-muted-foreground">threshold 50%</span>
        </div>
        <div className="relative mt-3">
          <div className="bg-gradient-risk h-2.5 w-full rounded-full opacity-30" />
          <div
            className="bg-gradient-risk absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
            style={{ width: pct(result.combinedRisk) }}
          />
          <span
            className="absolute -top-1 h-4.5 w-0.5 rounded bg-foreground/60"
            style={{ left: "50%" }}
            aria-hidden
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Channel
          label="Clinical (60%)"
          value={pct(result.tabularRisk)}
          tip="Tabular model over demographics, constitutional symptoms, cough duration and red flags."
        />
        <Channel
          label="Acoustic (40%)"
          value={result.audioRisk == null ? "No clip" : pct(result.audioRisk)}
          tip="Cough acoustic model. Without a clip the clinical channel carries the full weight."
        />
      </div>

      <Progress value={(result.totalSymptomBurden / 8) * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground">
        Constitutional score {result.constitutionalScore}/3 · Symptom burden{" "}
        {result.totalSymptomBurden}/8 ·{" "}
        {result.modelSource === "inference-api" ? "Live inference API" : "On-device fallback model"}
      </p>

      {high ? (
        <div className="space-y-2 rounded-xl border border-destructive/40 bg-crimson-soft p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4" /> Urgent referral recommended
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground/90">
            <li>
              Go to the nearest clinic for confirmatory <strong>GeneXpert MTB/RIF</strong> sputum
              testing — ideally today.
            </li>
            <li>Provide a deep morning sputum sample, not saliva.</li>
            <li>Cover coughs, ventilate rooms and avoid crowded indoor spaces until cleared.</li>
            <li>Ask about an HIV test — co-infection changes TB treatment urgency.</li>
          </ul>
          <p className="flex items-center gap-1.5 text-[0.7rem] text-destructive">
            <InfoTip label="Why sensitivity matters">
              Screening favours recall (sensitivity): missing a true TB case allows onward
              transmission, while a false alarm only costs one confirmatory test.
            </InfoTip>
            Tuned for high recall — expect some false alarms by design.
          </p>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-success/40 bg-success-soft p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-success">
            <ShieldCheck className="size-4" /> TB unlikely on this screening
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-foreground/90">
            <li>Monitor respiratory symptoms and re-screen if a cough passes two weeks.</li>
            <li>Return sooner for fever, night sweats, weight loss or blood in sputum.</li>
            <li>Keep indoor spaces ventilated and avoid smoke exposure.</li>
          </ul>
          <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            <HeartPulse className="size-3.5" /> A low score is not a negative test — clinical
            judgement always overrides this triage tool.
          </p>
        </div>
      )}
    </Card>
  );
}

function Channel({ label, value, tip }: { label: string; value: string; tip: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
        <InfoTip label={label}>{tip}</InfoTip>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
