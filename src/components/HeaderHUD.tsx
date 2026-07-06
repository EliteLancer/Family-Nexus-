/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface HeaderHUDProps {
  isAdmin: boolean;
  lineageFilter: 'all' | 'paternal' | 'maternal' | 'descendants';
  setLineageFilter: (filter: 'all' | 'paternal' | 'maternal' | 'descendants') => void;
  statHighlightLabel: string | null;
  clearGroupHighlight: () => void;
  playTick: () => void;
}

const HeaderHUD = React.memo(function HeaderHUD({
  isAdmin,
  lineageFilter,
  setLineageFilter,
  statHighlightLabel,
  clearGroupHighlight,
  playTick,
}: HeaderHUDProps) {
  return (
    <header className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto z-30 flex flex-wrap items-start sm:items-center gap-2.5 sm:gap-4 pointer-events-none">
      {/* Brand HUD */}
      <div className="bg-[#1D1E21]/60 backdrop-blur-md border border-neutral-800/60 rounded-xl p-3 px-4 shadow-xl flex items-center gap-3.5 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <span className="text-sm font-semibold text-white tracking-tight block">Family Nexus</span>
          <span className="text-[10px] text-neutral-400 font-medium block">
            Preserving Generations. Exploring Connections.
          </span>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="bg-[#1D1E21]/60 backdrop-blur-md border border-neutral-800/60 rounded-xl p-2.5 px-3.5 shadow-xl flex items-center gap-2 pointer-events-auto">
        <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
        <span className="text-[10px] font-semibold text-neutral-300 uppercase tracking-wider select-none">
          {isAdmin ? 'Administrator Mode' : 'Read-Only Mode'}
        </span>
      </div>

      {/* Active Statistics Group Highlight Filter HUD */}
      {statHighlightLabel && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2 px-3.5 shadow-xl flex items-center gap-3 pointer-events-auto animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
              {statHighlightLabel}
            </span>
          </div>
          <button
            onClick={() => {
              clearGroupHighlight();
              playTick();
            }}
            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400/80 hover:text-emerald-400 transition-colors cursor-pointer pointer-events-auto"
            title="Clear Highlight Filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Lineage Highlighting HUD */}
      <div className="bg-[#1D1E21]/60 backdrop-blur-md border border-neutral-800/60 rounded-xl p-1.5 shadow-xl flex items-center gap-1 pointer-events-auto">
        <button
          onClick={() => {
            setLineageFilter('all');
            clearGroupHighlight();
            playTick();
          }}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            lineageFilter === 'all'
              ? 'bg-neutral-800 text-white shadow-inner'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
          }`}
        >
          Show All
        </button>
        <button
          onClick={() => {
            setLineageFilter('paternal');
            clearGroupHighlight();
            playTick();
          }}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            lineageFilter === 'paternal'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-neutral-400 hover:text-blue-300 hover:bg-blue-500/5'
          }`}
        >
          <div className="w-1 h-1 rounded-full bg-blue-400" />
          Paternal
        </button>
        <button
          onClick={() => {
            setLineageFilter('maternal');
            clearGroupHighlight();
            playTick();
          }}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            lineageFilter === 'maternal'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-neutral-400 hover:text-emerald-300 hover:bg-emerald-500/5'
          }`}
        >
          <div className="w-1 h-1 rounded-full bg-emerald-400" />
          Maternal
        </button>
        <button
          onClick={() => {
            setLineageFilter('descendants');
            clearGroupHighlight();
            playTick();
          }}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            lineageFilter === 'descendants'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-neutral-400 hover:text-amber-300 hover:bg-amber-500/5'
          }`}
        >
          <div className="w-1 h-1 rounded-full bg-amber-400" />
          Descendants
        </button>
      </div>
    </header>
  );
});

export default HeaderHUD;
