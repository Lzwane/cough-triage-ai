import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { InfoTip } from "@/components/InfoTip";
import {
  coughDurationLabels,
  constitutionalScore,
  totalSymptomBurden,
  MAX_BURDEN,
  type CoughDuration,
  type SymptomInput,
} from "@/lib/screening";
import { cn } from "@/lib/utils";

const steps = ["Patient", "Constitutional", "Cough & red flags"] as const;

type Props = {
  value: SymptomInput;
  onChange: (next: SymptomInput) => void;
  step: number;
  onStepChange: (step: number) => void;
};

function SymptomToggle({
  label,
  hint,
  checked,
  onCheckedChange,
  danger,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors",
        checked
          ? danger
            ? "border-destructive/40 bg-crimson-soft"
            : "border-primary/40 bg-accent"
          : "border-border bg-card",
      )}
    >
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function SymptomQuestionnaire({ value, onChange, step, onStepChange }: Props) {
  const set = <K extends keyof SymptomInput>(key: K, v: SymptomInput[K]) =>
    onChange({ ...value, [key]: v });

  const constitutional = constitutionalScore(value);
  const burden = totalSymptomBurden(value);

  return (
    <Card className="card-clinical gap-0 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onStepChange(i)}
            className="flex flex-1 flex-col gap-1.5 text-left"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-[0.68rem] font-medium",
                i === step ? "text-primary" : "text-muted-foreground",
              )}
            >
              {s}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  Age
                  <InfoTip label="Why age matters">
                    TB incidence and screening thresholds shift with age — adults over 45 and
                    children under 15 carry extra clinical weight.
                  </InfoTip>
                </Label>
                <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-semibold text-accent-foreground">
                  {value.age} yrs
                </span>
              </div>
              <Slider
                value={[value.age]}
                min={1}
                max={95}
                step={1}
                onValueChange={([v]) => set("age", v ?? value.age)}
                aria-label="Patient age"
              />
            </div>
            <p className="rounded-lg bg-secondary p-3 text-xs leading-relaxed text-secondary-foreground">
              Cough Afrika is a triage aid, not a diagnosis. Results always route to a clinic
              for confirmatory testing.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <SymptomToggle
              label="Fever"
              hint="Recurrent or persistent raised temperature"
              checked={value.fever}
              onCheckedChange={(v) => set("fever", v)}
            />
            <SymptomToggle
              label="Unintentional weight loss"
              hint="Clothes looser without dieting"
              checked={value.weightLoss}
              onCheckedChange={(v) => set("weightLoss", v)}
            />
            <SymptomToggle
              label="Night sweats"
              hint="Drenching sweats that soak bedding"
              checked={value.nightSweats}
              onCheckedChange={(v) => set("nightSweats", v)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Cough duration</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(coughDurationLabels) as CoughDuration[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("coughDuration", k)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      value.coughDuration === k
                        ? "border-primary bg-accent font-medium text-accent-foreground"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {coughDurationLabels[k]}
                  </button>
                ))}
              </div>
            </div>
            <SymptomToggle
              danger
              label="Coughing blood (hemoptysis)"
              hint="Red flag — escalates triage priority immediately"
              checked={value.hemoptysis}
              onCheckedChange={(v) => set("hemoptysis", v)}
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/60 p-3">
          <div className="flex items-center gap-1 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
            Constitutional
            <InfoTip label="Constitutional symptom score">
              Fever, weight loss and night sweats together form the classic TB constitutional
              triad (0–3).
            </InfoTip>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{constitutional}/3</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/60 p-3">
          <div className="flex items-center gap-1 text-[0.68rem] font-medium tracking-wide text-muted-foreground uppercase">
            Symptom burden
            <InfoTip label="Total symptom burden">
              Constitutional score plus cough duration weighting plus red flags (0–8).
            </InfoTip>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {burden}/{MAX_BURDEN}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={step === 0}
          onClick={() => onStepChange(Math.max(0, step - 1))}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button size="sm" onClick={() => onStepChange(step + 1)}>
            Next <ArrowRight className="size-4" />
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Check className="size-4" /> Questionnaire complete
          </span>
        )}
      </div>
    </Card>
  );
}
