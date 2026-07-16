import React from "react";
import EmptyState from "./EmptyState";

interface PreviewPanelProps {
  transcript: string;
}

export default function PreviewPanel({ transcript }: PreviewPanelProps) {
  if (!transcript || !transcript.trim()) {
    return (
      <EmptyState
        title="No log preview available"
        description="Paste some engineering logs or upload a log file above to see a preview of the content here."
      />
    );
  }

  // Get first 50 lines
  const lines = transcript.split(/\r?\n/);
  const previewLines = lines.slice(0, 50);
  const totalLines = lines.length;

  return (
    <div className="w-full rounded-xl border border-box-border bg-box-bg overflow-hidden shadow-sm dark:shadow-lg transition-all duration-200 group">
      {/* Tab Bar Header */}
      <div className="flex items-center justify-between border-b border-box-border bg-box-line-numbers-bg select-none">
        <div className="flex items-center">
          {/* Traffic light window controls */}
          <div className="flex items-center gap-1.5 px-4">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/70 transition-colors border border-red-500/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500/70 transition-colors border border-yellow-500/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500/70 transition-colors border border-green-500/30" />
          </div>
          
          {/* Active File Tab */}
          <div className="flex items-center gap-2 px-4 py-2 border-r border-box-border bg-box-bg text-xs font-semibold text-foreground border-t-2 border-t-accent-primary">
            <span className="text-[10px] text-text-muted font-mono">transcript_preview.log</span>
          </div>
        </div>

        <div className="px-4">
          <span className="text-[9px] text-text-muted font-mono uppercase bg-box-line-numbers-bg px-2 py-0.5 rounded border border-box-border/80">
            {previewLines.length} of {totalLines} lines
          </span>
        </div>
      </div>

      {/* Code Editor Workspace */}
      <div className="p-4 overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed text-box-text custom-scrollbar">
        <div className="flex min-w-full">
          {/* Line Numbers */}
          <div className="pr-4 border-r border-box-border text-right text-box-line-numbers-text select-none shrink-0 font-mono text-xs leading-[20px]">
            {previewLines.map((_, i) => (
              <div key={i} className="h-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Logs Content */}
          <pre className="pl-4 flex-1 select-text">
            {previewLines.map((line, i) => (
              <div key={i} className="h-5 whitespace-pre leading-[20px]">
                {line || " "}
              </div>
            ))}
          </pre>
        </div>
      </div>
      
      {totalLines > 50 && (
        <div className="px-4 py-2 bg-box-line-numbers-bg/80 border-t border-box-border text-center text-[10px] font-mono text-text-muted">
          ... and {totalLines - 50} more lines truncated for preview ...
        </div>
      )}
    </div>
  );
}
