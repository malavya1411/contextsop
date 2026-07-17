import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface GenerateButtonProps {
  disabled: boolean;
  transcript: string;
  sourceType: "text" | "file";
  metadata: {
    filename?: string;
    size?: number;
    encoding?: string;
    lines: number;
    characters: number;
    estimatedTokens: number;
  };
  onProgress: (stepName: string | null) => void;
  onSuccess: (message: string) => void;
  onError?: (message: string) => void;
}

export default function GenerateButton({
  disabled,
  transcript,
  onProgress,
  onSuccess,
  onError,
}: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const router = useRouter();

  const validateInput = (input: string): boolean => {
    return input !== null && input.trim().length > 0;
  };

  const prepareTranscript = (input: string): string => {
    return input.trim();
  };

  const handleGenerate = async () => {
    if (disabled || loading) return;

    if (!validateInput(transcript)) {
      return;
    }

    setLoading(true);
    
    try {
      // Step 0: Notify parent to lock inputs and scroll to top
      setLoadingStep("Initializing...");
      onProgress("START");
      
      // Wait for smooth scroll animation to finish (800ms)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 1: Validating Input...
      setLoadingStep("Validating Input...");
      onProgress("Validating Input...");
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 2: Preparing Transcript...
      setLoadingStep("Preparing Transcript...");
      onProgress("Preparing Transcript...");
      const prepared = prepareTranscript(transcript);
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Step 3: Getting session token...
      setLoadingStep("Connecting to Auth...");
      onProgress("Connecting to Auth...");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Session expired. Please log in again.");

      // Step 4: Spawning generation job...
      setLoadingStep("Submitting to AI Pipeline...");
      onProgress("Submitting to AI Pipeline...");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/v1/sop/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ transcript: prepared }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Generation request failed.");
      }
      const { job_id } = await res.json();

      // Step 5: Polling status...
      let sop_id: string | null = null;
      let attempts = 0;
      setLoadingStep("AI Extracting Steps...");
      onProgress("AI Extracting Steps...");

      while (!sop_id && attempts < 90) { // max 3 minutes
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
        const pollRes = await fetch(`${apiUrl}/api/v1/sop/jobs/${job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!pollRes.ok) {
          throw new Error("Failed to query job status.");
        }
        const job = await pollRes.json();
        if (job.status === "completed") {
          sop_id = job.sop_id;
        } else if (job.status === "failed") {
          throw new Error(job.error || "AI generation failed.");
        } else if (job.status === "processing") {
          setLoadingStep("AI Compiling Runbook...");
          onProgress("AI Compiling Runbook...");
        }
      }

      if (!sop_id) {
        throw new Error("SOP Generation timed out. Please check your incident logs and try again.");
      }

      onSuccess("SOP generated successfully! Redirecting...");
      // Step 6: Redirecting...
      router.push(`/dashboard/run/${sop_id}`);
    } catch (err: unknown) {
      console.error(err);
      if (onError) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred during generation.";
        onError(message);
      }
    } finally {
      setLoading(false);
      setLoadingStep("");
      onProgress(null);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={disabled || loading}
      className={`w-full max-w-lg mx-auto flex items-center justify-center gap-2.5 py-4 px-8 rounded-full text-sm font-semibold transition-all duration-300 select-none ${
        disabled
          ? "bg-slate-100 dark:bg-[#0b1828] text-slate-400 dark:text-text-muted border border-slate-200 dark:border-sidebar-border/60 cursor-not-allowed shadow-none"
          : loading
          ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-gradient-flow text-white shadow-lg cursor-wait"
          : "bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 dark:from-emerald-500 dark:via-emerald-400 dark:to-teal-500 text-slate-950 shadow-[0_8px_30px_rgba(16,185,129,0.2)] dark:shadow-[0_8px_30px_rgba(52,211,153,0.15)] hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] active:scale-[0.98] cursor-pointer"
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span className="font-mono tracking-wide uppercase text-xs font-bold">{loadingStep}</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 shrink-0 fill-current" />
          <span className="uppercase tracking-wider text-xs font-bold">Generate Standard Operating Procedure</span>
        </>
      )}
    </button>
  );
}
