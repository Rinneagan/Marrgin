"use client";

import React, { useState } from "react";
import { X, Globe, Share2, MessageCircle } from "lucide-react";
import { Piece } from "@/lib/db";

interface SocialPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  piece: Partial<Piece>;
  coverImage?: string;
}

export function SocialPreviewModal({ isOpen, onClose, piece, coverImage }: SocialPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"x" | "messaging" | "search">("x");

  if (!isOpen) return null;

  const title = piece.title || "Untitled Piece";
  const dek = piece.subtitle || piece.summary || "Read the latest literary observation and reporting from Marrgin.";
  const slug = piece.slug || piece.id || "preview-id";
  const url = `marrgin.com/read/${slug}`;
  const displayImage = coverImage || piece.coverImage || "/favicon.ico";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-preview-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 id="social-preview-title" className="text-base font-serif font-medium text-neutral-900 dark:text-neutral-100">
              Social Metadata Preview
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Preview how this piece appears when shared across search and messaging platforms.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close social preview"
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("x")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "x"
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>X / Twitter Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("messaging")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "messaging"
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>OpenGraph / WhatsApp / Telegram</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "search"
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Search</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-neutral-100/60 dark:bg-neutral-950/60 flex items-center justify-center min-h-[320px]">
          {/* 1. X / Twitter Card */}
          {activeTab === "x" && (
            <div className="w-full max-w-md bg-black text-white rounded-2xl border border-neutral-800 overflow-hidden shadow-lg">
              {displayImage && (
                <div className="w-full h-44 bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[11px] font-sans text-neutral-300">
                    marrgin.com
                  </div>
                </div>
              )}
              <div className="p-3">
                <div className="text-[12px] text-neutral-400 font-sans">{url}</div>
                <div className="text-sm font-bold text-neutral-100 line-clamp-1 mt-0.5">{title}</div>
                <div className="text-xs text-neutral-400 line-clamp-2 mt-1 font-sans">{dek}</div>
              </div>
            </div>
          )}

          {/* 2. OpenGraph / WhatsApp / Telegram */}
          {activeTab === "messaging" && (
            <div className="w-full max-w-sm bg-white dark:bg-[#1f2c34] rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 shadow-md">
              <div className="flex gap-3 items-start">
                {displayImage && (
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {title}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                    {dek}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider font-mono">
                    marrgin.com
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Google Search */}
          {activeTab === "search" && (
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-serif font-bold text-neutral-800 dark:text-neutral-200">
                  M
                </div>
                <div>
                  <div className="text-xs font-sans text-neutral-800 dark:text-neutral-200">Marrgin</div>
                  <div className="text-[10px] font-sans text-neutral-500">https://{url}</div>
                </div>
              </div>
              <div className="text-base font-medium text-blue-700 dark:text-blue-400 line-clamp-1 hover:underline cursor-pointer">
                {title} | Marrgin
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                {dek}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
