"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { checkIsPoemLiked, togglePoemLike } from "@/lib/db";
import { motion } from "framer-motion";

export default function LikeButton({ poemId, initialLikesCount = 0 }: { poemId: string, initialLikesCount?: number }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user && poemId) {
      checkIsPoemLiked(user.uid, poemId).then(setIsLiked).catch(console.error);
    }
  }, [user, poemId]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please log in to like poems.");
      return;
    }

    setIsAnimating(true);
    
    // Optimistic UI update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      await togglePoemLike(user.uid, poemId, isLiked); // pass the OLD state to toggle
    } catch (error) {
      console.error("Failed to toggle like", error);
      // Revert optimistic update on failure
      setIsLiked(isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    }
    
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <button
      onClick={toggleLike}
      className={`flex items-center gap-2 transition-colors relative group ${
        isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
      }`}
      title={isLiked ? "Unlike" : "Like"}
    >
      <div className="relative">
        <Heart 
          size={22} 
          strokeWidth={1.5} 
          className={`transition-all duration-300 ${isLiked ? "fill-red-500 text-red-500" : "group-hover:fill-red-100"}`} 
        />
        
        {/* CSS Particle Micro-animation */}
        {isAnimating && isLiked && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-red-400"
          />
        )}
      </div>
      <span className="text-sm font-medium">{likesCount > 0 ? likesCount : ""}</span>
    </button>
  );
}
