"use client";

import { useEffect, useState, use } from "react";
import FollowButton from "@/components/FollowButton";
import BookmarkButton from "@/components/BookmarkButton";
import LikeButton from "@/components/LikeButton";
import CommentsSection from "@/components/CommentsSection";
import { getPoemById, Poem, CommentData, getComments, togglePoemLike, checkIsPoemLiked, toggleBookmark, checkIsBookmarked, trackPoemRead, getCollectionsForUser, createCollection, addPoemToCollection, Collection, deletePoem } from "@/lib/db";
import Link from "next/link";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { useZenMode } from "@/context/ZenContext";
import { Bookmark, MessageCircle, Heart, Share2, CornerRightUp, Wind, Moon, ArrowDown, Activity, Download, ListPlus, Trash2 } from "lucide-react";
import PoemRenderer from "@/components/PoemRenderer";
import EchoesPanel from "@/components/EchoesPanel";
import WeatherOverlay from "@/components/WeatherOverlay";
import { toPng } from 'html-to-image';
import { useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);
  const { isZenMode, setZenMode, setAmbientColor } = useZenMode();
  const { user } = useAuth();
  const router = useRouter();
  
  // New Phase 9 Features
  const [isReadInDark, setIsReadInDark] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  
  // Phase 12: Publication Metadata
  const [showDedication, setShowDedication] = useState(true);
  const [revisionDraft, setRevisionDraft] = useState(100);
  
  // Phase 13: Echoes
  const [comments, setComments] = useState<CommentData[]>([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [selectedLineText, setSelectedLineText] = useState("");

  // Phase 12 Analytics & Afterword
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const [afterwordUnlocked, setAfterwordUnlocked] = useState(false);

  // Phase 13 Export
  const poemRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Anthologies / Collections
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Progress bar animation
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Track completion based on scroll
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest > 0.9 && !isCompleted) {
        setIsCompleted(true);
      }
    });
  }, [scrollYProgress, isCompleted]);

  // Afterword Unlock Timer
  useEffect(() => {
    if (poem?.afterword) {
      // Calculate read time: words / 200 wpm. Minimum 5 seconds.
      const wordCount = poem.content.split(/\s+/).length;
      const readTimeSeconds = Math.max(5, Math.floor((wordCount / 200) * 60));
      
      const timer = setTimeout(() => {
        setAfterwordUnlocked(true);
      }, readTimeSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [poem]);

  // Map tags to an ambient color
  const getMoodColor = (tags: string[]) => {
    if (!tags || tags.length === 0) return "120, 119, 198"; // Default slate-purple
    const tag = tags[0].toLowerCase();
    switch (tag) {
      case "love": return "255, 113, 112"; // Coral/Red
      case "hope": return "252, 211, 77"; // Warm Gold
      case "grief": return "71, 85, 105"; // Slate Gray
      case "nature": return "52, 211, 153"; // Emerald Green
      case "dark": return "30, 41, 59"; // Deep Black/Slate
      case "dreams": return "167, 139, 250"; // Violet
      default: return "120, 119, 198"; // Default
    }
  };

  const fetchCommentsData = async () => {
    try {
      const data = await getComments(resolvedParams.id);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchPoem = async () => {
      try {
        const data = await getPoemById(resolvedParams.id);
        setPoem(data);
        if (data) {
          setAmbientColor(getMoodColor([]));
          if (!data.dedication) {
            setShowDedication(false);
          } else {
            // Dedication screen disappears after 4 seconds
            setTimeout(() => setShowDedication(false), 4000);
          }
        }
      } catch (error) {
        console.error("Failed to fetch poem:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoem();
    fetchCommentsData();
    
    return () => {
      // Always reset Zen Mode and Ambient Color when leaving the page
      setZenMode(false);
      setAmbientColor(null);
    }
  }, [resolvedParams.id, setZenMode, setAmbientColor]);

  // Track reading analytics on unmount or navigation
  useEffect(() => {
    return () => {
      if (poem && !hasTracked) {
        const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
        // Only track if they spent at least 5 seconds reading
        if (timeSpentSeconds >= 5) {
          trackPoemRead(poem.id, timeSpentSeconds, isCompleted).catch(console.error);
          setHasTracked(true); // Prevent double firing
        }
      }
    };
  }, [poem, startTime, isCompleted, hasTracked]);

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (isAutoScrolling) {
      scrollInterval = setInterval(() => {
        window.scrollBy({ top: 1, behavior: "auto" });
      }, 50); // Slow, rhythmic scroll
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling]);

  if (loading) {
    return (
      <div className="py-20 px-8 flex justify-center">
        <p className="text-secondary text-lg">Loading poem...</p>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="py-20 px-8 flex flex-col items-center gap-4">
        <p className="text-secondary text-lg">Poem not found.</p>
        <Link href="/home" className="text-accent hover:underline">
          Return to Feed
        </Link>
      </div>
    );
  }

  const startDeepRead = () => {
    setShowBreathing(true);
    // Hide scrollbar
    document.body.style.overflow = "hidden";
    
    setTimeout(() => {
      setShowBreathing(false);
      setZenMode(true);
      document.body.style.overflow = "unset";
    }, 8000); // 8 seconds of breathing
  };

  const handleLineClick = (index: number) => {
    if (!poem) return;
    // We need to extract the text of the line clicked.
    // For simplicity, we can strip the <fold> tags and just split by \n.
    const allLines = poem.content.replace(/<fold>/g, "").replace(/<\/fold>/g, "").split("\n");
    const text = allLines[index] || "";
    setSelectedLineText(text.trim() ? text.trim() : "(Empty Line)");
    setSelectedLineIndex(index);
  };

  const handleExport = async () => {
    console.log("Tear Out button clicked", { hasRef: !!poemRef.current });
    if (!poemRef.current) {
      console.error("poemRef is null");
      return;
    }
    setIsExporting(true);
    try {
      console.log("Starting toPng...");
      const dataUrl = await toPng(poemRef.current, {
        cacheBust: true,
        backgroundColor: isReadInDark ? '#000000' : '#ffffff',
        style: { padding: '40px' }
      });
      console.log("dataUrl generated, length:", dataUrl.length);
      const link = document.createElement('a');
      link.download = `${poem?.title || 'poem'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export poem', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!poem) return;
    try {
      await deletePoem(poem.id);
      window.location.href = "/home";
    } catch (err) {
      console.error("Failed to delete poem", err);
      alert("Failed to delete poem. Please try again.");
    }
  };

  const handleSaveToPlaylist = async () => {
    if (!user || !poem) {
      alert("Please sign in to save poems.");
      return;
    }
    const userCollections = await getCollectionsForUser(user.uid);
    setCollections(userCollections);
    setIsCollectionModalOpen(true);
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!poem) return;
    try {
      await addPoemToCollection(collectionId, poem.id);
      setIsCollectionModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAndAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !poem || !newCollectionName.trim()) return;
    setIsCreatingCollection(true);
    try {
      const newColId = await createCollection(user.uid, user.displayName || "Unknown", newCollectionName);
      await addPoemToCollection(newColId, poem.id);
      setIsCollectionModalOpen(false);
      setNewCollectionName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingCollection(false);
    }
  };


  return (
    <>
      {/* Weather Overlay (Phase 9) */}
      {poem?.weather && poem.weather !== "none" && <WeatherOverlay weather={poem.weather} />}

      {/* Breathing Interstitial */}
      <AnimatePresence>
        {showBreathing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white"
          >
            <motion.div
              animate={{ 
                scale: [1, 2, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 8,
                ease: "easeInOut"
              }}
              className="w-32 h-32 rounded-full border border-white/20 bg-white/5 flex items-center justify-center absolute"
            />
            <motion.p
              animate={{ opacity: [0, 1, 0, 1, 0] }}
              transition={{ duration: 8, times: [0, 0.2, 0.5, 0.7, 1] }}
              className="font-serif text-2xl z-10 tracking-widest text-white/70"
            >
              Breathe in...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDedication && poem?.dedication && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5 } }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="font-poem italic text-2xl text-secondary"
            >
              {poem.dedication}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent transform origin-left z-50"
        style={{ scaleX }}
      />
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-12 md:py-20 px-8 max-w-[700px] mx-auto group relative bg-white dark:bg-black shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl mt-8 mb-24"
      >
        <div className="flex flex-wrap justify-end mb-8 gap-4">
          <button 
            onClick={startDeepRead}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white hover:border-accent"
          >
            <Activity size={18} />
            <span className="text-sm font-medium">Deep Read</span>
          </button>
          
          <button 
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isAutoScrolling 
                ? "bg-accent text-white" 
                : "bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <ArrowDown size={18} className={isAutoScrolling ? "animate-bounce" : ""} />
            <span className="text-sm font-medium">Auto-Scroll</span>
          </button>
          
          <button 
            onClick={() => setIsReadInDark(!isReadInDark)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isReadInDark 
                ? "bg-black text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                : "bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Moon size={18} />
            <span className="text-sm font-medium">Dark Mode</span>
          </button>

          <button 
            onClick={() => setZenMode(!isZenMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isZenMode 
                ? "bg-accent text-white shadow-[0_0_15px_rgba(var(--accent),0.3)]" 
                : "bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Wind size={18} />
            <span className="text-sm font-medium">Zen Mode</span>
          </button>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-50`}
          >
            <Download size={18} />
            <span className="text-sm font-medium">{isExporting ? "Tearing..." : "Tear Out"}</span>
          </button>
          
          {user?.uid === poem.authorId && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white`}
            >
              <Trash2 size={18} />
              <span className="text-sm font-medium">Burn Page</span>
            </button>
          )}
        </div>

        <div className={`mb-16 transition-opacity duration-1000 ${isZenMode ? "opacity-20 hover:opacity-100" : "opacity-100"}`}>
          {poem.coverImage && (
            <div className="w-full h-[40vh] md:h-[50vh] relative mb-12 rounded-xl overflow-hidden shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poem.coverImage} alt="Cover Art" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7] dark:from-[#0a0a0a] to-transparent"></div>
            </div>
          )}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">{poem.title || "Untitled"}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/user/${poem.authorId}`} className="text-xl text-secondary hover:text-black dark:hover:text-white transition-colors">
                by {poem.authorName}
              </Link>
              <FollowButton authorId={poem.authorId} />
            </div>
            <div className="flex items-center gap-6">
              <LikeButton poemId={poem.id} initialLikesCount={poem.likesCount} />
              <BookmarkButton poemId={poem.id} />
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-400 uppercase tracking-widest flex items-center gap-4">
            <span>{Math.max(1, Math.ceil(poem.content.length / 500))} min read</span>
            <button 
              onClick={handleSaveToPlaylist}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white`}
            >
              <ListPlus size={18} />
              <span className="text-sm font-medium">Save to Anthology</span>
            </button>
          </div>
        </div>
        
        {/* Breathing Typography, Folded Poem, Typography as Emotion, & Read In Dark */}
        <motion.div 
          ref={poemRef}
          className="max-w-[800px] mx-auto relative z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        >
          <div className="text-center mb-16">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6">{poem.title}</h1>
            <p className="text-secondary font-medium tracking-widest uppercase text-sm flex items-center justify-center gap-2">
              <span>By</span>
              <Link href={`/user/${poem.authorId}`} className="hover:text-black dark:hover:text-white transition-colors hover:underline">
                {poem.authorName}
              </Link>
              <span>• {poem.createdAt?.toDate().toLocaleDateString()}</span>
            </p>
          </div>

          {poem.epigraph && (
            <div className="mb-16 italic text-sm text-gray-500 dark:text-gray-400 text-right max-w-sm ml-auto border-r-2 border-gray-200 dark:border-gray-800 pr-4">
              {poem.epigraph}
            </div>
          )}

          {poem.isScrapbook ? (
            <div className="relative w-full min-h-[600px] border border-gray-100 dark:border-gray-800 rounded-xl bg-white/5 overflow-hidden">
              {poem.scrapbookElements?.map((el, i) => (
                <div 
                  key={i} 
                  style={{ position: 'absolute', left: el.x, top: el.y }}
                  className="font-poem text-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-w-sm"
                >
                  {el.text}
                </div>
              ))}
            </div>
          ) : (
            <div className={poem.translationContent ? "flex flex-col md:flex-row gap-16 md:gap-8 justify-center" : ""}>
              <div className={poem.translationContent ? "flex-1 border-r border-gray-100 dark:border-gray-800 pr-8" : ""}>
                <PoemRenderer 
                  content={poem.content}
                  aesthetic={poem.aesthetic}
                  isReadInDark={isReadInDark}
                  hoveredLineIndex={hoveredLineIndex}
                  onHoverLine={setHoveredLineIndex}
                  echoedLines={comments.map(c => c.lineIndex).filter(i => i !== null) as number[]}
                  onLineClick={handleLineClick}
                  revisionDraft={revisionDraft}
                />
              </div>
              {poem.translationContent && (
                <div className="flex-1 pl-8">
                  <PoemRenderer 
                    content={poem.translationContent}
                    aesthetic={poem.aesthetic}
                    isReadInDark={isReadInDark}
                    hoveredLineIndex={hoveredLineIndex}
                    onHoverLine={setHoveredLineIndex}
                    revisionDraft={revisionDraft}
                  />
                </div>
              )}
            </div>
          )}

          {poem.footnote && (
            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
              * {poem.footnote}
            </div>
          )}
          
          <AnimatePresence>
            {poem.afterword && afterwordUnlocked && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 2 }}
                className="mt-16 pt-16 border-t-2 border-gray-100 dark:border-gray-800"
              >
                <h3 className="font-serif text-2xl mb-4 text-accent">Author's Afterword</h3>
                <p className="font-poem text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  {poem.afterword}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Draft Slider (only if not scrapbook and not in zen mode) */}
          {!poem.isScrapbook && !isZenMode && (
            <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
                Draft History: {revisionDraft === 100 ? "Final Publication" : `Draft v0.${Math.floor(revisionDraft)}`}
              </label>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={revisionDraft} 
                onChange={(e) => setRevisionDraft(parseInt(e.target.value))}
                className="w-full max-w-xs accent-accent"
              />
            </div>
          )}
        </motion.div>

      </motion.article>

      {!isZenMode && (
        <div className="relative w-full max-w-[700px] mx-auto bg-transparent border-t border-gray-200 dark:border-gray-800 pb-24 mt-16 pt-16">
          <CommentsSection poemId={poem.id} />
        </div>
      )}

      {/* Echoes Panel Side Flyout */}
      <EchoesPanel 
        poemId={poem.id}
        lineIndex={selectedLineIndex}
        lineText={selectedLineText}
        comments={comments}
        onClose={() => setSelectedLineIndex(null)}
        onRefresh={fetchCommentsData}
      />

      {/* Save to Collection Modal */}
      <AnimatePresence>
        {isCollectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCollectionModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="font-serif text-3xl mb-2">Save to Anthology</h2>
              <p className="text-secondary mb-6">Choose a collection to save "{poem.title}" to.</p>

              {collections.length > 0 ? (
                <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto">
                  {collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => handleAddToCollection(col.id)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium">{col.title}</span>
                      <span className="text-xs text-secondary">{col.poemIds.length} poems</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-secondary mb-6 text-sm">You don't have any anthologies yet.</p>
              )}

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <form onSubmit={handleCreateAndAddCollection} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="New Anthology Name..."
                    className="flex-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 focus:outline-none focus:border-black dark:focus:border-white text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!newCollectionName.trim() || isCreatingCollection}
                    className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Create & Add
                  </button>
                </form>
              </div>

              <button 
                onClick={() => setIsCollectionModalOpen(false)}
                className="mt-6 w-full py-3 rounded-xl text-secondary hover:text-black dark:hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fdfbf7] dark:bg-[#111] p-8 rounded-2xl max-w-md w-full shadow-2xl border border-red-200 dark:border-red-900/50 relative overflow-hidden z-10"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <h2 className="font-serif text-2xl mb-4 text-red-600 dark:text-red-500">Burn this page?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Are you sure you want to completely tear out this page? It will be permanently removed from your collection and cannot be recovered.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep It
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                  <Trash2 size={18} />
                  Burn Page
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
