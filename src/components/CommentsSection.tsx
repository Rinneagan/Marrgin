"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Heart, Share2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { addComment, getComments, CommentData } from "@/lib/db";

interface CommentsSectionProps {
  poemId: string;
}

export default function CommentsSection({ poemId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(poemId);
        setComments(data);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      }
    };
    fetchComments();
  }, [poemId]);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const displayName = user.email ? user.email.split("@")[0] : "Anonymous";
      await addComment(poemId, user.uid, displayName, newComment.trim());
      
      // Refresh comments
      const updatedComments = await getComments(poemId);
      setComments(updatedComments);
      setNewComment("");
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to add comment", error);
      alert("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseMentions = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.startsWith('@') && word.length > 1) {
        return <span key={i} className="text-accent cursor-pointer hover:underline">{word}</span>;
      }
      return word + " ";
    });
  };

  return (
    <div className="mt-24 pt-16 border-t border-gray-100">
      <div className="flex items-center gap-6 mb-12 text-secondary">
        <button className="flex items-center gap-2 hover:text-accent transition-colors group">
          <Heart className="w-5 h-5 group-hover:fill-accent" />
          <span>Like</span>
        </button>
        <button className="flex items-center gap-2 hover:text-black transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span>{comments.length} Comments</span>
        </button>
        <button className="flex items-center gap-2 hover:text-black transition-colors">
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      <div className="space-y-12">
        {user ? (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-medium">
              {user.email ? user.email[0].toUpperCase() : "U"}
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onInput={handleInput}
                placeholder="Share your thoughts... (use @ to mention someone)"
                className="w-full bg-transparent border-b border-gray-200 pb-2 outline-none resize-none overflow-hidden focus:border-black transition-colors min-h-[40px] placeholder:text-gray-400"
              />
              <div className="flex justify-end mt-4">
                <button 
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-accent text-white px-6 py-2 rounded-full text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-secondary">
            Please log in to share your thoughts.
          </div>
        )}

        <div className="space-y-10">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 font-medium cursor-pointer">
                {comment.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-medium cursor-pointer hover:underline">{comment.authorName}</span>
                    <span className="text-sm text-gray-400">
                      {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <button className="text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {parseMentions(comment.content)}
                </p>
                <div className="flex gap-4 mt-3 text-sm text-gray-400">
                  <button className="hover:text-black transition-colors">Reply</button>
                  <button className="hover:text-accent transition-colors flex items-center gap-1">
                    <Heart className="w-4 h-4" /> 0
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
