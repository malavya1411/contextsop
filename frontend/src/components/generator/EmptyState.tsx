import React from "react";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-box-border bg-box-bg/40 backdrop-blur-sm text-center min-h-[250px] shadow-sm select-none">
      <div className="p-4 rounded-full bg-box-line-numbers-bg border border-box-border text-text-muted mb-4 animate-float shadow-sm shadow-black/5">
        <FileText className="w-7 h-7 text-text-muted/80" />
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1.5">{title}</h4>
      <p className="text-xs text-text-muted max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
