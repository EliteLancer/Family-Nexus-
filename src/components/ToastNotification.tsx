import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShieldAlert, X, Undo2 } from 'lucide-react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

const ToastNotification = React.memo(function ToastNotification({ message, type, onDismiss, onUndo, canUndo }: ToastNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      className="fixed bottom-6 left-6 z-[100] max-w-sm flex items-center gap-3 px-4 py-3 bg-[#161719] border border-neutral-800 rounded-xl shadow-2xl shadow-black/80"
    >
      <div className={`p-1.5 rounded-lg ${type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {type === 'success' ? <Sparkles className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-medium text-neutral-200 leading-relaxed pr-1">{message}</p>
      </div>
      {canUndo && onUndo && (
        <button
          onClick={onUndo}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-semibold text-amber-400 uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </button>
      )}
      <button onClick={onDismiss} className="p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
});

export default ToastNotification;
