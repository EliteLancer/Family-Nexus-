/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, LogIn, ArrowRight, UserPlus, HelpCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface LoginOverlayProps {
  onLoginSuccess: (user: any) => void;
  onContinueAsGuest: () => void;
  isHighContrastLight: boolean;
}

export default function LoginOverlay({
  onLoginSuccess,
  onContinueAsGuest,
  isHighContrastLight
}: LoginOverlayProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          if (!data.user.email_confirmed_at) {
            setInfoMsg('Account created! Please check your email to verify your account before logging in.');
            setIsSignUp(false); // Switch to Sign In screen
            await supabase.auth.signOut();
          } else {
            onLoginSuccess(data.user);
          }
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          setErrorMsg(error.message);
        } else if (data.user) {
          if (!data.user.email_confirmed_at) {
            setErrorMsg('Please verify your email address before logging in.');
            await supabase.auth.signOut();
          } else {
            onLoginSuccess(data.user);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 ${
      isHighContrastLight ? 'bg-[#F8FAFC]' : 'bg-[#0B0C0E]'
    }`}>
      {/* Glow background effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-emerald-500/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md bg-[#161719] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/85 p-8 space-y-6 relative"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/5">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-extralight tracking-[0.15em] text-white uppercase font-sans">
              Family Nexus
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
              Preserving Generations. Exploring Connections.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-xl p-2.5 pl-10 text-xs text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 focus:border-emerald-500 focus:outline-none rounded-xl p-2.5 pl-10 text-xs text-white transition-all"
              />
            </div>
          </div>

          {infoMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] rounded-xl p-3 flex gap-2.5 items-center">
              <span>✉️ {infoMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] rounded-xl p-3 flex gap-2.5 items-center">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-xs font-semibold uppercase tracking-wider text-white rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Toggles and Guest */}
        <div className="space-y-4 pt-2 border-t border-neutral-800/40 text-center">
          <div className="text-xs">
            <span className="text-neutral-400">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-neutral-800/40"></div>
            <span className="flex-shrink mx-4 text-[10px] text-neutral-500 font-mono uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-neutral-800/40"></div>
          </div>

          <button
            onClick={onContinueAsGuest}
            className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white font-medium transition-colors cursor-pointer"
          >
            Continue as Guest <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
