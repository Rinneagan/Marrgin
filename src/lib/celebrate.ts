"use client";

import confetti from "canvas-confetti";

/**
 * Fires the celebratory confetti sequence reminiscent of the Common App submission moment:
 * Dual upward corner cannons + sustained cascading celebration across the screen.
 */
export function fireCelebratoryConfetti() {
  if (typeof window === "undefined") return;

  const duration = 3.2 * 1000;
  const animationEnd = Date.now() + duration;

  // 1. Initial burst from bottom-left and bottom-right corners
  confetti({
    particleCount: 90,
    angle: 60,
    spread: 75,
    origin: { x: 0.02, y: 0.85 },
    colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff", "#10b981", "#6366f1", "#ec4899", "#e11d48"],
    zIndex: 99999,
  });

  confetti({
    particleCount: 90,
    angle: 120,
    spread: 75,
    origin: { x: 0.98, y: 0.85 },
    colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff", "#10b981", "#6366f1", "#ec4899", "#e11d48"],
    zIndex: 99999,
  });

  // Center celebratory pop
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#f59e0b", "#fbbf24", "#ffd700", "#ffffff", "#10b981"],
      zIndex: 99999,
    });
  }, 300);

  // 2. Sustained celebratory cascade
  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 35 * (timeLeft / duration);

    // Left cannon
    confetti({
      particleCount: Math.floor(particleCount),
      angle: 60,
      spread: 60,
      origin: { x: 0.05, y: 0.8 },
      colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff", "#10b981", "#ec4899", "#3b82f6"],
      zIndex: 99999,
    });

    // Right cannon
    confetti({
      particleCount: Math.floor(particleCount),
      angle: 120,
      spread: 60,
      origin: { x: 0.95, y: 0.8 },
      colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff", "#10b981", "#ec4899", "#3b82f6"],
      zIndex: 99999,
    });
  }, 250);
}
