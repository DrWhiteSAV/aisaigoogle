import React from 'react';
import { motion } from 'motion/react';
import { Pet } from '../types';
import { RARITY_LABELS, RARITY_STYLES } from '../constants/gameData';
import { ElementSticker, AttributeSticker } from './GameUI';
import { cn } from '../lib/utils';

interface GalleryCardProps {
  pet: Pet;
  showPrice?: number;
  className?: string;
  onClick?: () => void;
  isCompact?: boolean;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ 
  pet, 
  showPrice, 
  className = "",
  onClick,
  isCompact = false
}) => {
  const rarityStyle = RARITY_STYLES[pet.rarity] || RARITY_STYLES.normal;
  const fontSize = isCompact ? "text-[8px]" : "text-[16px]";
  const nameFontSize = isCompact ? "text-[10px]" : "text-[18px]";
  const stickerScale = isCompact ? "scale-[0.55]" : "scale-100";

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("relative group cursor-pointer aspect-[9/16] w-full", className)}
      onClick={onClick}
    >
      {/* CP Badge */}
      <div 
        className={cn(
          "absolute z-[60] bg-sticker-yellow border-2 rotate-3",
          isCompact ? "top-0.5 right-0.5 px-1 py-0 border-thin" : "top-1 right-1 px-2 py-0.5"
        )}
        style={{ borderColor: rarityStyle.color }}
      >
        <span className={cn("font-black", fontSize)}>{calculateCP(pet)}</span>
      </div>

      {/* Rarity Tag */}
      <div 
        className={cn(
          "absolute z-[60] border-2 -rotate-3",
          isCompact ? "top-0.5 left-0.5 px-1 py-0 border-thin" : "top-1 left-1 px-2 py-0.5"
        )}
        style={{ backgroundColor: rarityStyle.bgColor, color: rarityStyle.color, borderColor: rarityStyle.color }}
      >
        <span className={cn("font-black", fontSize)}>{RARITY_LABELS[pet.rarity]}</span>
      </div>

      <div className="w-full h-full relative group shadow-sm bg-white border-2 border-black/5 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={pet.image} 
            alt={pet.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-white via-white/80 to-transparent opacity-95 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Stickers (Element/Attribute) - Higher up to avoid overlap */}
        <div className={cn(
          "absolute inset-x-0 flex justify-center gap-4 z-40 pointer-events-none px-4",
          isCompact ? "bottom-14 gap-1" : "bottom-20"
        )}>
           <div className={cn("rotate-[-4deg] origin-center", stickerScale)}>
              <ElementSticker element={pet.element} />
           </div>
           <div className={cn("rotate-[4deg] origin-center", stickerScale)}>
              <AttributeSticker attribute={pet.attribute} />
           </div>
        </div>

        {/* Metadata Overlay */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 z-[50] overflow-visible",
          isCompact ? "p-1 pb-1.5" : "p-3 pb-5"
        )}>
           {/* Gradient background with better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent z-[-1] pointer-events-none" />
          
          <div className="flex justify-between items-start gap-1 mb-0.5">
            <h3 className={cn("font-black text-pen-blue leading-[1.1] text-balance", nameFontSize)}>
              {pet.name}
            </h3>
            <span className={cn("font-black text-pen-blue whitespace-nowrap leading-none shrink-0", fontSize)}>LVL {pet.level}</span>
          </div>
          
          <div className="flex items-center justify-between font-black text-pen-blue italic leading-tight">
            <span className={cn("opacity-80", fontSize)}>{pet.ageStage.split(' - ')[1] || pet.ageStage}</span>
          </div>

          {showPrice !== undefined && (
            <div className={cn("font-black text-pen-blue mt-1.5 italic text-center w-full", isCompact ? "text-[12px]" : "text-[20px]")}>{showPrice} 🌱</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Helper inside the file to avoid import cycles if needed, 
// though we usually import from lib/gameLogic
function calculateCP(pet: Pet): number {
  const base = (pet.stats.attack + pet.stats.defense + pet.stats.speed + pet.stats.health / 5);
  return Math.floor(base * (1 + (pet.level - 1) * 0.1));
}
