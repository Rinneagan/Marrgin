"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Users, TrendingUp, MessageSquare, Eye } from "lucide-react";
import { getAdminStats } from "@/lib/db";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAdminStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="py-12 px-8 flex justify-center"><div className="animate-pulse">Loading stats...</div></div>;

  return (
    <div className="py-12 px-8 max-w-[1000px] mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <ShieldCheck size={32} className="text-accent" />
          <h1 className="font-serif text-4xl">Admin Dashboard</h1>
        </div>
        <Link href="/admin/notifications" className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-opacity">
          View Notifications
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-secondary">
            <Users size={20} />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-3xl font-serif">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-secondary">
            <TrendingUp size={20} />
            <h3 className="font-medium">Poems Published</h3>
          </div>
          <p className="text-3xl font-serif">{stats.totalPoems}</p>
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-secondary">
            <MessageSquare size={20} />
            <h3 className="font-medium">Total Comments</h3>
          </div>
          <p className="text-3xl font-serif">{stats.totalComments}</p>
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-secondary">
            <Eye size={20} />
            <h3 className="font-medium">Total Visits</h3>
          </div>
          <p className="text-3xl font-serif">{stats.totalVisits}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-8 shadow-sm">
          <h2 className="font-serif text-2xl mb-6 text-green-600 dark:text-green-400">Best Performing Poem</h2>
          {stats.bestPoem ? (
            <div>
              <p className="font-medium text-xl mb-1">{stats.bestPoem.title}</p>
              <p className="text-secondary mb-4">{stats.bestPoem.likesCount} Likes</p>
              <Link href={`/read/${stats.bestPoem.id}`} className="text-sm text-accent hover:underline">
                Read Poem →
              </Link>
            </div>
          ) : (
            <p className="text-secondary">No data available.</p>
          )}
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-8 shadow-sm">
          <h2 className="font-serif text-2xl mb-6 text-red-500">Least Performing Poem</h2>
          {stats.worstPoem ? (
            <div>
              <p className="font-medium text-xl mb-1">{stats.worstPoem.title}</p>
              <p className="text-secondary mb-4">{stats.worstPoem.likesCount} Likes</p>
              <Link href={`/read/${stats.worstPoem.id}`} className="text-sm text-accent hover:underline">
                Read Poem →
              </Link>
            </div>
          ) : (
            <p className="text-secondary">No data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
