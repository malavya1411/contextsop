"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import LogEditor from "@/components/generator/LogEditor";
import UploadDropzone from "@/components/generator/UploadDropzone";
import MetadataPanel, { FileMetadata } from "@/components/generator/MetadataPanel";
import PreviewPanel from "@/components/generator/PreviewPanel";
import StatisticsBar from "@/components/generator/StatisticsBar";
import DemoTemplates from "@/components/generator/DemoTemplates";
import GenerateButton from "@/components/generator/GenerateButton";
import ValidationAlert from "@/components/generator/ValidationAlert";
import LoadingOverlay from "@/components/generator/LoadingOverlay";

interface Statistics {
  characters: number;
  words: number;
  lines: number;
  estimatedTokens: number;
}

export default function SopGenerator() {
  // Core Page State
  const [rawTranscript, setRawTranscript] = useState<string>("");
  const [sourceType, setSourceType] = useState<"text" | "file">("text");
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  
  // Simulation State
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate live statistics on-the-fly during render
  const chars = rawTranscript.length;
  const words = rawTranscript.trim() ? rawTranscript.trim().split(/\s+/).length : 0;
  const lines = rawTranscript ? rawTranscript.split(/\r?\n/).length : 0;
  const estimatedTokens = Math.ceil(chars / 4);

  const statistics: Statistics = {
    characters: chars,
    words,
    lines,
    estimatedTokens,
  };

  // Handler for LogEditor input changes
  const handleEditorChange = (value: string) => {
    setRawTranscript(value);
    setSourceType("text");
    setValidationError("");
    // Clear file metadata if user starts manual editing
    if (fileMetadata) {
      setFileMetadata(null);
    }
  };

  // Handler to clear all content
  const handleClear = () => {
    setRawTranscript("");
    setSourceType("text");
    setFileMetadata(null);
    setValidationError("");
  };

  // Handler for successful file drops or loads
  const handleFileLoaded = (
    content: string,
    meta: {
      filename: string;
      size: number;
      lines: number;
      characters: number;
      encoding: string;
    }
  ) => {
    setRawTranscript(content);
    setSourceType("file");
    setValidationError("");
    setFileMetadata({
      ...meta,
      status: "Ready",
    });
  };

  // Handler for template clicks
  const handleSelectTemplate = (content: string) => {
    setRawTranscript(content);
    setSourceType("text");
    setFileMetadata(null);
    setValidationError("");
    
    // Smooth scroll to editor if viewport permits
    const element = document.getElementById("log-editor-container");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle progress steps and scroll to top immediately
  const handleProgress = (step: string | null) => {
    setProgressStep(step);
    if (step !== null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const mainContainer = document.querySelector("main")?.parentElement;
      if (mainContainer) {
        mainContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // Show a temporary success toast
  const handleShowSuccessToast = (message: string) => {
    setToastMessage(message);
    
    // Smooth scroll back to the top
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainContainer = document.querySelector("main")?.parentElement;
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: "smooth" });
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-8 relative pb-20 max-w-5xl mx-auto">
      {/* Loading overlay for generation simulation */}
      <LoadingOverlay active={progressStep !== null && progressStep !== "START"} message={progressStep || ""} />

      {/* Premium Hero Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-sidebar-border/40">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            AI-Powered SOP Generator
          </h1>
          <p className="text-sm md:text-base text-text-muted max-w-2xl leading-relaxed">
            Compile safe, structured Standard Operating Procedures directly from engineering logs, chat transcripts, and postmortem records.
          </p>
        </div>
      </div>

      {/* Validation alert banner */}
      <ValidationAlert message={validationError} onClear={() => setValidationError("")} />

      {/* Main Workspace Layout: Paste Logs and Drag-Drop Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div id="log-editor-container" className="flex flex-col h-full">
          <LogEditor
            value={rawTranscript}
            onChange={handleEditorChange}
            onClear={handleClear}
            disabled={progressStep !== null}
          />
        </div>
        <div className="flex flex-col h-full">
          <UploadDropzone
            onFileLoaded={handleFileLoaded}
            onError={(msg) => setValidationError(msg)}
            disabled={progressStep !== null}
          />
        </div>
      </div>

      {/* Live Statistics Bar */}
      {rawTranscript && (
        <section className="space-y-3 animate-fadeIn">
          <h3 className="text-xs font-semibold uppercase tracking-[.15em] text-[#91a3b9]">
            Live Statistics
          </h3>
          <StatisticsBar stats={statistics} />
        </section>
      )}

      {/* Ingestion Metadata Panel */}
      {fileMetadata && (
        <section className="animate-fadeIn">
          <MetadataPanel metadata={fileMetadata} />
        </section>
      )}

      {/* Log Preview Panel */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[.15em] text-[#91a3b9]">
          Log Preview
        </h3>
        <PreviewPanel transcript={rawTranscript} />
      </section>

      {/* Demo Templates Section */}
      <section className="border-t border-sidebar-border/60 pt-8">
        <DemoTemplates onSelectTemplate={handleSelectTemplate} disabled={progressStep !== null} />
      </section>

      {/* Generate Action Button */}
      <section className="flex flex-col items-center border-t border-sidebar-border/60 pt-8">
        <GenerateButton
          disabled={!rawTranscript || !rawTranscript.trim() || progressStep !== null}
          transcript={rawTranscript}
          sourceType={sourceType}
          metadata={{
            filename: fileMetadata?.filename,
            size: fileMetadata?.size,
            encoding: fileMetadata?.encoding,
            lines: statistics.lines,
            characters: statistics.characters,
            estimatedTokens: statistics.estimatedTokens,
          }}
          onProgress={handleProgress}
          onSuccess={handleShowSuccessToast}
        />
      </section>

      {/* Animated Custom Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-2xl backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
