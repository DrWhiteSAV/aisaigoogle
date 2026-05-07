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
import { Gallery } from './pages/Gallery';
import { PetDetail } from './pages/PetDetail';
import { Profile } from './pages/Profile';
import { TopUp } from './pages/TopUp';
import { Navbar } from './components/Navbar';
import { NeonButton } from './components/UI';
import { cn } from './lib/utils';
import { Sprout, Plus, Compass } from 'lucide-react';
import { UserProgress, Pet, UserProfile, Rarity } from './types';
import { generatePetStatsAndLore, generatePetArt } from './services/aiService';

import { updateEnergy, getPetRankByLevel, distributeStats, RARITY_WEIGHTS } from './lib/gameLogic';

const INITIAL_PROGRESS: UserProgress = {
  id: Math.random().toString(36).substring(7).toUpperCase(),
  pets: [],
  activePetId: null,
  sprouts: 5000, 
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
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 10 L50 90 M10 50 L90 50 M25 25 L75 75 M75 25 L25 75" />
            </svg>
          ) : d.type === 1 ? (
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 50 C50 20 80 20 80 50 C80 80 20 80 20 50 C20 30 40 30 40 50" />
            </svg>
          ) : (
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
      "bg-[#f2ede0] ledger-grid shadow-none relative h-full",
      side === 'left' ? "border-r border-black/[0.03]" : "border-l border-black/[0.03]"
    )} ref={ref}>
      <div className={cn(
        "absolute top-0 bottom-0 w-24 pointer-events-none z-20",
        side === 'left' 
          ? "right-0 bg-gradient-to-l from-black/[0.08] via-black/[0.02] to-transparent" 
          : "left-0 bg-gradient-to-r from-black/[0.08] via-black/[0.02] to-transparent"
      )} />
      
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

const BestiaryActionPage = ({ 
  side, forceType, spreadIndex, progress, setProgress, activePetId, toggleFlipLock, onAddNewPet, profile,
  onStartSummon, summoningPet, isSummoning, summoningError, setSummoningPet, setIsSummoning, setSummoningError, setUserProfile
}: { 
  side: 'left' | 'right', 
  forceType?: 'gallery' | 'evolve' | 'battle' | 'quest' | 'shop' | 'profile' | 'topup' | 'inventory', 
  spreadIndex?: number,
  progress: UserProgress,
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>,
  activePetId?: string | null,
  toggleFlipLock: (id: string, locked: boolean) => void,
  onAddNewPet?: (pet: Pet) => void,
  profile: UserProfile,
  onStartSummon?: () => void,
  summoningPet?: Pet | null,
  isSummoning?: boolean,
  summoningError?: string | null,
  setSummoningPet?: (pet: Pet | null) => void,
  setIsSummoning?: (val: boolean) => void,
  setSummoningError?: (err: string | null) => void,
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile>>
}) => {
  const location = useLocation();
  const path = location.pathname;
  const pathParts = path.split('/');
  const currentBattleId = path.includes('/battle') ? pathParts[pathParts.length - 1] : undefined;

  const effectiveType = forceType || (
    path.includes('/inventory') ? 'inventory' :
    path.includes('/battle') ? 'battle' :
    path.includes('/evolve') ? 'evolve' :
    path.includes('/gallery') ? 'gallery' :
    path.includes('/quest') ? 'quest' :
    path.includes('/shop') || path.includes('/sale') || path.includes('/summon') ? 'shop' :
    path.includes('/profile') || path.includes('/configs') || path.includes('/settings') ? 'profile' :
    path.includes('/topup') ? 'topup' :
    'gallery'
  );

  if (effectiveType === 'inventory') {
    const targetPetId = progress.pets[spreadIndex || 0]?.id || activePetId;
    
    if (side === 'left') return <Main progress={progress} setProgress={setProgress} manualActiveId={targetPetId} />;
    return <PetDetail progress={progress} setProgress={setProgress} manualId={targetPetId} initialTab="inventory" toggleFlipLock={toggleFlipLock} id={`inv-${side}-${spreadIndex}`} onAddNewPet={onAddNewPet} />;
  }
  if (effectiveType === 'battle') {
    return <Battle key={currentBattleId} progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} manualId={activePetId} side={side} battleId={currentBattleId} />;
  }
  if (effectiveType === 'evolve') {
    const targetPetId = progress.pets[spreadIndex || 0]?.id || activePetId;
    return <Evolve progress={progress} setProgress={setProgress} manualId={targetPetId || undefined} toggleFlipLock={toggleFlipLock} side={side} spreadIndex={spreadIndex} />;
  }
  if (effectiveType === 'gallery') {
    return <Gallery progress={progress} side={side} spreadIndex={spreadIndex} />;
  }
  if (effectiveType === 'quest') {
    if (side === 'left') return <Quest progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} profile={profile} />;
    return (
      <div className="p-12 flex flex-col items-center justify-center h-full gap-4 opacity-10">
        <Compass className="h-48 w-48 text-pen-blue animate-spin-slow" strokeWidth={1} />
        <div className="text-[120px] font-black text-pen-blue select-none -rotate-12 tracking-widest">Quest</div>
      </div>
    );
  }
  if (effectiveType === 'shop') {
    if (side === 'left') return <Shop progress={progress} setProgress={setProgress} onBuy={onAddNewPet || (() => {})} mode={path.includes('/sale') ? 'sell' : 'buy'} />;
    if (path.includes('/summon')) {
      return (
        <Setup 
          profile={profile} 
          setProfile={() => {}} // Read-only here if needed, or pass setProfile
          onComplete={onAddNewPet || (() => {})} 
          isMarketSummon 
          toggleFlipLock={toggleFlipLock} 
          onStartSummon={onStartSummon}
          externalPet={summoningPet}
          externalLoading={isSummoning}
          externalError={summoningError}
          setExternalPet={setSummoningPet}
          setExternalLoading={setIsSummoning}
          setExternalError={setSummoningError}
          side="right"
        />
      );
    }
    return <div className="h-full flex flex-col items-center justify-center text-pen-blue/20">Выберите товар...</div>;
  }
  if (effectiveType === 'profile') {
     if (side === 'left') return <Profile progress={progress} setProgress={setProgress} view="main" />;
     return <Profile progress={progress} setProgress={setProgress} view={path.includes('/settings') || path.includes('/configs') ? 'settings' : 'main'} />;
  }
  if (effectiveType === 'topup') {
    return <TopUp progress={progress} setProgress={setProgress} />;
  }

  // Default Fallback
  return <Gallery progress={progress} side={side} spreadIndex={spreadIndex} />;
};

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
  const isOnboarding = location.pathname === '/' || location.pathname === '/start' || location.pathname === '/setup' || location.pathname === '/make';
  const [summoningPet, setSummoningPet] = useState<Pet | null>(null);
  const [isSummoning, setIsSummoning] = useState(false);
  const [summoningError, setSummoningError] = useState<string | null>(null);
  const [flipBlockers, setFlipBlockers] = useState<Set<string>>(new Set());
  const isFlipEnabled = flipBlockers.size === 0;

  const toggleFlipLock = React.useCallback((id: string, locked: boolean) => {
    setFlipBlockers(prev => {
      const next = new Set(prev);
      if (locked) next.add(id);
      else next.delete(id);
      if (next.size === prev.size) return prev;
      return next;
    });
  }, []);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aisai_user_profile');
    const defaults: UserProfile = {
      name: 'Призыватель', gender: 'male', age: 18, city: '', hobbies: [], traits: [], about: ''
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) { return defaults; }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('aisai_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (!location.pathname.startsWith('/make') && !location.pathname.startsWith('/setup')) {
      setSummoningPet(null);
      setIsSummoning(false);
      setSummoningError(null);
    }
  }, [location.pathname]);

  const handlePetSummonComplete = React.useCallback((pet: Pet) => {
    handleAddNewPet(pet);
    setSummoningPet(null);
    setIsSummoning(false);
  }, [handleAddNewPet]);

  const activePetId = React.useMemo(() => {
    const match = location.pathname.match(/\/(pet|inventory|evolve|battle|quest)\/([^/]+)/);
    return match ? match[2] : progress.activePetId;
  }, [location.pathname, progress.activePetId]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const bookPages: Record<string, number> = {
    '/start': 0,
    '/setup': 2,
    '/main': 4,
    '/pet': 4,
    '/inventory': 4,
    '/battle': 8,
    '/evolve': 10,
    '/gallery': 12,
    '/quest': 12,
    '/shop': 14,
    '/summon': 16,
    '/sale': 18,
    '/profile': 20,
    '/configs': 22,
    '/topup': 24
  };

  const isActionRoute = (path: string) => [
    '/inventory', '/battle', '/quest', '/shop', '/summon', '/sale', '/profile', '/configs', '/settings', '/topup'
  ].some(p => path.includes(p));

  const isActionActive = isActionRoute(location.pathname);

  const somePetReadyToEvolve = progress.pets.some(p => {
    const potentialRank = getPetRankByLevel(p.level);
    const currentRankCode = p.ageStage.split(' ')[0];
    const potentialRankCode = potentialRank?.split(' ')[0];
    const rankIndex = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'EX', 'UX', 'Z'].indexOf(potentialRankCode || 'F');
    const expectedSkills = (rankIndex * 2) + 2;
    return potentialRankCode !== currentRankCode || (p.level >= 11 && (p.skills || []).length < expectedSkills);
  });

  const isEvolveActive = location.pathname.includes('/evolve') || (progress.pets.length > 4 && somePetReadyToEvolve);
  const petsCount = progress.pets?.length || 0;
  const gallerySpreadsCount = Math.ceil(petsCount / 4) || (petsCount > 0 ? 1 : 0);
  const inventorySpreadsCount = petsCount || (isOnboarding ? 0 : 1);
  const evolveSpreadsCount = isEvolveActive ? (petsCount || 1) : 0;

  // Book Indices (Spreads) - Memoize to prevent logic jumps
  const BOOK_INDICES = React.useMemo(() => ({
    HUB: 0,
    PROFILE: 1,
    SHOP: 2,
    GALLERY_START: 3,
    BATTLE: 3 + gallerySpreadsCount,
    QUEST: 3 + gallerySpreadsCount + 1,
    INVENTORY_START: 3 + gallerySpreadsCount + 2,
    EVOLVE_START: 3 + gallerySpreadsCount + 2 + inventorySpreadsCount
  }), [gallerySpreadsCount, inventorySpreadsCount]);

  const getPageFromPath = (path: string) => {
    // ONBOARDING MODE
    if (isOnboarding) {
      if (path === '/' || path === '/start') return 0;
      if (path === '/setup') return 2;
      return 0;
    }

    // APP MODE
    if (path.startsWith('/pet/') || path === '/main') return BOOK_INDICES.HUB * 2;
    if (path.includes('/profile') || path.includes('/configs') || path.includes('/settings')) return BOOK_INDICES.PROFILE * 2;
    if (path.includes('/shop') || path.includes('/sale') || path.includes('/summon')) return BOOK_INDICES.SHOP * 2;
    if (path.includes('/topup')) return BOOK_INDICES.SHOP * 2; // Keep topup near shop 
    
    if (path.startsWith('/gallery')) {
      const match = path.match(/\/gallery\/(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1]);
        const spreadIndex = Math.floor((pageNum - 1) / 2);
        return (BOOK_INDICES.GALLERY_START + spreadIndex) * 2;
      }
      return BOOK_INDICES.GALLERY_START * 2;
    }

    if (path.includes('/battle')) return BOOK_INDICES.BATTLE * 2;
    if (path.includes('/quest')) return BOOK_INDICES.QUEST * 2;

    if (path.startsWith('/inventory')) {
      const match = path.match(/\/inventory\/([^/]+)/);
      if (match) {
        const lastPart = match[1];
        if (/^\d+$/.test(lastPart)) {
          const pageNum = parseInt(lastPart);
          return (BOOK_INDICES.INVENTORY_START + pageNum - 1) * 2;
        }
        // Use 1:1 mapping for inventory spreads
        const petIndex = progress.pets.findIndex(p => p.id === lastPart);
        if (petIndex !== -1) {
          return (BOOK_INDICES.INVENTORY_START + petIndex) * 2;
        }
      }
      return BOOK_INDICES.INVENTORY_START * 2;
    }

    if (path.startsWith('/evolve')) {
      const parts = path.split('/');
      const lastPart = parts[parts.length - 1];

      if (lastPart && /^\d{1,3}$/.test(lastPart)) {
        const pageNum = parseInt(lastPart);
        return (BOOK_INDICES.EVOLVE_START + pageNum - 1) * 2;
      }
      
      // Use 1:1 mapping for evolve spreads
      const petIndex = progress.pets.findIndex(p => p.id === lastPart);
      if (petIndex !== -1) {
        return (BOOK_INDICES.EVOLVE_START + petIndex) * 2;
      }
      return BOOK_INDICES.EVOLVE_START * 2;
    }
    
    return BOOK_INDICES.HUB * 2;
  };

  const syncTargetRef = React.useRef<number | null>(null);

  useEffect(() => {
    const targetPage = getPageFromPath(location.pathname);
    if (syncTargetRef.current === targetPage) return;
    syncTargetRef.current = targetPage;
    
    const timer = setTimeout(() => {
      try {
        if (flipBookRef.current) {
          const pageFlip = typeof flipBookRef.current.pageFlip === 'function' ? flipBookRef.current.pageFlip() : null;
          if (pageFlip && typeof pageFlip.flip === 'function') {
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
  }, [location.pathname, progress.pets.length, isOnboarding]);

  const isPortrait = windowSize.width < 1024;

  const handleStartSummon = async () => {
    if (isSummoning) return;
    setIsSummoning(true);
    setSummoningError(null);
    setSummoningPet(null);

    try {
      const forcedRarity = ((): Rarity => {
        const r = Math.random() * 100;
        if (r < 1) return 'divine';
        if (r < 5) return 'legendary';
        if (r < 10) return 'mythical';
        if (r < 25) return 'epic';
        if (r < 50) return 'rare';
        return 'normal';
      })();
      
      const result = await generatePetStatsAndLore(userProfile, forcedRarity);
      if (!result) throw new Error("Не удалось получить ответ от эфира.");

      const { name, abilities, skills, lore, classification, element, attribute } = result;
      const petId = Math.random().toString(36).substr(2, 9);
      
      const art = await generatePetArt({ 
        id: petId, rarity: forcedRarity, personality: userProfile.traits[0] as any,
        habitat: 'forest', classification, element, attribute, level: 1, ageStage: 'F - младенчество'
      });

      // Distribute stats randomly by code as requested
      const initialStats = distributeStats(RARITY_WEIGHTS[forcedRarity].base);

      const newPet: Pet = {
        id: petId, 
        name: name || "Безымянный", 
        rarity: forcedRarity, 
        element: (element as any) || 'fire', 
        attribute: (attribute as any) || 'void',
        personality: 'calm', 
        habitat: 'forest', 
        image: art || `https://picsum.photos/seed/${petId}/1080/1920`,
        stats: initialStats,
        classification: classification || { 
          type: "Неизвестно",
          class: "Неизвестно",
          order: "Неизвестно",
          family: "Неизвестно",
          genus: "Неизвестно",
          species: "Неизвестно"
        }, 
        skills: skills || [],
        abilities: abilities || ["Базовая Атака"], 
        lore: lore || "Легенда еще не написана.", 
        level: 1, 
        experience: 0, 
        materials: {}, 
        ageStage: 'F - младенчество',
        rank: 'B',
        potential: Math.floor(Math.random() * 30) + 70,
        isRankRevealed: false, 
        statPoints: 0,
      };
      setSummoningPet(newPet);
    } catch (error: any) {
      console.error("Summoning error:", error);
      setSummoningError(error?.message || "Ошибка связи с эфиром. Попробуйте еще раз.");
    } finally {
      setIsSummoning(false);
    }
  };

  if (isPortrait) {
    const showNav = hasPets && !isOnboarding;
    const sortedPaths = Object.keys(bookPages).sort((a, b) => b.length - a.length);
    const matchedPath = sortedPaths.find(p => location.pathname.startsWith(p));

    return (
      <div className="flex flex-col min-h-screen pt-16 pb-20 bg-transparent ledger-grid overflow-y-auto w-full px-4 gap-6">
        {showNav && <Navbar sprouts={progress.sprouts} />}
        {matchedPath === '/start' && (
          <div className="space-y-6">
            <Page side="left"><Welcome onSetup={() => navigate('/setup')} /></Page>
            <Page side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} step={1} side="right" toggleFlipLock={toggleFlipLock} /></Page>
          </div>
        )}
        {matchedPath === '/setup' && (
          <div className="space-y-6">
            <Page side="left"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} step={2} side="left" toggleFlipLock={toggleFlipLock} onStartSummon={handleStartSummon} /></Page>
            <Page side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handlePetSummonComplete} step={3} side="right" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} toggleFlipLock={toggleFlipLock} /></Page>
          </div>
        )}
        {(matchedPath === '/main' || matchedPath === '/pet' || matchedPath === '/battle' || matchedPath === '/quest' || matchedPath === '/evolve' || matchedPath === '/inventory') && (
           <div className="space-y-6">
              <Page side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
              <div className="border-t-2 border-dashed border-black/5 pt-6">
                {matchedPath === '/battle' ? <Battle progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} /> :
                 matchedPath === '/quest' ? <Quest progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} profile={userProfile} /> :
                 matchedPath === '/evolve' ? <Evolve progress={progress} setProgress={setProgress} manualId={activePetId || undefined} toggleFlipLock={toggleFlipLock} /> :
                 <PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} initialTab={matchedPath === '/inventory' ? 'inventory' : 'stats'} toggleFlipLock={toggleFlipLock} onAddNewPet={handleAddNewPet} />}
              </div>
           </div>
        )}
        {(matchedPath === '/shop' || matchedPath === '/summon' || matchedPath === '/sale') && (
           <div className="space-y-6">
              <Page side="left"><Shop progress={progress} setProgress={setProgress} onBuy={handleAddNewPet} mode={matchedPath === '/sale' ? 'sell' : 'buy'} /></Page>
              {matchedPath === '/summon' && <Page side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} isMarketSummon toggleFlipLock={toggleFlipLock} onStartSummon={handleStartSummon} /></Page>}
           </div>
        )}
        {(matchedPath === '/profile' || matchedPath === '/configs' || matchedPath === '/topup') && (
           <div className="space-y-6">
              <Page side="left"><Profile progress={progress} setProgress={setProgress} /></Page>
              <Page side="right">
                {matchedPath === '/configs' ? <Profile progress={progress} setProgress={setProgress} view="settings" /> :
                 matchedPath === '/topup' ? <TopUp progress={progress} setProgress={setProgress} /> :
                 <div className="h-40 flex items-center justify-center">Личное дело</div>}
              </Page>
           </div>
        )}
      </div>
    );
  }

  const onFlip = (e: any) => {
    try {
      const newIndex = (e && typeof e.data === 'number') ? e.data : (typeof e === 'number' ? e : null);
      if (newIndex === null) return;
      
      const targetBaseIndex = Math.floor(newIndex / 2) * 2;
      const currentPath = location.pathname;
      const currentBasePage = getPageFromPath(currentPath);
      
      // Detection of manual manual flip
      const isManual = syncTargetRef.current !== targetBaseIndex;

      if (currentBasePage !== targetBaseIndex) {
        if (isOnboarding) {
          if (targetBaseIndex === 0) navigate('/start');
          else if (targetBaseIndex === 2) navigate('/setup');
        } else {
          // APP MODE
          const spreadIndex = targetBaseIndex / 2;
          const currentSpreadIndex = currentBasePage / 2;

          // SPECIAL RULE: Manual back always goes to HUB
          // targetBaseIndex < currentBasePage means flipping to an EARLIER page
          if (isManual && targetBaseIndex < currentBasePage && currentSpreadIndex > BOOK_INDICES.HUB) {
             const hubPage = BOOK_INDICES.HUB * 2;
             
             // If we aren't already at HUB, force it
             if (targetBaseIndex !== hubPage) {
               syncTargetRef.current = hubPage;
               try {
                 const pageFlip = flipBookRef.current?.pageFlip?.();
                 if (pageFlip) pageFlip.flip(hubPage);
               } catch (err) {}
             }

             // Avoid navigating if we're already on the correct path
             const hubPath = `/pet/${activePetId}`;
             if (location.pathname !== hubPath) {
               navigate(hubPath, { replace: true });
             }
             return;
          }
          
          if (spreadIndex === BOOK_INDICES.HUB) {
             if (location.pathname !== `/pet/${activePetId}`) navigate(`/pet/${activePetId}`);
          }
          else if (spreadIndex === BOOK_INDICES.PROFILE) navigate('/profile');
          else if (spreadIndex === BOOK_INDICES.SHOP) navigate('/shop');
          else if (spreadIndex >= BOOK_INDICES.GALLERY_START && spreadIndex < BOOK_INDICES.BATTLE) {
            const galleryIdx = spreadIndex - BOOK_INDICES.GALLERY_START;
            navigate(`/gallery/${galleryIdx * 2 + 1}`);
          }
          else if (spreadIndex === BOOK_INDICES.BATTLE) navigate('/battle');
          else if (spreadIndex === BOOK_INDICES.QUEST) navigate('/quest');
          else if (spreadIndex >= BOOK_INDICES.INVENTORY_START && spreadIndex < BOOK_INDICES.EVOLVE_START) {
            const invIdx = spreadIndex - BOOK_INDICES.INVENTORY_START;
            navigate(`/inventory/${invIdx * 2 + 1}`);
          }
          else if (spreadIndex >= BOOK_INDICES.EVOLVE_START) {
            const evolveIdx = spreadIndex - BOOK_INDICES.EVOLVE_START;
            navigate(`/evolve/${evolveIdx + 1}`);
          }
        }
      }
    } catch (err) {
      console.error("onFlip error:", err);
    }
  };

  const flipBookWidth = Math.floor(Math.min(720, (windowSize.width - (windowSize.width < 1280 ? 40 : 120)) / 2));
  const flipBookHeight = Math.floor(Math.min(900, windowSize.height - 40));
  const showNav = hasPets && !isOnboarding;

  const currentPath = location.pathname;
  const pathParts = currentPath.split('/');
  const currentBattleId = currentPath.includes('/battle') ? pathParts[pathParts.length - 1] : undefined;

  // Stabilize the key - only change when onboarding status or layout orientation shifts
  // We remove dynamic spread counts from the key to prevent full remounts which kill flip animations
  const flipbookKey = `flipbook-${isPortrait}-${isOnboarding}`;

  const currentPageIndex = getPageFromPath(location.pathname);
  const currentSpread = Math.floor(currentPageIndex / 2);
  
  // Strictly lock manual forward flipping on all app pages. 
  // Forward movement is only allowed via buttons.
  const isForwardLocked = !isOnboarding && currentSpread >= BOOK_INDICES.HUB;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent relative selection:bg-sticker-blue/30 overflow-hidden">
      <div className="absolute inset-0 bg-black/5 -z-10" />
      {showNav && <Navbar sprouts={progress.sprouts} />}
      <div className="w-full h-full flex items-center justify-center overflow-hidden p-4 sm:p-8">
        <div 
          className={cn(
            "relative flex items-center justify-center transition-all duration-500 ease-in-out",
            !isFlipEnabled && "opacity-90"
          )}
          style={{ width: flipBookWidth * 2, height: flipBookHeight }}
        >
          {/* Forward Lock Edge Overlay (Narrower to avoid blocking buttons) */}
          {isForwardLocked && (
            <div 
              className="absolute top-0 right-0 w-[20px] h-full z-[1000] cursor-default"
              style={{ pointerEvents: 'auto' }}
            />
          )}

          <HTMLFlipBook 
            key={flipbookKey}
            width={flipBookWidth} 
            height={flipBookHeight}
            size="stretch"
            minWidth={315}
            minHeight={100}
            maxShadowOpacity={0.2}
            showCover={false}
            mobileScrollSupport={true}
            ref={flipBookRef}
            className="flipbook-root"
            style={{ cursor: isOnboarding ? 'default' : 'grab' }}
            onFlip={onFlip}
            startPage={getPageFromPath(location.pathname)}
            drawShadow={true}
            flippingTime={900}
            useMouseEvents={isFlipEnabled}
            clickEventForward={true}
            usePortrait={false}
            startZIndex={0}
            autoSize={true}
            showPageCorners={true}
            disableFlipByClick={true}
          >
            {isOnboarding ? [
              /* ONBOARDING BOOK (2 Spreads) */
              <Page key="on-l" side="left"><Welcome onSetup={() => navigate('/setup')} /></Page>,
              <Page key="on-r" side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} step={1} side="right" toggleFlipLock={toggleFlipLock} /></Page>,
              <Page key="setup-l" side="left"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} step={2} side="left" toggleFlipLock={toggleFlipLock} onStartSummon={handleStartSummon} /></Page>,
              <Page key="setup-r" side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handlePetSummonComplete} step={3} side="right" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} toggleFlipLock={toggleFlipLock} /></Page>
            ] : [
              /* THE BESTIARY BOOK (Main App) */
              /* Book 2: HUB (Spread 0) */
              <Page key="hub-l" side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>,
              <Page key="hub-r" side="right"><PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} initialTab="stats" toggleFlipLock={toggleFlipLock} id="pet-detail-main" onAddNewPet={handleAddNewPet} /></Page>,
              
              /* Book 3: PROFILE (Spread 1) */
              <Page key="profile-spread-l" side="left"><BestiaryActionPage side="left" forceType="profile" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
              <Page key="profile-spread-r" side="right"><BestiaryActionPage side="right" forceType="profile" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,

              /* Book 4: MARKET (Spread 2) */
              <Page key="shop-spread-l" side="left"><BestiaryActionPage side="left" forceType="shop" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} onAddNewPet={handleAddNewPet} profile={userProfile} setUserProfile={setUserProfile} /></Page>,
              <Page key="shop-spread-r" side="right"><BestiaryActionPage side="right" forceType="shop" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} onAddNewPet={handleAddNewPet} profile={userProfile} onStartSummon={handleStartSummon} summoningPet={summoningPet} isSummoning={isSummoning} summoningError={summoningError} setSummoningPet={setSummoningPet} setIsSummoning={setIsSummoning} setSummoningError={setSummoningError} setUserProfile={setUserProfile} /></Page>,

              /* Book 5: GALLERY (Spreads 3+) */
              ...Array.from({ length: gallerySpreadsCount }).flatMap((_, i) => [
                <Page key={`gallery-spread-${i}-l`} side="left"><BestiaryActionPage side="left" forceType="gallery" spreadIndex={i} progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
                <Page key={`gallery-spread-${i}-r`} side="right"><BestiaryActionPage side="right" forceType="gallery" spreadIndex={i} progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>
              ]),

              /* Book 6: BATTLE */
              <Page key="battle-spread-l" side="left"><BestiaryActionPage side="left" forceType="battle" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
              <Page key="battle-spread-r" side="right"><BestiaryActionPage side="right" forceType="battle" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,

              /* Book 7: QUEST */
              <Page key="quest-spread-l" side="left"><BestiaryActionPage side="left" forceType="quest" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
              <Page key="quest-spread-r" side="right"><BestiaryActionPage side="right" forceType="quest" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,

              /* Book 8: INVENTORY (Spreads) */
              ...Array.from({ length: inventorySpreadsCount }).flatMap((_, i) => [
                <Page key={`inventory-spread-${i}-l`} side="left"><BestiaryActionPage side="left" forceType="inventory" spreadIndex={i} progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
                <Page key={`inventory-spread-${i}-r`} side="right"><BestiaryActionPage side="right" forceType="inventory" spreadIndex={i} progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>
              ]),

              /* Book 9: EVOLVE (Spreads) */
              ...Array.from({ length: evolveSpreadsCount }).flatMap((_, i) => [
                <Page key={`evolve-spread-${i}-l`} side="left"><BestiaryActionPage side="left" forceType="evolve" spreadIndex={i} progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
                <Page key={`evolve-spread-${i}-r`} side="right"><BestiaryActionPage side="right" forceType="evolve" spreadIndex={i} progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>
              ])
            ]}

          </HTMLFlipBook>
        </div>
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
        const migratedPets = (parsed.pets || []).map((p: any) => {
          const stats = p.stats || {
            attack: 10, defense: 10, health: 100, maxHealth: 100, 
            speed: 10, magic: 10, regeneration: 5, luck: 5, rage: 0, maxRage: 100
          };
          if (stats.luck === undefined) stats.luck = 5;
          if (stats.health === undefined) stats.health = 100;
          stats.maxHealth = stats.maxHealth || stats.health || 100;
          if (stats.rage === undefined) stats.rage = 0;
          if (stats.maxRage === undefined) stats.maxRage = 100;
          
          return {
            id: p.id || Math.random().toString(36).substring(7),
            name: p.name || "Безымянный",
            rarity: p.rarity || 'normal',
            element: p.element || 'fire',
            attribute: p.attribute || 'void',
            personality: p.personality || 'calm',
            habitat: p.habitat || 'forest',
            image: p.image || `https://picsum.photos/seed/${p.id}/1080/1920`,
            lore: p.lore || "Легенда еще не написана.",
            ...p,
            stats,
            abilities: [], // Clear old abilities as requested
            level: p.level || 1,
            experience: p.experience || 0,
            statPoints: typeof p.statPoints === 'number' ? p.statPoints : 0,
            classification: p.classification || { 
              type: "Неизвестно", class: "Неизвестно", order: "Неизвестно", 
              family: "Неизвестно", genus: "Неизвестно", species: "Неизвестно" 
            },
            ageStage: p.ageStage && p.ageStage.includes(' - ') ? p.ageStage : getPetRankByLevel(p.level || 1),
            skills: (p.skills && p.skills.length > 0 ? p.skills : [
              { 
                id: 'p1', 
                name: 'Титаническая Стойкость', 
                description: 'Питомец напрягает свои мощные грудные мышцы, создавая живой щит. Это позволяет ему игнорировать часть урона и быть более устойчивым в затяжных боях.', 
                type: 'passive', 
                targetStat: 'defense', 
                value: 10 
              },
              { 
                id: 'a1', 
                name: 'Яростный Резонанс', 
                description: 'Питомец входит в состояние боевого транса, вибрируя всем телом. Каждое движение становится быстрее и мощнее, вкладывая накопленную энергию в следующий удар.', 
                type: 'active_buff', 
                targetStat: 'attack', 
                value: 11 
              },
              { 
                id: 'd1', 
                name: 'Парализующий Крик', 
                description: 'Резкий высокочастотный звук бьет по барабанным перепонкам врага. Соперник теряет концентрацию и его мышцы немеют, что значительно снижает его наступательный потенциал.', 
                type: 'active_debuff', 
                targetStat: 'attack', 
                value: 25 
              }
            ]).map((s: any) => ({
              ...s,
              element: s.type !== 'passive' ? (p.element || 'fire') : undefined,
              attribute: s.type === 'passive' ? (p.attribute || 'void') : undefined,
              fallbackEmoji: s.fallbackEmoji || (s.type === 'passive' ? '🎐' : '💥')
            }))
          };
        });

        const migratedInventory = (parsed.inventory || []).map((item: any) => ({
          ...item,
          hue: item.type === 'egg' && item.hue === undefined ? Math.floor(Math.random() * 360) : item.hue,
          fallbackEmoji: item.fallbackEmoji || (item.type === 'egg' ? '🥚' : undefined)
        }));

        return { ...INITIAL_PROGRESS, ...parsed, pets: migratedPets, inventory: migratedInventory };
      } catch (e) { return INITIAL_PROGRESS; }
    }
    return INITIAL_PROGRESS;
  });

  useEffect(() => {
    localStorage.setItem('aisai_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => updateEnergy(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasPets = (progress.pets || []).length > 0;
  const handleAddNewPet = React.useCallback((pet: Pet) => {
    setProgress(prev => {
      if (prev.pets.some(p => p.id === pet.id)) return prev;
      return {
        ...prev,
        pets: [...prev.pets, pet],
        activePetId: prev.activePetId || pet.id,
      };
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen relative selection:bg-sticker-blue selection:text-pen-blue">
        <BackgroundDoodles />
        <svg width="0" height="0" className="absolute invisible">
          <defs>
            <pattern id="sketch-hatch-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(0, 71, 171, 0.1)" strokeWidth="1" />
            </pattern>
          </defs>
        </svg>
        <AnimatedRoutes hasPets={hasPets} progress={progress} setProgress={setProgress} handleAddNewPet={handleAddNewPet} />
      </div>
    </BrowserRouter>
  );
}
