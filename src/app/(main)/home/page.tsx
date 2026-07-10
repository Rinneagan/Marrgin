"use client";

import { useEffect, useState } from "react";
import FollowButton from "@/components/FollowButton";
import BookmarkButton from "@/components/BookmarkButton";
import LikeButton from "@/components/LikeButton";
import { getLatestPoems, Poem } from "@/lib/db";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

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

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const latestPoems = await getLatestPoems(20);
        setPoems(latestPoems);
      } catch (error) {
        console.error("Failed to fetch poems:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoems();
  }, []);

  return (
    <div className="py-12 px-8">
      <h1 className="font-serif text-4xl mb-8">Your Feed</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-secondary text-lg">Loading poems...</p>
        </div>
      ) : poems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-4">
          <p className="text-secondary text-lg">No poems published yet.</p>
          {isAdmin && (
            <Link href="/write" className="bg-accent text-white px-6 py-2 rounded-full hover:opacity-90">
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
              className="w-full bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow"
            >
              <Link href={`/read/${poem.id}`}>
                <h2 className="font-serif text-3xl mb-3 hover:text-accent transition-colors cursor-pointer">{poem.title || "Untitled"}</h2>
              </Link>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-secondary font-medium">by {poem.authorName}</p>
                <FollowButton authorId={poem.authorId} />
              </div>
              
              <p className="font-poem text-xl text-gray-700 mb-8 leading-relaxed line-clamp-3">
                {poem.content}
              </p>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div className="flex gap-2">
                  <span className="bg-gray-50 text-gray-600 text-xs px-4 py-1.5 rounded-full">
                    Poetry
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-secondary">
                    {Math.max(1, Math.ceil(poem.content.length / 500))} min read
                  </span>
                  <div className="flex items-center gap-4">
                    <LikeButton poemId={poem.id} initialLikesCount={poem.likesCount} />
                    <BookmarkButton poemId={poem.id} />
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
