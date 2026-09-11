"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCollectionById, getPoemById, Collection, Poem } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowLeft, Share, Lock, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!params.id) return;
      
      try {
        const collectionData = await getCollectionById(params.id as string);
        if (collectionData) {
          setCollection(collectionData);
          
          // Fetch all poems in this collection
          const poemPromises = collectionData.poemIds.map(id => getPoemById(id));
          const poemsData = await Promise.all(poemPromises);
          
          // Filter out nulls (deleted poems)
          setPoems(poemsData.filter(p => p !== null) as Poem[]);
        }
      } catch (error) {
        console.error("Error fetching collection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center px-4">
        <h1 className="font-serif text-4xl mb-4">Anthology Not Found</h1>
        <p className="text-secondary mb-8">This collection might have been deleted or is private.</p>
        <button onClick={() => router.back()} className="text-black dark:text-white border border-gray-200 dark:border-gray-800 px-6 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Immersive Header */}
      <div className="relative w-full h-[60vh] min-h-[400px]">
        <img 
          src={collection.coverImage} 
          alt={collection.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent flex flex-col justify-end p-8 md:p-16">
          <div className="max-w-[1000px] mx-auto w-full">
            <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {!collection.isPublic && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full uppercase tracking-wider">
                      <Lock size={12} /> Private
                    </span>
                  )}
                  <span className="text-xs font-medium bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full uppercase tracking-wider">
                    {poems.length} {poems.length === 1 ? "Piece" : "Pieces"}
                  </span>
                </div>
                <h1 className="font-serif text-5xl md:text-7xl text-white mb-4 shadow-sm">{collection.title}</h1>
                <p className="text-xl text-white/80 max-w-2xl font-light">
                  {collection.description || "A curated collection of writing and reporting."}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors">
                  <Share size={20} />
                </button>
                {user && user.uid !== collection.authorId && (
                  <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors">
                    <Heart size={20} /> Follow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Poems List */}
      <div className="max-w-[800px] mx-auto px-8 py-16">
        <div className="flex items-center justify-between mb-12 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="font-serif text-2xl">Contents</h2>
          <span className="text-secondary text-sm font-medium uppercase tracking-widest">
            Curated by {collection.authorName}
          </span>
        </div>

        {poems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-secondary text-lg">This anthology is currently empty.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {poems.map((piece: any, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={piece.id}
              >
                <Link href={`/read/${piece.id}`} className="block group">
                  <div className="flex flex-col md:flex-row md:items-start gap-6 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all">
                    <div className="text-3xl font-serif text-neutral-300 dark:text-neutral-700 font-light w-10 pt-0.5">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-900 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {piece.mode || "Poetry"}
                        </span>
                        {piece.location && (
                          <span className="text-[11px] text-neutral-400">· {piece.location}</span>
                        )}
                      </div>
                      <h3 className="font-serif text-2xl mb-1 text-neutral-900 dark:text-neutral-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
                        {piece.title}
                      </h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">
                        By {piece.authorName || "Marrgin"}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {piece.subtitle || piece.centralQuestion || piece.content?.replace(/<[^>]+>/g, '').substring(0, 150) + "..."}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
