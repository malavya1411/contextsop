import React from "react";
import { File, HardDrive, FileText, Compass, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export type IngestionStatus = "Ready" | "Invalid" | "Reading" | "Processing";

export interface FileMetadata {
  filename: string;
  size: number;
  lines: number;
  characters: number;
  encoding: string;
  status: IngestionStatus;
}

interface MetadataPanelProps {
  metadata: FileMetadata | null;
}

export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  if (!metadata) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: IngestionStatus) => {
    switch (status) {
      case "Ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        );
      case "Invalid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-3 h-3" /> Invalid
          </span>
        );
      case "Reading":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" /> Reading
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" /> Processing
          </span>
        );
      default:
        return null;
    }
  };

  const metaItems = [
    { label: "File Name", value: metadata.filename, icon: File },
    { label: "File Size", value: formatSize(metadata.size), icon: HardDrive },
    { label: "Detected Encoding", value: metadata.encoding, icon: Compass },
    { label: "Total Lines", value: metadata.lines.toLocaleString(), icon: FileText },
  ];

  return (
    <div className="w-full p-5 rounded-2xl border border-box-border bg-box-bg select-none shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-box-border pb-3">
        <h4 className="text-xs font-bold text-text-muted font-mono uppercase tracking-wider">File Ingestion Metadata</h4>
        {getStatusBadge(metadata.status)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {metaItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-4 rounded-xl border border-box-border bg-box-line-numbers-bg hover:border-accent-primary/25 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center gap-2 text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2.5 font-mono">
                <Icon className="w-3.5 h-3.5 text-text-muted/60 group-hover:text-accent-primary transition-colors" />
                {item.label}
              </div>
              <div className="text-xs font-bold text-foreground truncate select-text font-mono bg-box-bg/50 px-2.5 py-1.5 rounded-lg border border-box-border" title={item.value}>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
