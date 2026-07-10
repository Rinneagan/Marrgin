"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Eye, Clock } from "lucide-react";
import { getAdminNotifications } from "@/lib/db";
import Link from "next/link";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      const data = await getAdminNotifications();
      setNotifications(data);
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  return (
    <div className="py-12 px-8 max-w-[800px] mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-12">
        <ShieldCheck size={32} className="text-accent" />
        <h1 className="font-serif text-4xl">Admin Notifications</h1>
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
          notifications.map((notif) => (
            <div key={notif.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white/40 dark:bg-black/20 backdrop-blur-xl flex items-start gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full text-secondary mt-1">
                {notif.type === "signup" ? <UserPlus size={20} /> : <Eye size={20} />}
              </div>
              <div>
                <p className="font-medium text-lg">{notif.details}</p>
                <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                  <Clock size={14} />
                  <span>
                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-secondary">
            No admin notifications yet.
          </div>
        )}
      </div>
      
      <div className="mt-12 text-center">
        <Link href="/admin" className="text-sm text-secondary hover:text-accent underline transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
