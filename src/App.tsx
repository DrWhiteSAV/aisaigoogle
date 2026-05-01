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
import { TopUp } from './pages/TopUp';
import { Navbar } from './components/Navbar';
import { NeonButton } from './components/UI';
import { cn } from './lib/utils';
import { Coins, Plus } from 'lucide-react';
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

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; side?: 'left' | 'right' }>(({ children, side }, ref) => {
  return (
    <div className={cn(
      "bg-[#f2ede0] ledger-grid shadow-none relative overflow-hidden h-full",
      side === 'left' ? "border-r border-black/[0.03]" : "border-l border-black/[0.03]"
    )} ref={ref}>
      {/* Dynamic Spine Highlight - simulating the physical fold */}
      <div className={cn(
        "absolute top-0 bottom-0 w-24 pointer-events-none z-20",
        side === 'left' 
          ? "right-0 bg-gradient-to-l from-black/[0.08] via-black/[0.02] to-transparent" 
          : "left-0 bg-gradient-to-r from-black/[0.08] via-black/[0.02] to-transparent"
      )} />
      
      {/* Signature Red Margin Lines */}
      <div className={cn(
        "absolute top-0 bottom-0 w-[1px] bg-red-400/[0.15] pointer-events-none z-20",
        side === 'left' ? "right-12" : "left-12"
      )} />
      <div className={cn(
        "absolute top-0 bottom-0 w-[1px] bg-red-400/[0.05] pointer-events-none z-20",
        side === 'left' ? "right-14" : "left-14"
      )} />
      
      <div className="p-6 sm:p-8 pt-[10px] h-full overflow-y-auto no-scrollbar relative z-10">
        {children}
      </div>
    </div>
  );
});

const AnimatedRoutes = ({ hasPets, progress, setProgress, handleAddNewPet }: { 
  hasPets: boolean, 
  progress: UserProgress, 
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>,
  handleAddNewPet: (pet: Pet) => void
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const flipBookRef = React.useRef<any>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [summoningPet, setSummoningPet] = useState<Pet | null>(null);
  const [isSummoning, setIsSummoning] = useState(false);
  const [summoningError, setSummoningError] = useState<string | null>(null);

  // Clear summoning state when leaving onboarding or make page
  useEffect(() => {
    if (!location.pathname.startsWith('/make') && !location.pathname.startsWith('/setup') && !location.pathname.startsWith('/about')) {
      setSummoningPet(null);
      setIsSummoning(false);
      setSummoningError(null);
    }
  }, [location.pathname]);

  const handlePetSummonComplete = (pet: Pet) => {
    handleAddNewPet(pet);
    setSummoningPet(null);
    setIsSummoning(false);
  };

  // Extract ID manually for components rendered inside FlipBook
  const activePetId = React.useMemo(() => {
    const match = location.pathname.match(/\/pet\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map paths to book indices and logical spreads
  const bookPages: Record<string, number> = {
    '/start': 0,
    '/setup': 2,
    '/about': 4,
    '/make': 6,
    '/main': 8,
    '/pet': 8,
    '/inventory': 10,
    '/battle': 12,
    '/evolve': 14,
    '/quest': 16,
    '/shop': 18,
    '/summon': 20,
    '/sale': 22,
    '/profile': 24,
    '/configs': 26,
    '/topup': 28
  };

  const getPageFromPath = (path: string) => {
    if (path === '/' || path === '/start') return 0;
    if (path === '/setup') return 2;
    if (path === '/about') return 4;
    if (path === '/make') return 6;
    if (path === '/main' || path.startsWith('/pet/')) return 8;
    if (path.startsWith('/inventory')) return 10;
    if (path.startsWith('/battle')) return 12;
    if (path.startsWith('/evolve')) return 14;
    if (path.startsWith('/quest')) return 16;
    if (path === '/shop') return 18;
    if (path === '/summon') return 20;
    if (path === '/sale') return 22;
    if (path === '/profile') return 24;
    if (path === '/configs' || path === '/settings') return 26;
    if (path === '/topup') return 28;
    return 0;
  };

  useEffect(() => {
    const targetPage = getPageFromPath(location.pathname);
    
    const timer = setTimeout(() => {
      try {
        if (flipBookRef.current) {
          const pageFlip = typeof flipBookRef.current.pageFlip === 'function' ? flipBookRef.current.pageFlip() : null;
          
          if (pageFlip && typeof pageFlip.getCurrentPageIndex === 'function' && typeof pageFlip.flip === 'function') {
            const currentPage = pageFlip.getCurrentPageIndex();
            if (currentPage !== targetPage) {
              pageFlip.flip(targetPage);
            }
          }
        }
      } catch (e) {
        console.warn("Page flip sync failed:", e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isPortrait = windowSize.width < 1024;

  const isOnboarding = location.pathname === '/' || location.pathname === '/start' || location.pathname === '/setup' || location.pathname === '/about' || location.pathname === '/make';

  if (isPortrait) {
    const showNav = hasPets && !isOnboarding;
    return (
      <div className="flex flex-col min-h-screen pt-16 pb-20 bg-transparent ledger-grid overflow-y-auto w-full px-4 gap-6">
        {showNav && <Navbar rubles={progress.currency} />}
        
        {(() => {
          const sortedPaths = Object.keys(bookPages).sort((a, b) => b.length - a.length);
          const path = sortedPaths.find(p => location.pathname.startsWith(p));
          
          if (path === '/start') return <Page side="left"><Welcome onSetup={() => navigate('/setup/1')} /></Page>;
          if (path?.startsWith('/setup')) {
            const step = parseInt(location.pathname.split('/').pop() || '1') || 1;
            return <Page side="right"><Setup onComplete={handleAddNewPet} step={step} /></Page>;
          }
          
          if (path?.startsWith('/main') || path?.startsWith('/pet') || path === '/inventory' || path === '/battle' || path === '/evolve' || path === '/quest') {
             return (
               <div className="space-y-6">
                 <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
                 <div className="border-t-2 border-dashed border-black/5 pt-6">
                    {path === '/inventory' ? <PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} initialTab="inventory" /> :
                     path === '/battle' ? <Battle progress={progress} setProgress={setProgress} /> :
                     path === '/evolve' ? <Evolve progress={progress} setProgress={setProgress} /> :
                     path === '/quest' ? <Quest progress={progress} setProgress={setProgress} /> :
                     <PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} />}
                 </div>
               </div>
             );
          }
 
          if (path?.startsWith('/shop') || path === '/summon' || path === '/sale') {
            return (
              <div className="space-y-6">
                <Page side="left"><Shop progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} mode={path === '/sale' ? 'sell' : 'buy'} /></Page>
                {path === '/summon' && <Page side="right"><Setup onComplete={handleAddNewPet} step={1} isMarketSummon /></Page>}
              </div>
            );
          }
 
          if (path?.startsWith('/profile') || path === '/configs' || path === '/topup') {
            return (
              <div className="space-y-6">
                <Page side="left"><Profile progress={progress} setProgress={setProgress} view="main" /></Page>
                <Page side="right">
                   {path === '/configs' ? <Profile progress={progress} setProgress={setProgress} view="settings" /> :
                    path === '/topup' ? <TopUp progress={progress} setProgress={setProgress} /> :
                      <div className="text-center h-full flex flex-col items-center justify-center p-8 opacity-20">
                        <h2 className="text-xl font-black italic text-pen-blue">Инфо</h2>
                      </div>
                    }
                </Page>
              </div>
            );
          }
          
          return <div className="p-10 text-center italic text-pen-blue animate-pulse">Инициализация модуля...</div>;
        })()}
      </div>
    );
  }

  const onFlip = (e: any) => {
    const newIndex = (e && typeof e.data === 'number') ? e.data : (typeof e === 'number' ? e : null);
    if (newIndex === null) return;

    const targetBaseIndex = Math.floor(newIndex / 2) * 2;
    const currentBasePage = getPageFromPath(location.pathname);
    
    if (currentBasePage !== targetBaseIndex) {
      const entry = Object.entries(bookPages).find(([_, idx]) => idx === targetBaseIndex);
      if (entry) {
        navigate(entry[0]);
      }
    }
  };

    const showNav = hasPets && !isOnboarding;
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent relative selection:bg-sticker-blue/30 overflow-hidden">
        <div className="absolute inset-0 bg-black/5 -z-10" />
        
        {showNav && <Navbar rubles={progress.currency} />}
        
        <div className="w-full h-screen flex items-center justify-center overflow-hidden">
          <HTMLFlipBook 
            key={`flipbook-${isPortrait}-${windowSize.height}`}
            width={800} 
            height={windowSize.height}
            size="stretch"
            minWidth={315}
            maxWidth={1400}
            minHeight={100}
            maxHeight={2000}
            maxShadowOpacity={0.15}
            showCover={false}
            mobileScrollSupport={true}
            ref={flipBookRef}
            className="flipbook-root"
            style={{ cursor: isOnboarding ? 'default' : 'grab' }}
            onFlip={onFlip}
            startPage={0}
            drawShadow={true}
            flippingTime={800}
            useMouseEvents={!isOnboarding}
            clickEventForward={true}
            usePortrait={false}
            startZIndex={0}
            autoSize={true}
            showPageCorners={!isOnboarding}
            disableFlipByClick={true}
          >
          {/* BOOK 0: ONBOARDING FLOW */}
          <Page side="left"><Welcome side="left" /></Page>
          <Page side="right"><Welcome side="right" onSetup={() => navigate('/setup')} /></Page>
          
          {/* Personality (Left) + Manifesto (Right) */}
          <Page side="left"><Setup onComplete={handlePetSummonComplete} step={1} side="left" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          <Page side="right"><Setup onComplete={handlePetSummonComplete} step={1} side="right" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          
          {/* Hobbies (Left) + Soul Traits (Right) */}
          <Page side="left"><Setup onComplete={handlePetSummonComplete} step={2} side="left" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          <Page side="right"><Setup onComplete={handlePetSummonComplete} step={2} side="right" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          
          {/* Generation (Left) + Description (Right) */}
          <Page side="left"><Setup onComplete={handlePetSummonComplete} step={3} side="left" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          <Page side="right"><Setup onComplete={handlePetSummonComplete} step={3} side="right" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          
          {/* BOOK 1: BESTIARY (Spreads 4-8) */}
          {/* Spread: Main + Detail */}
          <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
          <Page side="right"><PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} /></Page>
          
          {/* Spread: Main + Inventory */}
          <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
          <Page side="right"><PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} initialTab="inventory" /></Page>
          
          {/* Spread: Main + Battle */}
          <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
          <Page side="right"><Battle progress={progress} setProgress={setProgress} /></Page>
          
          {/* Spread: Main + Evolve */}
          <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
          <Page side="right"><Evolve progress={progress} setProgress={setProgress} manualId={activePetId || undefined} /></Page>
          
          {/* Spread: Main + Quest */}
          <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
          <Page side="right"><Quest progress={progress} setProgress={setProgress} /></Page>
 
          {/* BOOK 2: SHOP (Spreads 9-11) */}
          <Page side="left"><Shop progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} mode="buy" /></Page>
          <Page side="right"><div className="h-full flex flex-col items-center justify-center italic text-pen-blue/20">Выберите товар...</div></Page>
          
          <Page side="left"><Shop progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} mode="buy" /></Page>
          <Page side="right"><Setup onComplete={handleAddNewPet} step={1} isMarketSummon externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} /></Page>
          
          <Page side="left"><Shop progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} mode="sell" /></Page>
          <Page side="right"><TopUp progress={progress} setProgress={setProgress} /></Page>
 
          {/* BOOK 3: PROFILE (Spreads 12-14) */}
          <Page side="left"><Profile progress={progress} setProgress={setProgress} view="main" /></Page>
          <Page side="right"><div className="h-full flex flex-col items-center justify-center italic text-pen-blue/20">Личное дело...</div></Page>
          
          <Page side="left"><Profile progress={progress} setProgress={setProgress} view="main" /></Page>
          <Page side="right"><Profile progress={progress} setProgress={setProgress} view="settings" /></Page>
 
          <Page side="left"><Profile progress={progress} setProgress={setProgress} view="main" /></Page>
          <Page side="right">
            <TopUp progress={progress} setProgress={setProgress} />
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
          inventory: Array.isArray(parsed.inventory) ? parsed.inventory : INITIAL_PROGRESS.inventory,
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

