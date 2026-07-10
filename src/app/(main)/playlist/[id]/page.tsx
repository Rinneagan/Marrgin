"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, getPoemById, Poem } from "@/lib/db";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<any>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!user) return;
      try {
        const profile = await getUserProfile(user.uid) as any;
        if (profile && profile.playlists) {
          const found = profile.playlists.find((p: any) => p.id === resolvedParams.id);
          if (found) {
            setPlaylist(found);
            const fetchedPoems = await Promise.all(
              found.poemIds.map((id: string) => getPoemById(id))
            );
            setPoems(fetchedPoems.filter((p: any): p is Poem => p !== null));
          }
        }
      } catch (err) {
        console.error("Failed to load playlist", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [user, resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 bg-accent rounded-full animate-ping"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-serif text-3xl mb-4 text-gray-500">Playlist not found</h1>
        <Link href="/profile" className="text-accent hover:underline">Return to Profile</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-6 px-8">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="font-serif text-3xl tracking-tight flex items-center gap-3">
                <PlayCircle className="text-accent" size={28} />
                {playlist.name}
              </h1>
              <p className="text-xs uppercase tracking-widest text-secondary mt-1">
                Curated Flow • {poems.length} Poems
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-8 mt-16 space-y-32">
        {poems.map((poem, index) => (
          <motion.div 
            key={poem.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -left-12 top-0 text-gray-200 dark:text-gray-800 font-serif text-8xl opacity-30 pointer-events-none select-none">
              {index + 1}
            </div>
            
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl mb-4">{poem.title}</h2>
              <p className="text-sm uppercase tracking-widest text-secondary">
                By {poem.authorName}
              </p>
            </div>

            <div className="font-poem text-xl md:text-2xl leading-relaxed md:leading-loose text-center whitespace-pre-wrap max-w-lg mx-auto">
              {poem.content}
            </div>
            
            {index < poems.length - 1 && (
              <div className="mt-32 border-b border-gray-100 dark:border-gray-800 w-1/4 mx-auto"></div>
            )}
          </motion.div>
        ))}
      </div>
      
      {poems.length === 0 && (
        <div className="text-center mt-32 text-gray-500 font-serif text-2xl">
          This playlist is empty.
        </div>
      )}
    </div>
  );
}
