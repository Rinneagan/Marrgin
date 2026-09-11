"use client";

import React, { useState } from "react";
import { StudioBlock } from "@/lib/studioBlocks";
import { Image as ImageIcon, Trash2, Edit3, Check, ExternalLink } from "lucide-react";

interface ImageBlockProps {
  block: StudioBlock;
  onChange: (updated: Partial<StudioBlock>) => void;
  onDelete: () => void;
}

export function ImageBlock({ block, onChange, onDelete }: ImageBlockProps) {
  const url = block.meta?.url || block.content || "";
  const caption = block.meta?.caption || "";
  const alt = block.meta?.alt || "";

  const [isEditing, setIsEditing] = useState(!url);
  const [inputUrl, setInputUrl] = useState(url);
  const [inputCaption, setInputCaption] = useState(caption);
  const [inputAlt, setInputAlt] = useState(alt);

  const handleSave = () => {
    onChange({
      content: inputUrl.trim(),
      meta: {
        url: inputUrl.trim(),
        caption: inputCaption.trim(),
        alt: inputAlt.trim() || inputCaption.trim() || "Editorial image",
      },
    });
    setIsEditing(false);
  };

  if (isEditing || !url) {
    return (
      <div className="my-6 p-4 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40 transition-all">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono tracking-wider uppercase text-neutral-500">
          <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Editorial Image Details</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-sans font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              Image URL / Path
            </label>
            <input
              type="text"
              placeholder="https://... or /images/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-sans font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Editorial Caption
              </label>
              <input
                type="text"
                placeholder="e.g. Fishermen docking in Jamestown, Accra, 2024"
                value={inputCaption}
                onChange={(e) => setInputCaption(e.target.value)}
                className="w-full text-xs font-serif px-3 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-sans font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Alt Text (Accessibility)
              </label>
              <input
                type="text"
                placeholder="Describe image for screen readers"
                value={inputAlt}
                onChange={(e) => setInputAlt(e.target.value)}
                className="w-full text-xs font-sans px-3 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Block</span>
            </button>
            <div className="flex items-center gap-2">
              {url && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!inputUrl.trim()}
                className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <figure className="group relative my-8 text-center">
      <div className="relative inline-block max-w-full overflow-hidden rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt || caption || "Marrgin editorial image"}
          className="max-h-[500px] w-auto object-contain mx-auto transition-transform duration-300"
          onError={(e) => {
            // Provide a graceful fallback indicator if image URL is invalid
            (e.target as HTMLElement).style.opacity = "0.5";
          }}
        />

        {/* Hover action toolbar */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/80 backdrop-blur-sm p-1 rounded border border-neutral-700/50 shadow-lg">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit image details"
            className="p-1 text-neutral-300 hover:text-white transition-colors"
            title="Edit image details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open image in new tab"
            className="p-1 text-neutral-300 hover:text-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete image"
            className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
            title="Delete image block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {caption ? (
        <figcaption className="mt-2 text-xs font-serif italic text-neutral-500 dark:text-neutral-400">
          {caption}
        </figcaption>
      ) : (
        <figcaption className="mt-1 text-[11px] font-sans text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Click edit above to add a caption
        </figcaption>
      )}
    </figure>
  );
}
