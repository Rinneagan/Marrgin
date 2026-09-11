import React from "react";
import { AlertCircle } from "lucide-react";

interface LimitationsDisclosureProps {
  limitations?: string;
}

export default function LimitationsDisclosure({ limitations }: LimitationsDisclosureProps) {
  if (!limitations || !limitations.trim()) return null;

  return (
    <section className="my-10 font-sans">
      <div className="bg-white/[0.015] dark:bg-white/[0.01] border border-dashed border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          <AlertCircle size={15} className="text-gray-400" />
          <span>What We Could Not Establish</span>
        </div>
        <div className="font-serif text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap italic">
          {limitations}
        </div>
      </div>
    </section>
  );
}
