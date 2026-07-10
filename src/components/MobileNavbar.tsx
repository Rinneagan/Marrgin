"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, PenTool, BookMarked, Bell, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    ...(isAdmin ? [{ name: "Write", href: "/write", icon: PenTool }] : []),
    { name: "Collections", href: "/collections", icon: BookMarked },
    { name: "Notifications", href: "/notifications", icon: Bell },
    ...(user ? [{ name: "Profile", href: "/profile", icon: User }] : []),
    { name: "About", href: "/about", icon: BookMarked },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    setIsOpen(false);
    router.push("/");
  };

    useEffect(() => {
      if (isOpen) {
        document.body.classList.add('drawer-open');
      } else {
        document.body.classList.remove('drawer-open');
      }
      return () => document.body.classList.remove('drawer-open');
    }, [isOpen]);

    return (
      <>
        {/* Mobile Sticky Header */}
        <div className="md:hidden sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-wide">
            Marrgin
          </Link>
          <button onClick={() => setIsOpen(true)} className="p-2 -mr-2">
            <Menu size={28} className="text-gray-800 dark:text-gray-200" />
          </button>
        </div>
  
        {/* Slide-out Drawer */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-background border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col p-8 md:hidden shadow-2xl"
              >
              <div className="flex justify-between items-center mb-12">
                <Link href="/" onClick={() => setIsOpen(false)} className="font-serif text-2xl tracking-wide">
                  MARRGIN
                </Link>
                <button onClick={() => setIsOpen(false)} className="p-2 -mr-2">
                  <X size={28} className="text-gray-800 dark:text-gray-200" />
                </button>
              </div>

              <nav className="flex flex-col gap-6 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 text-xl text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors relative"
                  >
                    <div className="relative">
                      <item.icon strokeWidth={1.5} size={28} />
                      {item.name === "Notifications" && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background dark:border-dark"></span>
                      )}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}

                {user && (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-4 text-xl text-red-500 hover:text-red-600 transition-colors mt-8 pt-8 border-t border-gray-100 dark:border-gray-800"
                  >
                    <LogOut strokeWidth={1.5} size={28} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                )}
              </nav>

              {!user ? (
                <div className="mt-auto flex flex-col gap-4 pt-8">
                  <Link href="/login" onClick={() => setIsOpen(false)} className="text-center font-medium hover:text-accent transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)} className="bg-accent text-white rounded-full py-4 text-center text-lg hover:bg-accent/90 transition-colors shadow-sm">
                    Join Waitlist
                  </Link>
                </div>
              ) : isAdmin ? (
                <div className="mt-auto pt-8">
                  <Link href="/write" onClick={() => setIsOpen(false)} className="block w-full bg-accent text-white rounded-full py-4 text-center text-lg hover:bg-accent/90 transition-colors shadow-sm">
                    Write a Poem
                  </Link>
                </div>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
