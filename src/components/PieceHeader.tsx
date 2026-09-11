import React from "react";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import BookmarkButton from "@/components/BookmarkButton";
import LikeButton from "@/components/LikeButton";
import { ListPlus, MapPin, Calendar, HelpCircle, Clock } from "lucide-react";
import { Piece, EditorialMode } from "@/lib/db";

interface PieceHeaderProps {
  piece: Piece;
  readingTimeText: string | null;
  onSaveToPlaylist?: () => void;
  isZenMode?: boolean;
}

export default function PieceHeader({
  piece,
  readingTimeText,
  onSaveToPlaylist = () => {},
  isZenMode = false,
}: PieceHeaderProps) {
  const mode: EditorialMode = piece.mode || "poetry";

  const formattedCreatedDate = piece.createdAt?.toDate
    ? piece.createdAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : piece.createdAt
    ? new Date(piece.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const formattedUpdatedDate = piece.updatedAt?.toDate
    ? piece.updatedAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : piece.updatedAt
    ? new Date(piece.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const showUpdated = formattedUpdatedDate && formattedCreatedDate && formattedUpdatedDate !== formattedCreatedDate;

  return (
    <header className={`mb-14 transition-opacity duration-1000 ${isZenMode ? "opacity-20 hover:opacity-100" : "opacity-100"}`}>
      {/* Optional Editorial Mode Tag */}
      {mode !== "poetry" && (
        <div className="mb-4">
          <span className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-white/[0.04] border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
            {mode.replace("-", " ")}
          </span>
        </div>
      )}

      {/* Cover Image if present */}
      {piece.coverImage && (
        <div className="w-full h-[35vh] md:h-[48vh] relative mb-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={piece.coverImage} alt={piece.title || "Cover"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7] dark:from-[#0a0a0a] via-transparent to-transparent" />
        </div>
      )}

      {/* Title */}
      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4 leading-[1.15] text-gray-900 dark:text-gray-100 tracking-tight">
        {piece.title || "Untitled"}
      </h1>

      {/* Subtitle / Dek */}
      {piece.subtitle && (
        <p className="font-serif text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed mb-6 italic">
          {piece.subtitle}
        </p>
      )}

      {/* Author Byline & Social Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800/60">
        <div className="flex flex-wrap items-center gap-3 font-sans text-sm text-secondary">
          <span>By</span>
          <Link
            href={`/user/${piece.authorId}`}
            className="font-serif text-base md:text-lg text-gray-900 dark:text-gray-100 hover:text-accent transition-colors font-medium hover:underline"
          >
            {piece.authorName}
          </Link>
          <FollowButton authorId={piece.authorId} />
        </div>

        <div className="flex items-center gap-6 self-end sm:self-auto">
          <LikeButton poemId={piece.id} initialLikesCount={piece.likesCount} />
          <BookmarkButton poemId={piece.id} />
        </div>
      </div>

      {/* Secondary Metadata Row (Date, Updated, Location, Reading Time, Anthology) */}
      <div className="mt-6 pt-4 border-t border-dashed border-gray-100 dark:border-gray-900 flex flex-wrap items-center justify-between gap-4 font-sans text-xs text-gray-400 uppercase tracking-widest">
        <div className="flex flex-wrap items-center gap-4">
          {formattedCreatedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-gray-400" />
              {formattedCreatedDate}
            </span>
          )}

          {showUpdated && (
            <span className="text-gray-500 font-normal lowercase">
              (updated {formattedUpdatedDate})
            </span>
          )}

          {(piece.location || piece.dateObserved) && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <MapPin size={13} className="text-accent" />
              {[piece.location, piece.dateObserved].filter(Boolean).join(" • ")}
            </span>
          )}

          {readingTimeText && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <Clock size={13} />
              {readingTimeText}
            </span>
          )}
        </div>

        <button
          onClick={onSaveToPlaylist}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white hover:border-accent"
        >
          <ListPlus size={14} />
          <span className="text-[11px] font-medium font-sans">Save to Anthology</span>
        </button>
      </div>

      {/* Prominently Featured: THE QUESTION (Investigation Mode or Data Story Mode) */}
      {(mode === "investigation" || mode === "data-story") && piece.centralQuestion && (
        <div className="mt-8 p-6 md:p-8 rounded-2xl bg-white/[0.03] dark:bg-white/[0.02] border border-accent/40 dark:border-accent/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent font-semibold mb-2">
            <HelpCircle size={15} />
            <span>The Reporting Question</span>
          </div>
          <blockquote className="font-serif text-2xl md:text-3xl text-gray-900 dark:text-gray-100 leading-snug">
            "{piece.centralQuestion}"
          </blockquote>
        </div>
      )}
    </header>
  );
}
