"use client";

import React, { createContext, useContext } from "react";
import Link from "next/link";
import { Piece, EditorialMode } from "@/lib/db";
import FollowButton from "@/components/FollowButton";
import BookmarkButton from "@/components/BookmarkButton";
import LikeButton from "@/components/LikeButton";
import { MapPin, Search, BarChart3, Feather, Eye, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const PieceCardContext = createContext<{ piece: Piece } | null>(null);

export function usePieceCard() {
  const context = useContext(PieceCardContext);
  if (!context) {
    throw new Error("PieceCard subcomponents must be rendered within a PieceCard");
  }
  return context;
}

export interface PieceCardProps {
  piece: Piece;
  children?: React.ReactNode;
  className?: string;
}

export default function PieceCard({ piece, children, className = "" }: PieceCardProps) {
  return (
    <PieceCardContext.Provider value={{ piece }}>
      <article 
        className={`w-full bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-7 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:border-gray-700/80 transition-all overflow-hidden relative group ${className}`}
      >
        {piece.coverImage && (
          <div className="absolute top-0 left-0 w-full h-40 opacity-70 group-hover:opacity-85 transition-opacity z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fbf9f5]/80 to-[#fbf9f5] dark:via-[#09090b]/80 dark:to-[#09090b] z-10"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={piece.coverImage} 
              alt={piece.title ? `${piece.title} cover image` : "Editorial cover photograph"} 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        
        <div className={`relative z-10 flex flex-col h-full ${piece.coverImage ? 'pt-16' : ''}`}>
          {children ? children : (
            <>
              <PieceCard.Eyebrow />
              <PieceCard.Title />
              <PieceCard.Dek />
              <PieceCard.Context />
              <PieceCard.Meta />
            </>
          )}
        </div>
      </article>
    </PieceCardContext.Provider>
  );
}

// 1. Eyebrow: Editorial Mode Badge / Category
PieceCard.Eyebrow = function PieceCardEyebrow({ className = "" }: { className?: string }) {
  const { piece } = usePieceCard();
  const mode = piece.mode || "poetry";

  const getModeLabel = (m: EditorialMode) => {
    switch (m) {
      case "investigation":
        return { label: "Investigation", icon: Search, color: "text-amber-800 dark:text-amber-400/90 border-amber-500/20 bg-amber-500/5" };
      case "field-note":
        return { label: "Field Note", icon: Eye, color: "text-emerald-800 dark:text-emerald-400/90 border-emerald-500/20 bg-emerald-500/5" };
      case "data-story":
        return { label: "Data Story", icon: BarChart3, color: "text-sky-800 dark:text-sky-400/90 border-sky-500/20 bg-sky-500/5" };
      case "essay":
        return { label: "Essay", icon: Feather, color: "text-purple-800 dark:text-purple-400/90 border-purple-500/20 bg-purple-500/5" };
      case "poetry":
      default:
        return { label: "Poetry", icon: Feather, color: "text-neutral-700 dark:text-neutral-300 border-neutral-500/20 bg-neutral-500/5" };
    }
  };

  const modeConfig = getModeLabel(mode);
  const Icon = modeConfig.icon;

  return (
    <div className={`flex items-center gap-2 mb-3.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-widest uppercase border ${modeConfig.color}`}>
        <Icon size={11} strokeWidth={1.75} />
        {modeConfig.label}
      </span>
      {piece.aesthetic && piece.aesthetic !== "default" && piece.aesthetic !== "poetry" && (
        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-sans">
          · {piece.aesthetic}
        </span>
      )}
    </div>
  );
};

// 2. Title
PieceCard.Title = function PieceCardTitle({ className = "" }: { className?: string }) {
  const { piece } = usePieceCard();
  return (
    <Link href={`/read/${piece.id}`}>
      <h2 className={`font-serif text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100 hover:text-amber-900 dark:hover:text-amber-400 transition-colors leading-tight mb-2 tracking-tight ${className}`}>
        {piece.title || "Untitled"}
      </h2>
    </Link>
  );
};

// 3. Dek / Subtitle
PieceCard.Dek = function PieceCardDek({ className = "" }: { className?: string }) {
  const { piece } = usePieceCard();
  if (!piece.subtitle) return null;

  return (
    <p className={`text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed mb-4 line-clamp-2 ${className}`}>
      {piece.subtitle}
    </p>
  );
};

// 4. Mode-Specific Context
PieceCard.Context = function PieceCardContextContainer() {
  const { piece } = usePieceCard();
  const mode = piece.mode || "poetry";

  switch (mode) {
    case "investigation":
      return <InvestigationContext />;
    case "field-note":
      return <FieldNoteContext />;
    case "data-story":
      return <DataStoryContext />;
    case "essay":
    case "poetry":
    default:
      return <WritingContext />;
  }
};

function InvestigationContext() {
  const { piece } = usePieceCard();

  if (piece.centralQuestion) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/40">
        <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-amber-900 dark:text-amber-400 uppercase mb-1">
          <HelpCircle size={12} />
          <span>The Question</span>
        </div>
        <p className="font-serif italic text-base md:text-lg text-neutral-900 dark:text-neutral-200 leading-snug line-clamp-2">
          &ldquo;{piece.centralQuestion}&rdquo;
        </p>
      </div>
    );
  }

  return <WritingContext />;
}

function FieldNoteContext() {
  const { piece } = usePieceCard();

  if (piece.observation) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/30">
        <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-emerald-900 dark:text-emerald-400 uppercase mb-1">
          <Eye size={12} />
          <span>Direct Observation</span>
        </div>
        <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-300 leading-relaxed line-clamp-3">
          {piece.observation}
        </p>
      </div>
    );
  }

  return <WritingContext />;
}

function DataStoryContext() {
  const { piece } = usePieceCard();

  return (
    <div className="mb-6">
      {piece.datasetName && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono tracking-widest text-sky-800 dark:text-sky-400 uppercase bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 line-clamp-1">
            {piece.datasetName}
          </span>
          {piece.dataUnits && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              ({piece.dataUnits})
            </span>
          )}
        </div>
      )}
      {piece.centralQuestion ? (
        <p className="font-serif italic text-base text-neutral-800 dark:text-neutral-200 leading-relaxed line-clamp-2">
          &ldquo;{piece.centralQuestion}&rdquo;
        </p>
      ) : (
        <WritingContext />
      )}
    </div>
  );
}

function WritingContext() {
  const { piece } = usePieceCard();
  const rawText = (piece.content || "")
    .replace(/<fold>/g, "")
    .replace(/<\/fold>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  if (!rawText) return null;

  return (
    <p className={`text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6 line-clamp-3 ${piece.mode === "poetry" ? "font-serif text-lg italic" : "text-sm md:text-base"}`}>
      {rawText}
    </p>
  );
}

// 5. Metadata Bar (Author, Location, Reading Time, Actions)
PieceCard.Meta = function PieceCardMeta({ className = "" }: { className?: string }) {
  const { piece } = usePieceCard();
  const { user } = useAuth();
  const authorName = piece.authorName || (piece as any).author || "Marrgin";
  const authorId = piece.authorId;

  // Mode-Aware Reading Time calculation
  const getReadingTime = (): string => {
    if (piece.readingTimeMinutes && piece.readingTimeMinutes > 0) {
      return `${piece.readingTimeMinutes} min read`;
    }
    const content = piece.content || "";
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const mode = piece.mode || "poetry";

    if (mode === "poetry") {
      return `${Math.max(1, Math.ceil(content.length / 500))} min read`;
    }
    if (mode === "field-note") {
      return wordCount < 60 ? "Quick read" : `${Math.max(1, Math.ceil(wordCount / 250))} min read`;
    }
    if (mode === "investigation" || mode === "data-story") {
      return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    }
    return `${Math.max(1, Math.ceil(wordCount / 225))} min read`;
  };

  return (
    <div className={`mt-auto pt-4 border-t border-gray-200/70 dark:border-gray-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 ${className}`}>
      {/* Left: Author & Location */}
      <div className="flex items-center gap-3 flex-wrap">
        {authorId ? (
          <div className="flex items-center gap-2">
            <Link href={`/user/${authorId}`} className="font-medium text-neutral-800 dark:text-neutral-200 hover:text-amber-900 dark:hover:text-amber-400 transition-colors">
              by {authorName}
            </Link>
            {user?.uid !== authorId && (
              <FollowButton authorId={authorId} />
            )}
          </div>
        ) : (
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            by {authorName}
          </span>
        )}

        {/* Location: Shown ONLY if it exists! */}
        {piece.location && piece.location.trim().length > 0 && (
          <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
            <MapPin size={11} className="text-amber-700/80 dark:text-amber-400/80" />
            {piece.location.trim()}
          </span>
        )}
      </div>

      {/* Right: Reading Time & Actions */}
      <div className="flex items-center gap-4">
        <span className="tracking-wider uppercase font-mono text-[11px]">
          {getReadingTime()}
        </span>
        <div className="flex items-center gap-3">
          <LikeButton poemId={piece.id} initialLikesCount={piece.likesCount || (piece as any).likes || 0} />
          <BookmarkButton poemId={piece.id} />
        </div>
      </div>
    </div>
  );
};
