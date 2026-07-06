import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ShieldAlert, X } from 'lucide-react';

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

const ResetConfirmModal = React.memo(function ResetConfirmModal({ onConfirm, onClose }: ResetConfirmModalProps) {
  return (
    <div
      id="reset-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-sm bg-[#161719] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/85 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#1D1E21]/50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-500" />
            <span className="font-semibold text-neutral-100 tracking-tight text-sm">Reset Family Tree?</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-3.5 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-light">
            Are you sure you want to reset the database? This will completely clear all local edits, newly created family records, and custom uploaded avatars, restoring the original <strong className="text-white">Arthur Sterling lineage tree</strong>.
          </p>
        </div>
        <div className="border-t border-neutral-800/60 bg-[#1D1E21]/30 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium rounded-xl transition-all cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer">
            Reset Tree
          </button>
        </div>
      </motion.div>
    </div>
  );
});

export default ResetConfirmModal;
