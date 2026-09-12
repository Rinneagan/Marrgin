"use client";

import { useState } from "react";
import { Piece, EditorialMode, generatePieceId, assertPieceDraftExists } from "@/lib/db";
import { 
  Plus, 
  FileText, 
  BookOpen, 
  Shield, 
  MapPin, 
  BarChart2, 
  Clock, 
  ArrowRight, 
  Trash2, 
  Eye, 
  Archive,
  X,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WritingDeskDashboardProps {
  drafts: Piece[];
  published: Piece[];
  archived: Piece[];
  scheduled?: Piece[];
  isLoading: boolean;
  onOpenPiece: (pieceId: string) => void;
  onDeleteDraft: (pieceId: string) => Promise<void>;
  onUnpublishPiece: (pieceId: string) => Promise<void>;
  onArchivePiece: (pieceId: string) => Promise<void>;
  onPreviewPiece: (piece: Piece) => void;
  onOpenAdminAccount?: () => void;
  userDisplayName: string;
}

const MODES: { id: EditorialMode; label: string; description: string; icon: any }[] = [
  { 
    id: "poetry", 
    label: "Poetry", 
    description: "Lyrical verses, stanzas, and emotional rhythms.",
    icon: BookOpen
  },
  { 
    id: "essay", 
    label: "Essay", 
    description: "Lived observations, reflections, and literary prose.",
    icon: FileText
  },
  { 
    id: "investigation", 
    label: "Investigation", 
    description: "In-depth investigative reporting, central questions, and evidence.",
    icon: Shield
  },
  { 
    id: "field-note", 
    label: "Field Note", 
    description: "Firsthand observations, findings, and inferences from the ground.",
    icon: MapPin
  },
  { 
    id: "data-story", 
    label: "Data Story", 
    description: "Empirical measurements, environmental records, and spatial analysis.",
    icon: BarChart2
  },
];

function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Recently";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `Edited ${diffMinutes}m ago`;
  if (diffHours < 24) return `Edited ${diffHours}h ago`;
  if (diffDays === 1) return "Edited yesterday";
  if (diffDays < 7) return `Edited ${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPublishedDate(timestamp: any): string {
  if (!timestamp) return "Published";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default function WritingDeskDashboard({
  drafts,
  published,
  archived,
  scheduled = [],
  isLoading,
  onOpenPiece,
  onDeleteDraft,
  onUnpublishPiece,
  onArchivePiece,
  onPreviewPiece,
  onOpenAdminAccount,
  userDisplayName,
}: WritingDeskDashboardProps) {
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);

  const handleStartPiece = async (selectedMode: EditorialMode) => {
    setIsModeSelectorOpen(false);
    const freshId = generatePieceId();
    await assertPieceDraftExists(freshId, selectedMode, "anonymous", userDisplayName);
    onOpenPiece(freshId);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 py-14">
      {/* Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 pb-8 border-b border-gray-200/80 dark:border-gray-800/80 mb-12">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 block mb-1">
            Marrgin
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 dark:text-neutral-100">
            Writing Desk
          </h1>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            Private authoring and publishing system for {userDisplayName}.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {onOpenAdminAccount && (
            <button
              onClick={onOpenAdminAccount}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-xs font-sans font-medium"
            >
              <Shield size={13} />
              <span>Publisher Settings</span>
            </button>
          )}

          <button
            onClick={() => setIsModeSelectorOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-xs font-sans font-medium shadow-sm"
          >
            <Plus size={14} />
            <span>New Piece</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-neutral-400 font-serif text-sm">
          Loading desk pieces...
        </div>
      ) : (
        <div className="space-y-16">
          {/* SECTION 1: DRAFTS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60 pb-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400 font-medium">
                Drafts ({drafts.length})
              </h2>
            </div>

            {drafts.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-neutral-400 font-serif text-sm">
                No active drafts. Click <span className="underline cursor-pointer" onClick={() => setIsModeSelectorOpen(true)}>New Piece</span> to start writing.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-900">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => onOpenPiece(draft.id)}
                    className="group py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif text-lg text-neutral-900 dark:text-neutral-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors truncate">
                          {draft.title.trim() || "Untitled Draft"}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                          {draft.mode || "poetry"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-sans">
                        <Clock size={11} />
                        <span>{formatRelativeTime(draft.updatedAt || draft.createdAt)}</span>
                        {draft.location && (
                          <>
                            <span>·</span>
                            <span>{draft.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPiece(draft.id);
                        }}
                        className="px-3 py-1 text-xs font-sans font-medium text-amber-900 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full transition-colors inline-flex items-center gap-1.5"
                        title="Edit draft in Studio"
                      >
                        <Pencil size={11} />
                        <span>Edit</span>
                        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewPiece(draft);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-full border border-gray-200 dark:border-gray-800"
                        title="Preview draft"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDraft(draft.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 transition-colors rounded-full border border-gray-200 dark:border-gray-800"
                        title="Delete draft"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION: SCHEDULED (if any exist) */}
          {scheduled.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60 pb-2">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Scheduled ({scheduled.length})</span>
                </h2>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-900">
                {scheduled.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => onOpenPiece(piece.id)}
                    className="group py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif text-lg text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {piece.title.trim() || "Untitled Piece"}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          {piece.mode || "poetry"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-sans">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Scheduled for {piece.scheduledAt ? new Date(piece.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Upcoming"}
                        </span>
                        {piece.location && (
                          <>
                            <span>·</span>
                            <span>{piece.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewPiece(piece);
                        }}
                        className="px-2.5 py-1 text-xs font-sans text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded border border-gray-200 dark:border-gray-800"
                        title="View reader layout"
                      >
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpublishPiece(piece.id);
                        }}
                        className="px-2.5 py-1 text-xs font-sans text-neutral-500 hover:text-amber-600 rounded border border-gray-200 dark:border-gray-800"
                        title="Cancel schedule and return to draft"
                      >
                        Revert to Draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: PUBLISHED */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-800/60 pb-2">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-medium">
                Published ({published.length})
              </h2>
            </div>

            {published.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-neutral-400 font-serif text-sm">
                No published pieces yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-900">
                {published.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => onOpenPiece(piece.id)}
                    className="group py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif text-lg text-neutral-900 dark:text-neutral-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors truncate">
                          {piece.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          {piece.mode || "poetry"}
                        </span>
                        {piece.isVaulted && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0">
                            Vaulted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-sans">
                        <span>{formatPublishedDate(piece.createdAt)}</span>
                        {piece.readingTimeMinutes ? (
                          <>
                            <span>·</span>
                            <span>{piece.readingTimeMinutes} min read</span>
                          </>
                        ) : null}
                        {piece.location && (
                          <>
                            <span>·</span>
                            <span>{piece.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPiece(piece.id);
                        }}
                        className="px-3 py-1 text-xs font-sans font-medium text-amber-900 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-full transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        title="Edit published piece in Studio"
                      >
                        <Pencil size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewPiece(piece);
                        }}
                        className="px-2.5 py-1 text-xs font-sans text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-full border border-gray-200 dark:border-gray-800 transition-colors"
                        title="View reader layout"
                      >
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnpublishPiece(piece.id);
                        }}
                        className="px-2.5 py-1 text-xs font-sans text-neutral-500 hover:text-amber-600 rounded-full border border-gray-200 dark:border-gray-800 transition-colors"
                        title="Unpublish back to draft"
                      >
                        Unpublish
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchivePiece(piece.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Archive piece"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 3: ARCHIVED (IF ANY) */}
          {archived.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
                Archived ({archived.length})
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-900">
                {archived.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => onOpenPiece(piece.id)}
                    className="py-3 flex items-center justify-between text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    <span className="font-serif text-base">{piece.title}</span>
                    <span className="text-xs font-mono uppercase">Archived</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* MODE SELECTOR MODAL */}
      <AnimatePresence>
        {isModeSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setIsModeSelectorOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X size={18} />
              </button>

              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400 block mb-2 font-medium">
                New Piece
              </span>
              <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-100 mb-2">
                What are you writing?
              </h3>
              <p className="text-xs text-neutral-500 font-sans mb-6">
                Choose an editorial mode. The editor and metadata tools will adapt accordingly.
              </p>

              <div className="space-y-2.5">
                {MODES.map((modeItem) => {
                  const Icon = modeItem.icon;
                  return (
                    <button
                      key={modeItem.id}
                      onClick={() => handleStartPiece(modeItem.id)}
                      className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-gray-800/80 hover:border-amber-500/60 dark:hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-all flex items-start gap-4 group"
                    >
                      <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-base text-neutral-900 dark:text-neutral-100 group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors">
                          {modeItem.label}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5">
                          {modeItem.description}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-neutral-300 group-hover:text-amber-800 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 self-center" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
