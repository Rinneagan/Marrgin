"use client";

import Navbar from "@/components/Navbar";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { trackUniqueVisit, createAdminNotification, getHomepageData, HomepageData, Piece } from "@/lib/db";
import PieceCard from "@/components/PieceCard";
import { 
  ArrowRight, 
  MapPin, 
  Compass, 
  HelpCircle
} from "lucide-react";

const letterAnimation: any = {
  hidden: { opacity: 0, y: 40, rotateX: -90 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    transition: { type: "spring", damping: 20, stiffness: 100 }
  }
};

// Protected signature poetry quotes for the 3.5s cinematic splash
const quotes = [
  { text: "Poetry is what gets lost in translation.", author: "Robert Frost" },
  { text: "Poetry is when an emotion has found its thought and the thought has found words.", author: "Robert Frost" },
  { text: "If I read a book and it makes my whole body so cold no fire can warm me, I know that is poetry.", author: "Emily Dickinson" },
  { text: "Poetry is the clear expression of mixed feelings.", author: "W.H. Auden" },
  { text: "A poem begins as a lump in the throat, a sense of wrong, a homesickness, a lovesickness.", author: "Robert Frost" },
  { text: "Poetry is an echo, asking a shadow to dance.", author: "Carl Sandburg" },
  { text: "To be a poet is a condition, not a profession.", author: "Robert Graves" },
  { text: "Poetry is language at its most distilled and most powerful.", author: "Rita Dove" },
  { text: "Genuine poetry can communicate before it is understood.", author: "T.S. Eliot" },
  { text: "Poetry is the spontaneous overflow of powerful feelings.", author: "William Wordsworth" },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Splash screen state (Strictly protected design element)
  const [randomQuote, setRandomQuote] = useState(quotes[0]);
  const [isLoading, setIsLoading] = useState(true);

  // Database-driven homepage data
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);

  useEffect(() => {
    // Unique visitor tracking
    if (typeof window !== "undefined" && !sessionStorage.getItem("hasVisited")) {
      sessionStorage.setItem("hasVisited", "true");
      trackUniqueVisit();
      createAdminNotification("visit", "A new visitor arrived on Marrgin");
    }

    // Pick a random quote after hydration to avoid SSR mismatch
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    
    // Protected 3.5-second cinematic splash screen timer
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    // Fetch live published homepage data from Firestore
    getHomepageData()
      .then(data => setHomepageData(data))
      .catch(console.error);
    
    return () => clearTimeout(timer);
  }, []);

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 140]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, -350]);

  const leadPiece = homepageData?.leadPiece;

  const getLeadReadingTime = (piece: Piece) => {
    if (piece.readingTimeMinutes && piece.readingTimeMinutes > 0) {
      return `${piece.readingTimeMinutes} min read`;
    }
    const words = (piece.content || "").trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  // Editorial blocks definitions
  const editorialDesks = [
    {
      id: "investigations",
      modeKey: "investigation",
      title: "Investigations",
      description: "What is happening, why is it happening, and what evidence supports that claim?",
      pieces: homepageData?.modePieces.investigations || []
    },
    {
      id: "writing",
      modeKey: "writing",
      title: "Writing",
      description: "Poems, essays, and attempts to make sense of things.",
      pieces: homepageData?.modePieces.writing || []
    },
    {
      id: "fieldNotes",
      modeKey: "field-note",
      title: "Field Notes",
      description: "What did we encounter, observe, or learn from being there?",
      pieces: homepageData?.modePieces.fieldNotes || []
    },
    {
      id: "dataStories",
      modeKey: "data-story",
      title: "Data Stories",
      description: "Empirical measurements, precipitation records, and spatial analysis.",
      pieces: homepageData?.modePieces.dataStories || []
    }
  ];

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. THE PROTECTED 3.5s CINEMATIC SPLASH SCREEN                 */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isLoading && (
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
                &ldquo;{randomQuote.text}&rdquo;
              </p>
              <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 font-mono tracking-[0.25em] uppercase">
                — {randomQuote.author}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className={`min-h-screen relative overflow-hidden ${isLoading ? 'h-screen overflow-hidden' : ''}`}>
        
        {/* Background Watermark Parallax */}
        <motion.div 
          style={{ y: watermarkY }}
          className="fixed top-[15%] left-0 right-0 text-center pointer-events-none z-0 select-none"
        >
          <span className="text-[22vw] font-serif font-bold text-black/[0.02] dark:text-white/[0.02] whitespace-nowrap">
            MARRGIN
          </span>
        </motion.div>

        <Navbar />

        {/* ------------------------------------------------------------- */}
        {/* 2. EDITORIAL HERO & MASTHEAD                                  */}
        {/* ------------------------------------------------------------- */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 sm:px-12 pt-28 pb-16 relative z-10 text-center">
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            {/* Split Letter Masthead Entrance */}
            <motion.div 
              initial="hidden"
              animate={!isLoading ? "visible" : "hidden"}
              transition={{ staggerChildren: 0.06, delayChildren: 0.1 }}
              className="flex justify-center overflow-hidden mb-6 select-none"
            >
              {"MARRGIN".split("").map((char, index) => (
                <motion.span 
                  key={index} 
                  variants={letterAnimation}
                  className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-neutral-900 dark:text-neutral-100"
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* Publication Identity & Voice */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-neutral-800 dark:text-neutral-200 mb-4 tracking-tight"
            >
              Writing from where things happen.
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-sans"
            >
              An independent publication observing Ghana through writing, reporting, fieldwork, and evidence.
            </motion.p>
            
            {/* Primary Discovery Call to Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-wrap gap-4 justify-center items-center text-xs sm:text-sm font-sans"
            >
              <a 
                href="#lead-story" 
                className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-7 py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm font-medium flex items-center gap-2"
              >
                <span>Read the Lead</span>
                <ArrowRight size={14} />
              </a>
              <Link 
                href="/explore" 
                className="border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-100 px-7 py-3 rounded-full transition-colors font-medium"
              >
                Explore Archive
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 3. THE LEAD STORY — EDITORIAL FEATURE                         */}
        {/* ------------------------------------------------------------- */}
        <section id="lead-story" className="max-w-5xl mx-auto px-6 sm:px-8 py-16 relative z-10">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-200/70 dark:border-gray-800/70 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-medium">
              The Lead Story
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              Featured Piece
            </span>
          </div>

          {leadPiece ? (
            <Link href={`/read/${leadPiece.id}`} className="group block">
              <article className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white/60 dark:bg-neutral-950/40 backdrop-blur-xl p-8 sm:p-12 lg:p-16 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-xl">
                {/* Eyebrow / Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-widest text-neutral-500 mb-6">
                  <span className="text-amber-900 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-medium">
                    {leadPiece.mode || "Investigation"}
                  </span>
                  {leadPiece.location && (
                    <span className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                      <MapPin size={12} className="text-amber-700 dark:text-amber-400" />
                      {leadPiece.location}
                    </span>
                  )}
                  <span>·</span>
                  <span>{getLeadReadingTime(leadPiece)}</span>
                </div>

                {/* Headline */}
                <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-neutral-900 dark:text-neutral-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors leading-[1.1] mb-6 tracking-tight">
                  {leadPiece.title}
                </h2>

                {/* Dek / Subtitle */}
                {leadPiece.subtitle && (
                  <p className="text-base sm:text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed mb-8 max-w-3xl font-light">
                    {leadPiece.subtitle}
                  </p>
                )}

                {/* Central Question Callout Box */}
                {leadPiece.centralQuestion && (
                  <div className="p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 mb-8 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-900 dark:text-amber-400 uppercase mb-2">
                      <HelpCircle size={13} />
                      <span>The Question</span>
                    </div>
                    <p className="font-serif italic text-lg sm:text-xl text-neutral-900 dark:text-neutral-100 leading-snug">
                      &ldquo;{leadPiece.centralQuestion}&rdquo;
                    </p>
                  </div>
                )}

                {/* Footer Byline */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200/70 dark:border-gray-800/70 text-xs text-neutral-500">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">
                    By {leadPiece.authorName || (leadPiece as any).author || "Marrgin"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-400 font-mono tracking-wider uppercase group-hover:translate-x-1 transition-transform">
                    Read Story <ArrowRight size={13} />
                  </span>
                </div>
              </article>
            </Link>
          ) : (
            <div className="p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
              <p className="font-serif text-xl text-neutral-500">Loading lead story...</p>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4. FOUR EDITORIAL DESKS (QUIET STACKED BLOCKS)                */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 relative z-10 space-y-20">
          {editorialDesks.map(desk => (
            <div key={desk.id} className="space-y-6">
              {/* Desk Editorial Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-gray-200/70 dark:border-gray-800/70 pb-3">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100">
                    {desk.title}
                  </h3>
                  <p className="font-serif italic text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    &ldquo;{desk.description}&rdquo;
                  </p>
                </div>
                <Link
                  href={`/explore?mode=${desk.modeKey}`}
                  className="text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline flex items-center gap-1 whitespace-nowrap self-start sm:self-auto"
                >
                  View Desk Archive <ArrowRight size={12} />
                </Link>
              </div>

              {/* Desk Pieces Showcase */}
              {desk.pieces.length === 0 ? (
                <div className="py-10 text-center text-neutral-400 font-serif text-sm border border-dashed border-gray-200/60 dark:border-gray-800/60 rounded-2xl">
                  No published pieces in this desk yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {desk.pieces.slice(0, 2).map(piece => (
                    <PieceCard key={piece.id} piece={piece} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 5. PLACES & GROUNDED REALITIES (GENUINELY DATA-DRIVEN)        */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16 relative z-10">
          <div className="p-8 sm:p-12 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-neutral-50/50 dark:bg-neutral-950/30 backdrop-blur-xl">
            <div className="max-w-2xl mb-8">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-900 dark:text-amber-400 font-medium block mb-2">
                Documented Ground
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 dark:text-neutral-100 mb-3">
                Grounded in Real Places.
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                Marrgin pays rigorous attention to the geography around it. From coastal artisanal fisheries to peri-urban boreholes and municipal flood basins, the work is anchored in physical reality.
              </p>
            </div>

            {/* Geographic Index Buttons: Consuming live data from published archive */}
            {(homepageData?.featuredLocations && homepageData.featuredLocations.length > 0) ? (
              <div className="flex flex-wrap gap-2.5">
                {homepageData.featuredLocations.map(loc => (
                  <Link
                    key={loc.name}
                    href={`/explore?location=${encodeURIComponent(loc.name)}`}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 text-xs font-sans transition-all shadow-sm"
                  >
                    <MapPin size={13} className="text-amber-800 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{loc.name}</span>
                    <span className="text-[10px] font-mono text-neutral-400">({loc.count})</span>
                  </Link>
                ))}
                <Link
                  href="/explore"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-amber-900 dark:text-amber-400 hover:underline"
                >
                  <span>All Locations</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No geographic locations logged in the archive yet.</p>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 6. EDITORIAL STATEMENT — WHY MARRGIN?                         */}
        {/* ------------------------------------------------------------- */}
        <section className="max-w-4xl mx-auto px-6 sm:px-8 py-20 relative z-10 text-center">
          <div className="w-10 h-0.5 bg-amber-800/40 dark:bg-amber-400/40 mx-auto mb-10 rounded-full" />
          
          <h2 className="font-serif text-3xl sm:text-5xl text-neutral-900 dark:text-neutral-100 mb-8 leading-tight max-w-3xl mx-auto">
            We observe. We question. We document.
          </h2>

          <p className="font-serif italic text-lg sm:text-2xl text-neutral-700 dark:text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            &ldquo;Marrgin is not a corporate media brand or an NGO portal. It is one coherent publication with multiple modes of thinking, grounded in Ghanaian reality.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-12 leading-relaxed font-sans">
            Built around primary reporting, credible documents, lyrical literature, and transparent data. Beautiful writing, but precise claims.
          </p>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all text-xs sm:text-sm font-medium tracking-wide shadow-sm"
          >
            <Compass size={16} />
            <span>Enter the Full Archive</span>
          </Link>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 7. FOOTER                                                     */}
        {/* ------------------------------------------------------------- */}
        <footer className="border-t border-gray-200/70 dark:border-gray-800/70 py-12 px-6 sm:px-8 text-center text-xs text-neutral-400 font-mono tracking-widest relative z-10">
          <p>© {new Date().getFullYear()} MARRGIN · ACCRA, GHANA</p>
          <p className="text-[10px] text-neutral-500 mt-2 font-sans">Different modes. One Marrgin.</p>
        </footer>
      </div>
    </>
  );
}
