"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllPoems, Piece, searchPieces, EditorialMode, EditorialGroup, getEditorialGroup } from "@/lib/db";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  Search, 
  X, 
  MapPin, 
  Sparkles, 
  Layers, 
  Feather, 
  Eye, 
  BarChart3,
  HelpCircle
} from "lucide-react";
import PieceCard from "@/components/PieceCard";

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMode = searchParams.get("mode") || "all";
  const initialTag = searchParams.get("tag") || searchParams.get("location") || "";
  const initialQ = searchParams.get("q") || "";

  const [allPieces, setAllPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  // Discovery Controls
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedGroup, setSelectedGroup] = useState<string>(initialMode);
  const [writingSubfilter, setWritingSubfilter] = useState<"all" | "poetry" | "essay">("all");
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);
  const [viewMode, setViewMode] = useState<"catalogue" | "geographic" | "constellation">("catalogue");

  // Keep state synchronized with URL query params
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam && modeParam !== selectedGroup) {
      setSelectedGroup(modeParam);
    }
    const tagParam = searchParams.get("tag") || searchParams.get("location");
    if (tagParam && tagParam !== selectedTag) {
      setSelectedTag(tagParam);
    }
  }, [searchParams]);

  useEffect(() => {
    getAllPoems()
      .then(data => {
        setAllPieces(data as Piece[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Curated reporting and literary topic tags
  const CURATED_TAGS = [
    "Odaw Basin",
    "Flooding",
    "Water Security",
    "Mining",
    "Jamestown",
    "Accra",
    "Memory",
    "Urban Form",
    "Kasoa",
    "Weija"
  ];

  // Editorial Group Definitions
  const editorialGroups = [
    { id: "all", label: "All Work" },
    { id: "writing", label: "Writing", description: "Poems, essays, and other attempts to make sense of things." },
    { id: "investigation", label: "Investigations", description: "In-depth investigative reporting, public records, and central questions." },
    { id: "field-note", label: "Field Notes", description: "Firsthand observations, evidence, and inferences recorded on the ground." },
    { id: "data-story", label: "Data Stories", description: "Empirical measurements, environmental records, and analytical narratives." },
  ];

  // Filtering Pipeline: Group/Mode -> Writing Subfilter -> Tag -> Search Query
  const filteredPieces = useMemo(() => {
    let result = allPieces;

    // 1. Group / Mode Filter
    if (selectedGroup === "writing") {
      result = result.filter(p => {
        const mode = p.mode || "poetry";
        if (writingSubfilter === "poetry") return mode === "poetry";
        if (writingSubfilter === "essay") return mode === "essay";
        return mode === "poetry" || mode === "essay";
      });
    } else if (selectedGroup !== "all") {
      result = result.filter(p => (p.mode || "poetry") === selectedGroup);
    }

    // 2. Tag Filter
    if (selectedTag) {
      const targetTag = selectedTag.toLowerCase();
      result = result.filter(p => 
        p.tags?.some(t => t.toLowerCase() === targetTag) ||
        p.location?.toLowerCase().includes(targetTag)
      );
    }

    // 3. Search Query (Title, subtitle, centralQuestion, observation, author, location, tags, excerpt)
    if (searchQuery.trim()) {
      result = searchPieces(searchQuery, result);
    }

    return result;
  }, [allPieces, selectedGroup, writingSubfilter, selectedTag, searchQuery]);

  // Actual Locations Only (No synthetic "General / Ghana" assignments)
  const actualLocations = useMemo(() => {
    const locMap = new Map<string, Piece[]>();
    filteredPieces.forEach(p => {
      const loc = p.location?.trim();
      if (loc) {
        if (!locMap.has(loc)) {
          locMap.set(loc, []);
        }
        locMap.get(loc)!.push(p);
      }
    });
    return Array.from(locMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPieces]);

  const activeGroupInfo = editorialGroups.find(g => g.id === selectedGroup);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Loading Archive</span>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-8 max-w-[1050px] mx-auto min-h-screen">
      {/* Discovery Header */}
      <header className="mb-10 text-center relative z-10 flex flex-col items-center">
        <h1 className="font-serif text-3xl sm:text-5xl text-neutral-900 dark:text-neutral-100 mb-3 tracking-tight">
          Explore Marrgin
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto font-serif italic mb-8">
          The public archive of poems, essays, investigations, field notes, and data.
        </p>

        {/* Universal Search Input */}
        <div className="w-full max-w-xl relative mb-8">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, central question, location, or topic..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View Switcher: Catalogue · Geographic · Constellation */}
        <div className="flex bg-neutral-100/90 dark:bg-neutral-900/90 rounded-full p-1 border border-neutral-200/80 dark:border-neutral-800/80 text-xs font-sans mb-8 shadow-sm">
          <button 
            onClick={() => setViewMode("catalogue")}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              viewMode === "catalogue" 
                ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-medium shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Layers size={13} />
            <span>Catalogue</span>
          </button>
          <button 
            onClick={() => setViewMode("geographic")}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              viewMode === "geographic" 
                ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-medium shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Compass size={13} />
            <span>Geographic Index</span>
          </button>
          <button 
            onClick={() => setViewMode("constellation")}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              viewMode === "constellation" 
                ? "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-medium shadow-sm" 
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            }`}
          >
            <Sparkles size={13} />
            <span>Constellation</span>
          </button>
        </div>
      </header>

      {/* Catalogue View: Mode Taxonomy Bar + Writing Subfilter + Tag Cloud */}
      {viewMode === "catalogue" && (
        <div className="space-y-8">
          {/* Primary Editorial Mode Filter */}
          <div className="border-b border-gray-200/70 dark:border-gray-800/70 pb-3">
            <nav className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-1 text-xs sm:text-sm font-sans no-scrollbar">
              {editorialGroups.map(group => {
                const isActive = selectedGroup === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      setWritingSubfilter("all");
                    }}
                    className={`relative py-1.5 whitespace-nowrap transition-colors tracking-wide ${
                      isActive 
                        ? "text-neutral-900 dark:text-neutral-100 font-medium" 
                        : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    }`}
                  >
                    <span>{group.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeExploreUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-neutral-900 dark:bg-neutral-100"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Special Writing Subfilter Header */}
          {selectedGroup === "writing" && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/70 dark:border-neutral-800/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="font-serif italic text-sm text-neutral-700 dark:text-neutral-300">
                  &ldquo;Poems, essays, and other attempts to make sense of things.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-sans">
                {[
                  { id: "all", label: "All Writing" },
                  { id: "poetry", label: "Poetry" },
                  { id: "essay", label: "Essays" },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setWritingSubfilter(sub.id as any)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      writingSubfilter === sub.id 
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium" 
                        : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-200/50 dark:bg-neutral-900/50"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Curated Topic / Tag Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-neutral-400 font-mono text-[11px] uppercase mr-1">Filter:</span>
            {CURATED_TAGS.map(tag => {
              const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? "" : tag)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isSelected 
                      ? "bg-amber-900 text-white dark:bg-amber-400 dark:text-neutral-950 font-medium shadow-sm" 
                      : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag("")}
                className="text-[11px] text-amber-900 dark:text-amber-400 hover:underline flex items-center gap-0.5 ml-2"
              >
                Clear tag
              </button>
            )}
          </div>

          {/* Pieces Grid */}
          <div className="pt-2">
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-xs font-mono tracking-widest uppercase text-neutral-400">
                {filteredPieces.length} {filteredPieces.length === 1 ? "Piece" : "Pieces"} Archived
              </span>
              {searchQuery && (
                <span className="text-xs text-neutral-500">
                  Matching &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>

            {filteredPieces.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-neutral-50/40 dark:bg-neutral-950/20">
                <p className="font-serif text-lg text-neutral-600 dark:text-neutral-400 mb-1">
                  No pieces found matching your criteria.
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
                  Try clearing your search query or selecting a different editorial mode.
                </p>
                {(searchQuery || selectedTag) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTag("");
                      setSelectedGroup("all");
                    }}
                    className="text-xs font-mono uppercase tracking-widest text-amber-900 dark:text-amber-400 hover:underline"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPieces.map(piece => (
                  <PieceCard key={piece.id} piece={piece} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Geographic Index (Actual Locations Only) */}
      {viewMode === "geographic" && (
        <div className="space-y-12">
          <div className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-950/40 border border-neutral-200/70 dark:border-neutral-800/70">
            <p className="text-xs font-mono tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
              Actual Field Locations Documented: {actualLocations.length} Regions & Sites
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Articles and field recordings mapped to specific coordinates, districts, and water basins across Ghana.
            </p>
          </div>

          {actualLocations.length === 0 ? (
            <div className="py-20 text-center text-neutral-500">
              No pieces with recorded locations match the current filter.
            </div>
          ) : (
            actualLocations.map(([locationName, piecesAtLocation]) => (
              <section key={locationName} className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-gray-200 dark:border-gray-800 pb-2">
                  <MapPin size={18} className="text-amber-800 dark:text-amber-400" />
                  <h2 className="font-serif text-2xl text-neutral-900 dark:text-neutral-100">
                    {locationName}
                  </h2>
                  <span className="text-xs font-mono text-neutral-400 ml-auto">
                    {piecesAtLocation.length} {piecesAtLocation.length === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {piecesAtLocation.map(piece => (
                    <PieceCard key={piece.id} piece={piece} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* Constellation View (Literary Starfield) */}
      {viewMode === "constellation" && (
        <div className="space-y-4">
          <div className="relative w-full h-[600px] bg-neutral-900/40 dark:bg-neutral-950/60 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden">
            {filteredPieces.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400 font-serif">
                No stars found in this sector.
              </div>
            ) : (
              filteredPieces.map((poem, i) => {
                const hash = poem.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
                const x = Math.abs(Math.sin(hash)) * 80 + 10;
                const y = Math.abs(Math.cos(hash)) * 80 + 10;
                const size = Math.max(0.6, Math.abs(Math.sin(hash * 2)) * 1.3);

                return (
                  <Link href={`/read/${poem.id}`} key={poem.id}>
                    <motion.div
                      className="absolute group cursor-pointer"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      whileHover={{ zIndex: 50 }}
                    >
                      <div 
                        className="rounded-full bg-amber-500/80 dark:bg-amber-400/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover:scale-150 transition-transform"
                        style={{ width: `${size}rem`, height: `${size}rem` }}
                      />
                      <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl shadow-2xl w-max pointer-events-none transition-opacity duration-300 z-50">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-400 block mb-0.5">
                          {poem.mode || "Poetry"}
                        </span>
                        <p className="font-serif text-base text-neutral-900 dark:text-neutral-100 mb-0.5">{poem.title}</p>
                        <p className="text-xs text-neutral-500">By {poem.authorName || "Marrgin"}</p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })
            )}

            {/* Constellation Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 text-amber-500/50">
              {filteredPieces.map((poem, i) => {
                if (i === filteredPieces.length - 1) return null;
                const nextPoem = filteredPieces[i + 1];
                
                const hash1 = poem.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
                const x1 = Math.abs(Math.sin(hash1)) * 80 + 10;
                const y1 = Math.abs(Math.cos(hash1)) * 80 + 10;
                
                const hash2 = nextPoem.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
                const x2 = Math.abs(Math.sin(hash2)) * 80 + 10;
                const y2 = Math.abs(Math.cos(hash2)) * 80 + 10;

                const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
                if (dist > 32) return null;

                return (
                  <line 
                    key={`line-${i}`}
                    x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                    stroke="currentColor" strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin"></div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
