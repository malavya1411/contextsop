import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";

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
}

export default function GenerateButton({
  disabled,
  transcript,
  sourceType,
  metadata,
  onProgress,
  onSuccess,
}: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");

  /**
   * TODO: Phase 7 Backend Integration
   * Placeholder function to validate raw input syntax or schemas.
   */
  const validateInput = (input: string): boolean => {
    // Current frontend checks for non-empty and non-whitespace characters
    return input !== null && input.trim().length > 0;
  };

  /**
   * TODO: Phase 7 Backend Integration
   * Placeholder function to sanitize, clean, or format the transcript.
   */
  const prepareTranscript = (input: string): string => {
    // Basic trimming and cleaning for now
    return input.trim();
  };

  /**
   * TODO: Phase 7 Backend Integration
   * Placeholder function to upload prepared transcript data to the database/Supabase bucket.
   */
  const uploadTranscript = async (prepared: string): Promise<string | null> => {
    // Mimic API upload delay
    console.log("[Phase 7 Uploading]:", prepared.substring(0, 50));
    await new Promise((resolve) => setTimeout(resolve, 800));
    return "mock-transcript-id-12345";
  };

  /**
   * TODO: Phase 7 Backend Integration
   * Main handler to send the payload to POST /api/v1/sop/generate.
   */
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
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 2: Preparing Transcript...
      setLoadingStep("Preparing Transcript...");
      onProgress("Preparing Transcript...");
      const prepared = prepareTranscript(transcript);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 3: Reading Uploaded File...
      setLoadingStep("Reading Uploaded File...");
      onProgress("Reading Uploaded File...");
      const uploadId = await uploadTranscript(prepared);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 4: Generating Metadata...
      setLoadingStep("Generating Metadata...");
      onProgress("Generating Metadata...");
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 5: Estimating AI Tokens...
      setLoadingStep("Estimating AI Tokens...");
      onProgress("Estimating AI Tokens...");
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 6: Preparing for AI Processing...
      setLoadingStep("Preparing for AI Processing...");
      onProgress("Preparing for AI Processing...");
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Payload prepared for Phase 7:
      const payload = {
        transcript: prepared,
        sourceType,
        uploadId,
        metadata: {
          filename: metadata.filename || "pasted_text.txt",
          size: metadata.size || prepared.length,
          encoding: metadata.encoding || "UTF-8",
          lines: metadata.lines,
          characters: metadata.characters,
          estimatedTokens: metadata.estimatedTokens,
        },
      };

      console.log("[Phase 7 Payload Ready]:", payload);

      onSuccess("Transcript prepared successfully. Ready for AI pipeline integration.");
    } catch (err) {
      console.error(err);
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
