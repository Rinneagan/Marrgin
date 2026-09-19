"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Compass, 
  Plus, 
  BookMarked, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Feather, 
  Search, 
  Eye, 
  BarChart3, 
  Info,
  CloudRain
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

function MobileNavbarContent() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode");

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  const isAdmin = user?.email && adminEmails.includes(user.email.toLowerCase());

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
        { name: "Beyond the Rain", href: "/beyond-the-rain", icon: CloudRain, exact: true },
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
    <>
      {/* Mobile Sticky Header */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 px-4 h-14 flex items-center justify-between">
        <Link href="/home" className="font-serif text-xl tracking-wider text-neutral-900 dark:text-neutral-100">
          MARRGIN
        </Link>
        <div className="flex items-center gap-1">
          <Link 
            href="/explore" 
            aria-label="Explore and Search"
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
          >
            <Search size={20} />
          </Link>
          <button 
            onClick={() => setIsOpen(true)} 
            aria-label="Open menu" 
            className="p-2 -mr-1 text-neutral-800 dark:text-neutral-200"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed top-0 left-0 bottom-0 w-[290px] bg-background border-r border-gray-200/80 dark:border-gray-800/80 z-50 flex flex-col p-6 md:hidden shadow-2xl overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Link 
                    href="/home" 
                    onClick={() => setIsOpen(false)} 
                    className="font-serif text-2xl tracking-wider block text-neutral-900 dark:text-neutral-100"
                  >
                    MARRGIN
                  </Link>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  aria-label="Close menu"
                  className="p-1.5 -mr-1 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Admin New Piece Button */}
              {isAdmin && (
                <div className="mb-6">
                  <Link
                    href="/write"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium text-xs tracking-wide shadow-sm"
                  >
                    <Plus size={15} />
                    <span>New Piece</span>
                  </Link>
                </div>
              )}

              {/* Navigation Sections */}
              <nav className="flex flex-col gap-6 flex-1">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <h3 className="text-[10px] font-mono tracking-widest text-neutral-400/90 uppercase px-2 mb-1.5 font-medium">
                      {section.title}
                    </h3>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isItemActive(item);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                              active 
                                ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-900 font-medium" 
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                            }`}
                          >
                            <Icon 
                              size={17} 
                              strokeWidth={active ? 2 : 1.6} 
                              className={active ? "text-amber-800 dark:text-amber-400" : "text-neutral-500"} 
                            />
                            <span>{item.name}</span>
                            {(item as any).badge && (
                              <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-gray-200/70 dark:border-gray-800/70 mt-6">
                {!user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="text-center text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white py-1.5"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsOpen(false)}
                      className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-xl py-2 text-center text-xs font-medium"
                    >
                      Join Waitlist
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 w-full text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function MobileNavbar() {
  return (
    <Suspense fallback={
      <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-background/80 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 px-4 flex items-center justify-between" />
    }>
      <MobileNavbarContent />
    </Suspense>
  );
}
