"use client";

import { useState } from "react";
import { Heart, UserPlus, MessageCircle, BellRing, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const initialNotifications = [
  {
    id: 1,
    type: "like_group",
    user: "Emma Dickinson and 2 others",
    content: "loved your poem 'Midnight Thoughts'",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "follow",
    user: "John Keats",
    content: "began following your verses",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "comment",
    user: "Sylvia Plath",
    content: "left a thought on 'The Bell Jar Reflections': \"This resonates deeply with me.\"",
    time: "1 day ago",
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="py-12 px-8 max-w-[700px] mx-auto min-h-screen">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-6 mb-12">
        <div className="flex items-center gap-3">
          <BellRing className="text-accent" size={28} />
          <h1 className="font-serif text-4xl">Activity</h1>
          {unreadCount > 0 && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-secondary hover:text-black dark:hover:text-white transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={notification.id}
              className={`relative p-6 rounded-2xl border transition-all duration-500 flex gap-5 group cursor-pointer ${
                notification.read
                  ? "bg-transparent border-gray-100 dark:border-gray-800 opacity-60"
                  : "bg-white/60 dark:bg-black/40 backdrop-blur-xl border-white/40 dark:border-white/10 shadow-sm"
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="mt-1 flex-shrink-0">
                {notification.type === "like_group" && <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><Heart className="text-red-500 fill-red-500" size={18} /></div>}
                {notification.type === "follow" && <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><UserPlus className="text-accent" size={18} /></div>}
                {notification.type === "comment" && <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><MessageCircle className="text-blue-500" size={18} /></div>}
              </div>
              <div className="flex-grow">
                <p className="text-gray-800 dark:text-gray-200 text-lg">
                  <span className="font-serif font-semibold">{notification.user}</span> {notification.content}
                </p>
                <p className="text-xs uppercase tracking-widest text-secondary mt-2 font-medium">{notification.time}</p>
              </div>
              {!notification.read && (
                <div className="flex-shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent opacity-100 group-hover:opacity-0 transition-opacity absolute right-6"></div>
                  <Check size={16} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity absolute right-6" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
