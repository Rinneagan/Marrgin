"use client";

import React, { useState } from "react";
import { Piece } from "@/lib/db";
import { X, Send, Clock, Globe, Share2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: (options?: { scheduledAt?: string }) => Promise<void>;
  onUnpublish?: () => Promise<void>;
  onOpenSocialPreview?: () => void;
  piece: Partial<Piece>;
  isPublishing: boolean;
  isAlreadyPublished: boolean;
}

export default function PublishConfirmationModal({
  isOpen,
  onClose,
  onConfirmPublish,
  onUnpublish,
  onOpenSocialPreview,
  piece,
  isPublishing,
  isAlreadyPublished,
}: PublishConfirmationModalProps) {
  const [publishAction, setPublishAction] = useState<"now" | "schedule">("now");
  
  // Default scheduled date 2 hours from now formatted for datetime-local
  const getDefaultScheduledDate = () => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [scheduledDateTime, setScheduledDateTime] = useState<string>(
    piece.scheduledAt ? new Date(piece.scheduledAt).toISOString().slice(0, 16) : getDefaultScheduledDate()
  );

  if (!isOpen) return null;

  const handleAction = async () => {
    if (publishAction === "schedule") {
      if (!scheduledDateTime) {
        alert("Please choose a future date and time for scheduled publication.");
        return;
      }
      const selectedMs = new Date(scheduledDateTime).getTime();
      if (selectedMs <= Date.now()) {
        alert("Please select a time in the future.");
        return;
      }
      await onConfirmPublish({ scheduledAt: new Date(scheduledDateTime).toISOString() });
    } else {
      await onConfirmPublish();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
        >
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="Close publish dialog"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-400">
            <Globe size={18} />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-medium">
              {isAlreadyPublished ? "Update Story" : "Publishing Studio"}
            </span>
          </div>

          <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-100 mb-2">
            {isAlreadyPublished ? "Publish updates to live story?" : "Publish to Marrgin"}
          </h3>

          <p className="text-xs text-neutral-500 font-sans mb-5 leading-relaxed">
            {isAlreadyPublished
              ? "Your updates will become immediately visible to readers across Marrgin. The original publication date will be preserved."
              : "Choose whether to make this piece public immediately or schedule it for a future date and time."}
          </p>

          {/* Schedule vs Publish Now tabs (Only for drafts / not yet published) */}
          {!isAlreadyPublished && (
            <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setPublishAction("now")}
                className={`py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  publishAction === "now"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
                }`}
              >
                <Send size={13} />
                <span>Publish Now</span>
              </button>
              <button
                type="button"
                onClick={() => setPublishAction("schedule")}
                className={`py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  publishAction === "schedule"
                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
                }`}
              >
                <Clock size={13} />
                <span>Schedule Later</span>
              </button>
            </div>
          )}

          {/* Scheduled Date/Time picker */}
          {publishAction === "schedule" && !isAlreadyPublished && (
            <div className="mb-5 p-3.5 bg-neutral-50 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Select Publication Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
              <p className="text-[11px] text-neutral-400 mt-1.5">
                The piece will remain private until this time arrives, when the server transitions it to published.
              </p>
            </div>
          )}

          {/* Piece Summary Card */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800/70 space-y-2 mb-5 text-xs font-sans">
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400 block">Title</span>
              <p className="font-serif text-base text-neutral-900 dark:text-neutral-100 font-medium line-clamp-1">
                {piece.title || "Untitled Piece"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">Editorial Mode</span>
                <span className="capitalize text-neutral-800 dark:text-neutral-200 font-medium">
                  {piece.mode || "Poetry"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">Location</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  {piece.location || "None specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Preview Metadata Card Trigger */}
          {onOpenSocialPreview && (
            <div className="mb-5">
              <button
                type="button"
                onClick={onOpenSocialPreview}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-serif text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 size={13} />
                <span>Preview Social & OpenGraph Cards</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAction}
              disabled={isPublishing || !piece.title?.trim()}
              className="w-full py-3 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-xs font-sans font-medium flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              <Send size={14} />
              <span>
                {isPublishing
                  ? "Processing..."
                  : isAlreadyPublished
                  ? "Update Story"
                  : publishAction === "schedule"
                  ? "Confirm Schedule"
                  : "Confirm & Publish"}
              </span>
            </button>

            {isAlreadyPublished && onUnpublish && (
              <button
                type="button"
                onClick={onUnpublish}
                disabled={isPublishing}
                className="w-full py-2.5 rounded-lg border border-amber-500/30 text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-xs font-sans font-medium"
              >
                Unpublish Back to Draft
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="w-full py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-xs font-sans"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
