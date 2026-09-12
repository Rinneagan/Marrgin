"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, X, Sparkles, Feather } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string | number;
  message: string;
  type?: ToastType;
  title?: string;
}

interface EditorialToastProps {
  toast: ToastItem | null;
  onClose: () => void;
  duration?: number;
}

export function EditorialToast({ toast, onClose, duration = 4000 }: EditorialToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const type = toast.type || "success";

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />;
      case "info":
        return <Clock className="w-5 h-5 text-sky-400 shrink-0" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />;
    }
  };

  const getBadge = () => {
    if (toast.title) return toast.title;
    switch (type) {
      case "success":
        return "Editorial Dispatch";
      case "info":
        return "Editorial Notice";
      case "warning":
        return "Editorial Check";
      case "error":
        return "System Warning";
      default:
        return "Marrgin";
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none flex flex-col items-end max-w-sm w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="pointer-events-auto w-full bg-neutral-950/95 dark:bg-black/95 text-neutral-100 border border-neutral-800/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl p-4 flex items-start gap-3.5 relative overflow-hidden"
        >
          {/* Subtle amber ambient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          {/* Icon */}
          <div className="mt-0.5">{getIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold">
                {getBadge()}
              </span>
            </div>
            <p className="font-serif text-sm md:text-base text-neutral-200 leading-snug">
              {toast.message}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="text-neutral-500 hover:text-neutral-200 p-1 rounded-full hover:bg-neutral-900 transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
