"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkIsFollowing, toggleFollowUser as toggleFollowDb } from "@/lib/db";

export default function FollowButton({
  authorId,
}: {
  authorId: string;
}) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (user && authorId) {
      checkIsFollowing(user.uid, authorId).then(setIsFollowing);
    }
  }, [user, authorId]);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please log in to follow authors.");
      return;
    }

    try {
      await toggleFollowDb(user.uid, authorId, isFollowing);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Failed to toggle follow", error);
    }
  };

  if (user && user.uid === authorId) {
    return null; // Don't show follow button for your own poems
  }

  return (
    <button
      onClick={toggleFollow}
      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
        isFollowing
          ? "bg-gray-100 text-gray-800 border border-transparent"
          : "bg-transparent text-accent border border-accent hover:bg-accent hover:text-white"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
