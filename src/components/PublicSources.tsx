import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";

export interface PublicSourceItem {
  title: string;
  url?: string;
  publisherOrOrg?: string;
  date?: string;
  notes?: string;
}

interface PublicSourcesProps {
  sources?: PublicSourceItem[];
}

export default function PublicSources({ sources }: PublicSourcesProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <section className="my-14 pt-8 border-t border-gray-200 dark:border-gray-800 font-sans">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">
        <BookOpen size={16} className="text-accent" />
        <span>Sources & Documentation</span>
      </div>

      <div className="space-y-4">
        {sources.map((src, idx) => (
          <div 
            key={idx}
            className="p-4 rounded-xl bg-white/[0.02] dark:bg-white/[0.01] border border-gray-100 dark:border-gray-800/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-serif text-base md:text-lg text-gray-900 dark:text-gray-100">
                  {src.title}
                </h4>
                {(src.publisherOrOrg || src.date) && (
                  <p className="text-xs text-gray-500 font-sans mt-0.5">
                    {[src.publisherOrOrg, src.date].filter(Boolean).join(" • ")}
                  </p>
                )}
                {src.notes && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-serif italic leading-relaxed">
                    {src.notes}
                  </p>
                )}
              </div>

              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-white/5 transition-colors shrink-0"
                  title="Open source document"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
