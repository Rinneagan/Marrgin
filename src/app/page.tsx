"use client";

import Navbar from "@/components/Navbar";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { trackUniqueVisit, createAdminNotification } from "@/lib/db";

const cardVariants: any = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 }
};

const categories = ["Love", "Life", "Death", "Hope", "Nature", "Dreams", "Faith", "Grief", "Friendship", "Dark"];

const featuredPoems = [
  {
    id: "1",
    title: "The Road Not Taken",
    author: "Robert Frost",
    preview: "Two roads diverged in a yellow wood, And sorry I could not travel both...",
    readTime: "5 min",
    tags: ["Nature", "Life"],
  },
  {
    id: "2",
    title: "Still I Rise",
    author: "Maya Angelou",
    preview: "You may write me down in history, With your bitter, twisted lies...",
    readTime: "4 min",
    tags: ["Hope", "Faith"],
  },
  {
    id: "3",
    title: "I Wandered Lonely as a Cloud",
    author: "William Wordsworth",
    preview: "I wandered lonely as a cloud That floats on high o'er vales and hills...",
    readTime: "3 min",
    tags: ["Nature", "Dreams"],
  },
];

const letterAnimation: any = {
  hidden: { opacity: 0, y: 50, rotateX: -90 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    transition: { type: "spring", damping: 20, stiffness: 100 }
  }
};

const quotes = [
  { text: "Poetry is what gets lost in translation.", author: "Robert Frost" },
  { text: "Poetry is when an emotion has found its thought and the thought has found words.", author: "Robert Frost" },
  { text: "If I read a book and it makes my whole body so cold no fire can warm me, I know that is poetry.", author: "Emily Dickinson" },
  { text: "Poetry is the clear expression of mixed feelings.", author: "W.H. Auden" },
  { text: "A poem begins as a lump in the throat, a sense of wrong, a homesickness, a lovesickness.", author: "Robert Frost" },
  { text: "Poetry is an echo, asking a shadow to dance.", author: "Carl Sandburg" },
  { text: "To be a poet is a condition, not a profession.", author: "Robert Graves" },
  { text: "Poetry is language at its most distilled and most powerful.", author: "Rita Dove" },
  { text: "Genuine poetry can communicate before it is understood.", author: "T.S. Eliot" },
  { text: "Poetry is the spontaneous overflow of powerful feelings.", author: "William Wordsworth" },
  { text: "Poetry is ordinary language raised to the Nth power.", author: "Paul Engle" },
  { text: "Painting is silent poetry, and poetry is painting that speaks.", author: "Plutarch" },
  { text: "Poetry is the journal of a sea animal living on land, wanting to fly in the air.", author: "Carl Sandburg" },
  { text: "A poet's work is to name the unnameable, to point at frauds, to take sides, start arguments, shape the world, and stop it from going to sleep.", author: "Salman Rushdie" },
  { text: "Poetry is just the evidence of life. If your life is burning well, poetry is just the ash.", author: "Leonard Cohen" },
  { text: "The poet is a liar who always speaks the truth.", author: "Jean Cocteau" },
  { text: "Poetry comes alive to me through recitation.", author: "Natalie Merchant" },
  { text: "Poetry is truth in its Sunday clothes.", author: "Philibert Joseph Roux" },
  { text: "You can find poetry in your everyday life, your memory, in what people say on the bus, in the news, or just what's in your heart.", author: "Carol Ann Duffy" },
  { text: "Poetry is a deal of joy and pain and wonder, with a dash of the dictionary.", author: "Khalil Gibran" },
];

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [randomQuote, setRandomQuote] = useState(quotes[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Track unique visit
    if (typeof window !== "undefined" && !sessionStorage.getItem("hasVisited")) {
      sessionStorage.setItem("hasVisited", "true");
      trackUniqueVisit();
      createAdminNotification("visit", "A new user visited the site");
    }

    // Pick a random quote after hydration to avoid SSR mismatch
    setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    
    // Dismiss loading screen after 3.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], [0, -400]);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background dark:bg-dark"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="max-w-4xl mx-auto text-center px-8 relative z-20"
            >
              <p className="font-poem text-4xl md:text-6xl lg:text-7xl italic text-black dark:text-white mb-8 leading-tight">
                "{randomQuote.text}"
              </p>
              <p className="text-xl text-secondary uppercase tracking-[0.3em]">— {randomQuote.author}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className={`min-h-screen relative overflow-hidden bg-background dark:bg-dark ${isLoading ? 'h-screen overflow-hidden' : ''}`}>
      {/* Background Watermark Parallax */}
      <motion.div 
        style={{ y: watermarkY }}
        className="fixed top-[20%] left-0 right-0 text-center pointer-events-none z-0"
      >
        <h1 className="text-[20vw] font-serif font-bold text-black/[0.02] dark:text-white/[0.02] whitespace-nowrap select-none">
          MARRGIN
        </h1>
      </motion.div>

      <Navbar />
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 lg:p-16 relative z-10">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-5xl text-center"
        >
          <motion.div 
            initial="hidden"
            animate={!isLoading ? "visible" : "hidden"}
            transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
            className="flex justify-center overflow-hidden mb-8 perspective-1000"
          >
            {/* Split "Marrgin" into letters for cinematic entrance */}
            {"Marrgin".split("").map((char, index) => (
              <motion.span 
                key={index} 
                variants={letterAnimation}
                className={`font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight ${char === " " ? "w-8" : ""}`}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={!isLoading ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-xl md:text-2xl text-secondary max-w-2xl mx-auto mb-12"
          >
            A quiet, elegant reading experience for poetry
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={!isLoading ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="flex gap-4 justify-center"
          >
            <Link href="/home" className="bg-accent text-white px-8 py-3 rounded-full hover:shadow-[0_0_20px_rgba(var(--accent),0.5)] transition-all">
              Start Reading
            </Link>
            <Link href="/home" className="border border-secondary px-8 py-3 rounded-full hover:border-black dark:hover:border-white transition-colors">
              Explore
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="px-8 lg:px-16 py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap gap-4 justify-center max-w-4xl mx-auto"
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-8 py-3 rounded-full text-sm hover:border-accent hover:text-accent transition-all shadow-sm"
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Featured Poems */}
      <section className="px-8 lg:px-16 py-32 relative z-10">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl mb-16 text-center"
        >
          Featured Works
        </motion.h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPoems.map((poem, i) => (
            <motion.div
              key={poem.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.2, duration: 0.8, ease: "easeOut" }}
              whileHover={{ y: -10 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all cursor-pointer group"
            >
              <h3 className="font-serif text-3xl mb-3 group-hover:text-accent transition-colors">{poem.title}</h3>
              <p className="text-secondary text-sm mb-6 uppercase tracking-widest">by {poem.author}</p>
              <p className="font-poem text-xl text-gray-600 dark:text-gray-400 mb-8 line-clamp-4 leading-relaxed">{poem.preview}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                  {poem.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-secondary font-medium tracking-widest">{poem.readTime}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
    </>
  );
}
