import React, { useState } from 'react';
import { Element, Attribute, Rarity } from '../types';
import { ELEMENT_DATA, ATTRIBUTE_DATA, RARITY_LABELS } from '../constants/gameData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';

export const ElementSticker: React.FC<{ 
  element: Element; 
  showLabel?: boolean; 
  className?: string; 
  onClick?: () => void;
}> = ({ element, showLabel = true, className, onClick }) => {
  const data = ELEMENT_DATA[element];
  const Icon = data.icon;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 border border-black/10 rotate-1 hover:rotate-0 transition-all",
        className
      )}
      style={{ backgroundColor: data.bgColor, color: data.color }}
    >
      <Icon className="h-3 w-3" />
      {showLabel && <span className="text-[10px] font-black uppercase italic">{data.label}</span>}
    </button>
  );
};

export const AttributeSticker: React.FC<{ 
  attribute: Attribute; 
  showLabel?: boolean; 
  className?: string;
  onClick?: () => void;
}> = ({ attribute, showLabel = true, className, onClick }) => {
  const data = ATTRIBUTE_DATA[attribute];
  const Icon = data.icon;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 border border-black/10 -rotate-1 hover:rotate-0 transition-all",
        className
      )}
      style={{ backgroundColor: data.bgColor, color: data.color }}
    >
      <Icon className="h-3 w-3" />
      {showLabel && <span className="text-[10px] font-black uppercase italic">{data.label}</span>}
    </button>
  );
};

export const InfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-[#f2ede0] ledger-grid border-2 border-black p-6 rotate-1"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-black/5 rounded-full transition-colors">
              <X className="h-5 w-5 text-pen-blue" strokeWidth={3} />
            </button>
            <h3 className="text-2xl font-black italic text-pen-blue mb-4 uppercase tracking-tight">{title}</h3>
            <div className="space-y-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const TypeChartContent: React.FC<{ element?: Element; attribute?: Attribute }> = ({ element, attribute }) => {
  if (element) {
    const data = ELEMENT_DATA[element];
    const sequence: Element[] = ['water', 'fire', 'air', 'earth'];
    const currentIndex = sequence.indexOf(element);
    
    return (
      <div className="space-y-6">
        <p className="text-sm font-black italic text-pen-blue/70 leading-relaxed">
          {data.description}
        </p>
        
        <div className="flex flex-col items-center gap-4 py-6 bg-white/30 rounded-xl border-2 border-dashed border-black/5">
           <div className="flex items-center gap-4">
              <ElementSticker element={sequence[0]} className={cn(element === sequence[0] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-lg text-pen-blue/30">→</span>
              <ElementSticker element={sequence[1]} className={cn(element === sequence[1] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
           <div className="flex items-center gap-4">
              <span className="rotate-90 text-lg text-pen-blue/30 leading-none h-6">↑</span>
              <div className="w-[80px]" />
              <span className="rotate-90 text-lg text-pen-blue/30 leading-none h-6">↓</span>
           </div>
           <div className="flex items-center gap-4">
              <ElementSticker element={sequence[3]} className={cn(element === sequence[3] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-lg text-pen-blue/30">←</span>
              <ElementSticker element={sequence[2]} className={cn(element === sequence[2] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-pen-blue/40 tracking-widest">Атака x2 над:</span>
            <ElementSticker element={data.strongAgainst} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-pen-blue/40 tracking-widest">Уязвим к:</span>
            <ElementSticker element={data.weakTo} />
          </div>
        </div>
      </div>
    );
  }

  if (attribute) {
    const data = ATTRIBUTE_DATA[attribute];
    const sequence: Attribute[] = ['light', 'dark', 'void', 'time'];
    
    return (
      <div className="space-y-6">
        <p className="text-sm font-black italic text-pen-blue/70 leading-relaxed">
          {data.description}
        </p>

        <div className="flex flex-col items-center gap-4 py-6 bg-white/30 rounded-xl border-2 border-dashed border-black/5">
           <div className="flex items-center gap-4">
              <AttributeSticker attribute={sequence[0]} className={cn(attribute === sequence[0] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-lg text-pen-blue/30">→</span>
              <AttributeSticker attribute={sequence[1]} className={cn(attribute === sequence[1] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
           <div className="flex items-center gap-4">
              <span className="rotate-90 text-lg text-pen-blue/30 leading-none h-6">↑</span>
              <div className="w-[80px]" />
              <span className="rotate-90 text-lg text-pen-blue/30 leading-none h-6">↓</span>
           </div>
           <div className="flex items-center gap-4">
              <AttributeSticker attribute={sequence[3]} className={cn(attribute === sequence[3] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-lg text-pen-blue/30">←</span>
              <AttributeSticker attribute={sequence[2]} className={cn(attribute === sequence[2] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
        </div>
        
        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-pen-blue/40 tracking-widest">Защита x2 от:</span>
            <AttributeSticker attribute={data.opponent} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};
