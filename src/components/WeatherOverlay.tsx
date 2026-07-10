"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface WeatherOverlayProps {
  weather: string;
}

export default function WeatherOverlay({ weather }: WeatherOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || weather === "none" || !weather) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden mix-blend-overlay">
      {weather === "rain" && (
        <div className="absolute -top-[100%] left-0 w-full h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzIiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI1MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSIvPjwvc3ZnPg==')] animate-[rain_0.5s_linear_infinite]" />
      )}
      {weather === "snow" && (
        <div className="absolute -top-[100%] left-0 w-full h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSIyIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiLz48L3N2Zz4=')] animate-[snow_10s_linear_infinite]" />
      )}
      {weather === "storm" && (
        <>
          <div className="absolute -top-[100%] left-0 w-full h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzIiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI1MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjQpIi8+PC9zdmc+')] animate-[rain_0.2s_linear_infinite] opacity-80" />
          <motion.div 
            className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0, 0.8, 0, 0, 0.5, 0] }}
            transition={{ duration: 7, repeat: Infinity, times: [0, 0.85, 0.88, 0.9, 0.95, 0.98, 1] }}
          />
        </>
      )}
    </div>
  );
}
