import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, onClick, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        "glass-card p-6 border border-white/5 hover:border-white/10 transition-all duration-500 backdrop-blur-[32px] bg-white/[0.03]",
        "hover:shadow-[0_0_30px_rgba(255,255,255,0.02)]",
        onClick && "cursor-pointer active:scale-[0.97]",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </motion.div>
  );
};

export const NeonButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'purple' | 'blue' | 'pink' | 'legendary';
  loading?: boolean;
}> = ({ children, onClick, className, variant = 'purple', loading }) => {
  const variants = {
    purple: "from-[#bc00ff] to-[#ff007a] shadow-[0_8px_24px_rgba(188,0,255,0.3)]",
    blue: "from-[#00f2ff] to-[#bc00ff] shadow-[0_8px_24px_rgba(0,242,255,0.3)]",
    pink: "from-[#ff007a] to-[#bc00ff] shadow-[0_8px_24px_rgba(255,0,122,0.3)]",
    legendary: "from-[#ffcc00] to-[#ff8000] shadow-[0_8px_24px_rgba(255,204,0,0.3)]",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative rounded-xl px-8 py-3 font-bold text-white transition-all duration-300 active:scale-95",
        "bg-gradient-to-br disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      ) : children}
    </button>
  );
};
