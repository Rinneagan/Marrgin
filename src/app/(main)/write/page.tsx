"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createPoem, getUserProfile } from "@/lib/db";
import { useRouter } from "next/navigation";
import { Lock, Type, Fingerprint, Activity, Ghost, UserCircle, Scissors, FileSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Simple syllable counter
const countSyllables = (word: string) => {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  return word.match(/[aeiouy]{1,2}/g)?.length || 1;
};

const countLineSyllables = (line: string) => {
  const words = line.split(/\s+/).filter(w => w.length > 0);
  return words.reduce((acc, word) => acc + countSyllables(word), 0);
};

// Simple rhyme group assignment (very basic, just matches last 2-3 letters)
const getRhymeGroup = (word: string) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 3) return w;
  // Match last vowel and everything after
  const match = w.match(/[aeiouy][^aeiouy]*$/);
  return match ? match[0] : w;
};

export default function WritePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isVaulted, setIsVaulted] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [aesthetic, setAesthetic] = useState("default");
  const [weather, setWeather] = useState("none");
  const [hasTranslation, setHasTranslation] = useState(false);
  const [translationContent, setTranslationContent] = useState("");
  const [isScrapbook, setIsScrapbook] = useState(false);
  const [scrapbookElements, setScrapbookElements] = useState<{id: string, x: number, y: number, text: string}[]>([]);
  const [epigraph, setEpigraph] = useState("");
  const [footnote, setFootnote] = useState("");
  const [dedication, setDedication] = useState("");
  const [afterword, setAfterword] = useState("");
  const [location, setLocation] = useState("");

  // Phase 11 Features
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);
  const [isHaikuMode, setIsHaikuMode] = useState(false);
  const [isRhymeMode, setIsRhymeMode] = useState(false);
  const [isBlackoutMode, setIsBlackoutMode] = useState(false);
  const [blackoutIndices, setBlackoutIndices] = useState<Set<number>>(new Set());
  
  // Phase 13 Features
  const [coverImagePrompt, setCoverImagePrompt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Phase 8 Features
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [penNames, setPenNames] = useState<string[]>([]);
  const [selectedPenName, setSelectedPenName] = useState("");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  useEffect(() => {
    // Wait until auth state is definitively loaded
    if (user !== undefined && !isAdmin) {
      router.push("/home");
    }
    
    // Fetch profile for Pen Names
    if (isAdmin && user) {
      getUserProfile(user.uid).then((profile: any) => {
        if (profile) {
          setPenNames(profile.penNames || [profile.displayName || "Anonymous"]);
          setSelectedPenName(profile.currentPenName || profile.displayName || "Anonymous");
        }
      });
    }
  }, [user, isAdmin, router]);

  if (!isAdmin) {
    return null; // Return nothing while redirecting
  }

  const handlePublish = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    if (isVaulted && !passphrase.trim()) {
      alert("Please provide a passphrase for the vaulted poem.");
      return;
    }
    
    setIsPublishing(true);
    try {
      const displayName = selectedPenName || (user.email ? user.email.split("@")[0] : "Anonymous");
      
      // Apply blackout before publishing
      let finalContent = content;
      if (isBlackoutMode) {
        finalContent = content.split(/\s+/).map((word, i) => {
          return blackoutIndices.has(i) ? "█".repeat(word.length) : word;
        }).join(" ");
      }

      await createPoem(
        user.uid, 
        displayName, 
        title, 
        finalContent, 
        isVaulted, 
        isVaulted ? passphrase.trim() : undefined, 
        aesthetic, 
        isAnonymous, 
        weather, 
        hasTranslation ? translationContent : undefined,
        isScrapbook,
        scrapbookElements,
        epigraph.trim(),
        footnote.trim(),
        dedication.trim(),
        afterword.trim(),
        location.trim(),
        coverImage
      );
      
      if (isVaulted) {
        // Automatically unlock vault for the current session if they just published to it
        sessionStorage.setItem("vaultUnlocked", passphrase.trim());
        router.push("/vault/feed");
      } else {
        router.push("/home");
      }
    } catch (error) {
      console.error("Failed to publish poem", error);
      alert("Failed to publish poem. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isTypewriterMode) {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
      }
    }
  };

  // Analyze content for sidebar stats
  const lines = content.split('\n');
  const rhymeGroups = new Map<string, string>();
  const colors = ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400"];
  let colorIndex = 0;

  const generateFoundPoetry = () => {
    const headlines = [
      "The world is quiet here",
      "Echoes of a distant sun",
      "City sleeps while shadows dance",
      "Time slips through our fingers like sand",
      "A sudden storm washes it all away"
    ];
    // Shuffle and pick 5
    const selected = headlines.sort(() => 0.5 - Math.random()).slice(0, 5);
    setContent(selected.join("\n\n"));
  };

  const handleBlackoutClick = (index: number) => {
    setBlackoutIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add if clicking directly on the canvas background, not existing elements
    if (e.target === e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setScrapbookElements([...scrapbookElements, { id: Date.now().toString(), x, y, text: "" }]);
    }
  };

  const updateScrapbookElement = (id: string, text: string) => {
    setScrapbookElements(prev => prev.map(el => el.id === id ? { ...el, text } : el));
  };

  const handleDragEnd = (id: string, e: any, info: any) => {
    setScrapbookElements(prev => prev.map(el => {
      if (el.id === id) {
        return { ...el, x: el.x + info.offset.x, y: el.y + info.offset.y };
      }
      return el;
    }));
  };

  const handleGenerateCover = async () => {
    if (!coverImagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      // Use pollinations.ai for free no-key AI image generation
      // Append a random seed to avoid browser caching if they generate multiple times
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverImagePrompt)}?seed=${seed}&width=1200&height=800&nologo=true`;
      
      // We can pre-load the image to ensure it's ready before showing it
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      setCoverImage(url);
    } catch (e) {
      console.error("Failed to generate image", e);
      alert("Failed to generate cover image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isTypewriterMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-[#fdfbf7] dark:bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden"
          >
            <div className="absolute top-8 right-8 z-[101]">
              <button 
                onClick={() => setIsTypewriterMode(false)}
                className="opacity-0 hover:opacity-100 transition-opacity duration-300 px-6 py-2 border border-gray-300 dark:border-gray-800 rounded-full font-mono text-sm text-gray-500 hover:text-black dark:hover:text-white"
              >
                Exit Typewriter Mode
              </button>
            </div>
            
            <div className="w-full max-w-[800px] h-[60vh] relative flex flex-col justify-center">
              {/* Typewriter specific textarea */}
              <textarea
                autoFocus
                placeholder="Start typing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none resize-none placeholder:text-gray-300 dark:placeholder:text-gray-800 leading-[3rem] text-3xl md:text-4xl"
                style={{ 
                  fontFamily: '"Courier New", Courier, monospace',
                  color: 'inherit',
                  height: '100%',
                  textAlign: 'center'
                }}
              />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none font-mono text-xs">
              NO BACKSPACE. JUST WRITE.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-12 px-8 max-w-[1200px] mx-auto min-h-screen flex flex-col md:flex-row gap-12">
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-8">
          <h1 className="font-serif text-3xl text-gray-400">New Poem</h1>
          <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-black dark:hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={isVaulted} 
              onChange={(e) => setIsVaulted(e.target.checked)}
              className="hidden"
            />
            <Lock size={16} className={isVaulted ? "text-accent" : ""} />
            <span className={isVaulted ? "text-accent font-medium" : ""}>Vaulted</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-black dark:hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={hasTranslation} 
              onChange={(e) => setHasTranslation(e.target.checked)}
              className="hidden"
            />
            <span className={hasTranslation ? "text-accent font-medium" : ""}>+ Translation</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-secondary hover:text-black dark:hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={isScrapbook} 
              onChange={(e) => setIsScrapbook(e.target.checked)}
              className="hidden"
            />
            <span className={isScrapbook ? "text-accent font-medium" : ""}>Scrapbook</span>
          </label>
          <button className="text-secondary hover:text-black transition-colors">
            Save Draft
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing || !title.trim() || !content.trim()}
            className="bg-accent text-white px-6 py-2 rounded-full hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <select 
          value={aesthetic} 
          onChange={(e) => setAesthetic(e.target.value)}
          className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-500 rounded-lg px-4 py-2 outline-none hover:border-accent transition-colors cursor-pointer appearance-none"
        >
          <option value="default">Default Aesthetic</option>
          <option value="typewriter">Vintage Typewriter</option>
          <option value="brutalist">Modern Brutalist</option>
        </select>

        <select 
          value={weather} 
          onChange={(e) => setWeather(e.target.value)}
          className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-500 rounded-lg px-4 py-2 outline-none hover:border-accent transition-colors cursor-pointer appearance-none"
        >
          <option value="none">No Weather</option>
          <option value="rain">Heavy Rain</option>
          <option value="snow">Gentle Snow</option>
          <option value="storm">Thunderstorm</option>
        </select>

        {!isAnonymous && penNames.length > 0 && (
          <select
            value={selectedPenName}
            onChange={(e) => setSelectedPenName(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-gray-500 rounded-lg px-4 py-2 outline-none hover:border-accent transition-colors cursor-pointer appearance-none"
          >
            {penNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {isVaulted && (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center gap-4">
          <Lock size={20} className="text-gray-400" />
          <input 
            type="text"
            placeholder="Set Passphrase (e.g., 'silence')"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="bg-transparent outline-none flex-1 font-medium placeholder:text-gray-400"
          />
        </div>
      )}

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-serif text-5xl md:text-6xl outline-none placeholder:text-gray-300 mb-8"
        />

        {isScrapbook ? (
          <div 
            className="w-full flex-1 min-h-[500px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl relative overflow-hidden bg-white/5 cursor-crosshair"
            onClick={handleCanvasClick}
          >
            <p className="absolute bottom-4 left-4 text-secondary text-sm pointer-events-none">Click anywhere to drop text. Drag to move.</p>
            {scrapbookElements.map((el) => (
              <motion.div
                key={el.id}
                drag
                dragMomentum={false}
                onDragEnd={(e: any, info: any) => handleDragEnd(el.id, e, info)}
                initial={{ x: el.x, y: el.y, scale: 0 }}
                animate={{ scale: 1 }}
                style={{ position: 'absolute', x: el.x, y: el.y }}
                className="cursor-move"
              >
                <textarea
                  value={el.text}
                  onChange={(e) => updateScrapbookElement(el.id, e.target.value)}
                  placeholder="Type here..."
                  autoFocus
                  className="bg-transparent font-poem text-xl outline-none resize-none border-b border-gray-300 focus:border-accent p-1 min-w-[200px]"
                  onPointerDown={(e) => e.stopPropagation()}
                />
              </motion.div>
            ))}
          </div>
        ) : isBlackoutMode ? (
          <div className="w-full flex-1 min-h-[500px] font-poem text-2xl leading-loose">
            {content.split(/\s+/).map((word, i) => (
              <span
                key={i}
                onClick={() => handleBlackoutClick(i)}
                className={`cursor-pointer mr-2 inline-block transition-colors ${blackoutIndices.has(i) ? 'bg-black text-black select-none rounded-sm' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              >
                {word}
              </span>
            ))}
          </div>
        ) : (
          <div className={`flex ${hasTranslation ? 'gap-8' : ''}`}>
            <textarea
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full flex-1 bg-transparent font-poem text-2xl outline-none resize-none placeholder:text-gray-300 leading-loose ${hasTranslation ? 'w-1/2 border-r border-gray-100 dark:border-gray-800 pr-4' : ''}`}
            ></textarea>
            
            {hasTranslation && (
              <textarea
                placeholder="Translation..."
                value={translationContent}
                onChange={(e) => setTranslationContent(e.target.value)}
                className="w-full flex-1 bg-transparent font-poem text-2xl outline-none resize-none placeholder:text-gray-300 leading-loose w-1/2 pl-4 text-gray-500"
              ></textarea>
            )}
          </div>
        )}

        {/* Phase 12: Publication Metadata */}
        <div className="mt-12 flex flex-col gap-6 border-t border-gray-100 dark:border-gray-800 pt-8">
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs uppercase tracking-widest text-secondary font-medium">Context & Lore</p>
            <input
              type="text"
              placeholder="Dedication (e.g. 'For E.')"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 outline-none font-serif text-lg placeholder:text-gray-400"
              value={dedication}
              onChange={e => setDedication(e.target.value)}
            />
            <input
              type="text"
              placeholder="Epigraph (e.g. A quote that inspired this)"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 outline-none font-serif text-lg placeholder:text-gray-400"
              value={epigraph}
              onChange={e => setEpigraph(e.target.value)}
            />
            <input
              type="text"
              placeholder="Footnote (Added to the bottom)"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 outline-none font-serif text-lg placeholder:text-gray-400"
              value={footnote}
              onChange={e => setFootnote(e.target.value)}
            />
            <input
              type="text"
              placeholder="Afterword (Unlocks after reading)"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 outline-none font-serif text-lg placeholder:text-gray-400"
              value={afterword}
              onChange={e => setAfterword(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location Written (e.g. 'Paris, France')"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 outline-none font-serif text-lg placeholder:text-gray-400"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* The Writer's Arsenal Sidebar */}
      <div className="w-full md:w-64 flex flex-col gap-8 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-8 md:pt-0 md:pl-8">
        
        {/* Phase 8: Privacy Controls */}
        <h2 className="font-serif text-xl text-gray-400 uppercase tracking-widest">Privacy</h2>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${isAnonymous ? 'bg-accent/10 text-accent' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>
              <Ghost size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isAnonymous ? 'text-accent' : 'text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>Ghost Writer</span>
              <span className="text-xs text-gray-400">Publish anonymously</span>
            </div>
            <input type="checkbox" className="hidden" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          </label>
        </div>

        <h2 className="font-serif text-xl text-gray-400 uppercase tracking-widest mt-4">Cover Art</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="e.g. A melancholic rainy city in watercolor"
              className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 outline-none text-sm placeholder:text-gray-400"
              value={coverImagePrompt}
              onChange={e => setCoverImagePrompt(e.target.value)}
            />
            <button
              onClick={handleGenerateCover}
              disabled={isGeneratingImage || !coverImagePrompt.trim()}
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {isGeneratingImage ? "Generating..." : "Generate AI Cover"}
            </button>
          </div>
          {coverImage && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
              >
                &times;
              </button>
            </div>
          )}
        </div>


        <h2 className="font-serif text-xl text-gray-400 uppercase tracking-widest mt-4">Arsenal</h2>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${isTypewriterMode ? 'bg-accent/10 text-accent' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>
              <Type size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isTypewriterMode ? 'text-accent' : 'text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>Typewriter Mode</span>
              <span className="text-xs text-gray-400">Disables backspace</span>
            </div>
            <input type="checkbox" className="hidden" checked={isTypewriterMode} onChange={(e) => setIsTypewriterMode(e.target.checked)} />
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${isHaikuMode ? 'bg-accent/10 text-accent' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>
              <Fingerprint size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isHaikuMode ? 'text-accent' : 'text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>Haiku Enforcer</span>
              <span className="text-xs text-gray-400">Counts syllables</span>
            </div>
            <input type="checkbox" className="hidden" checked={isHaikuMode} onChange={(e) => setIsHaikuMode(e.target.checked)} />
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${isRhymeMode ? 'bg-accent/10 text-accent' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>
              <Activity size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isRhymeMode ? 'text-accent' : 'text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>Rhyme Analyzer</span>
              <span className="text-xs text-gray-400">Highlights schemes</span>
            </div>
            <input type="checkbox" className="hidden" checked={isRhymeMode} onChange={(e) => setIsRhymeMode(e.target.checked)} />
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${isBlackoutMode ? 'bg-accent/10 text-accent' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>
              <Scissors size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isBlackoutMode ? 'text-accent' : 'text-gray-500 group-hover:text-black dark:group-hover:text-white'}`}>Blackout Mode</span>
              <span className="text-xs text-gray-400">Click words to redact</span>
            </div>
            <input type="checkbox" className="hidden" checked={isBlackoutMode} onChange={(e) => { setIsBlackoutMode(e.target.checked); setBlackoutIndices(new Set()); }} />
          </label>

          <button onClick={generateFoundPoetry} className="flex items-center gap-3 cursor-pointer group text-left">
            <div className={`p-2 rounded-lg transition-colors bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-black dark:group-hover:text-white`}>
              <FileSearch size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-medium text-gray-500 group-hover:text-black dark:group-hover:text-white`}>Found Poetry</span>
              <span className="text-xs text-gray-400">Pull random text</span>
            </div>
          </button>
        </div>

        {/* Real-time Analysis */}
        {(isHaikuMode || isRhymeMode) && content.trim() && (
          <div className="mt-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Analysis</h3>
            <div className="font-mono text-sm flex flex-col gap-2">
              {lines.map((line, i) => {
                const words = line.trim().split(/\s+/);
                const lastWord = words[words.length - 1];
                let rhymeColor = "";

                if (isRhymeMode && lastWord) {
                  const rGroup = getRhymeGroup(lastWord);
                  if (rGroup.length >= 2) {
                    if (!rhymeGroups.has(rGroup)) {
                      rhymeGroups.set(rGroup, colors[colorIndex % colors.length]);
                      colorIndex++;
                    }
                    rhymeColor = rhymeGroups.get(rGroup) || "";
                  }
                }

                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-500 truncate mr-4 text-xs opacity-50">{line || "..."}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      {isHaikuMode && (
                        <span className={`w-6 text-right ${countLineSyllables(line) > 0 ? 'text-accent' : 'text-gray-600'}`}>
                          {countLineSyllables(line)}
                        </span>
                      )}
                      {isRhymeMode && (
                        <span className={`w-8 text-right font-bold ${rhymeColor || 'text-gray-600'}`}>
                          {lastWord ? lastWord.slice(-3) : "-"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
