"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="absolute w-full top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-wider text-neutral-900 dark:text-neutral-100 hover:text-amber-900 dark:hover:text-amber-400 transition-colors">
          MARRGIN
        </Link>

        {/* Editorial Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-sans tracking-wide text-neutral-600 dark:text-neutral-300">
          <Link href="/explore?mode=writing" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Writing
          </Link>
          <Link href="/explore?mode=investigation" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Investigations
          </Link>
          <Link href="/beyond-the-rain" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Beyond the Rain
          </Link>
          <Link href="/explore?mode=field-note" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Field Notes
          </Link>
          <Link href="/explore?mode=data-story" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Data Stories
          </Link>
          <Link href="/explore" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Explore
          </Link>
        </div>

        {/* Auth / App Entry */}
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <Link 
                href="/home" 
                className="text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm"
              >
                Go to Feed
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/home" 
                  className="text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-4 py-2 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm"
                >
                  Enter
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
