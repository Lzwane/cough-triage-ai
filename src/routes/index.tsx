import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Loader2, RotateCcw, Sparkles, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SymptomQuestionnaire } from "@/components/SymptomQuestionnaire";
import { CoughRecorder, type CoughClip } from "@/components/CoughRecorder";
import { RiskMeter } from "@/components/RiskMeter";
import { InfoTip } from "@/components/InfoTip";
import { emptySymptoms, type ScreenResult, type SymptomInput } from "@/lib/screening";
import { screenPatient } from "@/lib/screening.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cough Afrika — AI TB Screening & Clinical Triage" },
      {
        name: "description",
        content:
          "Cough Afrika combines a symptom questionnaire with cough audio analysis to triage tuberculosis risk in low-resource communities.",
      },
      { property: "og:title", content: "Cough Afrika — AI TB Screening & Clinical Triage" },
      {
        property: "og:description",
        content:
          "Multi-modal TB screening: symptom burden scoring plus cough acoustics, with clear referral guidance for GeneXpert testing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [symptoms, setSymptoms] = useState<SymptomInput>(emptySymptoms);
  const [step, setStep] = useState(0);
  const [clip, setClip] = useState<CoughClip | null>(null);
  const [result, setResult] = useState<ScreenResult | null>(null);

  const screen = useServerFn(screenPatient);
  const mutation = useMutation({
    mutationFn: () =>
      screen({
        data: {
          ...symptoms,
          audioBase64: clip?.base64,
          audioMimeType: clip?.mimeType,
        },
      }),
    onSuccess: (data) => {
      setResult(data);
      toast.success(
        data.tier === "high" ? "High risk — referral advised" : "Low risk screening result",
      );
    },
    onError: () => toast.error("Assessment failed — please try again"),
  });

  const reset = () => {
    setSymptoms(emptySymptoms);
    setStep(0);
    setClip(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-clinical px-4 pt-6 pb-8 text-primary-foreground sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
                <Activity className="size-5" />
              </span>
              <div>
                <h1 className="text-lg leading-tight font-semibold">Cough Afrika</h1>
                <p className="text-xs opacity-80">AI multi-modal TB screening</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[0.68rem] font-medium">
              <Wifi className="size-3.5" /> Low-bandwidth ready
            </span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed opacity-90">
            Screen for tuberculosis in three minutes: a guided symptom questionnaire plus a
            three-second cough clip, combined into one triage score with clear next steps.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-5xl space-y-4 px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <SymptomQuestionnaire
              value={symptoms}
              onChange={setSymptoms}
              step={step}
              onStepChange={setStep}
            />
            <CoughRecorder clip={clip} onClipChange={setClip} />
          </div>
          <div className="space-y-4">
            <RiskMeter result={result} loading={mutation.isPending} />
            <div className="card-clinical flex items-start gap-2 p-4 text-xs leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Screening models are tuned for recall over precision.
                <InfoTip label="Recall and sensitivity">
                  Recall (sensitivity) is the share of true TB cases the tool flags. High recall
                  catches disease early and cuts transmission; the cost is more confirmatory
                  tests.
                </InfoTip>{" "}
                Every result must be confirmed with GeneXpert MTB/RIF sputum testing before
                treatment.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <Button variant="outline" size="lg" onClick={reset} aria-label="Reset screening">
            <RotateCcw className="size-4" />
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analysing{clip ? " audio + symptoms" : " symptoms"}…
              </>
            ) : (
              <>Run multi-modal assessment</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
