"use client";

import React from "react";
import { Piece, EditorialMode } from "@/lib/db";
import { X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PieceHeader from "@/components/PieceHeader";
import PoemRenderer from "@/components/PoemRenderer";
import ProseRenderer from "@/components/ProseRenderer";
import FieldNoteBlocks from "@/components/FieldNoteBlocks";
import MethodologyDisclosure from "@/components/MethodologyDisclosure";
import LimitationsDisclosure from "@/components/LimitationsDisclosure";
import PublicSources from "@/components/PublicSources";
import DataStoryMetadata from "@/components/DataStoryMetadata";

interface PiecePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  piece: Piece;
}

export default function PiecePreviewModal({
  isOpen,
  onClose,
  piece,
}: PiecePreviewModalProps) {
  if (!isOpen) return null;

  const mode: EditorialMode = piece.mode || "poetry";

  const calculateReadingTime = () => {
    if (piece.readingTimeMinutes && piece.readingTimeMinutes > 0) {
      return `${piece.readingTimeMinutes} min read`;
    }
    const words = (piece.content || "").trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-md p-4 sm:p-8 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 relative"
        >
          {/* Top Banner Notice */}
          <div className="sticky top-0 z-20 px-6 py-3 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-medium">
              <Eye size={14} />
              <span>Preview Mode · Exact Reader Experience ({mode})</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Reader Article Canvas */}
          <div className="p-6 sm:p-12 lg:p-16 max-w-[820px] mx-auto">
            {/* Header */}
            <PieceHeader
              piece={piece}
              readingTimeText={calculateReadingTime()}
            />

            {/* Content Body */}
            <div className="mt-8 space-y-8">
              {/* Epigraph (if essay or poetry) */}
              {piece.epigraph && (
                <div className="mb-10 italic text-sm text-gray-500 dark:text-gray-400 text-right max-w-sm ml-auto border-r-2 border-gray-200 dark:border-gray-800 pr-4 font-serif">
                  {piece.epigraph}
                </div>
              )}

              {/* Mode-Specific Renderers */}
              {mode === "poetry" ? (
                <PoemRenderer content={piece.content || ""} />
              ) : mode === "field-note" ? (
                <div className="space-y-8">
                  <FieldNoteBlocks 
                    observation={piece.observation} 
                    finding={piece.finding} 
                    inference={piece.inference} 
                    rawContent={piece.content} 
                  />
                  {piece.content && <ProseRenderer content={piece.content} mode={mode} />}
                </div>
              ) : (
                <ProseRenderer content={piece.content || ""} mode={mode} />
              )}

              {/* Data Story Metadata */}
              {mode === "data-story" && (
                <DataStoryMetadata 
                  datasetName={piece.datasetName}
                  dataSource={piece.dataSource}
                  dataUnits={piece.dataUnits}
                  dataTimeframe={piece.dataTimeframe}
                  dataConfig={piece.dataConfig}
                />
              )}

              {/* Public Investigative Disclosures */}
              {mode === "investigation" && (
                <div className="pt-8 space-y-6">
                  {piece.methodology && <MethodologyDisclosure methodology={piece.methodology} />}
                  {piece.limitations && <LimitationsDisclosure limitations={piece.limitations} />}
                  {piece.publicSources && piece.publicSources.length > 0 && (
                    <PublicSources sources={piece.publicSources} />
                  )}
                </div>
              )}

              {/* Footnote (if any) */}
              {piece.footnote && (
                <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-xs font-serif text-neutral-500 italic">
                  Note: {piece.footnote}
                </div>
              )}

              {/* Dedication / Afterword */}
              {piece.dedication && (
                <div className="pt-4 text-xs font-serif text-neutral-400 text-center italic">
                  Dedicated: {piece.dedication}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
