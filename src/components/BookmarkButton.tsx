"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { checkIsBookmarked, toggleBookmark as toggleBookmarkDb } from "@/lib/db";

export default function BookmarkButton({ poemId }: { poemId: string }) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user && poemId) {
      checkIsBookmarked(user.uid, poemId).then(setIsBookmarked).catch(console.error);
    }
  }, [user, poemId]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert("Please log in to save poems to your collection.");
      return;
    }

    setIsAnimating(true);
    
    try {
      await toggleBookmarkDb(user.uid, poemId, isBookmarked);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={toggleBookmark}
      className={`p-2 rounded-full transition-all duration-300 ${
        isBookmarked 
          ? "bg-accent/10 text-accent" 
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      } ${isAnimating ? "scale-110" : "scale-100"}`}
      title={isBookmarked ? "Remove from Collections" : "Save to Collection"}
    >
      {isBookmarked ? (
        <BookmarkCheck size={22} strokeWidth={1.5} className="fill-accent/20" />
      ) : (
        <Bookmark size={22} strokeWidth={1.5} />
      )}
    </button>
  );
}
