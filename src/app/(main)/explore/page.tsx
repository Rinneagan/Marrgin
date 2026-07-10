"use client";

import { useState, useEffect } from "react";
import { getAllPoems, Poem } from "@/lib/db";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Filter } from "lucide-react";

export default function ExplorePage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"map" | "compass">("map");

  useEffect(() => {
    getAllPoems()
      .then(data => {
        setPoems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const tags = ["all", "love", "hope", "grief", "nature", "dark", "dreams"];

  const filteredPoems = activeFilter === "all" 
    ? poems 
    : poems.filter(p => (p as any).tags && (p as any).tags.includes(activeFilter));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 bg-accent rounded-full animate-ping"></div>
      </div>
    );
  }

  return (
    <div className="py-20 px-8 max-w-[1200px] mx-auto min-h-screen relative overflow-hidden">
      <div className="mb-12 text-center relative z-10 flex flex-col items-center">
        <h1 className="font-serif text-4xl md:text-5xl text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-center gap-4">
          <Compass className="text-accent" size={32} />
          {viewMode === "map" ? "Constellation Map" : "Poetry Compass"}
        </h1>
        <p className="text-secondary tracking-widest uppercase text-sm mb-8">
          {viewMode === "map" ? "Navigate the constellation of thoughts" : "Explore poetry by location"}
        </p>

        <div className="flex bg-white/40 dark:bg-black/20 rounded-full p-1 border border-gray-200 dark:border-gray-800 w-max mx-auto">
          <button 
            onClick={() => setViewMode("map")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "map" ? "bg-accent text-white shadow-md" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
          >
            Constellation
          </button>
          <button 
            onClick={() => setViewMode("compass")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "compass" ? "bg-accent text-white shadow-md" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
          >
            Compass
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-16 flex-wrap relative z-10">
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`px-6 py-2 rounded-full text-sm tracking-widest uppercase transition-all duration-500 ${
              activeFilter === tag 
                ? "bg-accent text-white shadow-[0_0_15px_rgba(var(--accent),0.3)]" 
                : "bg-white/40 dark:bg-black/20 text-gray-500 hover:text-black dark:hover:text-white"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {viewMode === "map" ? (
        <div className="relative w-full h-[600px] bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border border-gray-100 dark:border-gray-800/50 overflow-hidden">
          {filteredPoems.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              No stars found in this sector.
            </div>
          ) : (
            filteredPoems.map((poem, i) => {
              // Pseudo-random deterministic position based on ID
              const hash = poem.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
              const x = Math.abs(Math.sin(hash)) * 80 + 10; // 10% to 90%
              const y = Math.abs(Math.cos(hash)) * 80 + 10;
              const size = Math.max(0.5, Math.abs(Math.sin(hash * 2)) * 1.5);

              return (
                <Link href={`/read/${poem.id}`} key={poem.id}>
                  <motion.div
                    className="absolute group cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    whileHover={{ zIndex: 50 }}
                  >
                    <div 
                      className="rounded-full bg-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(var(--accent),0.8)] group-hover:scale-150 transition-transform"
                      style={{ width: `${size}rem`, height: `${size}rem` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 px-4 py-2 rounded-lg shadow-xl w-max pointer-events-none transition-opacity duration-300">
                      <p className="font-serif text-lg mb-1">{poem.title}</p>
                      <p className="text-xs text-secondary tracking-widest uppercase">By {poem.authorName}</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}

          {/* Constellation Lines (Optional effect) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10 text-accent">
            {filteredPoems.map((poem, i) => {
              if (i === filteredPoems.length - 1) return null;
              const nextPoem = filteredPoems[i + 1];
              
              const hash1 = poem.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
              const x1 = Math.abs(Math.sin(hash1)) * 80 + 10;
              const y1 = Math.abs(Math.cos(hash1)) * 80 + 10;
              
              const hash2 = nextPoem.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
              const x2 = Math.abs(Math.sin(hash2)) * 80 + 10;
              const y2 = Math.abs(Math.cos(hash2)) * 80 + 10;

              // Only connect if reasonably close
              const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
              if (dist > 30) return null;

              return (
                <line 
                  key={`line-${i}`}
                  x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                  stroke="currentColor" strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="max-w-[800px] mx-auto">
          {Array.from(new Set(filteredPoems.map(p => p.location?.trim() || "Unknown Location"))).sort().map(loc => (
            <div key={loc} className="mb-12">
              <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-gray-800 pb-2">
                <Compass className="text-accent" size={20} />
                <h2 className="font-serif text-2xl uppercase tracking-widest">{loc}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPoems.filter(p => (p.location?.trim() || "Unknown Location") === loc).map(poem => (
                  <Link href={`/read/${poem.id}`} key={poem.id}>
                    <div className="p-6 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-accent transition-colors bg-white/40 dark:bg-black/20">
                      <h3 className="font-serif text-xl mb-2">{poem.title || "Untitled"}</h3>
                      <p className="text-sm text-secondary uppercase tracking-widest">By {poem.authorName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
