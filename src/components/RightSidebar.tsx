"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const QUOTES = [
  {
    text: "Poetry is when an emotion has found its thought and the thought has found words.",
    author: "Robert Frost",
  },
  {
    text: "The environment is man's first right. Without a clean environment, man cannot exist to claim other rights.",
    author: "Ken Saro-Wiwa",
  },
  {
    text: "Poetry is a clear expression of mixed feelings.",
    author: "W.H. Auden",
  },
  {
    text: "The precise role of the artist, then, is to illuminate that darkness, blaze roads through that vast forest, so that we will not, in all our doing, lose sight of its purpose.",
    author: "James Baldwin",
  },
];

export default function RightSidebar() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Simple rotation based on the day of the year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setQuoteIndex(dayOfYear % QUOTES.length);
  }, []);

  const quote = QUOTES[quoteIndex];

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  const trendingTags = [
    "Odaw Basin", 
    "Flooding", 
    "Water Security", 
    "Mining", 
    "Jamestown", 
    "Accra", 
    "Memory", 
    "Urban Form"
  ];

  return (
    <motion.aside 
      style={{ opacity }}
      animate={{ width: isCollapsed ? 0 : 330, paddingLeft: isCollapsed ? 0 : 28, paddingRight: isCollapsed ? 0 : 28 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden xl:flex flex-col py-8 sticky top-0 h-screen transition-opacity hover:!opacity-100 duration-300 relative"
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute ${isCollapsed ? '-left-12' : '-left-4'} top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10`}
      >
        {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            className="w-full flex flex-col"
          >
            {/* Reading Streak */}
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 mb-6 shadow-sm flex items-center justify-between whitespace-nowrap">
              <div>
                <h3 className="font-serif text-lg text-neutral-900 dark:text-neutral-100">Reading Streak</h3>
                <p className="text-xs text-secondary mt-0.5">Observing and reflecting</p>
              </div>
              <div className="flex flex-col items-center ml-4">
                <Flame size={24} className="text-amber-500 mb-0.5" />
                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">5 Days</span>
              </div>
            </div>

            {/* Trending Topics & Tags */}
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 mb-6 shadow-sm">
              <h3 className="font-serif text-lg text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                <Hash size={16} /> Topics & Desks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                    className="text-xs bg-white/60 dark:bg-gray-800/60 border border-transparent hover:border-amber-500/40 px-2.5 py-1 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-amber-900 dark:hover:text-amber-400 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Daily Quote / Observation */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
              <h3 className="font-serif text-base text-neutral-800 dark:text-neutral-200 mb-3">Reflection</h3>
              <p className="font-serif text-base italic text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-secondary text-xs font-mono">— {quote.author}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
