"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getVaultedPoems, Poem } from "@/lib/db";
import Link from "next/link";
import { Heart, LockOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const container: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function VaultFeedPage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchVault = async () => {
      const passphrase = sessionStorage.getItem("vaultUnlocked");
      if (!passphrase) {
        router.push("/vault");
        return;
      }

      try {
        const vaultedPoems = await getVaultedPoems(passphrase);
        if (vaultedPoems.length === 0) {
          // If the passphrase suddenly returns nothing (e.g. they deleted the last vaulted poem or changed passphrase on all)
          // We can still show an empty feed for now, or log them out. Let's just show an empty feed.
        }
        setPoems(vaultedPoems);
      } catch (error) {
        console.error(error);
        router.push("/vault");
      } finally {
        setLoading(false);
      }
    };

    fetchVault();
  }, [router]);

  const lockVault = () => {
    sessionStorage.removeItem("vaultUnlocked");
    router.push("/collections");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-500 flex items-center justify-center font-serif text-2xl animate-pulse">
        Unlocking...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 py-12 px-8">
      <div className="max-w-[800px] mx-auto">
        <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-12">
          <div className="flex items-center gap-3">
            <LockOpen className="text-white/40" size={28} />
            <h1 className="font-serif text-4xl text-white">The Vault</h1>
          </div>
          <button 
            onClick={lockVault}
            className="text-sm font-medium border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
          >
            Lock Vault
          </button>
        </div>

        {poems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-white/40 text-xl font-serif italic">This vault is currently empty.</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-12"
          >
            {poems.map((poem) => (
              <motion.div variants={item} key={poem.id}>
                <Link href={`/read/${poem.id}`} className="block group">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all">
                    <h2 className="font-serif text-3xl mb-2 text-white group-hover:text-accent transition-colors">
                      {poem.title || "Untitled"}
                    </h2>
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-6">by {poem.authorName}</p>
                    
                    <p className="font-poem text-xl text-white/70 line-clamp-4 mb-6 leading-loose italic">
                      {poem.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs font-medium text-white/30 uppercase tracking-widest mt-auto">
                      <span>{Math.max(1, Math.ceil(poem.content.length / 500))} min read</span>
                      <span className="flex items-center gap-1"><Heart size={14} /> {poem.likesCount}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
