"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBookmarkedPoems, Poem } from "@/lib/db";
import Link from "next/link";
import { Library, Plus, ChevronRight, Lock } from "lucide-react";

const DUMMY_SHELVES = [
  { id: "late-night", name: "Late Night Thoughts", count: 12, color: "bg-slate-800" },
  { id: "rainy-day", name: "Rainy Day Reads", count: 8, color: "bg-indigo-900" },
  { id: "grief", name: "Grief & Healing", count: 5, color: "bg-stone-800" },
];

export default function CollectionsPage() {
  const { user } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      try {
        const bookmarkedPoems = await getBookmarkedPoems(user.uid);
        setPoems(bookmarkedPoems);
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div className="py-24 px-8 max-w-[800px] mx-auto flex flex-col items-center justify-center text-center">
        <Library size={64} className="text-gray-300 dark:text-gray-700 mb-6" />
        <h1 className="font-serif text-4xl mb-4">Your Library</h1>
        <p className="text-secondary text-lg mb-8 max-w-md">Sign in to curate your personal collection of verses and organize them into shelves.</p>
        <Link href="/login" className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors shadow-sm text-lg">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-8 max-w-[1000px] mx-auto space-y-16">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl mb-2">The Library</h1>
          <p className="text-secondary">Your curated collections and saved poems.</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Plus size={16} /> New Shelf
        </button>
      </div>

      {/* Shelves Section */}
      <section>
        <h2 className="font-serif text-2xl mb-8">Your Shelves</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {DUMMY_SHELVES.map((shelf) => (
            <div key={shelf.id} className="group cursor-pointer">
              <div className="relative h-48 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-xl p-6 flex flex-col justify-end overflow-hidden hover:border-accent/30 transition-all shadow-sm hover:shadow-md">
                {/* Book Spines Graphic */}
                <div className="absolute -right-6 -bottom-6 flex items-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:-translate-y-2 group-hover:-rotate-3 duration-500">
                  <div className={`w-12 h-32 ${shelf.color} rounded-sm shadow-md`}></div>
                  <div className={`w-10 h-28 bg-gray-700 rounded-sm shadow-md`}></div>
                  <div className={`w-14 h-36 bg-gray-900 rounded-sm shadow-md`}></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="font-serif text-2xl mb-1 text-gray-900 dark:text-gray-100">{shelf.name}</h3>
                  <p className="text-xs uppercase tracking-widest text-secondary font-medium">{shelf.count} poems</p>
                </div>
              </div>
            </div>
          ))}

          {/* The Vault (Teaser) */}
          <Link href="/vault" className="group cursor-pointer block">
            <div className="relative h-48 bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col justify-end overflow-hidden hover:border-accent/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all">
              <div className="absolute top-6 right-6">
                <Lock size={20} className="text-gray-400 group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-serif text-2xl mb-1 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">The Vault</h3>
              <p className="text-xs uppercase tracking-widest text-secondary font-medium">Locked</p>
            </div>
          </Link>
        </div>
      </section>

      {/* General Bookmarks */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl">Unorganized Saves</h2>
          <Link href="#" className="text-sm text-secondary hover:text-accent flex items-center gap-1 transition-colors">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-secondary text-lg animate-pulse">Loading your saves...</p>
          </div>
        ) : poems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-secondary text-lg">You haven't saved any loose poems yet.</p>
            <Link href="/home" className="text-accent hover:underline">
              Explore the feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {poems.map((poem) => (
              <Link
                href={`/read/${poem.id}`}
                key={poem.id}
                className="group block bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-1"
              >
                <h2 className="font-serif text-2xl mb-2 group-hover:text-accent transition-colors line-clamp-1">
                  {poem.title || "Untitled"}
                </h2>
                <p className="text-secondary mb-4">by {poem.authorName}</p>
                
                <p className="font-poem text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                  {poem.content}
                </p>
                
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-auto">
                  {Math.max(1, Math.ceil(poem.content.length / 500))} min read
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
