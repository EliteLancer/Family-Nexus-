import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  isHighContrastLight: boolean;
  onEnter: () => void;
}

const SplashScreen = React.memo(function SplashScreen({ isHighContrastLight, onEnter }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      id="splash-screen"
      className={`absolute inset-0 z-50 flex flex-col justify-center items-center px-6 text-center transition-colors duration-300 ${
        isHighContrastLight ? 'bg-white text-black' : 'bg-[#0B0C0E] text-white'
      }`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/10">
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-4xl font-extralight tracking-[0.2em] text-white uppercase font-sans">
            Family Nexus
          </h1>
          <p className="text-xs text-neutral-400 font-mono tracking-widest uppercase">
            Preserving Generations. Exploring Connections.
          </p>
        </div>
        <div className="pt-8">
          <button
            onClick={onEnter}
            className="px-6 py-2.5 bg-[#161719] hover:bg-neutral-800 text-[11px] font-mono tracking-widest uppercase text-white rounded-lg border border-neutral-800/80 hover:border-emerald-500/30 shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer"
          >
            Enter Explorer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default SplashScreen;
