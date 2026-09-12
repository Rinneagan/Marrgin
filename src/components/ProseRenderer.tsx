import React from "react";

interface ProseRendererProps {
  content: string;
  isReadInDark?: boolean;
  onParagraphClick?: (index: number, text: string) => void;
  echoedParagraphs?: number[];
  mode?: string;
}

export default function ProseRenderer({
  content,
  isReadInDark = false,
  onParagraphClick,
  echoedParagraphs = [],
  mode = "essay",
}: ProseRendererProps) {
  // Normalize Windows line breaks and split into paragraphs
  const rawParagraphs = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  return (
    <div
      className={`prose-container max-w-[720px] mx-auto transition-colors duration-700 ${
        isReadInDark ? "bg-black p-6 md:p-10 rounded-3xl text-gray-300" : ""
      }`}
    >
      {rawParagraphs.map((para, idx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        const hasEcho = echoedParagraphs.includes(idx);

        // Heading 3
        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s+/, "");
          return (
            <h3
              key={idx}
              className="font-serif text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-10 mb-4 tracking-tight"
            >
              {headingText}
            </h3>
          );
        }

        // Heading 2
        if (trimmed.startsWith("## ")) {
          const headingText = trimmed.replace(/^##\s+/, "");
          return (
            <h2
              key={idx}
              className="font-serif text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mt-14 mb-5 tracking-tight border-b border-gray-100 dark:border-gray-900 pb-2"
            >
              {headingText}
            </h2>
          );
        }

        // Pull Quote / Blockquote
        if (trimmed.startsWith("> ")) {
          const quoteText = trimmed.replace(/^>\s+/, "");
          return (
            <blockquote
              key={idx}
              onClick={() => onParagraphClick?.(idx, quoteText)}
              className="my-10 pl-6 border-l-2 border-accent text-xl md:text-2xl font-serif italic text-gray-800 dark:text-gray-200 leading-relaxed cursor-pointer relative group hover:text-accent transition-colors"
            >
              {hasEcho && (
                <div
                  className="absolute -left-[5px] top-3 w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(var(--accent),0.8)]"
                  title="Paragraph has echoes"
                />
              )}
              {quoteText}
            </blockquote>
          );
        }

        // Markdown Image with caption: ![caption](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const caption = imgMatch[1];
          const src = imgMatch[2];
          return (
            <figure key={idx} className="my-10">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={caption || "Article photograph"} className="w-full h-auto object-cover max-h-[550px]" />
              </div>
              {caption && (
                <figcaption className="text-center font-sans text-xs text-gray-500 dark:text-gray-400 mt-2.5 italic">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // Standard Long-form Prose Paragraph
        return (
          <p
            key={idx}
            onClick={() => onParagraphClick?.(idx, trimmed)}
            className={`font-serif text-lg md:text-[21px] leading-[2.1] tracking-normal mb-8 relative transition-colors duration-300 ${
              isReadInDark
                ? "text-gray-300"
                : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {hasEcho && (
              <span
                className="absolute -left-6 top-3 w-2 h-2 rounded-full bg-accent/70 shadow-[0_0_8px_rgba(var(--accent),0.8)] animate-pulse"
                title="This paragraph has echoes"
              />
            )}
            <span>
              {trimmed}
            </span>
          </p>
        );
      })}
    </div>
  );
}
