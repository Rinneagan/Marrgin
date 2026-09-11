import React from "react";
import { ShieldCheck } from "lucide-react";

interface MethodologyDisclosureProps {
  methodology?: string;
}

export default function MethodologyDisclosure({ methodology }: MethodologyDisclosureProps) {
  if (!methodology || !methodology.trim()) return null;

  return (
    <section className="my-14 pt-8 border-t border-gray-200 dark:border-gray-800 font-sans">
      <div className="bg-white/[0.02] dark:bg-white/[0.01] border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-accent mb-3">
          <ShieldCheck size={16} className="text-accent" />
          <span>How We Reported This</span>
        </div>
        <div className="font-serif text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {methodology}
        </div>
      </div>
    </section>
  );
}
