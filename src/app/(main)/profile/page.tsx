"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateAdminBio, updatePenNames, getAllPoems, Poem } from "@/lib/db";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool, Heart, BookOpen, Pin, Palette, Activity, Eye, Clock, CheckCircle, ListMusic } from "lucide-react";

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

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"slate" | "parchment">("slate");
  const [activeTab, setActiveTab] = useState<"poems" | "playlists">("poems");
  
  // Edit Bio state
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [penNames, setPenNames] = useState<string[]>([]);
  const [newPenName, setNewPenName] = useState("");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin && user) {
          const data = await getUserProfile(user.uid) as any;
          setProfile(data);
          if (data?.bio) setBioInput(data.bio);
          if (data?.penNames) setPenNames(data.penNames);
        } else {
          setProfile({
            displayName: "Ebenezer Essel",
            bio: "I am a poet. Welcome to my thoughts and quiet reflections. This is my personal space where I share the poetry that shapes my world.",
            playlists: []
          });
        }

        const allPoems = await getAllPoems();
        setPoems(allPoems);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isAdmin]);

  const handleSaveBio = async () => {
    if (!user) return;
    try {
      await updateAdminBio(user.uid, bioInput);
      setProfile({ ...profile, bio: bioInput });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update bio", error);
    }
  };

  const handleAddPenName = async () => {
    if (!user || !newPenName.trim()) return;
    try {
      const updatedNames = [...penNames, newPenName.trim()];
      await updatePenNames(user.uid, updatedNames, updatedNames[0]);
      setPenNames(updatedNames);
      setNewPenName("");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-20 px-8 flex justify-center">
        <p className="text-secondary text-lg">Loading author profile...</p>
      </div>
    );
  }

  const totalLikes = poems.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const totalReads = poems.reduce((sum, p) => sum + (p.readsCount || 0), 0);
  const totalTimeSeconds = poems.reduce((sum, p) => sum + (p.totalReadTime || 0), 0);
  const totalCompletions = poems.reduce((sum, p) => sum + (p.completionsCount || 0), 0);
  
  const completionRate = totalReads > 0 ? Math.round((totalCompletions / totalReads) * 100) : 0;
  const avgReadTime = totalReads > 0 ? Math.round(totalTimeSeconds / totalReads) : 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const pinnedPoem = poems.length > 0 ? poems[0] : null; // Dummy pinned poem

  return (
    <div className={`transition-colors duration-1000 min-h-screen ${theme === 'parchment' ? 'bg-[#f4ebd8] text-amber-900' : ''}`}>
      <div className="py-12 px-8 max-w-[900px] mx-auto">
        {/* Aesthetic Toggle */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => setTheme(theme === 'slate' ? 'parchment' : 'slate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${theme === 'parchment' ? 'border-amber-900/20 hover:bg-amber-900/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Palette size={16} />
            <span className="text-sm font-medium">{theme === 'slate' ? 'Parchment Mode' : 'Slate Mode'}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <div className="w-32 h-32 bg-gradient-to-tr from-accent/20 to-accent rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-white dark:border-black shadow-xl">
            <span className="font-serif text-6xl text-white">
              {profile?.displayName?.charAt(0)?.toUpperCase() || "E"}
            </span>
          </div>
          
          <h1 className="font-serif text-5xl mb-4">{profile?.displayName || "Ebenezer Essel"}</h1>
          
          <div className="flex justify-center gap-8 mb-8 text-secondary">
            <div className="flex items-center gap-2">
              <BookOpen size={18} />
              <span>{poems.length} Poems</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={18} />
              <span>{totalLikes} Likes</span>
            </div>
          </div>

          <div className="max-w-xl mx-auto mb-12">
            {isEditing && isAdmin ? (
              <div className="flex flex-col items-center">
                <textarea 
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 font-poem text-lg mb-4 text-center resize-none outline-none focus:border-accent/50"
                  rows={4}
                />
                <div className="w-full mb-6 text-left">
                  <h3 className="font-serif text-lg mb-2 text-secondary">Manage Pen Names</h3>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {penNames.map(name => (
                      <span key={name} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">{name}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newPenName} 
                      onChange={(e) => setNewPenName(e.target.value)} 
                      placeholder="Add new pen name..." 
                      className="flex-1 bg-transparent border-b outline-none text-sm p-1"
                    />
                    <button onClick={handleAddPenName} className="text-xs bg-black text-white px-3 py-1 rounded-full">Add</button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-secondary hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveBio}
                    className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90"
                  >
                    Save Bio
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group inline-block">
                <p className={`font-poem text-xl leading-relaxed italic ${theme === 'parchment' ? 'text-amber-800' : 'text-gray-600 dark:text-gray-300'}`}>
                  "{profile?.bio}"
                </p>
                {isAdmin && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-secondary hover:text-accent"
                    title="Edit Bio"
                  >
                    <PenTool size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Tabs */}
          <div className="flex justify-center gap-8 border-t border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => setActiveTab("poems")}
              className={`flex items-center gap-2 py-4 border-t-2 ${activeTab === 'poems' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-black'}`}
            >
              <BookOpen size={18} />
              <span>Poems</span>
            </button>
            <button 
              onClick={() => setActiveTab("playlists")}
              className={`flex items-center gap-2 py-4 border-t-2 ${activeTab === 'playlists' ? 'border-accent text-accent' : 'border-transparent text-secondary hover:text-black'}`}
            >
              <ListMusic size={18} />
              <span>Playlists</span>
            </button>
          </div>
        </motion.div>
        {isAdmin && (
          <div className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 text-center">
                <Eye size={24} className="mx-auto text-secondary mb-2" />
                <div className="text-3xl font-serif mb-1">{totalReads}</div>
                <div className="text-xs uppercase tracking-widest text-secondary">Total Reads</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 text-center">
                <Clock size={24} className="mx-auto text-secondary mb-2" />
                <div className="text-3xl font-serif mb-1">{formatTime(totalTimeSeconds)}</div>
                <div className="text-xs uppercase tracking-widest text-secondary">Total Time Read</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 text-center">
                <Clock size={24} className="mx-auto text-secondary mb-2" />
                <div className="text-3xl font-serif mb-1">{formatTime(avgReadTime)}</div>
                <div className="text-xs uppercase tracking-widest text-secondary">Avg Read Time</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 text-center">
                <CheckCircle size={24} className="mx-auto text-secondary mb-2" />
                <div className="text-3xl font-serif mb-1">{completionRate}%</div>
                <div className="text-xs uppercase tracking-widest text-secondary">Completion Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Pinned Poem Hero Card */}
        {pinnedPoem && (
          <div className="mb-20">
            <div className="flex items-center gap-2 mb-6">
              <Pin className="text-accent" size={20} />
              <h2 className="font-serif text-2xl uppercase tracking-widest text-secondary">Pinned Masterpiece</h2>
            </div>
            <Link href={`/read/${pinnedPoem.id}`}>
              <div className={`p-12 rounded-3xl border shadow-2xl transition-transform hover:-translate-y-2 cursor-pointer ${theme === 'parchment' ? 'bg-[#eee4cf] border-amber-900/10' : 'bg-gradient-to-br from-white/60 to-white/20 dark:from-black/40 dark:to-black/10 backdrop-blur-2xl border-white/40 dark:border-white/10'}`}>
                <h3 className="font-serif text-5xl mb-6">{pinnedPoem.title || "Untitled"}</h3>
                <p className={`font-poem text-2xl leading-loose mb-10 line-clamp-4 ${theme === 'parchment' ? 'text-amber-900/80' : 'text-gray-700 dark:text-gray-300'}`}>
                  {pinnedPoem.content}
                </p>
                <div className="flex justify-between items-center text-sm font-medium uppercase tracking-widest text-secondary">
                  <span>Read Full Poem &rarr;</span>
                  <span className="flex items-center gap-1"><Heart size={16} className="text-accent"/> {pinnedPoem.likesCount}</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Published Works / Playlists */}
        <div>
          <h2 className={`font-serif text-3xl mb-8 border-b pb-4 ${theme === 'parchment' ? 'border-amber-900/20' : 'border-gray-100 dark:border-gray-800'}`}>
            {activeTab === "poems" ? "Complete Collection" : "Curated Playlists"}
          </h2>
          
          {activeTab === "poems" && (
            poems.length === 0 ? (
            <p className="text-secondary text-center py-8">No poems published yet.</p>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {poems.map((poem) => (
                <motion.div variants={item} key={poem.id}>
                  <Link
                    href={`/read/${poem.id}`}
                    className={`group block rounded-2xl p-8 transition-all hover:-translate-y-1 border ${theme === 'parchment' ? 'bg-[#eee4cf]/50 border-amber-900/10 hover:shadow-lg' : 'bg-white/40 dark:bg-black/20 backdrop-blur-xl border-white/40 dark:border-white/10 hover:shadow-md'}`}
                  >
                    <h3 className="font-serif text-2xl mb-3 group-hover:text-accent transition-colors line-clamp-1">
                      {poem.title || "Untitled"}
                    </h3>
                    <p className={`font-poem line-clamp-3 mb-6 leading-relaxed ${theme === 'parchment' ? 'text-amber-900/70' : 'text-gray-600 dark:text-gray-400'}`}>
                      {poem.content}
                    </p>
                    <div className="flex flex-col gap-2 mt-auto">
                      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-secondary">
                        <span>{Math.max(1, Math.ceil(poem.content.length / 500))} min read</span>
                        <span className="flex items-center gap-1"><Heart size={14} /> {poem.likesCount || 0}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                          <span title="Reads"><Eye size={12} className="inline mr-1"/> {poem.readsCount || 0}</span>
                          <span title="Avg Read Time"><Clock size={12} className="inline mr-1"/> {formatTime(poem.readsCount ? Math.round((poem.totalReadTime||0)/(poem.readsCount)) : 0)}</span>
                          <span title="Completion Rate"><CheckCircle size={12} className="inline mr-1"/> {poem.readsCount ? Math.round(((poem.completionsCount||0)/(poem.readsCount))*100) : 0}%</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ))}

          {activeTab === "playlists" && (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {profile?.playlists && profile.playlists.length > 0 ? (
                profile.playlists.map((playlist: any) => (
                  <motion.div variants={item} key={playlist.id}>
                    <Link href={`/playlist/${playlist.id}`}>
                      <div className={`p-8 border rounded-3xl group hover:border-accent transition-colors ${theme === 'parchment' ? 'bg-[#eee4cf]/50 border-amber-900/10' : 'bg-white/40 dark:bg-black/20 border-white/40 dark:border-white/10'}`}>
                        <h3 className="font-serif text-2xl mb-4 group-hover:text-accent transition-colors">{playlist.name}</h3>
                        <p className="text-secondary text-sm uppercase tracking-widest mb-6">
                          {playlist.poemIds.length} Poems
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                  <p className="text-secondary text-lg mb-2">No playlists created yet.</p>
                  <p className="text-sm text-gray-400">Save poems to playlists while reading.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
