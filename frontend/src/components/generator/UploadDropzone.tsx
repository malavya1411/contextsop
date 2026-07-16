import React, { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

interface UploadDropzoneProps {
  onFileLoaded: (
    content: string,
    metadata: {
      filename: string;
      size: number;
      lines: number;
      characters: number;
      encoding: string;
    }
  ) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export default function UploadDropzone({ onFileLoaded, onError, disabled = false }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const allowedExtensions = [".txt", ".log", ".md"];
  const maxSizeBytes = 2 * 1024 * 1024; // 2 MB

  const validateFile = (file: File): boolean => {
    // 1. Check size
    if (file.size > maxSizeBytes) {
      onError(`File "${file.name}" exceeds the 2 MB size limit.`);
      return false;
    }
    if (file.size === 0) {
      onError(`File "${file.name}" is empty.`);
      return false;
    }

    // 2. Check extension
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      onError(`Unsupported format. Only .txt, .log, and .md files are supported.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    
    // We read as ArrayBuffer to attempt decoding with different encodings
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        onError("Failed to read file buffer.");
        return;
      }

      const encodings = ["utf-8", "utf-16le", "utf-16be", "windows-1252", "iso-8859-1"];
      let decodedText = "";
      let resolvedEncoding = "";
      let decodeSuccess = false;

      for (const enc of encodings) {
        try {
          const decoder = new TextDecoder(enc, { fatal: true });
          decodedText = decoder.decode(buffer);
          resolvedEncoding = enc.toUpperCase();
          decodeSuccess = true;
          break;
        } catch {
          // Fall through to next encoding
        }
      }

      if (!decodeSuccess) {
        onError("Unable to decode file. The file encoding is not supported or corrupted.");
        return;
      }

      const lines = decodedText.split(/\r?\n/).length;
      const chars = decodedText.length;

      onFileLoaded(decodedText, {
        filename: file.name,
        size: file.size,
        lines,
        characters: chars,
        encoding: resolvedEncoding,
      });
    };

    reader.onerror = () => {
      onError("An error occurred while reading the file.");
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col gap-1 mb-2">
        <label className="block text-xs font-semibold uppercase tracking-[.15em] text-text-muted select-none">
          Upload Files
        </label>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`flex-1 flex flex-col items-center justify-center min-h-[350px] border-2 border-dashed rounded-xl p-8 cursor-pointer select-none text-center transition-all duration-300 relative group ${
          disabled
            ? "border-box-border bg-box-bg/50 opacity-40 cursor-not-allowed pointer-events-none"
            : isDragActive
            ? "border-accent-primary bg-accent-primary/5 scale-[0.99] shadow-inner shadow-accent-primary/5 animate-border-pulse"
            : "border-box-border bg-box-bg hover:bg-slate-100/30 dark:hover:bg-sidebar-bg/5 hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5 hover:-translate-y-0.5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.log,.md"
          onChange={handleChange}
          className="hidden"
          aria-label="Upload incident logs"
        />

        <div className={`p-4 rounded-2xl bg-box-line-numbers-bg border border-box-border text-text-muted group-hover:text-accent-primary group-hover:border-accent-primary/30 transition-all duration-300 shadow-sm shadow-black/5 mb-5 ${isDragActive ? "text-accent-primary scale-110 border-accent-primary/30" : ""}`}>
          <UploadCloud className="w-9 h-9 transition-transform duration-300 group-hover:scale-105" />
        </div>

        <h5 className="text-sm font-semibold text-foreground group-hover:text-accent-primary transition-colors duration-200 mb-1">
          Drag & drop incident logs
        </h5>
        
        <p className="text-xs text-text-muted mb-6">
          or <span className="text-accent-primary font-semibold hover:underline">browse files</span> from your computer
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-text-muted bg-box-line-numbers-bg px-3 py-1.5 rounded-lg border border-box-border/80 shadow-sm">
          <span>Max size: 2MB</span>
          <span className="hidden sm:inline border-r border-box-border h-3" />
          <span>Types: .txt, .log, .md</span>
        </div>
      </div>
    </div>
  );
}
