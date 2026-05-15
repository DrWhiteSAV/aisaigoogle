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
import { NeonButton, LogoAnimation } from './components/UI';
import { InfoModal } from './components/GameUI';
import { cn } from './lib/utils';
import { Sprout, Plus, Compass } from 'lucide-react';
import { UserProgress, Pet, UserProfile, Rarity, InventoryItem } from './types';
import { generatePetStatsAndLore, generatePetArt } from './services/aiService';

import { updateEnergy, getPetRankByLevel, distributeStats, rollPotential, RARITY_WEIGHTS, generateUniqueCode, getSummonerRank } from './lib/gameLogic';
import { SHOP_ARTIFACTS, SHOP_SKILLS, BUYING_PRICES } from './constants/shop';

const INITIAL_PROGRESS: UserProgress = {
  id: Math.random().toString(36).substring(7).toUpperCase(),
  pets: [],
  activePetId: null,
  sprouts: 5000, 
  inventory: [],
  energy: 10,
  lastEnergyUpdate: Date.now(),
  summonerRank: 'Новичок',
  marketInventory: [
    ...Array.from({ length: 1 }).map((_, i) => ({
      id: `egg-shop-${i}`,
      code: generateUniqueCode('EG', `-shop-${i}`),
      type: 'egg',
      name: 'Яйцо Питомца',
      description: 'Яйцо неведомого существа. Содержит в себе энергию случайной сущности. Можно высидеть в инкубаторе.',
      image: 'https://i.ibb.co/JwYQcc2D/egg.png',
      value: BUYING_PRICES.egg,
      hue: 30 + (i * 40)
    } as InventoryItem)),
    ...SHOP_ARTIFACTS.map((a, i) => ({ ...a, code: generateUniqueCode('AR', `-shop-${i}`) })),
    ...SHOP_SKILLS.map((s, i) => ({ ...s, code: generateUniqueCode('SK', `-shop-${i}`) }))
  ]
};

const BOOK_INDICES = {
  HUB: 0,
  PROFILE: 0,
  SHOP: 0,
  GALLERY_START: 0,
  INVENTORY_START: 1,
  QUEST: 2,
  BATTLE: 3,
  EVOLVE_START: 4
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

const pageScrollData = new Map<string, number>();

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; side?: 'left' | 'right'; id?: string }>(({ children, side, id }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isRestoring = React.useRef(false);
  
  // Use layout effect to restore scroll immediately after render updates
  React.useLayoutEffect(() => {
    if (id && scrollRef.current) {
      const saved = pageScrollData.get(id) || 0;
      isRestoring.current = true;
      scrollRef.current.scrollTop = saved;
      // Fallback timeout in case DOM heights expand after initial layout
      const t = setTimeout(() => {
         if (scrollRef.current) {
           isRestoring.current = true;
           scrollRef.current.scrollTop = saved;
           setTimeout(() => { isRestoring.current = false; }, 20);
         }
      }, 50);
      return () => {
         clearTimeout(t);
         isRestoring.current = false;
      };
    }
  }, [id]); // Only run on mount or id change

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
      
      <div 
        ref={scrollRef}
        onScroll={(e) => {
          if (id && !isRestoring.current) {
             const target = e.currentTarget;
             // Don't save 0 if the container suddenly became unscrollable (meaning it's hiding/unmounting)
             if (target.scrollHeight > target.clientHeight) {
                pageScrollData.set(id, target.scrollTop);
             }
          }
        }}
        className="p-6 sm:p-8 pt-[10px] h-full overflow-y-auto no-scrollbar relative z-10"
      >
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
  forceType?: 'gallery' | 'evolve' | 'battle' | 'quest' | 'shop' | 'shop-buy' | 'shop-sell' | 'profile' | 'topup' | 'inventory' | 'summon', 
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
    path.includes('/summon') ? 'summon' :
    path.includes('/inventory') ? 'inventory' :
    path.includes('/battle') ? 'battle' :
    path.includes('/evolve') ? 'evolve' :
    path.includes('/gallery') ? 'gallery' :
    path.includes('/quest') ? 'quest' :
    path.includes('/sale') ? 'shop-sell' :
    path.includes('/shop') ? 'shop-buy' :
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
  if (effectiveType === 'summon') {
    if (side === 'left') {
      return (
        <Setup 
          profile={profile} 
          setProfile={setUserProfile || (() => {})} 
          onComplete={onAddNewPet || (() => {})} 
          step={3}
          isMarketSummon 
          toggleFlipLock={toggleFlipLock} 
          onStartSummon={onStartSummon}
          externalPet={summoningPet}
          externalLoading={isSummoning}
          externalError={summoningError}
          setExternalPet={setSummoningPet}
          setExternalLoading={setIsSummoning}
          setExternalError={setSummoningError}
          side="left"
        />
      );
    }
    return <LogoAnimation />;
  }

  if (effectiveType === 'shop-buy') {
    if (side === 'left') return <Shop progress={progress} setProgress={setProgress} onBuy={onAddNewPet || (() => {})} mode="buy" />;
    return <LogoAnimation />;
  }
  if (effectiveType === 'shop-sell') {
    if (side === 'left') return <Shop progress={progress} setProgress={setProgress} onBuy={onAddNewPet || (() => {})} mode="sell" />;
    return <LogoAnimation />;
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
  const [limitError, setLimitError] = useState<{name: string, limit: number} | null>(null);
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

  type BookType = 'welcome' | 'bestiary' | 'gallery' | 'market' | 'summon' | 'profile';
  
  const getBookFromPath = (path: string): BookType => {
    if (path === '/' || path === '/start' || path === '/setup' || path === '/make') return 'welcome';
    if (path.includes('/gallery')) return 'gallery';
    if (path.includes('/shop') || path.includes('/sale')) return 'market';
    if (path.includes('/summon')) return 'summon';
    if (path.includes('/profile') || path.includes('/configs') || path.includes('/settings')) return 'profile';
    return 'bestiary';
  };

  const currentBook = getBookFromPath(location.pathname);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error("GLOBAL ERROR CAPTURED:", event.error);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("UNHANDLED REJECTION CAPTURED:", event.reason);
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('aisai_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (!location.pathname.startsWith('/make') && !location.pathname.startsWith('/setup') && !location.pathname.startsWith('/summon')) {
      setSummoningPet(null);
      setIsSummoning(false);
      setSummoningError(null);
    }
  }, [location.pathname]);

  const handlePetSummonComplete = React.useCallback((pet: Pet) => {
    handleAddNewPet(pet);
    setSummoningPet(null);
    setIsSummoning(false);
    navigate('/main');
  }, [handleAddNewPet, navigate]);

  const activePetId = React.useMemo(() => {
    const match = location.pathname.match(/\/(pet|inventory|evolve|battle|quest)\/([^/]+)/);
    return match ? match[2] : progress.activePetId;
  }, [location.pathname, progress.activePetId]);

  useEffect(() => {
    if (activePetId && activePetId !== progress.activePetId) {
      setProgress(p => ({ ...p, activePetId: activePetId }));
    }
  }, [activePetId, progress.activePetId]);

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

  const somePetReadyToEvolve = React.useMemo(() => {
    return (progress.pets || []).some(p => {
      const potentialRank = getPetRankByLevel(p.level || 1);
      const currentRankCode = (p.ageStage || '').split(' ')[0];
      const potentialRankCode = (potentialRank || '').split(' ')[0];
      return potentialRankCode !== currentRankCode;
    });
  }, [progress.pets]);

  const isEvolveActive = location.pathname.includes('/evolve') || ((progress.pets || []).length > 0 && somePetReadyToEvolve);

  const petsCount = (progress.pets || []).length;
  const gallerySpreadsCount = petsCount || 1;
  const evolveSpreadsCount = petsCount || 1;

  const getPageFromPath = (path: string) => {
    const book = getBookFromPath(path);
    
    if (book === 'welcome') {
      if (path === '/' || path === '/start') return 0;
      if (path === '/setup') return 2;
      return 0;
    }
    
    if (book === 'market') {
      if (path.includes('/sale')) return 2;
      return 0;
    }
    
    if (book === 'summon') {
      return 0;
    }
    
    if (book === 'profile') {
      if (path.includes('/settings') || path.includes('/configs')) return 2;
      return 0;
    }
    
    if (book === 'gallery') {
      const match = path.match(/\/gallery\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const petId = match[1];
        const petIndex = progress.pets.findIndex(p => p.id === petId);
        if (petIndex !== -1) return petIndex * 2;
      }
      return 0;
    }
    
    // Bestiary Book
    if (path === '/main' || path.startsWith('/pet/')) return 0;
    if (path.includes('/inventory')) return 2;
    if (path.includes('/quest')) return 4;
    if (path.includes('/battle')) return 6;
    if (path.startsWith('/evolve')) {
      const match = path.match(/\/evolve\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const petId = match[1];
        const petIndex = progress.pets.findIndex(p => p.id === petId);
        if (petIndex !== -1) return 8 + petIndex * 2;
      }
      return 8; 
    }
    
    return 0;
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
    
    const rankInfo = getSummonerRank(progress.pets);
    if (progress.pets.length >= rankInfo.limit) {
      setLimitError(rankInfo);
      return;
    }

    setIsSummoning(true);
    setSummoningError(null);
    setSummoningPet(null);

    try {
      const forcedRarity = rollPotential();
      
      const result = await generatePetStatsAndLore(userProfile, forcedRarity);
      if (!result) throw new Error("Не удалось получить ответ от эфира.");
      console.log("Pet generation result:", result);

      const { name, stats, abilities, skills, lore, classification, element, attribute } = result;
      const petId = Math.random().toString(36).substr(2, 9);
      
      const art = await generatePetArt({ 
        id: petId, rarity: forcedRarity, personality: userProfile.traits[0] as any,
        habitat: 'forest', classification, element, attribute, level: 1, ageStage: 'F - младенчество'
      });

      const newPet: Pet = {
        id: petId, 
        name: name || "Безымянный", 
        rarity: forcedRarity, 
        element: (element as any) || 'fire', 
        attribute: (attribute as any) || 'void',
        personality: 'calm', 
        habitat: 'forest', 
        image: art || `https://picsum.photos/seed/${petId}/1080/1920`,
        stats: stats || distributeStats(RARITY_WEIGHTS[forcedRarity].base),
        classification: classification || { 
          type: "Неизвестно",
          class: "Неизвестно",
          order: "Неизвестно",
          family: "Неизвестно",
          genus: "Неизвестно",
          species: "Неизвестно"
        }, 
        skills: (skills || []).filter(Boolean).map((s: any, idx: number) => {
          const sId = s.id || `skill-${petId}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
          return { 
            id: sId,
            code: s.code || generateUniqueCode('SK', `-${petId}-${idx}`),
            name: s.name || 'Таинственный прием',
            description: s.description || 'Древнее умение этой сущности',
            type: s.type || 'active_buff',
            targetStat: s.targetStat || 'attack',
            value: s.value || 5,
            image: s.image,
            fallbackEmoji: s.fallbackEmoji || '✨',
            element: s.element || element,
            attribute: s.attribute || attribute
          };
        }),
        abilities: abilities || ["Базовая Атака"], 
        lore: lore || "Легенда еще не написана.", 
        level: 1, 
        experience: 0, 
        materials: {}, 
        ageStage: 'F - младенчество',
        rank: '',
        isRankRevealed: false, 
        statPoints: 0,
        imageHistory: [art || `https://picsum.photos/seed/${petId}/1080/1920`],
      };
      console.log("FINAL GENERATED PET OBJECT:", newPet);
      setSummoningPet(newPet);
    } catch (error: any) {
      console.error("Summoning error FULL:", error);
      // If the error is a promise rejection it might not have .message
      const msg = typeof error === 'string' ? error : (error?.message || error?.error || "Ошибка связи с эфиром. Попробуйте еще раз.");
      setSummoningError(msg);
    } finally {
      setIsSummoning(false);
    }
  };

  const portraitScrollRef = React.useRef<HTMLDivElement>(null);
  const portraitIsRestoring = React.useRef(false);
  React.useLayoutEffect(() => {
    if (isPortrait && portraitScrollRef.current) {
      const saved = pageScrollData.get('portrait-' + currentBook) || 0;
      portraitIsRestoring.current = true;
      portraitScrollRef.current.scrollTop = saved;
      
      const t = setTimeout(() => {
         if (portraitScrollRef.current) {
           portraitIsRestoring.current = true;
           portraitScrollRef.current.scrollTop = saved;
           setTimeout(() => { portraitIsRestoring.current = false; }, 20);
         }
      }, 50);
      return () => {
         clearTimeout(t);
         portraitIsRestoring.current = false;
      };
    }
  }, [isPortrait, currentBook]);

  if (isPortrait) {
    const showNav = hasPets && !isOnboarding;
    const sortedPaths = Object.keys(bookPages).sort((a, b) => b.length - a.length);
    const matchedPath = sortedPaths.find(p => location.pathname.startsWith(p));

    return (
      <div 
        ref={portraitScrollRef}
        onScroll={(e) => {
          if (!portraitIsRestoring.current) pageScrollData.set('portrait-' + currentBook, e.currentTarget.scrollTop);
        }}
        className="flex flex-col min-h-screen pt-16 pb-20 bg-transparent ledger-grid overflow-y-auto w-full px-4 gap-6"
      >
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
              <Page side="left" id="main-mobile"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>
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
              <Page side="left" id="profile-l-mobile"><Profile progress={progress} setProgress={setProgress} /></Page>
              <Page side="right" id="profile-r-mobile">
                {matchedPath === '/configs' ? <Profile progress={progress} setProgress={setProgress} view="settings" /> :
                 matchedPath === '/topup' ? <TopUp progress={progress} setProgress={setProgress} /> :
                 <div className="h-40 flex items-center justify-center">Личное дело</div>}
              </Page>
           </div>
        )}

      <InfoModal 
        isOpen={!!limitError} 
        onClose={() => setLimitError(null)} 
        title="Лимит сущностей" 
      >
        <div className="space-y-4">
          <p className="text-[16px] font-black text-pen-red leading-relaxed border-b border-black/5 pb-4">
            Внимание! Ваш текущий ранг призывателя <strong>"{limitError?.name}"</strong>.
          </p>
          <div className="text-sm font-bold text-pen-blue/80">
            Он позволяет иметь не более <span className="text-xl text-pen-blue">{limitError?.limit}</span> питомцев.
          </div>
          <div className="bg-white/50 p-4 border border-black/10 text-xs font-black text-pen-blue italic rounded-sm">
            Чтобы повысить ранг и призывать больше сущностей, вам необходимо развивать и прокачивать своих текущих питомцев!
          </div>
          <NeonButton onClick={() => setLimitError(null)} className="w-full">Понятно</NeonButton>
        </div>
      </InfoModal>
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

          if (currentBook === 'bestiary') {
            // SPECIAL RULE: Manual back always goes to HUB
            if (isManual && targetBaseIndex < currentBasePage && currentSpreadIndex > BOOK_INDICES.HUB) {
               const hubPage = BOOK_INDICES.HUB * 2;
               if (targetBaseIndex !== hubPage) {
                 syncTargetRef.current = hubPage;
                 try {
                   const pageFlip = flipBookRef.current?.pageFlip?.();
                   if (pageFlip) pageFlip.flip(hubPage);
                 } catch (err) {}
               }
               const hubPath = `/pet/${activePetId}`;
               if (location.pathname !== hubPath) navigate(hubPath, { replace: true });
               return;
            }
            
            if (spreadIndex === BOOK_INDICES.HUB) {
               if (location.pathname !== `/pet/${activePetId}`) navigate(`/pet/${activePetId}`);
            }
            else if (spreadIndex === BOOK_INDICES.INVENTORY_START) navigate(activePetId ? `/inventory/${activePetId}` : '/inventory');
            else if (spreadIndex === BOOK_INDICES.QUEST) navigate(activePetId ? `/quest/${activePetId}` : '/quest');
            else if (spreadIndex === BOOK_INDICES.BATTLE) {
               navigate(activePetId ? `/battle/${activePetId}/${Math.random().toString(36).substring(7)}` : '/battle');
            }
            else if (spreadIndex >= BOOK_INDICES.EVOLVE_START) {
              const evolveIdx = spreadIndex - BOOK_INDICES.EVOLVE_START;
              const pet = progress.pets[evolveIdx];
              if (pet) navigate(`/evolve/${pet.id}`);
              else navigate('/evolve');
            }
          } else if (currentBook === 'gallery') {
            const galleryIdx = spreadIndex;
            const pet = progress.pets[galleryIdx];
            if (pet) navigate(`/gallery/${pet.id}`);
            else navigate('/gallery');
          } else if (currentBook === 'profile') {
            if (spreadIndex === 0) navigate('/profile');
            else navigate('/profile/settings');
          } else if (currentBook === 'market') {
            if (spreadIndex === 0) navigate('/shop');
            else navigate('/sale');
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
  const flipbookKey = `flipbook-${isPortrait}-${currentBook}-${petsCount}`;

  const currentPageIndex = getPageFromPath(location.pathname);
  const currentSpread = Math.floor(currentPageIndex / 2);
  
  // Strictly lock manual forward flipping on all app pages. 
  // Forward movement is only allowed via buttons.
  const isForwardLocked = currentBook !== 'welcome';

  const getBookPages = () => {
    switch (currentBook) {
      case 'welcome':
        return [
          <Page key="welcome-l" side="left"><Welcome onSetup={() => navigate('/setup')} /></Page>,
          <Page key="welcome-r" side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} step={1} side="right" toggleFlipLock={toggleFlipLock} /></Page>,
          <Page key="setup-l" side="left"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handleAddNewPet} step={2} side="left" toggleFlipLock={toggleFlipLock} onStartSummon={handleStartSummon} /></Page>,
          <Page key="setup-r" side="right"><Setup profile={userProfile} setProfile={setUserProfile} onComplete={handlePetSummonComplete} step={3} side="right" externalPet={summoningPet} externalLoading={isSummoning} externalError={summoningError} setExternalPet={setSummoningPet} setExternalLoading={setIsSummoning} setExternalError={setSummoningError} toggleFlipLock={toggleFlipLock} /></Page>
        ];
      case 'summon':
        return [
          <Page key="summon-l" side="left"><BestiaryActionPage side="left" forceType="summon" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} onAddNewPet={handleAddNewPet} profile={userProfile} onStartSummon={handleStartSummon} summoningPet={summoningPet} isSummoning={isSummoning} summoningError={summoningError} setSummoningPet={setSummoningPet} setIsSummoning={setIsSummoning} setSummoningError={setSummoningError} setUserProfile={setUserProfile} /></Page>,
          <Page key="summon-r" side="right"><LogoAnimation /></Page>
        ];
      case 'market':
        return [
          <Page key="market-buy-l" side="left"><BestiaryActionPage side="left" forceType="shop-buy" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} onAddNewPet={handleAddNewPet} profile={userProfile} setUserProfile={setUserProfile} /></Page>,
          <Page key="market-buy-r" side="right"><LogoAnimation /></Page>,
          <Page key="market-sell-l" side="left"><BestiaryActionPage side="left" forceType="shop-sell" progress={progress} setProgress={setProgress} activePetId={activePetId} toggleFlipLock={toggleFlipLock} onAddNewPet={handleAddNewPet} profile={userProfile} setUserProfile={setUserProfile} /></Page>,
          <Page key="market-sell-r" side="right"><LogoAnimation /></Page>
        ];
      case 'profile':
        return [
          <Page key="profile-main-l" side="left"><Profile progress={progress} setProgress={setProgress} view="main" userProfile={userProfile} setUserProfile={setUserProfile} /></Page>,
          <Page key="profile-main-r" side="right"><LogoAnimation /></Page>,
          
          <Page key="profile-set-l" side="left"><Profile progress={progress} setProgress={setProgress} view="settings" userProfile={userProfile} setUserProfile={setUserProfile} /></Page>,
          <Page key="profile-set-r" side="right"><LogoAnimation /></Page>
        ];
      case 'gallery':
        return Array.from({ length: gallerySpreadsCount }).flatMap((_, i) => {
          const pet = progress.pets[i];
          return [
            <Page key={`gallery-${i}-l`} side="left"><Gallery progress={progress} side="left" manualId={pet?.id} /></Page>,
            <Page key={`gallery-${i}-r`} side="right"><Gallery progress={progress} side="right" manualId={pet?.id} /></Page>
          ];
        });
      case 'bestiary':
      default:
        return [
          /* Spread 0: Bestiary & Params (Stats) */
          <Page key="bestiary-l" id="bestiary-l" side="left"><Main progress={progress} setProgress={setProgress} manualActiveId={activePetId} /></Page>,
          <Page key="bestiary-r" id="bestiary-r" side="right"><PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} initialTab="stats" toggleFlipLock={toggleFlipLock} id="pet-detail-main" onAddNewPet={handleAddNewPet} /></Page>,
          
          /* Spread 1: Inventory */
          <Page key="inv-l" id="inv-l" side="left"><PetDetail progress={progress} setProgress={setProgress} manualId={activePetId} initialTab="inventory" toggleFlipLock={toggleFlipLock} id="pet-inv-main" onAddNewPet={handleAddNewPet} /></Page>,
          <Page key="inv-r" id="inv-r" side="right"><LogoAnimation /></Page>,
          
          /* Spread 2: Quest */
          <Page key="quest-l" side="left"><Quest progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} profile={userProfile} /></Page>,
          <Page key="quest-r" side="right"><LogoAnimation /></Page>,
          
          /* Spread 3: Battle */
          <Page key="battle-l" side="left"><Battle progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} side="left" /></Page>,
          <Page key="battle-r" side="right"><Battle progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} side="right" /></Page>,
          
          /* Evolution Pages (1 pet per spread) starting at Spread 4 */
          ...Array.from({ length: evolveSpreadsCount }).flatMap((_, i) => {
            const pet = progress.pets[i];
            return [
              <Page key={`evolve-ext-${i}-l`} side="left"><Evolve progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} side="left" manualId={pet?.id} /></Page>,
              <Page key={`evolve-ext-${i}-r`} side="right"><Evolve progress={progress} setProgress={setProgress} toggleFlipLock={toggleFlipLock} side="right" manualId={pet?.id} /></Page>
            ];
          })
        ];
    }
  };

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
            {getBookPages()}

          </HTMLFlipBook>
        </div>
      </div>

      <InfoModal 
        isOpen={!!limitError} 
        onClose={() => setLimitError(null)} 
        title="Лимит сущностей" 
      >
        <div className="space-y-4">
          <p className="text-[16px] font-black text-pen-red leading-relaxed border-b border-black/5 pb-4">
            Внимание! Ваш текущий ранг призывателя <strong>"{limitError?.name}"</strong>.
          </p>
          <div className="text-sm font-bold text-pen-blue/80">
            Он позволяет иметь не более <span className="text-xl text-pen-blue">{limitError?.limit}</span> питомцев.
          </div>
          <div className="bg-white/50 p-4 border border-black/10 text-xs font-black text-pen-blue italic rounded-sm">
            Чтобы повысить ранг и призывать больше сущностей, вам необходимо развивать и прокачивать своих текущих питомцев!
          </div>
          <NeonButton onClick={() => setLimitError(null)} className="w-full">Понятно</NeonButton>
        </div>
      </InfoModal>
    </div>
  );
};

export default function App() {
  // Use INITIAL_PROGRESS while loading
  const [progress, setProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localforage on mount
  useEffect(() => {
    import('localforage').then((localforage) => {
      localforage.default.getItem('aisai_progress').then((saved: any) => {
        if (!saved) {
           const fallback = localStorage.getItem('aisai_progress');
           if (fallback) {
              try {
                saved = JSON.parse(fallback);
              } catch(e) {}
           }
        }
        
        if (saved) {
          try {
            const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
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
              
              const rawSkills = (p.skills && p.skills.length > 0 ? p.skills : [
                { id: 'p1', name: 'Титаническая Стойкость', type: 'passive', targetStat: 'defense', value: 10, fallbackEmoji: '🛡️' },
                { id: 'a1', name: 'Яростный Резонанс', type: 'active_buff', targetStat: 'attack', value: 11, fallbackEmoji: '⚡' },
                { id: 'd1', name: 'Парализующий Крик', type: 'active_debuff', targetStat: 'attack', value: 25, fallbackEmoji: '📢' }
              ]);

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
                level: p.level || 1,
                experience: p.experience || 0,
                statPoints: typeof p.statPoints === 'number' ? p.statPoints : 0,
                classification: p.classification || { 
                  type: "Неизвестно", class: "Неизвестно", order: "Неизвестно", 
                  family: "Неизвестно", genus: "Неизвестно", species: "Неизвестно" 
                },
                ageStage: p.ageStage && p.ageStage.includes(' - ') ? p.ageStage : getPetRankByLevel(p.level || 1),
                skills: rawSkills.map((s: any, idx: number) => {
                  let emoji = s.fallbackEmoji || s.emoji;
                  if (emoji === '🎐' || s.name.includes('Грудь') || s.name.includes('Стойкость')) emoji = '🛡️';
                  if (emoji === '💥' || s.name.includes('Транс') || s.name.includes('Резонанс')) emoji = '⚡';
                  if (emoji === '📢' || s.name.includes('Крик')) emoji = '😱';
                  
                  let image = s.image;
                  if (image && image.includes('fonts.gstatic.com')) image = undefined;

                  return {
                    ...s,
                    code: s.code || generateUniqueCode('SK', `-${p.id}-${idx}`),
                    image,
                    element: s.element || (s.type !== 'passive' ? (p.element || 'fire') : undefined),
                    attribute: s.attribute || (s.type === 'passive' ? (p.attribute || 'void') : undefined),
                    fallbackEmoji: emoji || (s.type === 'passive' ? '🛡️' : '💥')
                  };
                })
              };
            });

            const migratedInventory = (parsed.inventory || []).map((item: any, idx: number) => ({
              ...item,
              code: item.code || generateUniqueCode(item.type === 'egg' ? 'EG' : item.type === 'artifact' ? 'AR' : 'ID', `-${idx}`),
              hue: item.type === 'egg' && item.hue === undefined ? Math.floor(Math.random() * 360) : item.hue,
              fallbackEmoji: item.fallbackEmoji || (item.type === 'egg' ? '🥚' : undefined)
            }));

            const marketInventory = parsed.marketInventory || INITIAL_PROGRESS.marketInventory;
            setProgress({ ...INITIAL_PROGRESS, ...parsed, pets: migratedPets, inventory: migratedInventory, marketInventory });
          } catch (e) {
            // handle error smoothly
          }
        }
        setIsLoaded(true);
      });
    });
  }, []);

  // Save to localforage
  useEffect(() => {
    if (isLoaded) {
      import('localforage').then((localforage) => {
        localforage.default.setItem('aisai_progress', progress).catch((err) => {
           console.error("LocalForage Set Error:", err);
           // Fallback for localStorage to prevent quota issue, strip images
           try {
             const minifiedProgress = {
               ...progress,
               pets: progress.pets.map(p => ({
                 ...p,
                 image: p.image && p.image.length > 50000 ? '' : p.image // Strip large base64 images
               }))
             };
             localStorage.setItem('aisai_progress', JSON.stringify(minifiedProgress));
           } catch(e) {}
        });
      });
    }
  }, [progress, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      setProgress(prev => updateEnergy(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoaded]);

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

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#FDF9F1]">
         <div className="w-16 h-16 border-4 border-[#0047ab]/20 border-t-[#0047ab] rounded-full animate-spin"></div>
         <p className="mt-4 font-black text-[#0047ab] text-xl animate-pulse tracking-tight">ЗАГРУЗКА...</p>
      </div>
    );
  }

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
