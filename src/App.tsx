/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Welcome } from './pages/Welcome';
import { Setup } from './pages/Setup';
import { Main } from './pages/Main';
import { Quest } from './pages/Quest';
import { Battle } from './pages/Battle';
import { Market as Shop } from './pages/Market';
import { Evolve } from './pages/Evolve';
import { PetDetail } from './pages/PetDetail';
import { Profile } from './pages/Profile';
import { Navbar } from './components/Navbar';
import { NeonButton } from './components/UI';
import { cn } from './lib/utils';
import { UserProgress, Pet } from './types';

import { updateEnergy, getPetRankByLevel } from './lib/gameLogic';

const INITIAL_PROGRESS: UserProgress = {
  id: Math.random().toString(36).substring(7).toUpperCase(),
  pets: [],
  activePetId: null,
  currency: 5000, 
  inventory: [],
  energy: 10,
  lastEnergyUpdate: Date.now(),
  summonerRank: 'Новичок'
};

const BackgroundDoodles = () => {
  const [doodles] = useState(() => Array.from({ length: 15 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    rotate: Math.random() * 360,
    scale: 0.5 + Math.random() * 1.5,
    type: Math.floor(Math.random() * 3)
  })));

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden opacity-30">
      {doodles.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="absolute text-pen-blue/30"
          style={{ top: d.top, left: d.left, rotate: d.rotate, scale: d.scale }}
        >
          {d.type === 0 ? (
            /* Sparkle / Star */
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 10 L50 90 M10 50 L90 50 M25 25 L75 75 M75 25 L25 75" />
            </svg>
          ) : d.type === 1 ? (
            /* Swirl / Spiral */
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 50 C50 20 80 20 80 50 C80 80 20 80 20 50 C20 30 40 30 40 50" />
            </svg>
          ) : (
             /* Scribble / Hatching mark */
             <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
               <path d="M10 20 L30 10 M15 40 L45 25 M20 60 L60 40 M30 80 L80 50" />
             </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};

import HTMLFlipBook from 'react-pageflip';

const AnimatedRoutes = ({ hasPets, progress, setProgress, handleAddNewPet }: { 
  hasPets: boolean, 
  progress: UserProgress, 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>,
  handleAddNewPet: (pet: Pet) => void
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const flipBookRef = React.useRef<any>(null);

  // Map paths to page indices
  const pageMap: Record<string, number> = {
    '/start': 0,
    '/setup': 1,
    '/main': 2,
    '/pet': 3,
    '/quest': 4,
    '/battle': 5,
    '/shop': 6,
    '/evolve': 7,
    '/profile': 8,
    '/topup': 9
  };

  useEffect(() => {
    if (flipBookRef.current) {
      const path = Object.keys(pageMap).find(p => location.pathname.startsWith(p));
      if (path && pageMap[path] !== undefined) {
        flipBookRef.current.pageFlip().flip(pageMap[path]);
      }
    }
  }, [location.pathname]);

  const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => {
    return (
      <div className="bg-[#f4f1e8] shadow-none relative overflow-hidden h-full border-l border-black/5" ref={ref}>
        <div className="notebook-margin" />
        <div className="p-4 sm:p-8 h-full overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    );
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      {hasPets && <Navbar rubles={progress.currency} />}
      
      <div className="flex-1 h-screen flex items-center justify-center overflow-hidden">
        <HTMLFlipBook 
          width={800} 
          height={1000}
          size="stretch"
          minWidth={315}
          maxWidth={1200}
          minHeight={400}
          maxHeight={1600}
          maxShadowOpacity={0.3}
          showCover={false}
          mobileScrollSupport={true}
          ref={flipBookRef}
          className="flipbook-root"
          style={{ cursor: 'pointer' }}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={window.innerWidth < 1024}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          <Page><Welcome /></Page>
          <Page><Setup onComplete={handleAddNewPet} /></Page>
          <Page><Main progress={progress} setProgress={setProgress} /></Page>
          <Page><PetDetail progress={progress} setProgress={setProgress} /></Page>
          <Page><Quest progress={progress} setProgress={setProgress} /></Page>
          <Page><Battle progress={progress} setProgress={setProgress} /></Page>
          <Page><Shop progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} /></Page>
          <Page>{location.pathname.includes('/evolve') ? <Evolve progress={progress} setProgress={setProgress} /> : <div className="p-12 text-center h-full flex flex-col items-center justify-center font-bold italic text-pen-blue">Выберите питомца для эволюции через главное меню</div>}</Page>
          <Page><Profile progress={progress} setProgress={setProgress} /></Page>
          <Page>
            <div className="p-12 text-center h-full flex flex-col items-center justify-center">
              <h2 className="text-4xl font-black italic text-pen-blue mb-4">Пополнение баланса</h2>
              <p className="text-pen-blue/40 font-black italic max-w-sm mb-8">Интеграция платежной системы aiSai в разработке...</p>
              <NeonButton onClick={() => navigate(-1)}>Назад</NeonButton>
            </div>
          </Page>
        </HTMLFlipBook>
      </div>
    </div>
  );
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('aisai_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all required fields exist for backward compatibility
        const migratedPets = (parsed.pets || []).map((p: any) => ({
          ...p,
          ageStage: p.ageStage && p.ageStage.includes(' - ') ? p.ageStage : getPetRankByLevel(p.level || 1)
        }));

        return {
          ...INITIAL_PROGRESS,
          ...parsed,
          pets: migratedPets,
          inventory: parsed.inventory || INITIAL_PROGRESS.inventory,
          currency: typeof parsed.currency === 'number' ? parsed.currency : INITIAL_PROGRESS.currency,
        };
      } catch (e) {
        return INITIAL_PROGRESS;
      }
    }
    return INITIAL_PROGRESS;
  });

  useEffect(() => {
    localStorage.setItem('aisai_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => updateEnergy(prev));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const hasPets = (progress.pets || []).length > 0;

  const handleAddNewPet = (pet: Pet) => {
    setProgress(prev => {
      return {
        ...prev,
        pets: [...prev.pets, pet],
        activePetId: prev.activePetId || pet.id,
      };
    });
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen relative selection:bg-sticker-blue selection:text-pen-blue">
        <BackgroundDoodles />
        <AnimatedRoutes 
          hasPets={hasPets} 
          progress={progress} 
          setProgress={setProgress} 
          handleAddNewPet={handleAddNewPet} 
        />
      </div>
    </BrowserRouter>
  );
}

