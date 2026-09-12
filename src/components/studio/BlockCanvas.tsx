"use client";

import React, { useRef, useState, useEffect } from "react";
import { StudioBlock, BlockType, generateBlockId } from "@/lib/studioBlocks";
import { EditorialMode } from "@/lib/db";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { ImageBlock } from "./ImageBlock";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronUp, 
  ChevronDown,
  Quote,
  Feather
} from "lucide-react";

interface BlockCanvasProps {
  blocks: StudioBlock[];
  mode: EditorialMode;
  onChange: (blocks: StudioBlock[]) => void;
  readOnly?: boolean;
}

export function BlockCanvas({ blocks, mode, onChange, readOnly = false }: BlockCanvasProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashFilter, setSlashFilter] = useState<string>("");

  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // Auto-resize active textarea based on content
  const autoResize = (id: string) => {
    const el = textareaRefs.current.get(id);
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 36)}px`;
  };

  // Run autoResize whenever blocks change
  useEffect(() => {
    blocks.forEach((block) => {
      autoResize(block.id);
    });
  }, [blocks]);

  // Update a single block
  const updateBlock = (id: string, updates: Partial<StudioBlock>) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    onChange(next);
  };

  // Add a new block after index
  const addBlockAfter = (index: number, type: BlockType = "paragraph", initialContent = "") => {
    const newBlock: StudioBlock = {
      id: generateBlockId(),
      type: mode === "poetry" ? "poetry-stanza" : type,
      content: initialContent,
    };
    const next = [...blocks];
    next.splice(index + 1, 0, newBlock);
    onChange(next);

    // Focus the new block after render
    setTimeout(() => {
      const el = textareaRefs.current.get(newBlock.id);
      if (el) {
        el.focus();
        el.setSelectionRange(0, 0);
        autoResize(newBlock.id);
      }
      setActiveBlockId(newBlock.id);
    }, 20);
  };

  // Delete a block
  const deleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      // Don't delete last remaining block, just clear it
      updateBlock(blocks[0].id, {
        type: mode === "poetry" ? "poetry-stanza" : "paragraph",
        content: "",
        meta: undefined,
      });
      return;
    }

    const prevBlock = blocks[index - 1] || blocks[index + 1];
    const next = blocks.filter((_, i) => i !== index);
    onChange(next);

    if (prevBlock) {
      setTimeout(() => {
        const el = textareaRefs.current.get(prevBlock.id);
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
        setActiveBlockId(prevBlock.id);
      }, 20);
    }
  };

  // Move block up or down
  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  // Handle Slash Command Selection
  const handleSlashSelect = (type: BlockType, blockIndex: number) => {
    const block = blocks[blockIndex];
    if (!block) return;

    // Remove the slash prefix text from content
    const cleanedContent = block.content.replace(/^\/.*$/, "").trim();

    updateBlock(block.id, {
      type,
      content: cleanedContent,
      meta: type === "image" ? { url: "", caption: "", alt: "" } : undefined,
    });

    setSlashMenuBlockId(null);
    setSlashFilter("");

    setTimeout(() => {
      const el = textareaRefs.current.get(block.id);
      if (el) {
        el.focus();
        autoResize(block.id);
      }
    }, 20);
  };

  // Keydown handling for blocks
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    block: StudioBlock,
    index: number
  ) => {
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;

    // When slash menu is open for this block, slash menu handles its own keys
    if (slashMenuBlockId === block.id) {
      if (e.key === "Escape") {
        setSlashMenuBlockId(null);
        setSlashFilter("");
        return;
      }
    }

    // 1. Enter key handling
    if (e.key === "Enter") {
      // Poetry mode stanza handling:
      // In poetry, Enter inserts a line break.
      // Shift+Enter creates a new stanza block below.
      if (mode === "poetry" || block.type === "poetry-stanza") {
        if (e.shiftKey) {
          e.preventDefault();
          const textBefore = value.substring(0, selectionStart);
          const textAfter = value.substring(selectionEnd);
          updateBlock(block.id, { content: textBefore });
          addBlockAfter(index, "poetry-stanza", textAfter);
          return;
        }
        // Normal Enter continues newline in same stanza
        return;
      }

      // In lists:
      if (block.type === "bullet-list" || block.type === "numbered-list") {
        if (!e.shiftKey) {
          // If current line is empty, exit list into paragraph
          const currentLines = value.split("\n");
          if (currentLines[currentLines.length - 1]?.trim() === "") {
            e.preventDefault();
            const cleaned = currentLines.slice(0, -1).join("\n");
            updateBlock(block.id, { content: cleaned });
            addBlockAfter(index, "paragraph", "");
            return;
          }
          // Otherwise allow regular newline within list
          return;
        }
      }

      // In regular paragraph / headings / quote:
      // If Shift+Enter, allow newline within block
      if (!e.shiftKey && (block.type === "paragraph" || block.type === "heading2" || block.type === "heading3" || block.type === "blockquote")) {
        e.preventDefault();
        const textBefore = value.substring(0, selectionStart);
        const textAfter = value.substring(selectionEnd);

        updateBlock(block.id, { content: textBefore });
        addBlockAfter(index, "paragraph", textAfter);
        return;
      }
    }

    // 2. Backspace on empty block: delete block and move to previous
    if (e.key === "Backspace" && selectionStart === 0 && selectionEnd === 0) {
      if (value.length === 0 && blocks.length > 1) {
        e.preventDefault();
        deleteBlock(index);
        return;
      }
    }

    // 3. Arrow Up / Down navigation between blocks
    if (e.key === "ArrowUp" && selectionStart === 0 && selectionEnd === 0 && index > 0) {
      e.preventDefault();
      const prev = blocks[index - 1];
      const prevEl = textareaRefs.current.get(prev.id);
      if (prevEl) {
        prevEl.focus();
        const len = prevEl.value.length;
        prevEl.setSelectionRange(len, len);
      }
      return;
    }

    if (e.key === "ArrowDown" && selectionStart === value.length && selectionEnd === value.length && index < blocks.length - 1) {
      e.preventDefault();
      const next = blocks[index + 1];
      const nextEl = textareaRefs.current.get(next.id);
      if (nextEl) {
        nextEl.focus();
        nextEl.setSelectionRange(0, 0);
      }
      return;
    }
  };

  // Text change & Markdown shortcut detection
  const handleContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    block: StudioBlock,
    index: number
  ) => {
    const val = e.target.value;

    // Check Markdown shortcuts only if not currently in poetry mode
    if (mode !== "poetry") {
      // 1. Heading 2 shortcut: "## "
      if (val.startsWith("## ") && block.type !== "heading2") {
        updateBlock(block.id, {
          type: "heading2",
          content: val.replace(/^##\s+/, ""),
        });
        return;
      }

      // 2. Heading 3 shortcut: "### "
      if (val.startsWith("### ") && block.type !== "heading3") {
        updateBlock(block.id, {
          type: "heading3",
          content: val.replace(/^###\s+/, ""),
        });
        return;
      }

      // 3. Blockquote shortcut: "> "
      if (val.startsWith("> ") && block.type !== "blockquote") {
        updateBlock(block.id, {
          type: "blockquote",
          content: val.replace(/^>\s+/, ""),
        });
        return;
      }

      // 4. Bullet list shortcut: "- " or "* "
      if ((val.startsWith("- ") || val.startsWith("* ")) && block.type !== "bullet-list") {
        updateBlock(block.id, {
          type: "bullet-list",
          content: val.replace(/^[-*]\s+/, ""),
        });
        return;
      }

      // 5. Numbered list shortcut: "1. "
      if (val.startsWith("1. ") && block.type !== "numbered-list") {
        updateBlock(block.id, {
          type: "numbered-list",
          content: val.replace(/^1\.\s+/, ""),
        });
        return;
      }

      // 6. Divider shortcut: "---"
      if (val.trim() === "---") {
        updateBlock(block.id, {
          type: "divider",
          content: "---",
        });
        addBlockAfter(index, "paragraph", "");
        return;
      }
    }

    // Check for Slash command trigger
    if (val.startsWith("/")) {
      setSlashMenuBlockId(block.id);
      setSlashFilter(val.substring(1));
    } else if (slashMenuBlockId === block.id) {
      setSlashMenuBlockId(null);
      setSlashFilter("");
    }

    updateBlock(block.id, { content: val });
    autoResize(block.id);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 font-serif pb-24">
      {blocks.map((block, index) => {
        const isActive = activeBlockId === block.id;

        // Custom render for Divider
        if (block.type === "divider") {
          return (
            <div 
              key={block.id} 
              className="group relative py-6 flex items-center justify-center cursor-pointer"
              onClick={() => setActiveBlockId(block.id)}
            >
              <div className="w-24 border-b border-neutral-300 dark:border-neutral-700" />
              <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => deleteBlock(index)}
                  className="p-1 text-rose-500 hover:text-rose-600 transition-colors"
                  title="Remove divider"
                  aria-label="Remove divider"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }

        // Custom render for Image
        if (block.type === "image") {
          return (
            <div key={block.id} className="relative">
              <ImageBlock
                block={block}
                onChange={(updates) => updateBlock(block.id, updates)}
                onDelete={() => deleteBlock(index)}
              />
            </div>
          );
        }

        // Block Styling based on type
        let blockStyles = "w-full bg-transparent resize-none focus:outline-none transition-colors ";
        let placeholder = "Type '/' for commands or start writing...";

        if (block.type === "heading2") {
          blockStyles += "font-serif text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight";
          placeholder = "Heading 2";
        } else if (block.type === "heading3") {
          blockStyles += "font-serif text-xl md:text-2xl font-semibold text-neutral-800 dark:text-neutral-200 leading-snug";
          placeholder = "Heading 3";
        } else if (block.type === "blockquote") {
          blockStyles += "font-serif italic text-lg md:text-xl text-neutral-700 dark:text-neutral-300 pl-4 border-l-2 border-neutral-400 dark:border-neutral-600 py-1";
          placeholder = "Quote or observation statement...";
        } else if (block.type === "callout") {
          blockStyles += "font-sans text-sm md:text-base text-neutral-800 dark:text-neutral-200 pl-4 py-2 bg-neutral-50/80 dark:bg-neutral-900/50 rounded-r border-l-4 border-emerald-600 dark:border-emerald-500";
          placeholder = "Field note observation details...";
        } else if (block.type === "bullet-list" || block.type === "numbered-list") {
          blockStyles += "font-serif text-lg leading-relaxed text-neutral-800 dark:text-neutral-200 pl-4";
          placeholder = "List items (one per line)...";
        } else if (mode === "poetry" || block.type === "poetry-stanza") {
          // Poetry stanza: Cormorant Garamond, generous line-height, quiet elegance
          blockStyles += "font-serif text-xl md:text-2xl leading-[2.1] text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap tracking-wide";
          placeholder = `Stanza ${index + 1} (Enter for line, Shift+Enter for new stanza)...`;
        } else {
          // Standard Paragraph
          blockStyles += "font-serif text-lg md:text-xl leading-relaxed text-neutral-800 dark:text-neutral-200";
        }

        return (
          <div
            key={block.id}
            className={`group relative flex items-start transition-all ${
              isActive ? "opacity-100" : "opacity-95 hover:opacity-100"
            }`}
          >
            {/* Left margin controls: Add block, Move, Delete */}
            <div className="absolute -left-10 top-1.5 hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => addBlockAfter(index)}
                aria-label="Add block below"
                title="Add block below"
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {blocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteBlock(index)}
                  aria-label="Delete block"
                  title="Delete block"
                  className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Main Text Input Area */}
            <div className="flex-1 min-w-0 relative">
              {/* Poetry Stanza Badge indicator */}
              {(mode === "poetry" || block.type === "poetry-stanza") && (
                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1 select-none flex items-center gap-1">
                  <Feather className="w-2.5 h-2.5" />
                  <span>Stanza {index + 1}</span>
                </div>
              )}

              {/* Callout observation badge */}
              {block.type === "callout" && (
                <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1 select-none font-semibold">
                  Field Observation Note
                </div>
              )}

              <textarea
                ref={(el) => {
                  if (el) {
                    textareaRefs.current.set(block.id, el);
                    autoResize(block.id);
                  } else {
                    textareaRefs.current.delete(block.id);
                  }
                }}
                rows={1}
                value={block.content}
                placeholder={placeholder}
                readOnly={readOnly}
                spellCheck={false}
                onFocus={() => setActiveBlockId(block.id)}
                onBlur={() => {
                  // Delay closing to allow clicking menu options
                  setTimeout(() => {
                    if (activeBlockId === block.id) {
                      setActiveBlockId(null);
                    }
                  }, 150);
                }}
                onChange={(e) => handleContentChange(e, block, index)}
                onKeyDown={(e) => handleKeyDown(e, block, index)}
                className={blockStyles}
              />

              {/* Slash Command floating menu */}
              {slashMenuBlockId === block.id && (
                <SlashCommandMenu
                  filterText={slashFilter}
                  onSelect={(type) => handleSlashSelect(type, index)}
                  onClose={() => {
                    setSlashMenuBlockId(null);
                    setSlashFilter("");
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Trailing click-to-add action */}
      <div className="pt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={() => addBlockAfter(blocks.length - 1)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-serif text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{mode === "poetry" ? "Add Stanza" : "Add Section"}</span>
        </button>
      </div>
    </div>
  );
}
