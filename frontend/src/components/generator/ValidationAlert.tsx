import React from "react";
import { AlertCircle } from "lucide-react";

interface ValidationAlertProps {
  message: string;
  onClear?: () => void;
}

export default function ValidationAlert({ message, onClear }: ValidationAlertProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 leading-relaxed relative animate-fadeIn">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{message}</div>
      {onClear && (
        <button
          onClick={onClear}
          className="text-xs font-semibold hover:underline text-red-500/80 hover:text-red-500 transition-colors shrink-0"
          aria-label="Dismiss alert"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
