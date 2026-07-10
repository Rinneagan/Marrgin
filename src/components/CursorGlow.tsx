"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Motion values for exact mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the movement using a spring
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
    };
  }, [mouseX, mouseY, isVisible]);

  // Don't render on mobile devices where hovering doesn't make sense
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 w-[40vw] h-[40vw] min-w-[400px] min-h-[400px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-40 z-50"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: "-50%",
        translateY: "-50%",
        // Ultra-premium Antigravity orb styling: huge blur + multi-color gradient
        background: "conic-gradient(from 0deg, #7877c6, #ff7170, #7877c6)",
        filter: "blur(120px)",
      }}
      animate={{
        rotate: 360,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
        opacity: { duration: 0.8 },
      }}
    />
  );
}
