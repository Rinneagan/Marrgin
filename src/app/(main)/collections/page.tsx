"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCollectionsForUser, createCollection, Collection } from "@/lib/db";
import Link from "next/link";
import { Library, Plus, Lock, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const fetchCollections = async () => {
    if (!user) return;
    try {
      const data = await getCollectionsForUser(user.uid);
      setCollections(data);
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCollections();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    
    try {
      await createCollection(user.uid, user.displayName || "Unknown", newTitle, newDescription, isPublic);
      setIsModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      fetchCollections(); // Refresh list
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  if (!user) {
    return (
      <div className="py-24 px-8 max-w-[800px] mx-auto flex flex-col items-center justify-center text-center">
        <Library size={64} className="text-gray-300 dark:text-gray-700 mb-6" />
        <h1 className="font-serif text-4xl mb-4">Your Anthologies</h1>
        <p className="text-secondary text-lg mb-8 max-w-md">Sign in to curate your personal collections of verses and share them with the world.</p>
        <Link href="/login" className="bg-accent text-white px-8 py-3 rounded-full hover:bg-accent/90 transition-colors shadow-sm text-lg">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="py-20 px-8 max-w-[1000px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">Anthologies</h1>
          <p className="text-secondary text-lg">Curate and share your favorite poetry collections.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full hover:scale-105 transition-transform"
        >
          <Plus size={20} />
          <span className="font-medium">Create Anthology</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="py-24 px-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center bg-white/5 dark:bg-black/5">
          <BookOpen size={48} className="text-gray-300 dark:text-gray-700 mb-6" />
          <h2 className="font-serif text-2xl mb-2">No Anthologies Yet</h2>
          <p className="text-secondary max-w-sm mb-6">Create your first anthology to start organizing your favorite poems.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={collection.id}
            >
              <Link href={`/collections/${collection.id}`} className="group block">
                <div 
                  className="aspect-[4/5] rounded-2xl overflow-hidden relative mb-4 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-xl"
                >
                  <img src={collection.coverImage} alt={collection.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white font-serif text-2xl mb-1">{collection.title}</h3>
                    <p className="text-gray-300 text-sm">{collection.poemIds.length} Poems</p>
                  </div>
                  {!collection.isPublic && (
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full">
                      <Lock size={16} className="text-white" />
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="font-serif text-3xl mb-2">New Anthology</h2>
              <p className="text-secondary mb-6">Give your collection a name and mood.</p>
              
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    placeholder="e.g. Midnight Melancholy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Description (Optional)</label>
                  <textarea 
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none h-24"
                    placeholder="A brief summary of this collection's vibe..."
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="isPublic"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    className="w-5 h-5 accent-black dark:accent-white cursor-pointer"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">Make this anthology public</label>
                </div>
                <div className="pt-6 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="flex-1 py-3 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
