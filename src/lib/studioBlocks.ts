import { EditorialMode } from "./db";

export type BlockType = 
  | "paragraph" 
  | "heading2" 
  | "heading3" 
  | "blockquote" 
  | "poetry-stanza" 
  | "bullet-list" 
  | "numbered-list" 
  | "divider" 
  | "image" 
  | "callout";

export interface StudioBlock {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    caption?: string;
    alt?: string;
    url?: string;
    attribution?: string;
  };
}

export function generateBlockId(): string {
  return "blk_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
}

/**
 * Parses raw text/markdown into an array of structured StudioBlocks.
 * Strictly preserves poetry stanzas and line-breaks.
 */
export function parseContentToBlocks(rawContent: string, mode: EditorialMode): StudioBlock[] {
  if (!rawContent || !rawContent.trim()) {
    return [
      {
        id: generateBlockId(),
        type: mode === "poetry" ? "poetry-stanza" : "paragraph",
        content: "",
      },
    ];
  }

  // Normalize CRLF to LF
  const normalized = rawContent.replace(/\r\n/g, "\n");

  // In poetry mode, split on 2 or more newlines to preserve individual stanzas
  if (mode === "poetry") {
    const rawStanzas = normalized.split(/\n\s*\n/);
    const blocks: StudioBlock[] = [];

    for (const raw of rawStanzas) {
      // Preserve intentional leading/trailing single linebreaks within the stanza
      const trimmedStanza = raw.replace(/^\n+|\n+$/g, "");
      if (trimmedStanza.length > 0) {
        blocks.push({
          id: generateBlockId(),
          type: "poetry-stanza",
          content: trimmedStanza,
        });
      }
    }

    if (blocks.length === 0) {
      blocks.push({
        id: generateBlockId(),
        type: "poetry-stanza",
        content: "",
      });
    }

    return blocks;
  }

  // Non-poetry modes (Essay, Investigation, Field Note, Data Story)
  const rawSections = normalized.split(/\n\s*\n/);
  const blocks: StudioBlock[] = [];

  for (const section of rawSections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // 1. Heading 3
    if (trimmed.startsWith("### ")) {
      blocks.push({
        id: generateBlockId(),
        type: "heading3",
        content: trimmed.replace(/^###\s+/, ""),
      });
      continue;
    }

    // 2. Heading 2
    if (trimmed.startsWith("## ")) {
      blocks.push({
        id: generateBlockId(),
        type: "heading2",
        content: trimmed.replace(/^##\s+/, ""),
      });
      continue;
    }

    // 3. Blockquote
    if (trimmed.startsWith("> ")) {
      // Check if it's an observation callout
      if (trimmed.startsWith("> 📋") || trimmed.startsWith("> **Observation:**") || trimmed.startsWith("> [Observation]")) {
        const cleanCallout = trimmed.replace(/^>\s*(📋\s*)?(\*\*Observation:\*\*|\[Observation\])?\s*/i, "");
        blocks.push({
          id: generateBlockId(),
          type: "callout",
          content: cleanCallout,
        });
        continue;
      }

      // Standard quote: clean leading > from all lines if multi-line quote
      const quoteLines = trimmed.split("\n").map(l => l.replace(/^>\s?/, "")).join("\n");
      blocks.push({
        id: generateBlockId(),
        type: "blockquote",
        content: quoteLines,
      });
      continue;
    }

    // 4. Divider
    if (trimmed === "---" || trimmed === "***" || trimmed === "* * *") {
      blocks.push({
        id: generateBlockId(),
        type: "divider",
        content: "---",
      });
      continue;
    }

    // 5. Image: ![caption](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const caption = imgMatch[1];
      const url = imgMatch[2];
      blocks.push({
        id: generateBlockId(),
        type: "image",
        content: url,
        meta: {
          caption,
          url,
          alt: caption || "Article image",
        },
      });
      continue;
    }

    // 6. Bullet List: lines starting with - or *
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listLines = trimmed.split("\n").map(l => l.replace(/^[-*]\s+/, "")).join("\n");
      blocks.push({
        id: generateBlockId(),
        type: "bullet-list",
        content: listLines,
      });
      continue;
    }

    // 7. Numbered List: lines starting with 1.
    if (/^\d+\.\s+/.test(trimmed)) {
      const listLines = trimmed.split("\n").map(l => l.replace(/^\d+\.\s+/, "")).join("\n");
      blocks.push({
        id: generateBlockId(),
        type: "numbered-list",
        content: listLines,
      });
      continue;
    }

    // 8. Standard Prose Paragraph
    blocks.push({
      id: generateBlockId(),
      type: "paragraph",
      content: section, // keep internal single line breaks intact
    });
  }

  if (blocks.length === 0) {
    blocks.push({
      id: generateBlockId(),
      type: "paragraph",
      content: "",
    });
  }

  return blocks;
}

/**
 * Serializes an array of StudioBlocks back into clean Markdown/text.
 * Guarantees 100% fidelity with PoemRenderer and ProseRenderer.
 */
export function serializeBlocksToContent(blocks: StudioBlock[], mode: EditorialMode): string {
  if (!blocks || blocks.length === 0) {
    return "";
  }

  if (mode === "poetry") {
    return blocks
      .map(b => b.content)
      .join("\n\n");
  }

  const sections: string[] = [];

  for (const block of blocks) {
    const trimmed = block.content.trim();

    switch (block.type) {
      case "heading2":
        if (trimmed) sections.push(`## ${trimmed}`);
        break;

      case "heading3":
        if (trimmed) sections.push(`### ${trimmed}`);
        break;

      case "blockquote":
        if (trimmed) {
          const quotedLines = trimmed.split("\n").map(l => `> ${l}`).join("\n");
          sections.push(quotedLines);
        }
        break;

      case "callout":
        if (trimmed) {
          sections.push(`> 📋 **Observation:** ${trimmed}`);
        }
        break;

      case "divider":
        sections.push("---");
        break;

      case "image":
        const imgUrl = block.meta?.url || block.content.trim();
        if (imgUrl) {
          const caption = block.meta?.caption || "";
          sections.push(`![${caption}](${imgUrl})`);
        }
        break;

      case "bullet-list":
        if (trimmed) {
          const formattedList = trimmed
            .split("\n")
            .filter(l => l.trim().length > 0)
            .map(l => `- ${l.trim()}`)
            .join("\n");
          if (formattedList) sections.push(formattedList);
        }
        break;

      case "numbered-list":
        if (trimmed) {
          const formattedNumbered = trimmed
            .split("\n")
            .filter(l => l.trim().length > 0)
            .map((l, i) => `${i + 1}. ${l.trim()}`)
            .join("\n");
          if (formattedNumbered) sections.push(formattedNumbered);
        }
        break;

      case "poetry-stanza":
      case "paragraph":
      default:
        if (block.content.trim()) {
          sections.push(block.content);
        }
        break;
    }
  }

  return sections.join("\n\n");
}
