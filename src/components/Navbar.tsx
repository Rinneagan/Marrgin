"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="absolute w-full top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 h-20 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-wide">
          Marrgin
        </Link>
        <div className="flex items-center gap-6">
          
          {!loading && (
            user ? (
              <Link href="/home" className="border border-accent text-accent px-4 py-2 rounded-full hover:bg-accent hover:text-white transition-colors">
                Go to App
              </Link>
            ) : (
              <Link href="/login" className="border border-accent text-accent px-4 py-2 rounded-full hover:bg-accent hover:text-white transition-colors">
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
