"use client";

import { useEffect, useState } from "react";
import FollowButton from "@/components/FollowButton";
import BookmarkButton from "@/components/BookmarkButton";
import LikeButton from "@/components/LikeButton";
import { getLatestPoems, getFollowingPoems, Poem } from "@/lib/db";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const item: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
};

export default function HomeFeed() {
  const { user } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"global" | "following">("global");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    const fetchPoems = async () => {
      setLoading(true);
      try {
        if (feedType === "following" && user) {
          const followingPoems = await getFollowingPoems(user.uid, 20);
          setPoems(followingPoems);
        } else {
          const latestPoems = await getLatestPoems(20);
          setPoems(latestPoems);
        }
      } catch (error) {
        console.error("Failed to fetch poems:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoems();
  }, [feedType, user]);

  return (
    <div className="py-12 px-8 max-w-[1000px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <h1 className="font-serif text-4xl">Your Feed</h1>
        {user && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-full p-1 border border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => setFeedType("global")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                feedType === "global" 
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Explore
            </button>
            <button 
              onClick={() => setFeedType("following")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                feedType === "following" 
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Following
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
        </div>
      ) : poems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white/50 dark:bg-black/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <p className="text-secondary text-lg">
            {feedType === "following" ? "You aren't following anyone with published poems yet." : "No poems published yet."}
          </p>
          {feedType === "following" && (
            <button onClick={() => setFeedType("global")} className="text-black dark:text-white font-medium hover:underline">
              Explore Global Feed
            </button>
          )}
          {isAdmin && feedType === "global" && (
            <Link href="/write" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-full hover:opacity-90">
              Be the first to write
            </Link>
          )}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 flex flex-col items-center"
        >
          {poems.map((poem) => (
            <motion.div
              variants={item}
              key={poem.id}
              className="w-full bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all overflow-hidden relative"
            >
              {poem.coverImage && (
                <div className="absolute top-0 left-0 w-full h-48 sm:h-64 opacity-80 hover:opacity-100 transition-opacity z-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fdfbf7] dark:to-[#0a0a0a] z-10"></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={poem.coverImage} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative z-10 pt-16 sm:pt-24">
              <Link href={`/read/${poem.id}`}>
                <h2 className="font-serif text-3xl mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">{poem.title || "Untitled"}</h2>
              </Link>
              <div className="flex items-center gap-4 mb-6">
                <Link href={`/user/${poem.authorId}`} className="text-secondary font-medium hover:text-black dark:hover:text-white transition-colors">
                  by {poem.authorName}
                </Link>
                {user?.uid !== poem.authorId && (
                  <FollowButton authorId={poem.authorId} />
                )}
              </div>
              
              <p className="font-poem text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed line-clamp-3">
                {poem.content.replace(/<[^>]+>/g, '')}
              </p>
              
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-6">
                <div className="flex gap-2">
                  <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-xs px-4 py-1.5 rounded-full uppercase tracking-widest font-medium">
                    {poem.aesthetic || "Poetry"}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-secondary uppercase tracking-widest">
                    {Math.max(1, Math.ceil(poem.content.length / 500))} min read
                  </span>
                  <div className="flex items-center gap-4">
                    <LikeButton poemId={poem.id} initialLikesCount={poem.likesCount} />
                    <BookmarkButton poemId={poem.id} />
                  </div>
                </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Mobile-only Extras (from Right Sidebar) */}
      <div className="md:hidden mt-16 space-y-8">
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h3 className="font-serif text-xl mb-4">Trending Tags</h3>
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
      </div>
    </div>
  );
}
