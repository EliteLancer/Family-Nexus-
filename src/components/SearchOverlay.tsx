/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Person } from '../types';
import { Search, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  people: Record<string, Person>;
  onSelectPerson: (id: string) => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  people,
  onSelectPerson
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveIndex(0);
    } else {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Match query against names, cities, or professions
  useEffect(() => {
    setActiveIndex(0);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const norm = query.toLowerCase().trim();
    const filtered = Object.values(people).filter(
      p => {
        if (norm === 'living') return p.living;
        if (norm === 'deceased') return !p.living;
        return (
          p.name.toLowerCase().includes(norm) ||
          p.profession.toLowerCase().includes(norm) ||
          p.city.toLowerCase().includes(norm) ||
          p.id.toLowerCase().includes(norm)
        );
      }
    );

    setResults(filtered.slice(0, 6)); // Limit to top 6 results
  }, [query, people]);

  // Handle ESC and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (results.length > 0 ? Math.min(prev + 1, results.length - 1) : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0) {
          const target = results[activeIndex] || results[0];
          if (target) {
            onSelectPerson(target.id);
            onClose();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, results, activeIndex, onSelectPerson]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="search-overlay-backdrop"
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[10vh] px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ type: 'spring', damping: 25, stiffness: 380 }}
          id="search-spotlight-modal"
          className="w-full max-w-xl bg-[#161719] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl shadow-black/90"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input field */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800 bg-[#1D1E21]/60">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name, profession, city, or ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-white placeholder-neutral-500"
            />
            <div className="flex items-center gap-1 bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-400 font-mono border border-neutral-700/50">
              <span>ESC</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Results list */}
          <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
            {results.length > 0 ? (
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-3 py-1.5 block">
                  Suggestions ({results.length})
                </span>
                {results.map((p, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPerson(p.id);
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer group ${
                        isActive 
                          ? 'bg-neutral-800/90 border-l-2 border-emerald-500 pl-2' 
                          : 'hover:bg-neutral-800/60 pl-3'
                      }`}
                    >
                      <img
                        src={p.photo}
                        alt={p.name}
                        className={`w-8 h-8 rounded-full object-cover border transition-colors ${
                          isActive ? 'border-emerald-500' : 'border-neutral-800 group-hover:border-emerald-500/50'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold transition-colors ${
                            isActive ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'
                          }`}>
                            {p.name}
                          </span>
                          <span className={`text-[10px] font-mono transition-colors ${
                            isActive ? 'text-emerald-500' : 'text-neutral-500'
                          }`}>
                            {p.id} {isActive && <span className="text-[9px] ml-1 bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/20">↵</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                          {p.profession && <span className="truncate">{p.profession}</span>}
                          {p.profession && p.city && <span className="text-neutral-600">•</span>}
                          {p.city && <span>{p.city}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : query.trim() ? (
              <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
                <Search className="w-8 h-8 text-neutral-600 mb-2" />
                <span className="text-xs font-medium">No family members found</span>
                <span className="text-[11px] text-neutral-600 mt-0.5">Try looking for alternative spellings or cities</span>
              </div>
            ) : (
              // Default view (Recent / Popular list)
              <div className="space-y-4 px-2 py-1.5">
                <div className="space-y-1.5 px-1 pt-1">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Quick Filter Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Oxford', 'London', 'Edinburgh', 'Professor', 'Living', 'Deceased'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-2.5 py-1 bg-[#1D1E21] hover:bg-neutral-800 text-[10px] text-neutral-300 hover:text-emerald-400 rounded-md border border-neutral-800/80 transition-all cursor-pointer font-medium"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-0.5 pt-2">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-1 block mb-1">
                    Patriarchs & Notable Connections
                  </span>
                  {Object.values(people).slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPerson(p.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neutral-800/80 transition-colors cursor-pointer group"
                    >
                      <img
                        src={p.photo}
                        alt={p.name}
                        className="w-7 h-7 rounded-full object-cover border border-neutral-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">
                            {p.name}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-600">
                            {p.id}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
