"use client";

import Link from "next/link";
import { useState } from "react";
import { Home, Compass, PenTool, BookMarked, Bell, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

export default function LeftSidebar() {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    ...(isAdmin ? [{ name: "Write", href: "/write", icon: PenTool }] : []),
    { name: "Collections", href: "/collections", icon: BookMarked },
    { name: "Notifications", href: "/notifications", icon: Bell },
    ...(user ? [{ name: "Profile", href: "/profile", icon: User }] : []),
    { name: "About", href: "/about", icon: BookMarked }, // Reuse icon or add Info
  ];

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <motion.aside 
      style={{ opacity }}
      animate={{ width: isCollapsed ? 100 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col p-8 sticky top-0 h-screen border-r border-gray-100 dark:border-gray-800 transition-opacity hover:!opacity-100 duration-300 relative"
    >
      <div className="mb-12 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
            >
              <Link href="/" className="font-serif text-2xl tracking-wide whitespace-nowrap">Marrgin</Link>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Link href="/" className="font-serif text-2xl tracking-wide">F.</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <nav className="flex flex-col gap-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            title={isCollapsed ? item.name : ""}
            className="flex items-center gap-4 text-xl text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors relative"
          >
            <div className="relative flex-shrink-0">
              <item.icon strokeWidth={1.5} size={28} />
              {item.name === "Notifications" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background dark:border-dark"></span>
              )}
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            )}
          </Link>
        ))}

        {user && (
          <button
            onClick={handleSignOut}
            title={isCollapsed ? "Sign Out" : ""}
            className="flex items-center gap-4 text-xl text-red-500 hover:text-red-600 transition-colors mt-auto pt-8 border-t border-gray-100 dark:border-gray-800"
          >
            <LogOut strokeWidth={1.5} size={28} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap">Sign Out</span>}
          </button>
        )}
      </nav>
      
      {!user ? (
        <div className="mt-auto flex flex-col gap-4">
          {!isCollapsed && (
            <Link href="/login" className="text-center font-medium hover:text-accent transition-colors">
              Sign In
            </Link>
          )}
          <Link href="/signup" className={`bg-accent text-white rounded-full ${isCollapsed ? 'py-3 px-0 flex justify-center' : 'py-4'} text-center text-lg hover:bg-accent/90 transition-colors shadow-sm`}>
            {isCollapsed ? <PenTool size={20} /> : "Join Waitlist"}
          </Link>
        </div>
      ) : isAdmin && !isCollapsed ? (
        <div className="mt-8">
          <Link href="/write" className="block w-full bg-accent text-white rounded-full py-4 text-center text-lg hover:bg-accent/90 transition-colors shadow-sm">
            Write a Poem
          </Link>
        </div>
      ) : isAdmin && isCollapsed ? (
        <div className="mt-8">
          <Link href="/write" className="block w-full bg-accent text-white rounded-full py-3 text-center flex justify-center hover:bg-accent/90 transition-colors shadow-sm">
            <PenTool size={20} />
          </Link>
        </div>
      ) : null}

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}
