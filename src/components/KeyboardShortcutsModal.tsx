import React from 'react';
import { motion } from 'motion/react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['\u2318 + K', 'or', '/'], desc: 'Open spotlight search overlay' },
  { keys: ['Space + Drag'], desc: 'Pan around the infinite canvas' },
  { keys: ['+', 'or', '='], desc: 'Zoom in closer on active lineage' },
  { keys: ['-'], desc: 'Zoom out to view wider family tree' },
  { keys: ['0'], desc: 'Recenter layout on home node' },
  { keys: ['P'], desc: 'Highlight paternal ancestors' },
  { keys: ['M'], desc: 'Highlight maternal ancestors' },
  { keys: ['A'], desc: 'Clear lineage highlight (Show All)' },
  { keys: ['S'], desc: 'Toggle statistics insights panel' },
  { keys: ['Ctrl + Z'], desc: 'Undo last action' },
  { keys: ['Ctrl + P'], desc: 'Print clean family lineage tree map' },
  { keys: ['ESC'], desc: 'Close any active overlay or sidebar' },
];

const KeyboardShortcutsModal = React.memo(function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return (
    <div
      id="shortcuts-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md bg-[#161719] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/85 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1D1E21]/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-neutral-100 tracking-tight text-sm">Keyboard Shortcuts Guide</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
            Navigate the Family Nexus lineage map efficiently with these system-wide keyboard bindings.
          </p>
          <div className="space-y-2">
            {SHORTCUTS.map((sh, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-800/40 last:border-0 text-[11px]">
                <span className="text-neutral-400 font-light">{sh.desc}</span>
                <div className="flex items-center gap-1">
                  {sh.keys.map((k, kIdx) => (
                    <span
                      key={kIdx}
                      className={k === 'or' ? 'text-[9px] text-neutral-600 px-0.5' : 'font-mono text-[10px] font-semibold text-neutral-200 bg-neutral-800 border border-neutral-700/60 px-2 py-0.5 rounded shadow-sm'}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-neutral-800/60 bg-[#1D1E21]/30 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium rounded-xl transition-all cursor-pointer">
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
});

export default KeyboardShortcutsModal;
