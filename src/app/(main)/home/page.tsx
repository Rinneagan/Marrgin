"use client";

import { useEffect, useState } from "react";
import { getPiecesFeed, Piece, EditorialGroup } from "@/lib/db";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import PieceCard from "@/components/PieceCard";

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const item: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 20 } }
};

export default function HomeFeed() {
  const { user } = useAuth();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"global" | "following">("global");
  const [activeGroup, setActiveGroup] = useState<EditorialGroup | "all">("all");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const feedPieces = await getPiecesFeed({
          group: activeGroup,
          feedType,
          followerId: user?.uid,
          limitCount: 30
        });
        setPieces(feedPieces);
      } catch (error) {
        console.error("Failed to fetch pieces:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [activeGroup, feedType, user]);

  const filterTabs: { id: EditorialGroup | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "writing", label: "Writing" },
    { id: "investigations", label: "Investigations" },
    { id: "field-notes", label: "Field Notes" },
    { id: "data", label: "Data Stories" },
  ];

  return (
    <div className="py-10 px-4 sm:px-8 max-w-[900px] mx-auto min-h-screen">
      {/* Header & Feed Scope Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline mb-6 gap-4 border-b border-gray-200/70 dark:border-gray-800/70 pb-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 dark:text-neutral-100">
            Your Feed
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-serif italic">
            Reading, reporting, and observation.
          </p>
        </div>

        {/* Explore · Following Switcher (Subtle dot indicator) */}
        {user && (
          <div className="flex items-center gap-2 text-xs font-sans">
            <button 
              onClick={() => setFeedType("global")}
              className={`transition-colors relative py-1 ${
                feedType === "global" 
                  ? "text-neutral-900 dark:text-neutral-100 font-semibold" 
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              Explore
              {feedType === "global" && (
                <motion.div 
                  layoutId="feedTypeDot" 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-800 dark:bg-amber-400 rounded-full" 
                />
              )}
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button 
              onClick={() => setFeedType("following")}
              className={`transition-colors relative py-1 ${
                feedType === "following" 
                  ? "text-neutral-900 dark:text-neutral-100 font-semibold" 
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              Following
              {feedType === "following" && (
                <motion.div 
                  layoutId="feedTypeDot" 
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-800 dark:bg-amber-400 rounded-full" 
                />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Understated Mode Filter Bar (Small typography, hairline indicator) */}
      <nav className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-3 mb-8 text-xs sm:text-sm font-sans no-scrollbar">
        {filterTabs.map(tab => {
          const isActive = activeGroup === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveGroup(tab.id)}
              className={`relative py-1.5 whitespace-nowrap transition-colors tracking-wide ${
                isActive 
                  ? "text-neutral-900 dark:text-neutral-100 font-medium" 
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeFilterUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-900 dark:bg-neutral-100"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Content Feed */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 gap-3">
          <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
          <span className="text-xs text-neutral-400 tracking-wider font-mono uppercase">Retrieving Feed</span>
        </div>
      ) : pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-neutral-50/40 dark:bg-neutral-950/20">
          <p className="font-serif text-lg text-neutral-600 dark:text-neutral-400 mb-2">
            {feedType === "following" 
              ? "You aren't following anyone who has published in this section yet." 
              : `No ${activeGroup === "all" ? "pieces" : activeGroup} published yet.`}
          </p>
          <p className="text-xs text-neutral-400 max-w-sm mb-6">
            {feedType === "following" 
              ? "Switch to the global feed to discover new reporting and writing." 
              : "Check back as new field notes, investigations, and essays are published."}
          </p>
          {feedType === "following" && (
            <button 
              onClick={() => setFeedType("global")} 
              className="text-xs font-mono uppercase tracking-widest text-amber-900 dark:text-amber-400 hover:underline"
            >
              Explore Global Feed
            </button>
          )}
          {isAdmin && feedType === "global" && (
            <Link 
              href="/write" 
              className="mt-2 text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Publish a new piece
            </Link>
          )}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {pieces.map((piece) => (
            <motion.div variants={item} key={piece.id}>
              <PieceCard piece={piece} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Mobile-only Extras */}
      <div className="md:hidden mt-14 pt-8 border-t border-gray-200/70 dark:border-gray-800/70 space-y-6">
        <div>
          <h3 className="text-xs font-mono tracking-widest uppercase text-neutral-400 mb-3">
            Topics & Desks
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Accra", 
              "Odaw Basin", 
              "Flooding", 
              "Water Security", 
              "Jamestown", 
              "Mining", 
              "Memory", 
              "Urban Form"
            ].map((tag) => (
              <Link
                key={tag}
                href={`/explore?tag=${encodeURIComponent(tag)}`}
                className="text-xs bg-neutral-100 dark:bg-neutral-900 border border-transparent hover:border-amber-500/30 px-3 py-1 rounded-full text-neutral-700 dark:text-neutral-300 hover:text-amber-900 dark:hover:text-amber-400 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
