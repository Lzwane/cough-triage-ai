import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload, AudioLines } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/InfoTip";
import { cn } from "@/lib/utils";

export type CoughClip = { base64: string; mimeType: string; url: string; name: string };

const CLIP_SECONDS = 3;

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read audio"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export function CoughRecorder({
  clip,
  onClipChange,
}: {
  clip: CoughClip | null;
  onClipChange: (clip: CoughClip | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        onClipChange({
          base64: await toBase64(blob),
          mimeType: blob.type,
          url: URL.createObjectURL(blob),
          name: `cough-${new Date().toISOString().slice(11, 19)}`,
        });
        toast.success("Cough clip captured");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 0.1;
          if (next >= CLIP_SECONDS) stop();
          return next;
        });
      }, 100);
    } catch {
      toast.error("Microphone unavailable — upload a .wav clip instead");
    }
  };

  const onUpload = async (file: File) => {
    if (!file.type.startsWith("audio/") && !file.name.endsWith(".wav")) {
      toast.error("Please choose an audio file (.wav)");
      return;
    }
    onClipChange({
      base64: await toBase64(file),
      mimeType: file.type || "audio/wav",
      url: URL.createObjectURL(file),
      name: file.name,
    });
    toast.success("Cough clip uploaded");
  };

  return (
    <Card className="card-clinical gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            Cough audio
            <InfoTip label="Why cough audio matters">
              Acoustic features of a forced cough add an independent signal to the clinical
              questionnaire, lifting sensitivity where symptoms alone are ambiguous.
            </InfoTip>
          </h2>
          <p className="text-xs text-muted-foreground">
            Record a {CLIP_SECONDS}-second forced cough, or upload a .wav clip.
          </p>
        </div>
        {clip && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Discard clip"
            onClick={() => onClipChange(null)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex h-24 items-center justify-center gap-1 overflow-hidden rounded-lg border px-3",
          recording ? "border-destructive/40 bg-crimson-soft" : "border-border bg-muted/50",
        )}
        aria-live="polite"
      >
        {recording ? (
          Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-destructive"
              style={{
                height: `${16 + Math.abs(Math.sin(i * 0.7 + elapsed * 4)) * 56}px`,
                transition: "height 100ms linear",
              }}
            />
          ))
        ) : clip ? (
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <AudioLines className="size-4" /> {clip.name}
            </div>
            <audio controls src={clip.url} className="w-full" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Waveform appears here while recording</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {recording ? (
          <Button variant="destructive" className="flex-1" onClick={stop}>
            <Square className="size-4" /> Stop ({(CLIP_SECONDS - elapsed).toFixed(1)}s)
            <span className="pulse-rec ml-1 size-2 rounded-full bg-destructive-foreground" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={start}>
            <Mic className="size-4" /> Record cough
          </Button>
        )}
        <Button variant="outline" className="flex-1" asChild>
          <label>
            <Upload className="size-4" /> Upload .wav
            <input
              type="file"
              accept="audio/wav,audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </Button>
      </div>
    </Card>
  );
}
