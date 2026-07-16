import React, { useRef, useEffect } from "react";
import { Copy, Trash2, Check } from "lucide-react";

interface LogEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function LogEditor({ value, onChange, onClear, disabled = false }: LogEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Split lines to calculate line count
  const lines = value.split(/\r?\n/);
  const lineCount = Math.max(1, lines.length);

  // Sync scroll of line numbers with textarea scroll
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Failed to copy
    }
  };

  // Adjust line numbers height or scroll when lines change
  useEffect(() => {
    handleScroll();
  }, [value]);

  return (
    <div className="w-full flex flex-col h-full">
      <label className="block text-xs font-semibold uppercase tracking-[.15em] text-text-muted mb-2 select-none">
        Paste Logs
      </label>

      <div className="flex-1 flex flex-col border border-box-border rounded-xl bg-box-bg overflow-hidden min-h-[350px] shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary/50 transition-all duration-200 relative group">
        {/* Editor Title Bar / Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-box-border bg-box-line-numbers-bg select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700/60" />
            <span className="text-[10px] font-bold tracking-wider text-text-muted font-mono uppercase">
              logs.txt
            </span>
          </div>
          
          {/* Action Buttons inside Header */}
          <div className="flex items-center gap-1.5 select-none">
            {value && (
              <>
                <button
                  onClick={handleCopy}
                  disabled={disabled}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-box-bg border border-box-border text-[10px] font-semibold text-text-muted hover:text-foreground hover:border-text-muted/40 transition-colors duration-150 ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                  title="Copy all logs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClear}
                  disabled={disabled}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-[10px] font-semibold text-red-500 hover:text-red-400 border border-red-500/20 transition-colors duration-150 ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                  title="Clear editor content"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Text Area & Line Numbers */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Line Numbers Column */}
          <div
            ref={lineNumbersRef}
            className="w-12 select-none overflow-hidden pr-3 pt-3 border-r border-box-border text-right font-mono text-xs leading-[20px] text-box-line-numbers-text bg-box-line-numbers-bg shrink-0"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="h-5">
                {i + 1}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            disabled={disabled}
            placeholder="Paste engineering logs...
Supported formats:
• Slack conversations
• Terminal output
• Kubernetes logs
• Docker logs
• Incident reports
• Postmortem notes
• Troubleshooting transcripts"
            className={`flex-1 resize-none bg-transparent outline-none p-3 font-mono text-xs leading-[20px] text-box-text caret-accent-primary placeholder-slate-400 dark:placeholder-[#3d5874] overflow-y-auto custom-scrollbar h-[300px] md:h-auto ${disabled ? "opacity-65 cursor-not-allowed" : ""}`}
            spellCheck="false"
          />

          {/* Character & Line Counter Badge */}
          <div className="absolute right-3 bottom-3 opacity-60 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none select-none flex gap-2 font-mono text-[9px] text-text-muted bg-box-line-numbers-bg border border-box-border px-2 py-0.5 rounded shadow">
            <span>{value.length.toLocaleString()} chars</span>
            <span className="border-r border-box-border" />
            <span>{lineCount.toLocaleString()} lines</span>
          </div>
        </div>
      </div>
    </div>
  );
}
