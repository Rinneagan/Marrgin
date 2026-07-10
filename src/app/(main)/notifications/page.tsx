"use client";

import { useEffect, useState } from "react";
import { BookOpen, MessageCircle, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getSiteNotifications, getUserNotifications } from "@/lib/db";
import Link from "next/link";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      let combined: any[] = [];
      const siteNotifs = await getSiteNotifications();
      combined = [...siteNotifs];

      if (user) {
        const userNotifs = await getUserNotifications(user.uid);
        combined = [...combined, ...userNotifs];
      }

      // Sort by descending date
      combined.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setNotifications(combined);
      setLoading(false);
    };
    fetchNotifs();
  }, [user]);

  return (
    <div className="py-12 px-8 max-w-[700px] mx-auto min-h-screen">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6 mb-12">
        <div className="flex items-center gap-3">
          <BellRing className="text-accent" size={28} />
          <h1 className="font-serif text-4xl">Activity</h1>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={notif.id}
                className="relative p-6 rounded-2xl border transition-all duration-500 flex gap-5 bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-sm"
              >
                <div className="mt-1 flex-shrink-0">
                  {notif.type === "poem" && <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><BookOpen className="text-accent" size={18} /></div>}
                  {notif.type === "comment" && <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><MessageCircle className="text-blue-500" size={18} /></div>}
                  {notif.type === "reply" && <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center"><MessageCircle className="text-green-500" size={18} /></div>}
                </div>
                <div className="flex-grow">
                  <p className="text-gray-800 dark:text-gray-200 text-lg">
                    {notif.details}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs uppercase tracking-widest text-secondary font-medium">
                      {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                    </p>
                    {notif.link && (
                      <Link href={notif.link} className="text-xs text-accent hover:underline">
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12 text-secondary">
            No activity yet.
          </div>
        )}
      </div>
    </div>
  );
}
