"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, checkUsernameAvailability } from "@/lib/db";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { generateRandomUsername, generateAlternativeUsername } from "@/lib/usernameGenerator";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with a random username
  useEffect(() => {
    generateAndCheckUsername();
  }, []);

  const generateAndCheckUsername = async () => {
    setCheckingUsername(true);
    let generated = generateRandomUsername();
    let isAvailable = await checkUsernameAvailability(generated);
    
    // If not available, append a number
    if (!isAvailable) {
      generated = generateAlternativeUsername(generated);
      isAvailable = await checkUsernameAvailability(generated);
    }
    
    setUsername(generated);
    setUsernameAvailable(isAvailable);
    setCheckingUsername(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    setUsernameAvailable(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (val.length < 3) return;

    setCheckingUsername(true);
    typingTimeoutRef.current = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailability(val);
      setUsernameAvailable(isAvailable);
      setCheckingUsername(false);
    }, 500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }

    setLoading(true);

    try {
      // Double check availability before creating
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setError("Username was just taken, please choose another.");
        setUsernameAvailable(false);
        setLoading(false);
        return;
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(user.uid, user.email || "", username);
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
        <h1 className="font-serif text-4xl mb-2">Join Marrgin</h1>
        <p className="text-secondary">Start reading and writing poetry</p>
      </div>

      <div className="space-y-4">
        {error && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-xl">{error}</div>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Username"
                required
                className={`w-full px-4 py-3 rounded-xl border bg-transparent outline-none transition-colors pr-24 ${
                  usernameAvailable === false ? 'border-red-500 focus:border-red-500' : 
                  usernameAvailable === true ? 'border-green-500 dark:border-green-800 focus:border-green-500' : 
                  'border-gray-200 dark:border-gray-700 focus:border-accent'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {checkingUsername && <RefreshCw size={16} className="text-secondary animate-spin" />}
                {!checkingUsername && usernameAvailable === true && <CheckCircle2 size={18} className="text-green-500" />}
                {!checkingUsername && usernameAvailable === false && <XCircle size={18} className="text-red-500" />}
                <button
                  type="button"
                  onClick={generateAndCheckUsername}
                  title="Generate random name"
                  className="text-secondary hover:text-accent transition-colors ml-1"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-red-500 mt-1 ml-1">This username is taken</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-1">Username available</p>
            )}
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-accent transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent outline-none focus:border-accent transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-accent transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                  <line x1="2" y1="2" x2="22" y2="22"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <button 
            disabled={loading || usernameAvailable === false || checkingUsername}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-full hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </motion.div>
  );
}
