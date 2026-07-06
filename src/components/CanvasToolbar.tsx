/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Home, BarChart3, Shield, Eye, Download, Upload, RotateCcw,
  Maximize2, Keyboard, Volume2, VolumeX, Sun, Moon, Undo2, LogOut, Workflow, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CanvasToolbarProps {
  onSearchOpen: () => void;
  onHomeClick: () => void;
  onFitTree: () => void;
  onStatsOpen: () => void;
  onExportTree: () => void;
  onImportTrigger: () => void;
  onExportGEDCOM: () => void;
  onImportGEDCOMTrigger: () => void;
  onResetConfirmOpen: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onShortcutsOpen: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: 'dark' | 'light-high-contrast';
  onToggleTheme: () => void;
  canUndo: boolean;
  onUndo: () => void;
  isLoggedIn: boolean;
  userEmail?: string;
  onLogout: () => void;
  orientation: 'TB' | 'LR';
  onToggleOrientation: () => void;
}

const CanvasToolbar = React.memo(function CanvasToolbar({
  onSearchOpen,
  onHomeClick,
  onFitTree,
  onStatsOpen,
  onExportTree,
  onImportTrigger,
  onExportGEDCOM,
  onImportGEDCOMTrigger,
  onResetConfirmOpen,
  isAdmin,
  onToggleAdmin,
  onShortcutsOpen,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
  canUndo,
  onUndo,
  isLoggedIn,
  userEmail,
  onLogout,
  orientation,
  onToggleOrientation
}: CanvasToolbarProps) {
  const [isDataOpen, setIsDataOpen] = useState(false);
  const dataDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dataDropdownRef.current && !dataDropdownRef.current.contains(event.target as Node)) {
        setIsDataOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div id="floating-toolbar-wrapper" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95vw] sm:w-auto flex justify-center">
      <div className="bg-[#1D1E21]/80 backdrop-blur-md border border-neutral-800/80 rounded-full py-1.5 sm:py-2 px-3 sm:px-4 shadow-2xl flex items-center gap-1 sm:gap-1.5 overflow-x-auto sm:overflow-visible no-scrollbar max-w-full whitespace-nowrap scroll-smooth">
        
        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all duration-200 relative group cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="toolbar-tooltip">
            Search
          </span>
        </button>

        {/* Home / Center Root */}
        <button
          onClick={onHomeClick}
          className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all duration-200 relative group cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span className="toolbar-tooltip">
            Home
          </span>
        </button>

        {/* Fit tree */}
        <button
          onClick={onFitTree}
          className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all duration-200 relative group cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="toolbar-tooltip">
            Fit Screen
          </span>
        </button>

        <div className="w-[1px] h-5 bg-neutral-800 mx-1.5" />

        {/* Stats */}
        <button
          onClick={onStatsOpen}
          className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all duration-200 relative group cursor-pointer"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="toolbar-tooltip">
            Stats
          </span>
        </button>

        {/* Database Sync / Import / Export Options Dropdown */}
        <div className="relative" ref={dataDropdownRef}>
          <button
            onClick={() => setIsDataOpen(!isDataOpen)}
            className={`p-2.5 rounded-full transition-all duration-200 relative group cursor-pointer ${
              isDataOpen 
                ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="toolbar-tooltip">
              Data Options
            </span>
          </button>

          <AnimatePresence>
            {isDataOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-52 bg-[#161719] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-50 p-1.5 space-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    onExportTree();
                    setIsDataOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-800 rounded-lg text-left text-neutral-300 hover:text-white transition-all cursor-pointer text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-medium">Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onImportTrigger();
                    setIsDataOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-800 rounded-lg text-left text-neutral-300 hover:text-white transition-all cursor-pointer text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-medium">Import JSON</span>
                </button>

                <div className="h-[1px] bg-neutral-800/60 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    onExportGEDCOM();
                    setIsDataOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-800 rounded-lg text-left text-neutral-300 hover:text-white transition-all cursor-pointer text-[11px]"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium">Export GEDCOM</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onImportGEDCOMTrigger();
                    setIsDataOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-800 rounded-lg text-left text-neutral-300 hover:text-white transition-all cursor-pointer text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium">Import GEDCOM</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset to seed (Only visible in Admin Mode) */}
        {isAdmin && (
          <button
            onClick={onResetConfirmOpen}
            className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-rose-400 transition-all duration-200 relative group cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="toolbar-tooltip">
              Reset
            </span>
          </button>
        )}

        {/* Undo */}
        {isAdmin && canUndo && (
          <button
            onClick={onUndo}
            className="p-2.5 hover:bg-neutral-800 rounded-full text-amber-400 hover:text-amber-300 transition-all duration-200 relative group cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
            <span className="toolbar-tooltip">
              Undo
            </span>
          </button>
        )}

        <div className="w-[1px] h-5 bg-neutral-800 mx-1.5" />

        {/* Admin Mode toggle */}
        <button
          onClick={onToggleAdmin}
          className={`p-2.5 rounded-full transition-all duration-200 relative group flex items-center justify-center cursor-pointer ${
            isAdmin 
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          {isAdmin ? <Shield className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="toolbar-tooltip">
            {isAdmin ? 'View Mode' : 'Admin Mode'}
          </span>
        </button>

        {/* Shortcuts */}
        <button
          onClick={onShortcutsOpen}
          className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all duration-200 relative group cursor-pointer"
        >
          <Keyboard className="w-4 h-4" />
          <span className="toolbar-tooltip">
            Shortcuts
          </span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className={`p-2.5 rounded-full transition-all duration-200 relative group flex items-center justify-center cursor-pointer ${
            isMuted ? 'text-neutral-500 hover:bg-neutral-800 hover:text-white' : 'text-emerald-400 hover:bg-neutral-800'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="toolbar-tooltip">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        {/* Layout Orientation Toggle */}
        <button
          onClick={onToggleOrientation}
          className="p-2.5 hover:bg-neutral-800 rounded-full text-neutral-300 hover:text-white transition-all duration-200 relative group cursor-pointer"
        >
          <Workflow className="w-4 h-4" />
          <span className="toolbar-tooltip">
            {orientation === 'TB' ? 'Horizontal Layout' : 'Vertical Layout'}
          </span>
        </button>

        <div className="w-[1px] h-5 bg-neutral-800 mx-1.5" />

        {/* Accessibility Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-full transition-all duration-200 relative group flex items-center justify-center cursor-pointer ${
            theme === 'light-high-contrast'
              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
          }`}
        >
          {theme === 'light-high-contrast' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          <span className="toolbar-tooltip">
            {theme === 'light-high-contrast' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>

        {isLoggedIn && (
          <>
            <div className="w-[1px] h-5 bg-neutral-800 mx-1.5" />
            
            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2.5 hover:bg-neutral-800 rounded-full text-red-400 hover:text-red-300 transition-all duration-200 relative group cursor-pointer"
              title={`Logged in as ${userEmail}`}
            >
              <LogOut className="w-4 h-4" />
              <span className="toolbar-tooltip">
                Sign Out
              </span>
            </button>
          </>
        )}

      </div>
    </div>
  );
});

export default CanvasToolbar;
