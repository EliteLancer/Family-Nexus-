/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Shield, Key, Database, Sun, Moon, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileHUDProps {
  user: any;
  isGuest: boolean;
  onLogout: () => void;
  people: Record<string, any>;
  rootUserId: string;
  setRootUser: (id: string) => void;
  theme: 'dark' | 'light-high-contrast';
  onToggleTheme: () => void;
  playTick: () => void;
}

const UserProfileHUD = React.memo(function UserProfileHUD({
  user,
  isGuest,
  onLogout,
  people,
  rootUserId,
  setRootUser,
  theme,
  onToggleTheme,
  playTick,
}: UserProfileHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    playTick();
  };

  const currentRootPerson = people[rootUserId];
  const totalCount = Object.keys(people).length;
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'G';

  return (
    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 pointer-events-auto" ref={dropdownRef}>
      {/* Profile Toggle Button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 bg-[#1D1E21]/80 backdrop-blur-md border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800 rounded-full py-1.5 pl-2 pr-3 shadow-xl transition-all cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono group-hover:border-emerald-400 transition-colors">
          {userInitials}
        </div>
        <span className="text-[11px] font-semibold text-neutral-300 group-hover:text-white transition-colors max-w-[120px] truncate">
          {user?.email || 'Guest Explorer'}
        </span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 bg-[#161719] border border-neutral-800 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden"
          >
            {/* Header info */}
            <div className="p-4 bg-[#1D1E21]/50 border-b border-neutral-800/80 flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 text-lg font-bold font-mono">
                {userInitials}
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block truncate max-w-[240px]">
                  {user?.email || 'Guest Explorer'}
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold font-mono uppercase border ${
                    user 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    <Database className="w-2.5 h-2.5" />
                    {user ? 'Cloud Sync' : 'Local Session'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2.5 space-y-1.5">
              
              {/* Database stats */}
              <div className="px-3.5 py-2 text-[10px] text-neutral-400 font-medium flex items-center justify-between bg-neutral-900/40 rounded-xl border border-neutral-800/40">
                <span>Active Registry Members</span>
                <span className="font-bold text-white font-mono">{totalCount} registered</span>
              </div>

              {/* Set Root User Option */}
              <div className="p-2.5 bg-neutral-900/20 rounded-xl border border-neutral-800/40 space-y-2">
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Tree Root Focus</span>
                <div className="space-y-1">
                  <select
                    value={rootUserId}
                    onChange={(e) => {
                      setRootUser(e.target.value);
                      playTick();
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 focus:outline-none rounded-lg p-2 text-xs text-white transition-all cursor-pointer"
                  >
                    {Object.values(people)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  <span className="text-[9.5px] text-neutral-400 pl-0.5 leading-tight block">
                    Focus node when entering explorer.
                  </span>
                </div>
              </div>

              {/* Theme Toggle inside Profile */}
              <button
                onClick={() => {
                  onToggleTheme();
                  playTick();
                }}
                className="w-full flex items-center justify-between p-2.5 px-3.5 hover:bg-neutral-800/60 text-xs text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  {theme === 'light-high-contrast' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-400" />}
                  Theme
                </span>
                <span className="text-[10px] text-neutral-500 font-mono group-hover:text-neutral-300">
                  {theme === 'light-high-contrast' ? 'High-Contrast Light' : 'Dark Mode'}
                </span>
              </button>

            </div>

            {/* Actions Footer */}
            <div className="p-2.5 bg-[#1D1E21]/30 border-t border-neutral-800/80">
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500/15"
              >
                <LogOut className="w-3.5 h-3.5" />
                {user ? 'Sign Out / Logout' : 'Exit Guest Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default UserProfileHUD;
