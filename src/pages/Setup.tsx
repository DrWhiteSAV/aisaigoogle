import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { GlassCard, NeonButton } from '../components/UI';
import { Pet, Rarity, UserProfile } from '../types';
import { generatePetStatsAndLore, generatePetArt } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Plus } from 'lucide-react';
import { HandwrittenText } from '../components/UI';

const forcedRarityMap: Record<string, string> = {
  normal: 'ОБЫЧНЫЙ',
  advanced: 'ПРОДВИНУТЫЙ',
  rare: 'РЕДКИЙ',
  perfect: 'ИДЕАЛЬНЫЙ',
  epic: 'ЭПИЧЕСКИЙ',
  legendary: 'ЛЕГЕНДАРНЫЙ',
  mythical: 'МИФИЧЕСКИЙ',
  eternal: 'ВЕЧНЫЙ',
  divine: 'БОЖЕСТВЕННЫЙ',
  transcendent: 'ТРАНСЦЕНДЕНТНЫЙ'
};

export const Setup: React.FC<{ 
  onComplete: (pet: Pet) => void; 
  step?: number; 
  isMarketSummon?: boolean;
  side?: 'left' | 'right';
  externalPet?: Pet | null;
  externalLoading?: boolean;
  externalError?: string | null;
  setExternalPet?: (pet: Pet | null) => void;
  setExternalLoading?: (loading: boolean) => void;
  setExternalError?: (error: string | null) => void;
}> = ({ 
  onComplete, 
  step: currentStep = 1, 
  isMarketSummon, 
  side,
  externalPet,
  externalLoading,
  externalError,
  setExternalPet,
  setExternalLoading,
  setExternalError
}) => {
  const navigate = useNavigate();
  
  // Use local state if external ones are not provided (for standalone usage if any)
  const [localLoading, setLocalLoading] = useState(false);
  const [localPet, setLocalPet] = useState<Pet | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const loading = externalLoading !== undefined ? externalLoading : localLoading;
  const pet = externalPet !== undefined ? externalPet : localPet;
  const errorMessage = externalError !== undefined ? externalError : localError;

  const setLoading = (val: boolean) => {
    if (setExternalLoading) setExternalLoading(val);
    else setLocalLoading(val);
  };
  const setGeneratedPet = (val: Pet | null) => {
    if (setExternalPet) setExternalPet(val);
    else setLocalPet(val);
  };
  const setErrorMessage = (val: string | null) => {
    if (setExternalError) setExternalError(val);
    else setLocalError(val);
  };

  const [profile, setProfile] = useState<UserProfile>(() => {
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
    localStorage.setItem('aisai_user_profile', JSON.stringify(profile));
  }, [profile]);

  const HOBBIES = [
    'Рисование', 'Пение', 'Танцы', 'Чтение', 'Кино', 'Видеоигры', 'Программирование', 
    'Кулинария', 'Путешествия', 'Спорт', 'Йога', 'Фотография', 'Садоводство', 'Аниме', 
    'Коллекционирование', 'Музыка', 'Писательство', 'Рыбалка', 'Походы', 'Волонтерство', 
    'Шахматы', 'Космос', 'Астрономия', 'Наука', 'Мода', 'Блогинг', 'Языки', 'Психология', 
    'Эзотерика', 'Театр'
  ];

  const currentTraitsList = profile.gender === 'male' ? [
    'Добрый', 'Смелый', 'Умный', 'Веселый', 'Спокойный', 'Честный', 'Трудолюбивый', 
    'Мечтательный', 'Ответственный', 'Решительный', 'Скромный', 'Энергичный', 
    'Творческий', 'Серьезный', 'Дружелюбный'
  ] : [
    'Добрая', 'Смелая', 'Умная', 'Веселая', 'Спокойная', 'Честная', 'Трудолюбивая', 
    'Мечтательная', 'Ответственная', 'Решительная', 'Скромная', 'Энергичная', 
    'Творческая', 'Серьезная', 'Дружелюбная'
  ];

  const handleGenerate = async () => {
    if (!profile.name || !profile.city || profile.hobbies.length === 0 || profile.traits.length === 0) {
      setErrorMessage('Пожалуйста, заполните анкету полностью!');
      return;
    }
    setLoading(true);
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
      
      const { name, stats, abilities, lore, classification, element, attribute } = await generatePetStatsAndLore(profile, forcedRarity);
      const petId = Math.random().toString(36).substr(2, 9);
      
      // Explicitly request vertical 9:16 aspect ratio in prompt context if possible, 
      // though the service might need adjustment too.
      const art = await generatePetArt({ 
        id: petId, rarity: forcedRarity, personality: profile.traits[0] as any,
        habitat: 'forest', classification, element, attribute
      });

      const newPet: Pet = {
        id: petId, 
        name, 
        rarity: forcedRarity, 
        element: (element as any) || 'fire', 
        attribute: (attribute as any) || 'void',
        personality: profile.traits[0] as any, 
        habitat: 'forest', 
        image: art,
        stats: { ...stats, maxHealth: stats.health, maxRage: 100, rage: 0 },
        classification, 
        abilities, 
        lore, 
        level: 1, 
        experience: 0, 
        materials: {}, 
        ageStage: 'F - младенчество',
        isRankRevealed: false, 
        statPoints: 0,
      };
      setGeneratedPet(newPet);
    } catch (error) { setErrorMessage("Ошибка генерации. Проверьте соединение."); }
    finally { setLoading(false); }
  };

  const toggleSelection = (list: string[], item: string, limit: number) => {
    if (list.includes(item)) return list.filter(i => i !== item);
    if (list.length < limit) return [...list, item];
    return list;
  };

  const isStep1Valid = profile.name.trim().length > 0 && profile.city.trim().length > 0 && profile.about.trim().length > 0;
  const isStep2Valid = profile.hobbies.length > 0 && profile.traits.length > 0;

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) navigate('/about');
    if (currentStep === 2 && isStep2Valid) navigate('/make');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-center p-8">
      {side === 'left' ? (
        <div className="space-y-6">
          <Loader2 className="h-16 w-16 text-pen-blue animate-spin mx-auto" />
          <h2 className="text-3xl font-black italic text-pen-blue">Синтез сущности...</h2>
          <p className="text-pen-blue/40 font-black italic text-sm">Формирование цифровой структуры (9:16)</p>
        </div>
      ) : (
        <div className="space-y-4 opacity-30">
          <div className="h-12 w-12 border-2 border-black/5 rotate-45 animate-pulse mx-auto" />
          <p className="text-[10px] font-black italic text-pen-blue uppercase">Синхронизация ментального оттиска...</p>
        </div>
      )}
    </div>
  );

  if (pet && side === 'left') return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 text-center">
      <div className="w-full max-w-[240px] aspect-[9/16] rounded-[4px] overflow-hidden border-2 border-black rotate-1 shadow-xl bg-white/50">
        <img src={pet.image} className="w-full h-full object-cover" />
      </div>
      <div>
        <h2 className="text-3xl font-black italic text-pen-blue leading-none">{pet.name}</h2>
        <div className="text-[10px] font-black italic text-pen-blue/40 mt-1 uppercase">Редкость: {forcedRarityMap[pet.rarity]}</div>
      </div>
    </div>
  );

  if (pet && side === 'right') return (
    <div className="flex flex-col h-full p-8 text-center items-center justify-center space-y-8">
      <div className="flex-1 overflow-y-auto no-scrollbar pt-10 flex flex-col justify-center">
        <h3 className="text-lg font-black italic text-pen-blue mb-4">История Проявления</h3>
        <p className="text-sm font-black italic text-pen-blue/60 leading-relaxed whitespace-pre-wrap max-w-sm">
          {pet.lore}
        </p>
      </div>
      <NeonButton onClick={() => { 
        onComplete(pet);
        navigate(isMarketSummon ? '/shop' : '/main');
      }} className="w-full py-6 text-xl font-black italic">ПОДПИСАТЬ КОНТРАКТ</NeonButton>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 pt-[10px] space-y-8 overflow-y-auto no-scrollbar">
      {/* Step 1: Personality (Left) & Manifesto (Right) */}
      {currentStep === 1 && (
        side === 'left' ? (
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-3xl font-black italic text-pen-blue">Личность</h2>
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-pen-blue/40 uppercase">Имя / ID</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-transparent border-b-2 border-black/10 py-1 text-2xl font-black italic text-pen-blue focus:border-pen-blue outline-none transition-all"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                 <div className="flex-1 mr-8">
                    <label className="text-[10px] font-black text-pen-blue/40 uppercase block mb-1 italic">Возраст: {profile.age}</label>
                    <input 
                       type="range" min="5" max="99" value={profile.age}
                       onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                       className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer accent-pen-blue"
                    />
                 </div>
              </div>
              <div className="space-y-2 pt-2 opacity-30">
                <div className="flex items-center gap-3 border-2 border-black/5 p-2">
                   <div className="h-6 w-6 bg-black/5 flex items-center justify-center text-[10px] font-bold">G</div>
                   <div className="text-[10px] font-black italic truncate">Google: shishkarnem@gmail.com</div>
                </div>
                <div className="flex items-center gap-3 border-2 border-black/5 p-2">
                   <div className="h-6 w-6 bg-black/5 flex items-center justify-center text-[10px] font-bold">T</div>
                   <div className="text-[10px] font-black italic">Telegram: @user_id</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            <h2 className="text-3xl font-black italic text-pen-blue">Приписка</h2>
            <div className="flex-1 flex flex-col space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-pen-blue/40 uppercase">Город</label>
                <input 
                  type="text" 
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  placeholder="Ваш город..."
                  className="w-full bg-transparent border-b-2 border-black/10 py-1 text-xl font-black italic text-pen-blue focus:border-pen-blue outline-none transition-all placeholder:text-black/5"
                />
              </div>
              <div className="space-y-1 pt-2">
                 <label className="text-[10px] font-black text-pen-blue/40 uppercase block italic">Манифест</label>
                 <textarea 
                    value={profile.about}
                    onChange={(e) => setProfile({...profile, about: e.target.value})}
                    placeholder="Ваше жизненное кредо..."
                    rows={3}
                    className="w-full bg-white/30 border-2 border-black/5 p-2 text-sm font-black italic text-pen-blue focus:border-pen-blue/20 outline-none transition-all resize-none placeholder:text-black/5"
                 />
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <NeonButton 
                  onClick={handleNext} 
                  disabled={!isStep1Valid}
                  className={cn(
                    "w-full py-5 text-xl font-black italic transition-all",
                    !isStep1Valid ? "opacity-20 grayscale cursor-not-allowed" : "opacity-100"
                  )}
                >
                  ДАЛЕЕ
                </NeonButton>
              </div>
            </div>
          </div>
        )
      )}

      {/* Step 2: Hobbies (Left) & Traits (Right) */}
      {currentStep === 2 && (
        side === 'left' ? (
          <div className="space-y-2 flex-1 flex flex-col">
            <h2 className="text-3xl font-black italic text-pen-blue">Увлечения</h2>
            <div className="flex flex-wrap gap-1.5 flex-1 pt-2 content-start">
               {HOBBIES.map(h => (
                 <button 
                   key={h}
                   onClick={() => setProfile({...profile, hobbies: toggleSelection(profile.hobbies, h, 8)})}
                   className={cn(
                     "px-2 py-1 border-2 text-[10px] font-black italic transition-all",
                     profile.hobbies.includes(h) ? "bg-sticker-yellow border-black rotate-2 shadow-sm" : "border-black/5 text-black/20 hover:border-black/20"
                   )}
                 >{h}</button>
               ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full">
            <h2 className="text-3xl font-black italic text-pen-blue">Черты Души</h2>
            <div className="flex flex-wrap gap-1.5 pt-2">
               {currentTraitsList.map(t => (
                 <button 
                   key={t}
                   onClick={() => setProfile({...profile, traits: toggleSelection(profile.traits, t, 5)})}
                   className={cn(
                     "px-2 py-1 border-2 text-[10px] font-black italic transition-all",
                     profile.traits.includes(t) ? "bg-sticker-pink border-black -rotate-1 shadow-sm" : "border-black/5 text-black/20 hover:border-black/20"
                   )}
                 >{t}</button>
               ))}
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
              <NeonButton 
                onClick={handleNext} 
                disabled={!isStep2Valid}
                className={cn(
                  "w-full py-5 text-xl font-black italic bg-sticker-yellow transition-all",
                  !isStep2Valid ? "opacity-20 grayscale cursor-not-allowed" : "opacity-100"
                )}
              >
                ПРИЗВАТЬ СУЩНОСТЬ
              </NeonButton>
              {errorMessage && <div className="text-pen-red text-[10px] font-black italic mt-2 uppercase">{errorMessage}</div>}
            </div>
          </div>
        )
      )}

      {/* Step 3: Make Spread - Handled by loading/pet states above */}
      {currentStep === 3 && !loading && !pet && (
        side === 'left' ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 flex-1">
             <div className="text-center">
                <h2 className="text-3xl font-black italic text-pen-blue">Готовы?</h2>
                <p className="text-[10px] font-black italic text-pen-blue/40 uppercase mt-2">Ритуал проявления неизбежен</p>
             </div>
             <NeonButton onClick={handleGenerate} className="w-full py-6 text-xl font-black italic bg-sticker-yellow">
                НАЧАТЬ СИНТЕЗ
             </NeonButton>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
             <div className="h-16 w-16 border-2 border-black/5 rotate-45 mx-auto" />
             <p className="text-[10px] font-black italic text-pen-blue uppercase">Ожидание инициации...</p>
          </div>
        )
      )}
    </div>
  );
};
