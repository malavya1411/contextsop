import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  active: boolean;
  message?: string;
}

export default function LoadingOverlay({ active, message = "Processing..." }: LoadingOverlayProps) {
  // Lock body scroll while active
  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="flex flex-col items-center gap-5 p-8 rounded-2xl border border-slate-200/80 dark:border-sidebar-border bg-white/80 dark:bg-[#07111f]/80 shadow-2xl backdrop-blur-lg max-w-sm w-full mx-4 text-center select-none"
          >
            <div className="relative flex items-center justify-center">
              {/* Outer glow ring */}
              <div className="absolute w-12 h-12 rounded-full bg-accent-primary/10 animate-ping" />
              
              {/* Main spinner */}
              <Loader2 className="w-9 h-9 animate-spin text-accent-primary" />
            </div>

            <div className="space-y-1">
              <AnimatePresence mode="wait">
                <motion.p
                  key={message}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-semibold text-foreground tracking-wide"
                >
                  {message}
                </motion.p>
              </AnimatePresence>
              <p className="text-[10px] text-text-muted font-mono tracking-wider uppercase">
                ContextSOP AI Pipeline
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
