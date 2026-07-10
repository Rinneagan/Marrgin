"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useZenMode } from "@/context/ZenContext";

export default function ParticleRing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ambientColor } = useZenMode();
  
  // Use a ref to ensure the animation loop always has the latest color
  // without needing to restart the loop
  const colorRef = useRef<string>("120, 119, 198");
  
  useEffect(() => {
    if (ambientColor) {
      colorRef.current = ambientColor;
    } else {
      colorRef.current = "120, 119, 198"; // Default slate-purple
    }
  }, [ambientColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let startTime = performance.now();
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;
    
    // The center of the entire ring system
    let ringX = currentX;
    let ringY = currentY;

    // Handle high DPI displays
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = e.touches[0].clientX;
        targetY = e.touches[0].clientY;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchstart", handleTouchMove);

    const animate = (time: number) => {
      // Smooth out mouse movement to make it feel like viscous fluid
      currentX += (targetX - currentX) * 0.008;
      currentY += (targetY - currentY) * 0.008;
      
      // Have the entire ring slowly drift towards the mouse
      ringX += (currentX - ringX) * 0.01;
      ringY += (currentY - ringY) * 0.01;

      const elapsed = time - startTime;
      const cx = ringX;
      const cy = ringY;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const rows = 25;
      const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.45;
      const rowSpacing = maxRadius / rows;
      const particlesPerRow = 80;
      const particleSize = 2;

      for (let r = 1; r <= rows; r++) {
        const radius = r * rowSpacing;
        const currentParticles = Math.max(10, Math.floor(particlesPerRow * (r / rows) * 1.5));
        const angleStep = (Math.PI * 2) / currentParticles;

        for (let p = 0; p < currentParticles; p++) {
          const baseAngle = p * angleStep + (r * 0.1);
          const timeSlow = elapsed * 0.001;
          
          // Jellyfish tentacle undulation
          // The wave amplitude increases for outer rows (tentacle ends)
          const wave1 = Math.sin(baseAngle * 6 - timeSlow * 1.5) * (r * 1.2);
          const wave2 = Math.cos(baseAngle * 3 + timeSlow * 0.8) * (r * 1.8);
          const dynamicRadius = radius + wave1 + wave2;

          let px = cx + Math.cos(baseAngle) * dynamicRadius;
          let py = cy + Math.sin(baseAngle) * dynamicRadius;

          const dx = px - currentX;
          const dy = py - currentY;
          const distanceToCursor = Math.sqrt(dx * dx + dy * dy);

          // Massive radius for gentle water-like displacement
          const magneticRadius = 800;
          if (distanceToCursor < magneticRadius) {
            const normalizedDist = 1 - (distanceToCursor / magneticRadius);
            // Smoothstep function for perfect fluid curves (3x^2 - 2x^3)
            const smooth = normalizedDist * normalizedDist * (3 - 2 * normalizedDist);
            const pullForce = smooth * 150; 
            const angleToCursor = Math.atan2(dy, dx);
            px -= Math.cos(angleToCursor) * pullForce;
            py -= Math.sin(angleToCursor) * pullForce;
          }

          const phase = (r * 0.5) + (p * 0.2) + (Math.sin(px * 0.01) + Math.cos(py * 0.01));
          const shimmer = (Math.sin(timeSlow + phase) + 1) / 2;
          const alpha = 0.1 + (shimmer * 0.9);

          ctx.fillStyle = `rgba(${colorRef.current}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, particleSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchstart", handleTouchMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="pointer-events-none fixed top-0 left-0 w-screen h-screen z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  );
}
