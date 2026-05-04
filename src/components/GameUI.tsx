import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
        "flex items-center gap-1.5 transition-all bg-stone-50/40 rounded-lg px-2 py-0.5 border border-white/20",
        className
      )}
      style={{ color: data.color }}
    >
      <Icon className="h-6 w-6" />
      {showLabel && <span className="text-[20px] font-black">{data.label}</span>}
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
        "flex items-center gap-1.5 transition-all bg-stone-50/40 rounded-lg px-2 py-0.5 border border-white/20",
        className
      )}
      style={{ color: data.color }}
    >
      <Icon className="h-6 w-6" />
      {showLabel && <span className="text-[20px] font-black">{data.label}</span>}
    </button>
  );
};

export const InfoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showClose?: boolean;
  plain?: boolean;
}> = ({ isOpen, onClose, title, children, showClose = true, plain = false }) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4 h-screen w-screen"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 cursor-pointer"
        />
        <motion.div 
          initial={plain ? { opacity: 0, scale: 0.98 } : { opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={plain ? { opacity: 0, scale: 0.98 } : { opacity: 0, scale: 0.9, y: 20 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative pointer-events-auto z-10",
            plain 
              ? "flex items-center justify-center p-4 max-h-screen" 
              : "w-full max-w-sm bg-[#f2ede0] ledger-grid border-2 border-black p-6 rotate-1 shadow-2xl"
          )}
        >
          {showClose && (
            <button 
              onClick={onClose} 
              className={cn(
                "absolute z-50 p-2 hover:bg-white/10 rounded-full transition-colors",
                plain ? "top-4 right-4 sm:top-[-50px] sm:right-[-50px] text-white hover:scale-110" : "top-4 right-4 text-pen-blue"
              )}
            >
              <X className={plain ? "h-8 w-8" : "h-6 w-6"} strokeWidth={3} />
            </button>
          )}
          {!plain && <h3 className="text-2xl font-black text-pen-blue mb-4 tracking-tight">{title}</h3>}
          <div className={plain ? "flex items-center justify-center overflow-hidden rounded-lg max-h-[85vh] aspect-[9/16]" : "space-y-4"}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export const TypeChartContent: React.FC<{ element?: Element; attribute?: Attribute }> = ({ element, attribute }) => {
  if (element) {
    const data = ELEMENT_DATA[element];
    const sequence: Element[] = ['water', 'fire', 'air', 'earth'];
    const currentIndex = sequence.indexOf(element);
    
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-black text-pen-blue/70 leading-tight">
            {data.description}
          </p>
          <p className="text-[12px] font-bold text-pen-blue/50 italic leading-snug">
            Цикл стихий: Вода → Огонь → Воздух → Земля → Вода. Питомец с превосходящей стихией наносит на 50% больше урона (Атака и Магия x1.5).
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4 py-4">
           <div className="flex items-center gap-4">
              <ElementSticker element={sequence[0]} className={cn(element === sequence[0] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">→</span>
              <ElementSticker element={sequence[1]} className={cn(element === sequence[1] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xl text-pen-blue/30 leading-none">↑</span>
              <div className="w-[120px]" />
              <span className="text-xl text-pen-blue/30 leading-none">↓</span>
           </div>
           <div className="flex items-center gap-4">
              <ElementSticker element={sequence[3]} className={cn(element === sequence[3] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">←</span>
              <ElementSticker element={sequence[2]} className={cn(element === sequence[2] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-pen-blue/40 tracking-widest uppercase">Атака x1.5 над:</span>
            <ElementSticker element={data.strongAgainst} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-pen-blue/40 tracking-widest uppercase">Уязвим к:</span>
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
        <div className="space-y-2">
          <p className="text-sm font-black text-pen-blue/70 leading-tight">
            {data.description}
          </p>
          <p className="text-[12px] font-bold text-pen-blue/50 italic leading-snug">
            Цикл атрибутов: Свет → Тьма → Пустота → Время → Свет. Питомец с превосходящим атрибутом получает на 50% больше Защиты (Защита x1.5).
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
           <div className="flex items-center gap-4">
              <AttributeSticker attribute={sequence[0]} className={cn(attribute === sequence[0] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">→</span>
              <AttributeSticker attribute={sequence[1]} className={cn(attribute === sequence[1] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xl text-pen-blue/30 leading-none">↑</span>
              <div className="w-[120px]" />
              <span className="text-xl text-pen-blue/30 leading-none">↓</span>
           </div>
           <div className="flex items-center gap-4">
              <AttributeSticker attribute={sequence[3]} className={cn(attribute === sequence[3] && "ring-2 ring-pen-blue ring-offset-2")} />
              <span className="text-xl text-pen-blue/30">←</span>
              <AttributeSticker attribute={sequence[2]} className={cn(attribute === sequence[2] && "ring-2 ring-pen-blue ring-offset-2")} />
           </div>
        </div>
        
        <div className="space-y-3 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-pen-blue/40 tracking-widest uppercase">Защита x1.5 от:</span>
            <AttributeSticker attribute={data.opponent} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};
