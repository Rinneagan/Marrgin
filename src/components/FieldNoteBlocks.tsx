import React from "react";
import { Eye, Search, Sparkles } from "lucide-react";

interface FieldNoteBlocksProps {
  observation?: string;
  finding?: string;
  inference?: string;
  rawContent?: string;
}

export default function FieldNoteBlocks({
  observation,
  finding,
  inference,
  rawContent,
}: FieldNoteBlocksProps) {
  // If dedicated fields aren't present, check if rawContent contains ### OBSERVATION, ### FINDING, ### INFERENCE
  let obsText = observation || "";
  let findText = finding || "";
  let infText = inference || "";

  if (!obsText && !findText && !infText && rawContent) {
    const obsMatch = rawContent.match(/###\s*OBSERVATION\s*([\s\S]*?)(?=###\s*FINDING|###\s*INFERENCE|$)/i);
    const findMatch = rawContent.match(/###\s*FINDING\s*([\s\S]*?)(?=###\s*INFERENCE|$)/i);
    const infMatch = rawContent.match(/###\s*INFERENCE\s*([\s\S]*?)$/i);

    if (obsMatch) obsText = obsMatch[1].trim();
    if (findMatch) findText = findMatch[1].trim();
    if (infMatch) infText = infMatch[1].trim();
  }

  const hasStructured = Boolean(obsText || findText || infText);

  if (!hasStructured) {
    // If no structured blocks, render raw content with elegant notebook prose
    return (
      <div className="font-serif text-xl md:text-2xl text-gray-800 dark:text-gray-200 leading-[2.2] tracking-wide whitespace-pre-wrap">
        {rawContent}
      </div>
    );
  }

  return (
    <div className="space-y-8 my-8 font-sans">
      {/* 1. Observation: Primary sensory & empirical data */}
      {obsText && (
        <div className="rounded-2xl p-6 md:p-8 bg-black/[0.02] dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Eye size={12} /> Observation
            </span>
            <span className="text-xs text-gray-400 font-mono">Empirical record</span>
          </div>
          <div className="font-serif text-lg md:text-xl text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {obsText}
          </div>
        </div>
      )}

      {/* 2. Finding: What the evidence appears to establish */}
      {findText && (
        <div className="rounded-2xl p-6 md:p-8 bg-amber-500/[0.03] dark:bg-amber-500/[0.02] border border-amber-500/20 relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Search size={12} /> Finding
            </span>
            <span className="text-xs text-gray-400 font-mono">Evidentiary conclusion</span>
          </div>
          <div className="font-serif text-lg md:text-xl text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {findText}
          </div>
        </div>
      )}

      {/* 3. Inference: What may follow from the evidence */}
      {infText && (
        <div className="rounded-2xl p-6 md:p-8 bg-purple-500/[0.03] dark:bg-purple-500/[0.02] border border-purple-500/20 relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Sparkles size={12} /> Inference
            </span>
            <span className="text-xs text-gray-400 font-mono">Analytical interpretation</span>
          </div>
          <div className="font-serif text-lg md:text-xl text-gray-800 dark:text-gray-200 leading-relaxed italic whitespace-pre-wrap">
            {infText}
          </div>
        </div>
      )}
    </div>
  );
}
