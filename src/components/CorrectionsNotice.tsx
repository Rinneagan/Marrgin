import React from "react";
import { History } from "lucide-react";

export interface CorrectionItem {
  date: string;
  whatChanged: string;
  reason?: string;
}

interface CorrectionsNoticeProps {
  corrections?: CorrectionItem[];
}

export default function CorrectionsNotice({ corrections }: CorrectionsNoticeProps) {
  if (!corrections || corrections.length === 0) return null;

  return (
    <section className="my-10 pt-6 border-t border-gray-100 dark:border-gray-900 font-sans">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
        <History size={14} className="text-gray-400" />
        <span>Corrections & Updates</span>
      </div>

      <div className="space-y-3">
        {corrections.map((item, idx) => (
          <div 
            key={idx}
            className="text-xs text-gray-500 dark:text-gray-400 font-sans leading-relaxed border-l-2 border-gray-200 dark:border-gray-800 pl-3 py-1"
          >
            <span className="font-mono text-gray-400 font-medium mr-2">{item.date}:</span>
            <span>{item.whatChanged}</span>
            {item.reason && (
              <span className="italic text-gray-500 block mt-0.5">({item.reason})</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
