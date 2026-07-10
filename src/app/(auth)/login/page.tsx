"use client";

import Link from "next/link";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col w-full space-y-8"
    >
      <div className="text-center">
        <h1 className="font-serif text-4xl mb-2">Welcome Back</h1>
        <p className="text-secondary">Continue your reading journey</p>
      </div>

      <div className="space-y-4">
        {error && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-xl">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-accent transition-colors"
          />
          <div className="flex justify-end">
            <Link href="#" className="text-sm text-secondary hover:text-accent transition-colors">
              Forgot password?
            </Link>
          </div>
          <button 
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-full hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-secondary">
        Don't have an account?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
