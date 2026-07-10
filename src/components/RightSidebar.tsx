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
    text: "If I read a book and it makes my whole body so cold no fire can warm me, I know that is poetry.",
    author: "Emily Dickinson",
  },
  {
    text: "Poetry is a clear expression of mixed feelings.",
    author: "W.H. Auden",
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

  return (
    <motion.aside 
      style={{ opacity }}
      animate={{ width: isCollapsed ? 0 : 350, paddingLeft: isCollapsed ? 0 : 32, paddingRight: isCollapsed ? 0 : 32 }}
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
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm flex items-center justify-between whitespace-nowrap">
              <div>
                <h3 className="font-serif text-xl">Reading Streak</h3>
                <p className="text-sm text-secondary mt-1">You're on a roll!</p>
              </div>
              <div className="flex flex-col items-center ml-4">
                <Flame size={28} className="text-orange-500 mb-1" />
                <span className="font-bold text-gray-800 dark:text-gray-200">5 Days</span>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="font-serif text-xl mb-4 flex items-center gap-2"><Hash size={18} /> Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {["Nature", "Love", "Melancholy", "Hope", "City", "Dreams"].map((tag) => (
                  <button
                    key={tag}
                    className="text-sm bg-white/60 dark:bg-gray-800/60 border border-transparent hover:border-accent/50 px-3 py-1.5 rounded-full hover:text-accent transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4">Today's Quote</h3>
              <p className="font-poem text-lg italic text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                "{quote.text}"
              </p>
              <p className="text-secondary text-sm">— {quote.author}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
