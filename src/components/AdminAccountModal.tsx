"use client";

import { useState } from "react";
import { User, EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, updateEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { X, Shield, Key, Mail, LogOut, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface AdminAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function AdminAccountModal({ isOpen, onClose, user }: AdminAccountModalProps) {
  const router = useRouter();

  // Change Email State
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !emailCurrentPassword.trim() || !user.email) return;

    setIsUpdatingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      // 1. Reauthenticate with current password
      const credential = EmailAuthProvider.credential(user.email, emailCurrentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Try verifyBeforeUpdateEmail or fallback to updateEmail
      try {
        await verifyBeforeUpdateEmail(user, newEmail.trim());
        setEmailSuccess(`Verification sent to ${newEmail}. Please click the link to finalize.`);
      } catch (innerErr: any) {
        // Fallback for direct update if verification is not enforced by Firebase project setting
        await updateEmail(user, newEmail.trim());
        setEmailSuccess(`Email updated successfully to ${newEmail}.`);
      }
      setNewEmail("");
      setEmailCurrentPassword("");
    } catch (err: any) {
      console.error("Email update error:", err);
      setEmailError(err.message || "Failed to update email. Check password.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim() || !user.email) return;

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      // 1. Reauthenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password securely via Firebase Auth SDK
      await updatePassword(user, newPassword);

      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password update error:", err);
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      onClose();
      router.push("/home");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-400">
            <Shield size={18} />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-medium">
              Publisher Security
            </span>
          </div>

          <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-100 mb-1">
            Admin Account & Credentials
          </h3>
          <p className="text-xs text-neutral-500 font-sans mb-6">
            Authenticated as <span className="font-mono text-neutral-700 dark:text-neutral-300">{user.email}</span>.
          </p>

          <div className="space-y-8 text-xs font-sans">
            {/* 1. Change Email Form */}
            <form onSubmit={handleUpdateEmail} className="p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 space-y-3">
              <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
                <Mail size={14} className="text-amber-800 dark:text-amber-400" />
                <span>Change Administrator Email</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Your stable administrator UID remains unchanged. Changing your email preserves full publishing privileges.
              </p>

              <input
                type="email"
                placeholder="New administrator email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
              />

              <input
                type="password"
                placeholder="Current password (for verification)"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
              />

              {emailError && (
                <span className="text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {emailError}
                </span>
              )}
              {emailSuccess && (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {emailSuccess}
                </span>
              )}

              <button
                type="submit"
                disabled={isUpdatingEmail || !newEmail.trim() || !emailCurrentPassword.trim()}
                className="w-full py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isUpdatingEmail ? "Updating Email..." : "Update Email"}
              </button>
            </form>

            {/* 2. Change Password Form */}
            <form onSubmit={handleUpdatePassword} className="p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 space-y-3">
              <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
                <Key size={14} className="text-amber-800 dark:text-amber-400" />
                <span>Change Administrator Password</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Managed directly via Firebase Authentication. Passwords are never stored in Firestore or logged.
              </p>

              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
              />

              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
              />

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-neutral-800 dark:text-neutral-200 outline-none focus:border-amber-500"
              />

              {passwordError && (
                <span className="text-rose-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {passwordError}
                </span>
              )}
              {passwordSuccess && (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {passwordSuccess}
                </span>
              )}

              <button
                type="submit"
                disabled={isUpdatingPassword || !currentPassword.trim() || !newPassword.trim()}
                className="w-full py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isUpdatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>

            {/* 3. Sign Out */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 hover:border-rose-500/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut size={13} />
                <span>Sign Out of Publisher Account</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
