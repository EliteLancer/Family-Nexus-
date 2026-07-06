import React from 'react';
import { motion } from 'motion/react';
import { TreePine, Plus } from 'lucide-react';

interface EmptyStateProps {
  isAdmin: boolean;
  onEnableAdmin: () => void;
}

const EmptyState = React.memo(function EmptyState({ isAdmin, onEnableAdmin }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6"
    >
      <div className="space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/5">
          <TreePine className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-200 tracking-tight">
            Start Your Family Tree
          </h2>
          <p className="text-sm text-neutral-400 font-light leading-relaxed">
            Your family tree is empty. Import a backup file or enable Administrator Mode to add your first family member.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={onEnableAdmin}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Enable Admin Mode
          </button>
        )}

        {isAdmin && (
          <p className="text-xs text-emerald-400 font-medium">
            Use the Import button in the toolbar to load a backup, or reset to seed data.
          </p>
        )}
      </div>
    </motion.div>
  );
});

export default EmptyState;
