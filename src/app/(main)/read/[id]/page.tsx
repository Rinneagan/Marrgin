"use client";

import { useEffect, useState, use } from "react";
import { getPoemById, Piece, CommentData, getComments, trackPoemRead, getCollectionsForUser, createCollection, addPoemToCollection, Collection, deletePoem, EditorialMode } from "@/lib/db";
import Link from "next/link";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { useZenMode } from "@/context/ZenContext";
import { Wind, Moon, ArrowDown, Activity, Download, Trash2 } from "lucide-react";
import PoemRenderer from "@/components/PoemRenderer";
import PieceHeader from "@/components/PieceHeader";
import ProseRenderer from "@/components/ProseRenderer";
import MethodologyDisclosure from "@/components/MethodologyDisclosure";
import LimitationsDisclosure from "@/components/LimitationsDisclosure";
import PublicSources from "@/components/PublicSources";
import CorrectionsNotice from "@/components/CorrectionsNotice";
import FieldNoteBlocks from "@/components/FieldNoteBlocks";
import DataStoryMetadata from "@/components/DataStoryMetadata";
import EchoesPanel from "@/components/EchoesPanel";
import WeatherOverlay from "@/components/WeatherOverlay";
import CommentsSection from "@/components/CommentsSection";
import { toPng } from 'html-to-image';
import { useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [loading, setLoading] = useState(true);
  const { isZenMode, setZenMode, setAmbientColor } = useZenMode();
  const { user } = useAuth();
  const router = useRouter();
  
  // Reading Atmosphere & Focus Controls
  const [isReadInDark, setIsReadInDark] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  
  // Poetry Specific Publication Metadata
  const [showDedication, setShowDedication] = useState(true);
  const [revisionDraft, setRevisionDraft] = useState(100);
  
  // Echoes & Marginalia (Works for stanzas in poetry & paragraphs in prose)
  const [comments, setComments] = useState<CommentData[]>([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [selectedLineText, setSelectedLineText] = useState("");

  // Reading Analytics & Earned Afterword
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const [afterwordUnlocked, setAfterwordUnlocked] = useState(false);

  // Export Canvas & Author Controls
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

  const mode: EditorialMode = piece?.mode || "poetry";

  // Track completion based on scroll
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest > 0.9 && !isCompleted) {
        setIsCompleted(true);
      }
    });
  }, [scrollYProgress, isCompleted]);

  // Poetry-Only: Afterword Unlock Timer
  useEffect(() => {
    if (mode === "poetry" && piece?.afterword) {
      const wordCount = piece.content.split(/\s+/).length;
      const readTimeSeconds = Math.max(5, Math.floor((wordCount / 200) * 60));
      
      const timer = setTimeout(() => {
        setAfterwordUnlocked(true);
      }, readTimeSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [piece, mode]);

  // Mood color for ambient canvas (poetry only)
  const getMoodColor = (tags: string[]) => {
    if (!tags || tags.length === 0) return "120, 119, 198";
    const tag = tags[0].toLowerCase();
    switch (tag) {
      case "love": return "255, 113, 112";
      case "hope": return "252, 211, 77";
      case "grief": return "71, 85, 105";
      case "nature": return "52, 211, 153";
      case "dark": return "30, 41, 59";
      case "dreams": return "167, 139, 250";
      default: return "120, 119, 198";
    }
  };

  const fetchCommentsData = async () => {
    try {
      const data = await getComments(resolvedParams.id);
      setComments(data);
    } catch (e) {
      console.error("Error fetching comments:", e);
    }
  };

  useEffect(() => {
    const fetchPieceData = async () => {
      try {
        const data = await getPoemById(resolvedParams.id);
        setPiece(data);
        if (data) {
          if (data.mode === "poetry" || !data.mode) {
            setAmbientColor(getMoodColor(data.tags || []));
            if (!data.dedication) {
              setShowDedication(false);
            } else {
              setTimeout(() => setShowDedication(false), 4000);
            }
          } else {
            setShowDedication(false);
            setAmbientColor(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch piece:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPieceData();
    fetchCommentsData();
    
    return () => {
      setZenMode(false);
      setAmbientColor(null);
    };
  }, [resolvedParams.id, setZenMode, setAmbientColor]);

  // Reading Analytics Tracker (Universal across all modes)
  useEffect(() => {
    return () => {
      if (piece && !hasTracked) {
        const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);
        if (timeSpentSeconds >= 5) {
          trackPoemRead(piece.id, timeSpentSeconds, isCompleted).catch(console.error);
          setHasTracked(true);
        }
      }
    };
  }, [piece, startTime, isCompleted, hasTracked]);

  // Poetry-Only: Auto-Scroll Rhythm
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (isAutoScrolling && mode === "poetry") {
      scrollInterval = setInterval(() => {
        window.scrollBy({ top: 1, behavior: "auto" });
      }, 50);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling, mode]);

  if (loading) {
    return (
      <div className="py-24 px-8 flex justify-center items-center min-h-[50vh]">
        <p className="font-serif text-secondary text-lg animate-pulse">Reading Marrgin...</p>
      </div>
    );
  }

  if (!piece) {
    return (
      <div className="py-24 px-8 flex flex-col items-center gap-4 min-h-[50vh] justify-center">
        <p className="font-serif text-secondary text-xl">Piece not found or unavailable.</p>
        <Link href="/home" className="text-accent hover:underline font-serif text-base">
          Return to Marrgin
        </Link>
      </div>
    );
  }

  // Calculate Mode-Appropriate Reading Time
  const calculateReadingTime = (): string | null => {
    if (!piece.content) return null;
    const wordCount = piece.content.trim().split(/\s+/).filter(Boolean).length;
    if (mode === "poetry") {
      return `${Math.max(1, Math.ceil(piece.content.length / 500))} min read`;
    }
    if (mode === "field-note") {
      if (wordCount < 60) return "Quick read";
      return `${Math.max(1, Math.ceil(wordCount / 250))} min read`;
    }
    if (mode === "investigation" || mode === "data-story") {
      return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    }
    // Essay
    return `${Math.max(1, Math.ceil(wordCount / 225))} min read`;
  };

  const startDeepRead = () => {
    setShowBreathing(true);
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      setShowBreathing(false);
      setZenMode(true);
      document.body.style.overflow = "unset";
    }, 8000);
  };

  // Line-Level Echoes (Poetry)
  const handleLineClick = (index: number) => {
    if (!piece) return;
    const allLines = piece.content.replace(/<fold>/g, "").replace(/<\/fold>/g, "").split("\n");
    const text = allLines[index] || "";
    setSelectedLineText(text.trim() ? text.trim() : "(Line)");
    setSelectedLineIndex(index);
  };

  // Paragraph-Level Echoes (Prose: Essay, Investigation, Data Story)
  const handleParagraphClick = (index: number, text: string) => {
    setSelectedLineText(text.trim() ? text.trim() : "(Paragraph)");
    setSelectedLineIndex(index);
  };

  const handleExport = async () => {
    if (!poemRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(poemRef.current, {
        cacheBust: true,
        backgroundColor: isReadInDark ? '#000000' : '#ffffff',
        style: { padding: '40px' }
      });
      const link = document.createElement('a');
      link.download = `${piece.title || 'marrgin-piece'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export piece', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!piece) return;
    try {
      await deletePoem(piece.id);
      router.push("/home");
    } catch (err) {
      console.error("Failed to delete piece", err);
      alert("Failed to delete piece. Please try again.");
    }
  };

  const handleSaveToPlaylist = async () => {
    if (!user || !piece) {
      alert("Please sign in to save pieces to an anthology.");
      return;
    }
    const userCollections = await getCollectionsForUser(user.uid);
    setCollections(userCollections);
    setIsCollectionModalOpen(true);
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!piece) return;
    try {
      await addPoemToCollection(collectionId, piece.id);
      setIsCollectionModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAndAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !piece || !newCollectionName.trim()) return;
    setIsCreatingCollection(true);
    try {
      const newColId = await createCollection(user.uid, user.displayName || "Unknown", newCollectionName);
      await addPoemToCollection(newColId, piece.id);
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
      {/* Poetry-Only Weather Overlay */}
      {mode === "poetry" && piece?.weather && piece.weather !== "none" && (
        <WeatherOverlay weather={piece.weather} />
      )}

      {/* Poetry-Only Breathing Interstitial */}
      <AnimatePresence>
        {mode === "poetry" && showBreathing && (
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

      {/* Poetry-Only Dedication Splash Screen */}
      <AnimatePresence>
        {mode === "poetry" && showDedication && piece?.dedication && (
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
              {piece.dedication}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-accent transform origin-left z-50"
        style={{ scaleX }}
      />

      {/* Main Article Container */}
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-12 md:py-20 px-6 sm:px-10 max-w-[820px] mx-auto group relative bg-white dark:bg-black shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl mt-8 mb-24"
      >
        {/* Universal & Mode-Filtered Controls Toolbar */}
        <div className="flex flex-wrap justify-end mb-10 gap-3 font-sans">
          {/* Poetry-Only: Deep Read (Breathing Pacer) */}
          {mode === "poetry" && (
            <button 
              onClick={startDeepRead}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white hover:border-accent text-xs font-medium"
            >
              <Activity size={15} />
              <span>Deep Read</span>
            </button>
          )}
          
          {/* Poetry-Only: Auto-Scroll */}
          {mode === "poetry" && (
            <button 
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
                isAutoScrolling 
                  ? "bg-accent text-white" 
                  : "bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              <ArrowDown size={15} className={isAutoScrolling ? "animate-bounce" : ""} />
              <span>Auto-Scroll</span>
            </button>
          )}
          
          {/* Universal: Dark Mode */}
          <button 
            onClick={() => setIsReadInDark(!isReadInDark)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              isReadInDark 
                ? "bg-black text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                : "bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Moon size={15} />
            <span>Dark Reading</span>
          </button>

          {/* Universal: Zen Mode */}
          <button 
            onClick={() => setZenMode(!isZenMode)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs font-medium ${
              isZenMode 
                ? "bg-accent text-white shadow-[0_0_15px_rgba(var(--accent),0.3)]" 
                : "bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
            }`}
          >
            <Wind size={15} />
            <span>Zen Mode</span>
          </button>

          {/* Universal: Tear Out (Export Canvas) */}
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-50 text-xs font-medium"
          >
            <Download size={15} />
            <span>{isExporting ? "Tearing..." : "Tear Out"}</span>
          </button>
          
          {/* Author Burn Page */}
          {user?.uid === piece.authorId && (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white text-xs font-medium"
            >
              <Trash2 size={15} />
              <span>Burn Page</span>
            </button>
          )}
        </div>

        {/* Mode-Aware Piece Header */}
        <PieceHeader 
          piece={piece}
          readingTimeText={calculateReadingTime()}
          onSaveToPlaylist={handleSaveToPlaylist}
          isZenMode={isZenMode}
        />
        
        {/* Mode-Aware Article Body */}
        <motion.div 
          ref={poemRef}
          className="max-w-[760px] mx-auto relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        >
          {/* 1. POETRY MODE: 100% untouched and preserved */}
          {mode === "poetry" && (
            <>
              {piece.epigraph && (
                <div className="mb-14 italic text-sm text-gray-500 dark:text-gray-400 text-right max-w-sm ml-auto border-r-2 border-gray-200 dark:border-gray-800 pr-4 font-serif">
                  {piece.epigraph}
                </div>
              )}

              {piece.isScrapbook ? (
                <div className="relative w-full min-h-[600px] border border-gray-100 dark:border-gray-800 rounded-xl bg-white/5 overflow-hidden">
                  {piece.scrapbookElements?.map((el, i) => (
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
                <div className={piece.translationContent ? "flex flex-col md:flex-row gap-16 md:gap-8 justify-center" : ""}>
                  <div className={piece.translationContent ? "flex-1 border-r border-gray-100 dark:border-gray-800 pr-8" : ""}>
                    <PoemRenderer 
                      content={piece.content}
                      aesthetic={piece.aesthetic}
                      isReadInDark={isReadInDark}
                      hoveredLineIndex={hoveredLineIndex}
                      onHoverLine={setHoveredLineIndex}
                      echoedLines={comments.map(c => c.lineIndex).filter(i => i !== null) as number[]}
                      onLineClick={handleLineClick}
                      revisionDraft={revisionDraft}
                    />
                  </div>
                  {piece.translationContent && (
                    <div className="flex-1 pl-8">
                      <PoemRenderer 
                        content={piece.translationContent}
                        aesthetic={piece.aesthetic}
                        isReadInDark={isReadInDark}
                        hoveredLineIndex={hoveredLineIndex}
                        onHoverLine={setHoveredLineIndex}
                        revisionDraft={revisionDraft}
                      />
                    </div>
                  )}
                </div>
              )}

              {piece.footnote && (
                <div className="mt-14 pt-8 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 font-serif">
                  * {piece.footnote}
                </div>
              )}

              {/* Earned Afterword Timer */}
              <AnimatePresence>
                {piece.afterword && afterwordUnlocked && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 2 }}
                    className="mt-16 pt-16 border-t-2 border-gray-100 dark:border-gray-800"
                  >
                    <h3 className="font-serif text-2xl mb-4 text-accent">Author's Afterword</h3>
                    <p className="font-poem text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                      {piece.afterword}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Draft History Slider */}
              {!piece.isScrapbook && !isZenMode && (
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
            </>
          )}

          {/* 2. ESSAY MODE: Literary long-form prose */}
          {mode === "essay" && (
            <>
              {piece.epigraph && (
                <div className="mb-12 italic text-base text-gray-600 dark:text-gray-400 text-right max-w-md ml-auto border-r-2 border-accent/40 pr-4 font-serif">
                  {piece.epigraph}
                </div>
              )}

              <ProseRenderer 
                content={piece.content}
                isReadInDark={isReadInDark}
                onParagraphClick={handleParagraphClick}
                echoedParagraphs={comments.map(c => c.lineIndex).filter(i => i !== null) as number[]}
                mode="essay"
              />

              {piece.footnote && (
                <div className="mt-14 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 font-serif">
                  * {piece.footnote}
                </div>
              )}

              {piece.afterword && (
                <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="font-serif text-xl mb-3 text-accent font-medium">Author's Note</h3>
                  <p className="font-serif text-base leading-relaxed text-gray-700 dark:text-gray-300 italic">
                    {piece.afterword}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 3. INVESTIGATION MODE: Rigorous reporting centerpiece */}
          {mode === "investigation" && (
            <>
              <ProseRenderer 
                content={piece.content}
                isReadInDark={isReadInDark}
                onParagraphClick={handleParagraphClick}
                echoedParagraphs={comments.map(c => c.lineIndex).filter(i => i !== null) as number[]}
                mode="investigation"
              />

              {/* How we reported this (Methodology Disclosure) */}
              <MethodologyDisclosure methodology={piece.methodology} />

              {/* What we could not establish (Limitations Disclosure) */}
              <LimitationsDisclosure limitations={piece.limitations} />

              {/* Public Sources (Strictly public citations, never editorialWorkspaces) */}
              <PublicSources sources={piece.publicSources || (piece.dataSources as any)} />

              {/* Subdued Corrections Notice (if present) */}
              <CorrectionsNotice corrections={piece.corrections} />

              {piece.footnote && (
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-900 text-xs text-gray-500 font-sans">
                  * {piece.footnote}
                </div>
              )}
            </>
          )}

          {/* 4. FIELD NOTE MODE: Notebook with Observation / Finding / Inference */}
          {mode === "field-note" && (
            <>
              <FieldNoteBlocks 
                observation={piece.observation}
                finding={piece.finding}
                inference={piece.inference}
                rawContent={piece.content}
              />

              {piece.footnote && (
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-900 text-xs text-gray-500 font-sans">
                  * {piece.footnote}
                </div>
              )}
            </>
          )}

          {/* 5. DATA STORY MODE: Analytical disclosure & visualization slot */}
          {mode === "data-story" && (
            <>
              <DataStoryMetadata 
                datasetName={piece.datasetName}
                dataSource={piece.dataSource}
                dataTimeframe={piece.dataTimeframe}
                dataUnits={piece.dataUnits}
                dataConfig={piece.dataConfig}
              />

              <ProseRenderer 
                content={piece.content}
                isReadInDark={isReadInDark}
                onParagraphClick={handleParagraphClick}
                echoedParagraphs={comments.map(c => c.lineIndex).filter(i => i !== null) as number[]}
                mode="data-story"
              />

              <MethodologyDisclosure methodology={piece.methodology} />
              <LimitationsDisclosure limitations={piece.limitations} />
              <PublicSources sources={piece.publicSources || (piece.dataSources as any)} />
            </>
          )}
        </motion.div>
      </motion.article>

      {/* Global Comments Section (Universal across all modes) */}
      {!isZenMode && (
        <div className="relative w-full max-w-[820px] mx-auto bg-transparent border-t border-gray-200 dark:border-gray-800 pb-24 mt-16 pt-16 px-6 sm:px-10">
          <CommentsSection poemId={piece.id} />
        </div>
      )}

      {/* Echoes Marginalia Panel Side Flyout (Universal across all modes) */}
      <EchoesPanel 
        poemId={piece.id}
        lineIndex={selectedLineIndex}
        lineText={selectedLineText}
        comments={comments}
        onClose={() => setSelectedLineIndex(null)}
        onRefresh={fetchCommentsData}
      />

      {/* Save to Collection / Anthology Modal */}
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
              <p className="text-secondary mb-6">Choose an anthology to save "{piece.title}" to.</p>

              {collections.length > 0 ? (
                <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto">
                  {collections.map(col => (
                    <button
                      key={col.id}
                      onClick={() => handleAddToCollection(col.id)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium">{col.title}</span>
                      <span className="text-xs text-secondary">{col.poemIds.length} pieces</span>
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

      {/* Delete / Burn Page Modal */}
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
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-sans text-sm">
                Are you sure you want to completely tear out this piece? It will be permanently removed from Marrgin and cannot be recovered.
              </p>
              
              <div className="flex gap-4 font-sans text-sm">
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
                  <Trash2 size={16} />
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
