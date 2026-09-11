"use client";

import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Home, 
  Compass, 
  Plus, 
  BookMarked, 
  Bell, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Feather,
  Search,
  Eye,
  BarChart3,
  Info,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

function LeftSidebarContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode");

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNewPieceOpen, setIsNewPieceOpen] = useState(false);
  const newPieceRef = useRef<HTMLDivElement>(null);
  
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0.4]);

  // Close new piece dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newPieceRef.current && !newPieceRef.current.contains(event.target as Node)) {
        setIsNewPieceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const navSections = [
    {
      title: "Discover",
      items: [
        { name: "Home", href: "/home", icon: Home, exact: true },
        { name: "Explore", href: "/explore", icon: Compass, exact: true },
      ]
    },
    {
      title: "Editorial",
      items: [
        { name: "Writing", href: "/explore?mode=writing", icon: Feather, modeKey: "writing" },
        { name: "Investigations", href: "/explore?mode=investigation", icon: Search, modeKey: "investigation" },
        { name: "Field Notes", href: "/explore?mode=field-note", icon: Eye, modeKey: "field-note" },
        { name: "Data Stories", href: "/explore?mode=data-story", icon: BarChart3, modeKey: "data-story" },
      ]
    },
    {
      title: "Library",
      items: [
        { name: "Anthologies", href: "/collections", icon: BookMarked },
        { name: "About", href: "/about", icon: Info },
        ...(user ? [
          { name: "Notifications", href: "/notifications", icon: Bell, badge: true },
          { name: "Profile", href: "/profile", icon: User },
        ] : []),
      ]
    }
  ];

  const isItemActive = (item: { href: string; exact?: boolean; modeKey?: string }) => {
    if (item.modeKey) {
      return pathname === "/explore" && currentMode === item.modeKey;
    }
    if (item.exact) {
      return pathname === item.href && !currentMode;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <motion.aside 
      style={{ opacity }}
      animate={{ width: isCollapsed ? 90 : 270 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col p-6 sticky top-0 h-screen border-r border-gray-200/70 dark:border-gray-800/70 transition-opacity hover:!opacity-100 duration-300 relative select-none bg-background/50 backdrop-blur-md"
    >
      {/* Brand Header */}
      <div className="mb-8 flex items-center justify-between pl-2">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
            >
              <Link href="/" className="font-serif text-2xl tracking-wider text-neutral-900 dark:text-neutral-100 hover:text-amber-900 dark:hover:text-amber-400 transition-colors">
                MARRGIN
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Link href="/" className="font-serif text-2xl tracking-wider text-neutral-900 dark:text-neutral-100">
                M.
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Admin Quick Action: + New Piece */}
      {isAdmin && (
        <div className="mb-6 relative" ref={newPieceRef}>
          {!isCollapsed ? (
            <div>
              <div className="flex items-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm">
                <Link 
                  href="/write" 
                  className="flex-1 py-2.5 px-4 text-sm font-medium tracking-wide flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={2} />
                  <span>New Piece</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsNewPieceOpen(!isNewPieceOpen)}
                  aria-label="Select mode"
                  className="px-2.5 py-2.5 border-l border-neutral-700 dark:border-neutral-300 hover:bg-black/10 dark:hover:bg-white/10 rounded-r-xl transition-colors"
                >
                  <ChevronDown size={14} className={`transform transition-transform ${isNewPieceOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Mode Selector Dropdown */}
              <AnimatePresence>
                {isNewPieceOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 shadow-xl z-50 text-xs font-sans"
                  >
                    {[
                      { mode: "poetry", label: "Poetry", icon: Feather },
                      { mode: "essay", label: "Essay", icon: Feather },
                      { mode: "investigation", label: "Investigation", icon: Search },
                      { mode: "field-note", label: "Field Note", icon: Eye },
                      { mode: "data-story", label: "Data Story", icon: BarChart3 },
                    ].map(item => (
                      <Link
                        key={item.mode}
                        href={`/write?mode=${item.mode}`}
                        onClick={() => setIsNewPieceOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <item.icon size={13} className="text-neutral-400" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              href="/write" 
              title="New Piece"
              className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center mx-auto hover:scale-105 transition-transform shadow-sm"
            >
              <Plus size={18} />
            </Link>
          )}
        </div>
      )}
      
      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto space-y-6 pr-1">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed ? (
              <h3 className="text-[10px] font-mono tracking-widest text-neutral-400/90 uppercase px-3 mb-2 font-medium">
                {section.title}
              </h3>
            ) : (
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-3 mx-2" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : ""}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all relative group ${
                      active 
                        ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100/90 dark:bg-neutral-900/90 font-semibold" 
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon 
                        strokeWidth={active ? 2 : 1.6} 
                        size={18} 
                        className={active ? "text-amber-900 dark:text-amber-400" : "text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors"}
                      />
                      {(item as any).badge && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <span className="truncate tracking-normal">
                        {item.name}
                      </span>
                    )}

                    {active && !isCollapsed && (
                      <motion.div 
                        layoutId="activeNavIndicator"
                        className="ml-auto w-1 h-3.5 rounded-full bg-amber-800 dark:bg-amber-400"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User Authentication */}
      <div className="pt-4 border-t border-gray-200/70 dark:border-gray-800/70 mt-auto">
        {!user ? (
          <div className="flex flex-col gap-2">
            {!isCollapsed ? (
              <Link 
                href="/login" 
                className="text-center text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white py-1.5 transition-colors"
              >
                Sign In
              </Link>
            ) : null}
            <Link 
              href="/signup" 
              className={`bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-xl ${isCollapsed ? 'py-2 px-0 flex justify-center' : 'py-2 px-4'} text-center text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm`}
            >
              {isCollapsed ? <User size={15} /> : "Join Waitlist"}
            </Link>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            title={isCollapsed ? "Sign Out" : ""}
            className="flex items-center gap-3 px-3 py-2 w-full text-xs font-medium text-red-600/90 dark:text-red-400/90 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} className="flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        )}
      </div>

      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 transform bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-full p-1 shadow-sm hover:bg-gray-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors z-20"
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </motion.aside>
  );
}

export default function LeftSidebar() {
  return (
    <Suspense fallback={
      <aside className="hidden md:flex flex-col p-6 w-[270px] border-r border-gray-200/70 dark:border-gray-800/70 h-screen sticky top-0" />
    }>
      <LeftSidebarContent />
    </Suspense>
  );
}
