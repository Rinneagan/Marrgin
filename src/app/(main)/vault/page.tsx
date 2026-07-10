"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { getVaultedPoems } from "@/lib/db";

export default function VaultLockPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already unlocked, redirect
    if (sessionStorage.getItem("vaultUnlocked")) {
      router.push("/vault/feed");
    }
  }, [router]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setIsChecking(true);
    setError(false);

    try {
      const poems = await getVaultedPoems(passphrase.trim());
      if (poems.length > 0) {
        // Success
        sessionStorage.setItem("vaultUnlocked", passphrase.trim());
        router.push("/vault/feed");
      } else {
        // No poems found with this passphrase
        setError(true);
        setPassphrase("");
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-12">
          <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center">
            <Lock size={32} className="text-white/60" />
          </div>
        </div>
        
        <form onSubmit={handleUnlock} className="relative">
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter Passphrase"
            className={`w-full bg-transparent border-b-2 ${error ? 'border-red-500' : 'border-white/20 focus:border-white'} py-4 text-center font-serif text-3xl outline-none transition-colors placeholder:text-white/20`}
            autoFocus
          />
          <button 
            type="submit"
            disabled={isChecking || !passphrase.trim()}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors disabled:opacity-0"
          >
            <ArrowRight size={24} />
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-center mt-6 font-medium animate-pulse">
            Incorrect passphrase. The vault remains sealed.
          </p>
        )}
      </div>
    </div>
  );
}
