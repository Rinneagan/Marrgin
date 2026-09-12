"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { Piece, getBeyondTheRainPieces } from "@/lib/db";
import { ChapterSynthesisResponse, ArchivePattern } from "@/app/api/beyond-the-rain/connect-dots/route";

export default function BeyondTheRainPage() {
  // Restrained 3.5s chapter opening matching the original Marrgin homepage splash
  const [showSplash, setShowSplash] = useState(true);

  // Chapter state
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [isLoadingPieces, setIsLoadingPieces] = useState(true);

  // Background archive synthesis
  const [synthesis, setSynthesis] = useState<ChapterSynthesisResponse | null>(null);

  useEffect(() => {
    // 3.5-second chapter opening timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    // Fetch published pieces for Beyond the Rain
    getBeyondTheRainPieces()
      .then((data) => {
        setPieces(data);
        setIsLoadingPieces(false);
      })
      .catch((err) => {
        console.error("Error loading chapter pieces:", err);
        setIsLoadingPieces(false);
      });

    // Fetch cached server-side archive synthesis (GET: visitor loads never trigger fresh inference)
    fetch("/api/beyond-the-rain/connect-dots")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSynthesis(data);
      })
      .catch((err) => {
        // Quiet degradation: primary reporting remains accessible
        console.warn("Archive synthesis currently unavailable:", err);
      });

    return () => clearTimeout(timer);
  }, []);

  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case "documented":
        return "Documented";
      case "possible":
        return "Possible";
      case "unresolved":
      default:
        return "Unresolved";
    }
  };

  return (
    <div
      className={`min-h-screen bg-background text-neutral-900 dark:text-neutral-100 ${
        showSplash ? "h-screen overflow-hidden" : ""
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. CHAPTER OPENING SPLASH (MATCHING MARRGIN'S HOMEPAGE SPLASH) */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background dark:bg-[#080808]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="max-w-3xl mx-auto text-center px-8 relative z-20"
            >
              <p className="font-serif italic text-3xl md:text-5xl lg:text-6xl text-neutral-900 dark:text-neutral-100 mb-6 leading-tight">
                &ldquo;Water is never just weather. In Ghana, it is drainage, politics, concrete, and memory.&rdquo;
              </p>
              <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 font-mono tracking-[0.25em] uppercase">
                — Beyond the Rain in Ghana
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-24 space-y-16">
        {/* ------------------------------------------------------------- */}
        {/* 2. CHAPTER HEADER                                             */}
        {/* ------------------------------------------------------------- */}
        <header className="border-b border-neutral-200 dark:border-neutral-800 pb-10">
          <h1 className="font-serif text-4xl sm:text-6xl text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            Beyond the Rain in Ghana
          </h1>
          <p className="font-serif italic text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
            An investigation of drainage, infrastructure, land use, and the human cost of flooding across Ghana.
          </p>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* 3. WHAT THE ARCHIVE SHOWS (BACKGROUND SYNTHESIS)              */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100">
            What the archive shows
          </h2>

          {synthesis?.status === "ready" && synthesis.patterns.length > 0 ? (
            <div className="space-y-6">
              <p className="font-serif text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {synthesis.summary}
              </p>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800">
                {synthesis.patterns.map((pattern: ArchivePattern, idx: number) => (
                  <div key={idx} className="py-5 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                        {getClassificationLabel(pattern.classification)}
                      </span>
                    </div>

                    <p className="font-serif text-base sm:text-lg text-neutral-900 dark:text-neutral-100 leading-relaxed">
                      {pattern.claim}
                    </p>

                    {pattern.supportingPieces && pattern.supportingPieces.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                        <span>Supporting reporting:</span>
                        {pattern.supportingPieces.map((sp, pIdx) => (
                          <Link
                            key={pIdx}
                            href={`/read/${sp.pieceId}`}
                            className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                          >
                            {sp.title}
                            {sp.location ? ` (${sp.location})` : ""}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 border-y border-neutral-200 dark:border-neutral-800">
              <p className="font-serif italic text-neutral-600 dark:text-neutral-400">
                The archive is still taking shape.
              </p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4. DISPATCHES & REPORTING                                      */}
        {/* ------------------------------------------------------------- */}
        <section className="space-y-8 pt-4">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <h2 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100">
              Reporting
            </h2>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              {pieces.length} {pieces.length === 1 ? "dispatch" : "dispatches"}
            </span>
          </div>

          {isLoadingPieces ? (
            <div className="py-12 text-center font-serif italic text-neutral-400">
              Loading dispatches...
            </div>
          ) : pieces.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <p className="font-serif italic text-neutral-600 dark:text-neutral-400">
                No dispatches have been published in this chapter yet.
              </p>
              <div>
                <Link
                  href="/write"
                  className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-4"
                >
                  <span>Open Writing Desk</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {pieces.map((piece) => (
                <article key={piece.id} className="py-8 space-y-3 group">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {piece.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {piece.location}
                      </span>
                    )}
                    {piece.location && <span>·</span>}
                    <span>{piece.mode ? piece.mode.toUpperCase() : "INVESTIGATION"}</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                    <Link href={`/read/${piece.id}`}>{piece.title}</Link>
                  </h3>

                  {piece.subtitle && (
                    <p className="font-serif italic text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {piece.subtitle}
                    </p>
                  )}

                  {piece.centralQuestion && (
                    <p className="font-serif text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="font-mono uppercase text-[10px] tracking-wider text-neutral-400 block mb-1">
                        Central Question
                      </span>
                      {piece.centralQuestion}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    <span>{piece.authorName || "Ebenezer Essel"}</span>
                    <Link
                      href={`/read/${piece.id}`}
                      className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Read dispatch</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
