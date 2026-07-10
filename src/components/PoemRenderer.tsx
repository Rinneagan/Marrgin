import React, { useState } from "react";

interface PoemRendererProps {
  content: string;
  aesthetic?: string;
  isReadInDark?: boolean;
  hoveredLineIndex?: number | null;
  onHoverLine?: (index: number | null) => void;
  echoedLines?: number[];
  onLineClick?: (index: number) => void;
  revisionDraft?: number;
}

const emotionalTypography = (word: string) => {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  
  if (lower === "heavy") {
    return <span className="font-black translate-y-1 inline-block drop-shadow-md">{word}</span>;
  }
  if (lower === "float") {
    return <span className="font-light -translate-y-1 inline-block opacity-80">{word}</span>;
  }
  if (lower === "shatter" || lower === "shattered") {
    return <span className="tracking-[0.5em] italic inline-block">{word}</span>;
  }
  if (lower === "drift") {
    return <span className="tracking-widest inline-block text-white/50">{word}</span>;
  }
  
  return word;
};

// Render text and apply emotion typography
const renderTextLine = (line: string) => {
  return line.split(/(\s+)/).map((word, i) => (
    <React.Fragment key={i}>
      {emotionalTypography(word)}
    </React.Fragment>
  ));
};

export default function PoemRenderer({ 
  content, 
  aesthetic = "default", 
  isReadInDark = false, 
  hoveredLineIndex = null, 
  onHoverLine,
  echoedLines = [],
  onLineClick,
  revisionDraft = 100
}: PoemRendererProps) {
  const blocks = content.split(/(<fold>[\s\S]*?<\/fold>)/g);
  
  let globalLineIndex = 0;

  const renderObscuredLine = (line: string, index: number) => {
    if (revisionDraft === 100) return line;
    
    const seed = index * 100 + revisionDraft;
    const words = line.split(" ");
    
    return words.map((word, i) => {
      const random = Math.sin(seed + i) * 10000;
      const isVisible = (random - Math.floor(random)) < (revisionDraft / 100);
      return isVisible ? word : "█".repeat(word.length);
    }).join(" ");
  };

  const renderBlock = (block: string, blockIndex: number) => {
    if (block.startsWith("<fold>") && block.endsWith("</fold>")) {
      const innerText = block.substring(6, block.length - 7).trim();
      return <FoldedBlock key={`block-${blockIndex}`} text={innerText} revisionDraft={revisionDraft} />;
    }

    const lines = block.split('\n');
    return lines.map((line, idx) => {
      const currentIdx = globalLineIndex++;
      
      if (line === "" && (idx === 0 || idx === lines.length - 1) && lines.length > 1) {
        return null;
      }

      const hasEcho = echoedLines.includes(currentIdx);
      const obscuredLine = renderObscuredLine(line, currentIdx);

      return (
        <div 
          key={`line-${currentIdx}`}
          onMouseEnter={() => onHoverLine?.(currentIdx)}
          onClick={() => onLineClick?.(currentIdx)}
          className={`relative transition-all duration-700 cursor-pointer ${
            isReadInDark 
              ? hoveredLineIndex === currentIdx 
                ? "text-white text-shadow-glow" 
                : "text-[#111] hover:text-white" 
              : "hover:text-accent"
          }`}
        >
          {hasEcho && !isReadInDark && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent/50 shadow-[0_0_8px_rgba(var(--accent),0.8)] animate-pulse" title="This line has echoes" />
          )}
          {hasEcho && isReadInDark && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" title="This line has echoes" />
          )}
          
          {obscuredLine ? renderTextLine(obscuredLine) : <br/>}
        </div>
      );
    });
  };

  return (
    <div className={`
      ${aesthetic === 'typewriter' ? "font-mono text-xl md:text-2xl tracking-tight leading-[2.5]" : ""}
      ${aesthetic === 'brutalist' ? "font-sans font-black uppercase text-3xl md:text-5xl lg:text-7xl tracking-tighter leading-[1.1]" : ""}
      ${!aesthetic || aesthetic === 'default' ? "font-poem text-2xl md:text-3xl lg:text-4xl text-center leading-[2.5] tracking-wide" : ""}
      transition-colors duration-1000 
      ${isReadInDark ? "bg-black p-8 rounded-3xl" : "text-gray-800 dark:text-gray-200"}
    `}
    onMouseLeave={() => onHoverLine?.(null)}
    >
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

const FoldedBlock = ({ text, revisionDraft = 100 }: { text: string, revisionDraft?: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const obscureLine = (line: string, index: number) => {
    if (revisionDraft === 100) return line;
    const seed = index * 200 + revisionDraft;
    const words = line.split(" ");
    return words.map((word, i) => {
      const random = Math.sin(seed + i) * 10000;
      const isVisible = (random - Math.floor(random)) < (revisionDraft / 100);
      return isVisible ? word : "█".repeat(word.length);
    }).join(" ");
  };

  return (
    <div 
      className="my-8 py-4 border-l-2 border-dashed border-gray-300 dark:border-gray-700 pl-6 cursor-pointer relative group transition-all duration-700"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-300 dark:bg-gray-700 rounded-full group-hover:bg-accent transition-colors duration-500" />
      
      {!isOpen ? (
        <div className="text-gray-400 dark:text-gray-500 italic flex items-center gap-4">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-accent">Click to unfold</span>
          <span className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></span>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          {text.split('\n').map((line, idx) => (
            <div key={idx}>{line ? emotionalTypography(obscureLine(line, idx)) : <br/>}</div>
          ))}
        </div>
      )}
    </div>
  );
};
