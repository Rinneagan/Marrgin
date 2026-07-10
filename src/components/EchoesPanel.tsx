"use client";

import { useState, useRef } from "react";
import { MessageCircle, Heart, X, Pin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addComment, CommentData, pinComment } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

interface EchoesPanelProps {
  poemId: string;
  lineIndex: number | null;
  lineText: string;
  comments: CommentData[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function EchoesPanel({ poemId, lineIndex, lineText, comments, onClose, onRefresh }: EchoesPanelProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  // Filter comments for this specific line
  const lineComments = comments.filter(c => c.lineIndex === lineIndex);
  
  // Separate top level and replies
  const topLevelComments = lineComments.filter(c => !c.parentId);
  const replies = lineComments.filter(c => c.parentId);

  // Sort: Pinned first, then chronological
  topLevelComments.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.createdAt?.toMillis() - b.createdAt?.toMillis();
  });

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim() || isSubmitting || lineIndex === null) return;

    setIsSubmitting(true);
    try {
      const displayName = user.email ? user.email.split("@")[0] : "Anonymous";
      await addComment(poemId, user.uid, displayName, newComment.trim(), lineIndex, replyToId);
      
      setNewComment("");
      setReplyToId(null);
      onRefresh(); // Trigger parent to fetch comments again
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to add echo", error);
      alert("Failed to post echo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePin = async (commentId: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    try {
      await pinComment(poemId, commentId, !currentStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      {lineIndex !== null && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 w-full md:w-[400px] h-full bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
            <div>
              <h3 className="font-serif text-xl mb-2 flex items-center gap-2">
                <MessageCircle size={18} className="text-accent"/> Echoes
              </h3>
              <p className="text-sm text-gray-500 italic line-clamp-2 border-l-2 border-accent pl-3">"{lineText}"</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {topLevelComments.length === 0 ? (
              <p className="text-secondary text-center text-sm mt-10">No echoes on this line yet. Be the first.</p>
            ) : (
              topLevelComments.map((comment) => (
                <div key={comment.id} className={`space-y-4 ${comment.isPinned ? 'p-4 bg-accent/5 dark:bg-accent/10 rounded-xl border border-accent/20' : ''}`}>
                  <div className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center text-gray-500 text-sm font-medium">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          {comment.isPinned && <Pin size={12} className="text-accent" />}
                        </div>
                        {isAdmin && (
                          <button onClick={() => handlePin(comment.id, !!comment.isPinned)} className="opacity-0 group-hover:opacity-100 text-xs text-secondary hover:text-accent transition-all">
                            {comment.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{comment.content}</p>
                      <button 
                        onClick={() => setReplyToId(comment.id)}
                        className="text-xs text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.filter(r => r.parentId === comment.id).length > 0 && (
                    <div className="pl-11 space-y-4 border-l border-gray-100 dark:border-gray-800 ml-4">
                      {replies.filter(r => r.parentId === comment.id).map(reply => (
                        <div key={reply.id} className="flex gap-3">
                           <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-medium">
                            {reply.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-xs mr-2">{reply.authorName}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{reply.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {user ? (
              <div className="flex flex-col gap-2">
                {replyToId && (
                  <div className="flex justify-between items-center text-xs text-accent bg-accent/10 px-3 py-1 rounded-full w-fit">
                    <span>Replying to thread...</span>
                    <button onClick={() => setReplyToId(null)}><X size={12}/></button>
                  </div>
                )}
                <div className="flex gap-3">
                  <textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onInput={handleInput}
                    placeholder="Leave an echo..."
                    className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-700 pb-2 outline-none resize-none overflow-hidden focus:border-accent transition-colors min-h-[30px] text-sm placeholder:text-gray-400"
                  />
                  <button 
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || isSubmitting}
                    className="self-end bg-accent text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors mb-1"
                  >
                    {isSubmitting ? "..." : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-secondary">Log in to leave an echo.</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
