import React from 'react';
import { cn } from '../lib/utils';
import { Pet, Rarity } from '../types';
import { NeonButton } from './UI';
import { RARITY_STYLES, RARITY_LABELS } from '../constants/gameData';
import { getPetRankByLevel, getExpNeeded } from '../lib/gameLogic';

interface PetEvolutionCardProps {
  pet: Pet;
  isSelected: boolean;
  isEvolving: boolean;
  onSelect: () => void;
  onLevelUp: (e: React.MouseEvent) => void;
}

export const PetEvolutionCard: React.FC<PetEvolutionCardProps> = ({
  pet,
  isSelected,
  isEvolving,
  onSelect,
  onLevelUp
}) => {
  const pRankCode = getPetRankByLevel(pet.level).split(' ')[0];
  const pCurrentRankCode = pet.ageStage.split(' ')[0];
  const pRankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(pRankCode);
  const pExpectedSkills = (pRankIndex * 2) + 2;
  
  const potentialRank = getPetRankByLevel(pet.level);
  
  const isMajor = pRankCode !== pCurrentRankCode || (pet.level >= 11 && (pet.skills || []).length < pExpectedSkills);
  const rarityType = pet.rarity.toLowerCase() as Rarity;
  const rarityStyle = RARITY_STYLES[rarityType] || RARITY_STYLES.normal;

  return (
    <div 
      onClick={onSelect}
      className={cn(
        "group relative aspect-[9/16] bg-white border-2 transition-all duration-300 cursor-pointer overflow-visible mb-12",
        isSelected ? "scale-105 z-10 shadow-xl" : "border-black/5 hover:scale-100 scale-[0.98]"
      )}
      style={isSelected ? { borderColor: rarityStyle.color } : {}}
    >
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={pet.image} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          referrerPolicy="no-referrer" 
          alt={pet.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent opacity-80" />
      </div>

      {/* Top Left Indicators: Rarity and Level */}
      <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5 items-start">
        <div 
          className="px-1.5 py-0 text-[14px] font-black border-2 bg-white shadow-sm"
          style={{ 
            borderColor: rarityStyle.color,
            color: rarityStyle.color
          }}
        >
          {RARITY_LABELS[rarityType]}
        </div>
        <div className="text-[14px] font-black text-pen-blue bg-transparent px-1">
          Ур. {pet.level}
        </div>
      </div>

      {/* Ascend Button or Exp Progress */}
      {isSelected && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-center">
          {isMajor ? (
            <NeonButton 
              onClick={(e) => { e.stopPropagation(); onLevelUp(e); }}
              disabled={isEvolving}
              className="py-1.5 px-4 text-[20px] font-black shadow-lg border-2 w-fit mx-auto whitespace-nowrap bg-pen-red text-white border-white/20 animate-pulse"
            >
              {isEvolving ? "Рисуется..." : "Вознестись"}
            </NeonButton>
          ) : (
             <div className="bg-white/80 border-2 border-pen-blue px-3 py-1 text-center w-[90%]">
                <div className="text-[12px] font-black text-pen-blue">Опыт</div>
                <div className="w-full bg-black/10 h-2 rounded-full mt-1 overflow-hidden">
                   <div 
                     className="bg-sticker-blue h-full"
                     style={{ width: `${Math.min(100, (pet.experience / (getExpNeeded(pet.level) || 1)) * 100)}%` }}
                   />
                </div>
                <div className="text-[10px] font-black text-pen-blue/60 mt-0.5">
                   {pet.experience} / {getExpNeeded(pet.level)}
                </div>
             </div>
          )}
        </div>
      )}
      
      {/* Name and Rank (displayed below the card via relative positioning of parent) */}
      <div className="absolute top-full left-0 right-0 pt-2 flex flex-col items-center">
        <div className="text-[16px] font-black text-pen-blue truncate w-full text-center px-1">
          {pet.name}
        </div>
        <div className="text-[16px] font-black text-pen-blue tracking-tighter italic">
          {pet.ageStage}
        </div>
      </div>
    </div>
  );
};
