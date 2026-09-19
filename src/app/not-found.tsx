import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Margin is Empty",
  description: "The requested verse or dispatch does not exist, has moved, or remains unwritten.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center select-none">
      <div className="w-10 h-0.5 bg-amber-800/40 dark:bg-amber-400/40 mx-auto mb-8 rounded-full" />
      
      <p className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-3">
        404 · Page Not Found
      </p>

      <h1 className="font-serif text-5xl sm:text-6xl text-neutral-900 dark:text-neutral-100 mb-6">
        The Margin is Empty
      </h1>

      <p className="font-poem italic text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed mb-12">
        &ldquo;The requested verse or dispatch does not exist, has moved, or remains unwritten.&rdquo;
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 font-sans">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-6 py-3 rounded-full text-xs font-medium tracking-wide hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Return Home</span>
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 px-6 py-3 rounded-full text-xs font-medium tracking-wide text-neutral-800 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all shadow-sm"
        >
          <Compass size={14} />
          <span>Explore Archive</span>
        </Link>
      </div>

      <div className="mt-20 pt-8 border-t border-gray-200/50 dark:border-gray-800/50 max-w-xs mx-auto">
        <p className="text-[10px] text-neutral-400 font-mono tracking-widest">
          MARRGIN · ACCRA, GHANA
        </p>
      </div>
    </div>
  );
}
