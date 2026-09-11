"use client";

import { useState, useEffect, useCallback } from "react";
import { PublicComment, fetchCommentsForPiece, submitComment, moderateComment } from "@/lib/comments";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, EyeOff, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface CommentsSectionProps {
  poemId: string;
}

const SINGLE_ADMIN_UID = "54WZPYBFR8VIPv9qpIDn1FI0bcz1";

function formatRelativeTime(ms: number): string {
  if (!ms) return "Recently";
  const now = Date.now();
  const diffMs = Math.max(0, now - ms);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CommentsSection({ poemId }: CommentsSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.uid === SINGLE_ADMIN_UID;

  const [comments, setComments] = useState<PublicComment[]>([]);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    try {
      let idToken: string | undefined = undefined;
      if (isAdmin && user) {
        idToken = await user.getIdToken();
      }
      const data = await fetchCommentsForPiece(poemId, idToken);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [poemId, isAdmin, user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCommentBody.trim();
    if (!clean || isSubmitting) return;

    if (clean.length < 3) {
      setErrorMessage("Comment must be at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const created = await submitComment(poemId, clean);
      setComments((prev) => [...prev, created]);
      setNewCommentBody("");
      setSuccessMessage("Comment posted.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModerate = async (commentId: string, action: "hide" | "approve" | "delete") => {
    if (!user || !isAdmin) return;
    try {
      const idToken = await user.getIdToken();
      if (action === "delete") {
        if (!confirm("Delete this comment permanently?")) return;
        await moderateComment(commentId, { action: "delete" }, idToken);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const newStatus = action === "hide" ? "hidden" : "approved";
        await moderateComment(commentId, { status: newStatus }, idToken);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      console.error("Moderation error:", err);
      alert("Failed to moderate comment.");
    }
  };

  return (
    <section className="mt-16 pt-12 border-t border-gray-200/70 dark:border-gray-800/70 max-w-2xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 font-medium">
          Comments ({comments.filter((c) => c.status === "approved" || isAdmin).length})
        </h3>
        <span className="text-[11px] text-neutral-400 italic">
          Pseudonyms are assigned automatically to readers.
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-12 space-y-3">
        <textarea
          rows={3}
          value={newCommentBody}
          onChange={(e) => {
            setNewCommentBody(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="Write a comment..."
          maxLength={1000}
          className="w-full bg-neutral-50/60 dark:bg-neutral-900/40 border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-4 text-sm font-sans text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500/50 resize-none transition-colors placeholder:text-neutral-400"
        />

        <div className="flex items-center justify-between">
          <div className="text-xs">
            {errorMessage && (
              <span className="text-rose-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errorMessage}
              </span>
            )}
            {successMessage && (
              <span className="text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={12} /> {successMessage}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || newCommentBody.trim().length < 3}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <span>{isSubmitting ? "Posting..." : "Post comment"}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </form>

      {/* Comment Stream */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-neutral-400 italic">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-400 italic border-t border-dashed border-gray-200/60 dark:border-gray-800/60">
          No comments yet. Leave the first observation.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-900 space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className={`pt-6 first:pt-0 ${comment.status === "hidden" ? "opacity-40" : ""}`}>
              {/* Author & Timestamp */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-base text-neutral-900 dark:text-neutral-100 font-medium">
                    {comment.displayName}
                  </span>
                  {comment.status === "hidden" && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Hidden
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>

              {/* Plain-text Comment Body (Stored and rendered strictly as text) */}
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                {comment.body}
              </p>

              {/* Admin Moderation Controls */}
              {isAdmin && (
                <div className="mt-2.5 flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  {comment.status === "approved" ? (
                    <button
                      onClick={() => handleModerate(comment.id, "hide")}
                      className="hover:text-amber-500 flex items-center gap-1"
                      title="Hide comment from public readers"
                    >
                      <EyeOff size={11} /> Hide
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModerate(comment.id, "approve")}
                      className="hover:text-emerald-500 flex items-center gap-1"
                      title="Approve comment for public readers"
                    >
                      <CheckCircle2 size={11} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleModerate(comment.id, "delete")}
                    className="hover:text-rose-500 flex items-center gap-1"
                    title="Permanently delete comment"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
