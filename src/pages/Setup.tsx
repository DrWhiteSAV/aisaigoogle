import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { NeonButton } from '../components/UI';
import { Pet, Rarity, UserProfile } from '../types';
import { generatePetStatsAndLore, generatePetArt } from '../services/aiService';
import { motion } from 'motion/react';
import { Loader2, Plus } from 'lucide-react';

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

  const [customHobby, setCustomHobby] = useState('');
  const [customTrait, setCustomTrait] = useState('');

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

  const toggleSelection = (list: string[], item: string, limit: number) => {
    if (list.includes(item)) return list.filter(i => i !== item);
    if (list.length < limit) return [...list, item];
    return list;
  };

  const handleGenerate = async () => {
    if (!profile.name || !profile.city || profile.hobbies.length === 0 || profile.traits.length === 0) {
      setErrorMessage('Пожалуйста, заполните анкету полностью!');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
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
      
      const art = await generatePetArt({ 
        id: petId, rarity: forcedRarity, personality: profile.traits[0] as any,
        habitat: 'forest', classification, element, attribute, level: 1, ageStage: 'F - младенчество'
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
    } catch (error) { 
      console.error(error);
      setErrorMessage("Ошибка генерации. Проверьте соединение."); 
    }
    finally { setLoading(false); }
  };

  const addCustomHobby = () => {
    if (customHobby.trim() && !profile.hobbies.includes(customHobby.trim()) && profile.hobbies.length < 8) {
      setProfile({ ...profile, hobbies: [...profile.hobbies, customHobby.trim()] });
      setCustomHobby('');
    }
  };

  const addCustomTrait = () => {
    if (customTrait.trim() && !profile.traits.includes(customTrait.trim()) && profile.traits.length < 8) {
      setProfile({ ...profile, traits: [...profile.traits, customTrait.trim()] });
      setCustomTrait('');
    }
  };

  const isStep1Valid = profile.name.trim().length >= 2 && profile.city.trim().length >= 2 && profile.about.trim().length > 5;
  const isStep2Valid = profile.hobbies.length >= 1 && profile.traits.length >= 1;

  const handleNext = () => {
    if (currentStep === 1 && isStep1Valid) navigate('/about');
    if (currentStep === 2 && isStep2Valid) navigate('/make');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-center p-8 bg-[#f5f2e9] ledger-grid relative overflow-hidden">
      {side === 'left' ? (
        <div className="space-y-6 relative z-10 w-full max-w-xs">
          <Loader2 className="h-16 w-16 text-pen-blue animate-spin mx-auto" />
          <h2 className="text-3xl font-black italic text-pen-blue leading-tight">Синтез сущности...</h2>
          <p className="text-pen-blue/40 font-black italic text-xs uppercase tracking-widest">Формирование цифровой структуры</p>
          <div className="w-full h-[3px] bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-pen-blue"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 12, ease: "linear" }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 opacity-30 relative z-10">
          <div className="h-12 w-12 border-2 border-black/5 rotate-45 animate-pulse mx-auto" />
          <p className="text-[10px] font-black italic text-pen-blue uppercase tracking-tight">Синхронизация ментального оттиска...</p>
        </div>
      )}
    </div>
  );

  if (pet && side === 'left') return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[280px] aspect-[9/16] rounded-[2px] overflow-hidden border-2 border-black rotate-1 shadow-2xl bg-white relative group"
      >
        <img src={pet.image} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" alt={pet.name} />
        <div className="absolute inset-0 pointer-events-none border-[12px] border-white/10" />
      </motion.div>
      <div>
        <h2 className="text-3xl font-black italic text-pen-blue leading-none mb-1">{pet.name}</h2>
        <div className="text-[10px] font-black italic text-pen-blue/40 uppercase tracking-widest">Ранг: {forcedRarityMap[pet.rarity]}</div>
      </div>
    </div>
  );

  if (pet && side === 'right') return (
    <div className="flex flex-col h-full p-8 text-center items-center justify-center space-y-8">
      <div className="flex-1 overflow-y-auto no-scrollbar pt-10 flex flex-col justify-center">
        <h3 className="text-xl font-black italic text-pen-blue mb-4">История Проявления</h3>
        <p className="text-sm font-black italic text-pen-blue/70 leading-relaxed whitespace-pre-wrap max-w-sm mx-auto">
          {pet.lore}
        </p>
      </div>
      <NeonButton onClick={() => { 
        onComplete(pet);
        navigate(isMarketSummon ? '/shop' : '/main');
      }} className="w-full py-6 text-xl font-black italic bg-sticker-yellow border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">ПОДПИСАТЬ КОНТРАКТ</NeonButton>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 pt-[10px] space-y-4 overflow-hidden relative">
      {currentStep === 1 && (
        side === 'left' ? (
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-4xl font-black italic text-pen-blue mb-6">Анкета</h2>
            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-pen-blue/40 uppercase tracking-widest">Инициалы</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-transparent border-b-2 border-black/10 py-1 text-3xl font-black italic text-pen-blue focus:border-pen-blue outline-none transition-all"
                />
              </div>
              <div className="space-y-4 pt-2">
                 <div>
                    <label className="text-[10px] font-black text-pen-blue/40 uppercase block mb-3 italic tracking-wider">Биологический цикл: {profile.age}</label>
                    <input 
                       type="range" min="5" max="99" value={profile.age}
                       onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
                       className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer accent-pen-blue"
                    />
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setProfile({...profile, gender: 'male'})}
                      className={cn(
                        "flex-1 py-3 text-xs font-black italic border-2 transition-all",
                        profile.gender === 'male' ? "bg-pen-blue text-white border-pen-blue rotate-1 shadow-sm" : "border-black/5 text-black/20"
                      )}
                    >МУЖСКОЙ</button>
                    <button 
                      onClick={() => setProfile({...profile, gender: 'female'})}
                      className={cn(
                        "flex-1 py-3 text-xs font-black italic border-2 transition-all",
                        profile.gender === 'female' ? "bg-pen-blue text-white border-pen-blue -rotate-1 shadow-sm" : "border-black/5 text-black/20"
                      )}
                    >ЖЕНСКИЙ</button>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <h2 className="text-4xl font-black italic text-pen-blue mb-4">Манифест</h2>
            <div className="flex-1 flex flex-col space-y-6 overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-pen-blue/40 uppercase tracking-widest">Регион связи</label>
                <input 
                  type="text" 
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  placeholder="Где вы сейчас?"
                  className="w-full bg-transparent border-b-2 border-black/10 py-1 text-2xl font-black italic text-pen-blue focus:border-pen-blue outline-none transition-all placeholder:text-black/5"
                />
              </div>
              <div className="space-y-1 pt-2">
                 <label className="text-[10px] font-black text-pen-blue/40 uppercase block italic tracking-wider mb-2">Голос Разума</label>
                 <textarea 
                    value={profile.about}
                    onChange={(e) => setProfile({...profile, about: e.target.value})}
                    placeholder="Напишите пару строк о своей философии..."
                    rows={5}
                    className="w-full bg-white/20 border-2 border-black/5 p-4 text-sm font-black italic text-pen-blue focus:border-pen-blue/20 outline-none transition-all resize-none placeholder:text-black/5 leading-relaxed"
                 />
              </div>
              <div className="mt-8">
                <NeonButton 
                  onClick={handleNext} 
                  disabled={!isStep1Valid}
                  className={cn(
                    "w-full py-6 text-xl font-black italic transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black",
                    !isStep1Valid ? "opacity-20 grayscale cursor-not-allowed" : "bg-sticker-yellow"
                  )}
                >
                  ДАЛЕЕ / NEXT
                </NeonButton>
              </div>
            </div>
          </div>
        )
      )}

      {currentStep === 2 && (
        side === 'left' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-end mb-4 pr-2">
              <h2 className="text-4xl font-black italic text-pen-blue leading-none">Увлечения</h2>
              <span className="text-xs font-black text-pen-blue/40 bg-black/5 px-2 py-0.5 rounded-full">{profile.hobbies.length}/8</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 py-2">
                <div className="flex flex-wrap gap-2 content-start">
                  {HOBBIES.map(h => (
                    <button 
                      key={h}
                      onClick={() => setProfile({...profile, hobbies: toggleSelection(profile.hobbies, h, 8)})}
                      className={cn(
                        "px-3 py-1.5 border-2 text-[11px] font-black italic transition-all",
                        profile.hobbies.includes(h) ? "bg-sticker-yellow border-black rotate-1 shadow-md" : "border-black/5 text-black/20 hover:border-black/20"
                      )}
                    >{h}</button>
                  ))}
                  {profile.hobbies.filter(h => !HOBBIES.includes(h)).map(h => (
                    <button 
                      key={`custom-${h}`}
                      onClick={() => setProfile({...profile, hobbies: profile.hobbies.filter(i => i !== h)})}
                      className="px-3 py-1.5 border-2 text-[11px] font-black italic bg-sticker-yellow border-black rotate-1 shadow-md"
                    >{h}</button>
                  ))}
                  
                  {/* Inline custom input */}
                  <div className="flex gap-2 items-center min-w-[150px] border-b-2 border-black/10 px-2">
                    <input 
                      type="text" 
                      value={customHobby}
                      onChange={(e) => setCustomHobby(e.target.value)}
                      placeholder="Добавить..."
                      className="flex-1 bg-transparent py-1 text-xs font-black italic text-pen-blue outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && addCustomHobby()}
                    />
                    <button onClick={addCustomHobby} className="p-1">
                      <Plus className="h-4 w-4 text-pen-blue" />
                    </button>
                  </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-end mb-4 pr-2">
              <h2 className="text-4xl font-black italic text-pen-blue leading-none">Черты Души</h2>
              <span className="text-xs font-black text-pen-blue/40 bg-black/5 px-2 py-0.5 rounded-full">{profile.traits.length}/8</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 py-2">
                <div className="flex flex-wrap gap-2 content-start">
                  {currentTraitsList.map(t => (
                    <button 
                      key={t}
                      onClick={() => setProfile({...profile, traits: toggleSelection(profile.traits, t, 8)})}
                      className={cn(
                        "px-3 py-1.5 border-2 text-[11px] font-black italic transition-all",
                        profile.traits.includes(t) ? "bg-sticker-pink border-black -rotate-1 shadow-md" : "border-black/5 text-black/20 hover:border-black/20"
                      )}
                    >{t}</button>
                  ))}
                  {profile.traits.filter(t => !currentTraitsList.includes(t)).map(t => (
                    <button 
                      key={`custom-${t}`}
                      onClick={() => setProfile({...profile, traits: profile.traits.filter(i => i !== t)})}
                      className="px-3 py-1.5 border-2 text-[11px] font-black italic bg-sticker-pink border-black -rotate-1 shadow-md"
                    >{t}</button>
                  ))}
                  
                  {/* Inline custom input */}
                  <div className="flex gap-2 items-center min-w-[150px] border-b-2 border-black/10 px-2">
                    <input 
                      type="text" 
                      value={customTrait}
                      onChange={(e) => setCustomTrait(e.target.value)}
                      placeholder="Черта..."
                      className="flex-1 bg-transparent py-1 text-xs font-black italic text-pen-blue outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && addCustomTrait()}
                    />
                    <button onClick={addCustomTrait} className="p-1">
                      <Plus className="h-4 w-4 text-pen-blue" />
                    </button>
                  </div>

                  {/* Inline button */}
                  <div className="w-full pt-8">
                    <NeonButton 
                      onClick={handleNext} 
                      disabled={!isStep2Valid}
                      className={cn(
                        "w-full py-6 text-xl font-black italic transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black",
                        !isStep2Valid ? "opacity-20 grayscale cursor-not-allowed" : "bg-sticker-yellow"
                      )}
                    >
                      ПРИЗВАТЬ СУЩНОСТЬ
                    </NeonButton>
                  </div>
                </div>
            </div>
          </div>
        )
      )}

      {currentStep === 3 && !loading && !pet && (
        side === 'left' ? (
          <div className="h-full flex flex-col items-center justify-center space-y-10 flex-1">
             <div className="text-center space-y-4">
                <h2 className="text-5xl font-black italic text-pen-blue tracking-tighter">Готовы?</h2>
                <div className="h-[2px] w-12 bg-pen-blue/20 mx-auto" />
                <p className="text-[12px] font-black italic text-pen-blue/40 uppercase tracking-[0.2em]">Протокол слияния активен</p>
             </div>
             <NeonButton onClick={handleGenerate} className="px-16 py-10 text-3xl font-black italic bg-sticker-yellow shadow-2xl hover:scale-105 transition-transform">
                НАЧАТЬ СИНТЕЗ
             </NeonButton>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-40">
             <div className="h-24 w-24 border-2 border-black/10 rotate-45 mx-auto flex items-center justify-center p-2">
                <div className="h-full w-full border border-black/10 rotate-45 animate-pulse" />
             </div>
             <p className="text-[12px] font-black italic text-pen-blue uppercase tracking-tighter">Ожидание биометрического следа...</p>
          </div>
        )
      )}
    </div>
  );
};
