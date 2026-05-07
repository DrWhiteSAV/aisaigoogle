import React from 'react';
import { UserProgress, Pet, Rarity } from '../types';
import { cn } from '../lib/utils';
import { RARITY_LABELS, RARITY_STYLES } from '../constants/gameData';
import { ElementSticker, AttributeSticker } from '../components/GameUI';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

interface GalleryPetCardProps {
  pet: Pet;
}

import { GalleryCard } from '../components/GalleryCard';

const GalleryPetCard: React.FC<GalleryPetCardProps> = ({ pet }) => {
  return (
    <div className="p-1 w-full max-w-[280px] mx-auto">
      <GalleryCard 
        pet={pet} 
      />
    </div>
  );
};

export const Gallery: React.FC<{ progress: UserProgress; side?: 'left' | 'right'; spreadIndex?: number }> = ({ progress, side = 'left', spreadIndex = 0 }) => {
  const navigate = useNavigate();
  const pets = progress.pets || [];
  
  // spreadIndex is 0-based. Each spread has 2 pages.
  // Left page: (index * 2) + 1, Right page: (index * 2) + 2
  const currentPage = spreadIndex * 2 + (side === 'left' ? 1 : 2);
  const petsPerPageSide = 2;
  const startIndex = spreadIndex * 4 + (side === 'left' ? 0 : 2);
  const sidePets = pets.slice(startIndex, startIndex + petsPerPageSide);
  
  const totalSpreads = Math.max(1, Math.ceil(pets.length / 4));

  if (pets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-24 h-24 border-4 border-dashed border-black/10 rounded-full flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-black/10" />
        </div>
        <h2 className="text-2xl font-black text-pen-blue">Галерея пуста</h2>
        <p className="text-pen-blue/60 font-medium italic">Призовите сущностей, чтобы наполнить книгу</p>
      </div>
    );
  }

  const handlePrev = () => {
    if (spreadIndex > 0) navigate(`/gallery/${(spreadIndex - 1) * 2 + 1}`);
  };

  const handleNext = () => {
    if (spreadIndex < totalSpreads - 1) navigate(`/gallery/${(spreadIndex + 1) * 2 + 1}`);
  };

  const hasPetsOnThisPage = sidePets.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-black text-pen-blue italic tracking-tighter flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Галерея Питомцев
        </h2>
      </div>

      <div className="flex-1 min-h-0 bg-white/10 border-2 border-black/5 rounded-sm p-3 overflow-hidden">
        <div className="grid grid-cols-2 gap-x-3 h-full">
           {sidePets.map((pet) => (
             <GalleryPetCard key={pet.id} pet={pet} />
           ))}
           {sidePets.length === 0 && (
             <div className="col-span-2 h-full flex items-center justify-center border-2 border-dashed border-black/5">
                <div className="text-[10px] font-black text-pen-blue/20 tracking-widest text-center">
                  Эта страница<br/>пока пуста
                </div>
             </div>
           )}
        </div>
      </div>
      
      <div className="pt-4 flex items-center justify-between shrink-0">
        <button 
          onClick={handlePrev}
          disabled={spreadIndex <= 0 || side === 'right'}
          className={cn(
            "p-1 rounded-full transition-colors",
            (spreadIndex <= 0 || side === 'right') ? "opacity-0 pointer-events-none" : "hover:bg-black/5 text-pen-blue"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center font-black text-pen-blue text-[16px]">
           {hasPetsOnThisPage ? `Лист ${currentPage}` : ""}
        </div>

        <button 
          onClick={handleNext}
          disabled={spreadIndex >= totalSpreads - 1 || side === 'left'}
          className={cn(
            "p-1 rounded-full transition-colors",
            (spreadIndex >= totalSpreads - 1 || side === 'left') ? "opacity-0 pointer-events-none" : "hover:bg-black/5 text-pen-blue"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
