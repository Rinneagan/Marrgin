import { ShieldCheck, Users, Flag, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="py-12 px-8 max-w-[1000px] mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-12">
        <ShieldCheck size={32} className="text-accent" />
        <h1 className="font-serif text-4xl">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-secondary">
            <Users size={20} />
            <h3 className="font-medium">Total Users</h3>
          </div>
          <p className="text-3xl font-serif">12,450</p>
        </div>
        
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-secondary">
            <TrendingUp size={20} />
            <h3 className="font-medium">Poems Published</h3>
          </div>
          <p className="text-3xl font-serif">84,210</p>
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-red-500">
            <Flag size={20} />
            <h3 className="font-medium">Reported Content</h3>
          </div>
          <p className="text-3xl font-serif text-red-500">12</p>
        </div>
      </div>

      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-8 shadow-sm">
        <h2 className="font-serif text-2xl mb-6">Manage Featured Content</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white/60 dark:bg-black/40">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">The Road Not Taken</p>
              <p className="text-sm text-secondary">Robert Frost</p>
            </div>
            <button className="text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors">
              Remove Featured
            </button>
          </div>
          
          <div className="flex justify-between items-center p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white/60 dark:bg-black/40">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">Still I Rise</p>
              <p className="text-sm text-secondary">Maya Angelou</p>
            </div>
            <button className="text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors">
              Remove Featured
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
