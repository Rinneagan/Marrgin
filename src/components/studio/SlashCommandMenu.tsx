"use client";

import React, { useEffect, useRef, useState } from "react";
import { BlockType } from "@/lib/studioBlocks";
import { 
  Heading2, 
  Heading3, 
  Quote, 
  Feather, 
  List, 
  ListOrdered, 
  Minus, 
  Image as ImageIcon, 
  FileText 
} from "lucide-react";

export interface SlashCommandOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

export const SLASH_COMMANDS: SlashCommandOption[] = [
  {
    type: "paragraph",
    label: "Text Paragraph",
    description: "Standard body paragraph for prose or narrative",
    icon: FileText,
  },
  {
    type: "heading2",
    label: "Heading 2",
    description: "Section header for major divisions",
    icon: Heading2,
    shortcut: "##",
  },
  {
    type: "heading3",
    label: "Heading 3",
    description: "Sub-section header for detailed topics",
    icon: Heading3,
    shortcut: "###",
  },
  {
    type: "poetry-stanza",
    label: "Poetry Stanza",
    description: "Preserves exact linebreaks, meter, and stanza spacing",
    icon: Feather,
    shortcut: "stanza",
  },
  {
    type: "blockquote",
    label: "Blockquote",
    description: "Editorial pullquote or cited statement",
    icon: Quote,
    shortcut: ">",
  },
  {
    type: "callout",
    label: "Field Note Observation",
    description: "Distinct observation block with notation badge",
    icon: Feather,
    shortcut: "> [obs]",
  },
  {
    type: "bullet-list",
    label: "Bulleted List",
    description: "Unordered list of items or evidence points",
    icon: List,
    shortcut: "-",
  },
  {
    type: "numbered-list",
    label: "Numbered List",
    description: "Ordered sequential list of steps or points",
    icon: ListOrdered,
    shortcut: "1.",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Quiet horizontal pause between sections",
    icon: Minus,
    shortcut: "---",
  },
  {
    type: "image",
    label: "Image with Caption",
    description: "Editorial photography, charts, or maps",
    icon: ImageIcon,
    shortcut: "![]",
  },
];

interface SlashCommandMenuProps {
  filterText: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashCommandMenu({ filterText, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const cleanFilter = filterText.toLowerCase().trim();
  const filtered = SLASH_COMMANDS.filter((cmd) => {
    if (!cleanFilter) return true;
    return (
      cmd.label.toLowerCase().includes(cleanFilter) ||
      cmd.description.toLowerCase().includes(cleanFilter) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(cleanFilter)) ||
      cmd.type.toLowerCase().includes(cleanFilter)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [filterText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].type);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (filtered.length === 0) {
    return (
      <div 
        ref={menuRef}
        className="absolute z-50 mt-1 w-72 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-3 text-xs text-neutral-500"
      >
        No matching block types for &ldquo;/{filterText}&rdquo;
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 mt-1 w-80 max-h-72 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl py-1 text-sm transition-all animate-in fade-in zoom-in-95 duration-100"
      role="listbox"
      aria-label="Insert block menu"
    >
      <div className="px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase text-neutral-400 border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
        Insert Block
      </div>
      {filtered.map((cmd, index) => {
        const Icon = cmd.icon;
        const isSelected = index === selectedIndex;
        return (
          <button
            key={cmd.type}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(cmd.type)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors ${
              isSelected
                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            }`}
          >
            <div className={`p-1.5 rounded border mt-0.5 ${
              isSelected 
                ? "bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white" 
                : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500"
            }`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs font-serif">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                    {cmd.shortcut}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                {cmd.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
