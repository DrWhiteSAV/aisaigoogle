import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { NeonButton, AnimatedEgg } from '../components/UI';
import { Pet, Rarity, UserProfile } from '../types';
import { generatePetStatsAndLore, generatePetArt } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Plus, X } from 'lucide-react';
import { RARITY_LABELS } from '../constants/gameData';
import { ElementSticker, AttributeSticker } from '../components/GameUI';

interface EditModalProps {
  editingField: 'name' | 'city' | 'about' | 'hobby' | 'trait' | 'age' | null;
  modalValue: string;
  setModalValue: (val: string) => void;
  saveEditModal: () => void;
  onClose: () => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  hobbiesList: string[];
  traitsList: string[];
  toggleSelection: (list: string[], item: string, limit: number) => string[];
  isMobileBook?: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ 
  editingField, 
  modalValue, 
  setModalValue, 
  saveEditModal, 
  onClose,
  profile,
  setProfile,
  hobbiesList,
  traitsList,
  toggleSelection,
  isMobileBook
}) => {
  const isTagField = editingField === 'hobby' || editingField === 'trait';
  const currentList = editingField === 'hobby' ? profile.hobbies : profile.traits;
  const options = editingField === 'hobby' ? hobbiesList : traitsList;
  const limit = 8;

  return createPortal(
    <AnimatePresence>
      {editingField && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center p-[5%] bg-black/40"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseMove={(e) => e.stopPropagation()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "w-full bg-[#f2ede0] ledger-grid border-2 border-pen-blue pointer-events-auto relative flex flex-col overflow-hidden shadow-2xl",
              isTagField 
                ? (isMobileBook 
                    ? "max-w-[95%] h-[75vh] max-h-[75vh] p-4" 
                    : "max-w-2xl h-[75vh] max-h-[75vh] md:h-[80vh] md:max-h-[80vh] p-4 md:p-6")
                : "max-w-md h-auto max-h-full p-6"
            )}
            style={{ 
              color: 'var(--color-pen-blue)', 
              fontWeight: isMobileBook ? undefined : 100, 
              fontSize: isMobileBook ? undefined : '12px',
              fontStyle: 'normal'
            }}
          >
            <div className="absolute top-2 right-2 flex gap-1 z-50">
              <button onClick={onClose} className="p-2 flex items-center justify-center rounded-full hover:bg-black/5 text-pen-blue opacity-50 hover:opacity-100 transition-all">
                <X className="h-6 w-6" strokeWidth={3} />
              </button>
            </div>
            <h3 className={cn("font-black text-pen-blue mb-4 mr-8", isMobileBook ? "text-[18px] mb-2" : "text-2xl")}>
              {editingField === 'name' ? 'Введите Имя' : 
               editingField === 'city' ? 'Ваш Регион' : 
               editingField === 'hobby' ? 'Выберите Увлечения' :
               editingField === 'trait' ? 'Выберите Черты Души' :
               editingField === 'age' ? 'Ваш Возраст' :
               'Голос Разума'}
            </h3>
            
            {isTagField ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         if (!modalValue.trim()) return;
                         if (editingField === 'hobby' && !profile.hobbies.includes(modalValue.trim()) && profile.hobbies.length < 8) {
                           setProfile({ ...profile, hobbies: [...profile.hobbies, modalValue.trim()] });
                         } else if (editingField === 'trait' && !profile.traits.includes(modalValue.trim()) && profile.traits.length < 8) {
                           setProfile({ ...profile, traits: [...profile.traits, modalValue.trim()] });
                         }
                         setModalValue('');
                       }
                    }}
                    placeholder="Добавить свой тег..."
                    className="flex-1 bg-white/40 border-b-2 border-pen-blue/20 py-1.5 px-3 text-base font-black text-pen-blue focus:border-pen-blue outline-none transition-all"
                  />
                  <button 
                    onClick={() => {
                       if (!modalValue.trim()) return;
                       if (editingField === 'hobby' && !profile.hobbies.includes(modalValue.trim()) && profile.hobbies.length < 8) {
                         setProfile({ ...profile, hobbies: [...profile.hobbies, modalValue.trim()] });
                       } else if (editingField === 'trait' && !profile.traits.includes(modalValue.trim()) && profile.traits.length < 8) {
                         setProfile({ ...profile, traits: [...profile.traits, modalValue.trim()] });
                       }
                       setModalValue('');
                    }}
                    className="aspect-square w-10 flex items-center justify-center bg-pen-blue text-white"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-1 min-h-0">
                  <div className="flex flex-wrap gap-1.5">
                    {options.map(item => (
                      <button 
                        key={item}
                        onClick={() => {
                          const newList = toggleSelection(currentList, item, limit);
                          setProfile({ ...profile, [editingField === 'hobby' ? 'hobbies' : 'traits']: newList });
                        }}
                        className={cn(
                          "border-2 transition-all",
                          isMobileBook ? "text-[10px] py-[3px] px-[8px]" : "text-xs py-[6px] px-[12px]",
                          currentList.includes(item) 
                            ? (editingField === 'hobby' ? "bg-sticker-yellow border-black font-black rotate-1" : "bg-sticker-pink border-black font-black -rotate-1")
                            : "border-pen-blue text-pen-blue font-normal italic hover:bg-pen-blue/5"
                        )}
                      >{item}</button>
                    ))}
                    {currentList.filter(i => !options.includes(i)).map(item => (
                      <button 
                        key={`custom-${item}`}
                        onClick={() => {
                          setProfile({ ...profile, [editingField === 'hobby' ? 'hobbies' : 'traits']: currentList.filter(i => i !== item) });
                        }}
                        className={cn(
                          "border-2 font-black bg-sticker-yellow border-black rotate-1",
                          isMobileBook ? "text-[10px] py-[3px] px-[8px]" : "text-xs py-[6px] px-[12px]",
                          editingField === 'trait' && "bg-sticker-pink -rotate-1"
                        )}
                      >{item}</button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-3 border-t-2 border-black/5 flex justify-between items-center bg-[#f2ede0]">
                  <span className="text-sm font-black text-pen-blue">Выбрано: {currentList.length}/{limit}</span>
                  <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-pen-blue text-white font-black hover:brightness-110 border-2 border-pen-blue text-sm"
                  >
                    Готово
                  </button>
                </div>
              </div>
            ) : (
              <>
                {editingField === 'about' ? (
                  <textarea 
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    rows={5}
                    autoFocus
                    className="w-full bg-white/40 border-2 border-black/5 p-4 text-sm font-black text-pen-blue focus:border-pen-blue outline-none transition-all resize-none mb-6"
                  />
                ) : (
                  <input 
                    type={editingField === 'age' ? 'number' : 'text'}
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEditModal()}
                    autoFocus
                    className="w-full bg-transparent border-b-2 border-black/20 py-2 text-2xl font-black text-pen-blue focus:border-pen-blue outline-none transition-all mb-6"
                    style={isMobileBook ? {
                      fontFamily: 'Georgia',
                      marginTop: '14px',
                      paddingTop: '12px',
                      paddingLeft: '11px',
                      paddingRight: '2px',
                      paddingBottom: '12px',
                      marginLeft: '0px',
                      marginRight: '0px'
                    } : undefined}
                  />
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={saveEditModal}
                    className={cn(
                      "flex-1 bg-pen-blue text-white border-2 border-pen-blue hover:brightness-110",
                      isMobileBook ? "py-2 text-[16px] font-normal" : "py-4 text-base font-black"
                    )}
                  >
                    Принять
                  </button>
                  <button 
                    onClick={onClose}
                    className={cn(
                      "flex-1 bg-white/40 border-2 border-pen-blue text-pen-blue hover:bg-black/5",
                      isMobileBook ? "py-2 text-[16px] font-normal" : "py-4 text-base font-black"
                    )}
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const Setup: React.FC<{ 
  onComplete: (pet: Pet) => void; 
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  step?: number; 
  isMarketSummon?: boolean;
  side?: 'left' | 'right';
  externalPet?: Pet | null;
  externalLoading?: boolean;
  externalError?: string | null;
  setExternalPet?: (pet: Pet | null) => void;
  setExternalLoading?: (loading: boolean) => void;
  setExternalError?: (error: string | null) => void;
  toggleFlipLock?: (id: string, locked: boolean) => void;
  onStartSummon?: () => void;
  hideAction?: boolean;
  isMobileBook?: boolean;
  mNavigate?: () => void;
}> = ({ 
  onComplete, 
  profile,
  setProfile,
  step: currentStep = 1, 
  isMarketSummon, 
  side,
  externalPet,
  externalLoading,
  externalError,
  setExternalPet,
  setExternalLoading,
  setExternalError,
  toggleFlipLock,
  onStartSummon,
  hideAction,
  isMobileBook,
  mNavigate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const componentId = React.useId();
  const lockId = `setup-${currentStep}-${side || 'main'}-${componentId}`;

  // Auto-start summoning if requested via state
  useEffect(() => {
    if (location.state?.autoSummon && onStartSummon && !isMobileBook) {
      onStartSummon();
      // Clear state to avoid re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, onStartSummon, navigate, location.pathname, isMobileBook]);

  const [localLoading, setLocalLoading] = useState(false);
  const [localPet, setLocalPet] = useState<Pet | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(100);
  const [showRetry, setShowRetry] = useState(false);

  const loading = externalLoading !== undefined ? externalLoading : localLoading;
  const pet = externalPet !== undefined ? externalPet : localPet;
  const errorMessage = externalError !== undefined ? externalError : localError;

  // Handle countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setShowRetry(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!loading) {
      setCountdown(100);
      setShowRetry(false);
    }
    return () => clearInterval(timer);
  }, [loading, countdown]);

  // Auto-complete when pet appears and we are the designated completion side
  useEffect(() => {
    if (pet && (side === 'right' || (currentStep === 3 && side === 'left'))) {
      onComplete(pet);
      // Add a small delay to allow state to settle before navigation
      const timer = setTimeout(() => {
        navigate(`/pet/${pet.id}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pet, side, currentStep, onComplete, navigate]);

  const [customHobby, setCustomHobby] = useState('');
  const [customTrait, setCustomTrait] = useState('');

  const [editingField, setEditingField] = useState<'name' | 'city' | 'about' | 'hobby' | 'trait' | 'age' | null>(null);
  const [modalValue, setModalValue] = useState('');

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

  useEffect(() => {
    if (toggleFlipLock) {
      toggleFlipLock(lockId, !!editingField);
    }
  }, [editingField, toggleFlipLock, lockId]);

  const openEditModal = (field: 'name' | 'city' | 'about' | 'hobby' | 'trait' | 'age', currentValue: string = '') => {
    setEditingField(field);
    setModalValue(currentValue);
  };

  const saveEditModal = () => {
    if (editingField === 'hobby') {
      if (modalValue.trim() && !profile.hobbies.includes(modalValue.trim()) && profile.hobbies.length < 8) {
        setProfile({ ...profile, hobbies: [...profile.hobbies, modalValue.trim()] });
      }
    } else if (editingField === 'trait') {
      if (modalValue.trim() && !profile.traits.includes(modalValue.trim()) && profile.traits.length < 8) {
        setProfile({ ...profile, traits: [...profile.traits, modalValue.trim()] });
      }
    } else if (editingField === 'age') {
      const val = parseInt(modalValue);
      if (!isNaN(val)) {
        setProfile({ ...profile, age: Math.min(999, Math.max(1, val)) });
      }
    } else if (editingField) {
      setProfile({ ...profile, [editingField]: modalValue });
    }
    setEditingField(null);
    setModalValue('');
  };

  const isStep1Valid = profile.name.trim().length >= 2 && profile.city.trim().length >= 2 && profile.about.trim().length > 5;
  const isStep2Valid = profile.hobbies.length >= 1 && profile.traits.length >= 1;

  const handleNext = () => {
    if (loading) return;
    if (currentStep === 1 && isStep1Valid) {
      if (isMobileBook && mNavigate) mNavigate();
      else navigate('/setup');
    }
    if (currentStep === 2 && isStep2Valid) {
      if (onStartSummon) {
        onStartSummon();
      } else {
        // Fallback for direct /setup flow
        navigate('/main');
      }
    }
  };

  // Removed automatic handleGenerate useEffect

  if (loading) return (
    <div className={cn("flex items-center justify-center h-full text-center relative overflow-hidden", isMobileBook ? "p-4 bg-transparent" : "p-8 bg-[#f5f2e9] ledger-grid")}>
      <div className={cn("relative z-10 w-full max-w-xs", isMobileBook ? "space-y-4" : "space-y-6")}>
        <div className={cn("mx-auto relative flex items-center justify-center", isMobileBook ? "h-64 w-64" : "h-80 w-80")}>
            {/* Background Aura */}
            <div className={cn("absolute border-4 border-dashed border-pen-blue/5 rounded-full animate-spin-slow opacity-20", isMobileBook ? "inset-x-[-40px] inset-y-[-40px]" : "inset-x-[-60px] inset-y-[-60px]")} />
            
            <AnimatedEgg hue={45} className={cn("relative z-10", isMobileBook ? "h-56 w-56" : "h-72 w-72")} />
        </div>
        <h2 className={cn("font-black text-pen-blue leading-tight", isMobileBook ? "text-2xl" : "text-3xl")}>
          {side === 'left' ? (isMarketSummon ? 'Высиживание...' : 'Призыв...') : (isMarketSummon ? 'Вылупление...' : 'Пробуждение...')}
        </h2>
        <p className={cn("text-pen-blue font-black tracking-wide", isMobileBook ? "text-[10px]" : "text-xs")}>
          {side === 'left' ? 'Энергетическая инкубация' : 'Материлизация сущности'}
        </p>
        
        <div className="relative">
          <div className="w-full h-[3px] bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-pen-blue"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, 100 - countdown)}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
          <div className="mt-2 text-[10px] font-black text-pen-blue">
            ОСТАЛОСЬ: {countdown}с
          </div>
        </div>

        {showRetry && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={isMobileBook ? "pt-2" : "pt-4"}
          >
            <button 
              onClick={() => {
                setCountdown(100);
                setShowRetry(false);
                if (onStartSummon) onStartSummon();
              }}
              className={cn("bg-pen-red text-white text-xs font-black rotate-1 border-2 border-black", isMobileBook ? "px-6 py-2" : "px-6 py-3")}
            >
              Повторить генерацию
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );

  if (currentStep === 3 && !pet) return (
    <div className={cn("h-full flex flex-col items-center justify-center text-center", isMobileBook ? "p-4 space-y-4 bg-transparent" : "p-8 space-y-6 bg-[#f5f2e9] ledger-grid opacity-50")}>
      <div className={cn("relative flex items-center justify-center", isMobileBook ? "w-32 h-32" : "w-40 h-40")}>
        <div className={cn("absolute border-2 border-dashed border-pen-blue/10 rounded-full animate-spin-slow opacity-20", isMobileBook ? "inset-x-[-20px] inset-y-[-20px]" : "inset-x-[-30px] inset-y-[-30px]")} />
        <AnimatedEgg hue={45} className={cn("opacity-30", isMobileBook ? "h-28 w-28" : "h-36 w-36")} />
      </div>
      <div className="space-y-2">
        <h2 className={cn("font-black text-pen-blue", isMobileBook ? "text-lg" : "text-xl")}>{isMarketSummon ? 'Подготовка к инкубации' : 'Ожидание Инициации'}</h2>
        <p className={cn("leading-relaxed", isMobileBook ? "text-[12px] font-normal text-pen-blue" : "text-[12px] font-black text-pen-blue")}>
          {isMarketSummon ? 'Настройте будущую сущность и разбейте скорлупу' : 'Завершите заполнение анкеты на левой странице и нажмите «Призвать сущность»'}
        </p>
      </div>
    </div>
  );

  if (pet && (side === 'right' || (currentStep === 3 && side === 'left'))) return (
    <div className={cn("flex items-center justify-center h-full text-center relative overflow-hidden", isMobileBook ? "p-4 bg-transparent" : "p-8 bg-[#f5f2e9] ledger-grid")}>
      <div className={cn("relative z-10 w-full max-w-xs", isMobileBook ? "space-y-4" : "space-y-6")}>
        <div className="w-16 h-16 bg-pen-blue rounded-full mx-auto flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 bg-white rotate-45" />
        </div>
        <h2 className={cn("font-black text-pen-blue leading-tight italic", isMobileBook ? "text-2xl" : "text-3xl")}>
          {isMarketSummon ? 'Скорлупа разбита!' : 'Связь установлена'}
        </h2>
        <p className={cn("font-black text-pen-blue italic tracking-[0.2em] animate-pulse", isMobileBook ? "text-[10px]" : "text-xs")}>
          {isMarketSummon ? 'Новый питомец готов...' : 'Перенос данных в бестиарий...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className={cn(isMobileBook ? "contents relative" : cn("flex flex-col relative", hideAction ? "h-auto" : "h-full overflow-hidden p-6 space-y-5"))}>
      <EditModal 
        editingField={editingField}
        modalValue={modalValue}
        setModalValue={setModalValue}
        saveEditModal={saveEditModal}
        onClose={() => setEditingField(null)}
        profile={profile}
        setProfile={setProfile}
        hobbiesList={HOBBIES}
        traitsList={currentTraitsList}
        toggleSelection={toggleSelection}
        isMobileBook={isMobileBook}
      />
      {errorMessage && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 border-2 border-red-400 p-2 text-[10px] font-black text-red-600 flex items-center justify-between z-[60] rotate-1">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline">X</button>
        </div>
      )}
      {currentStep === 1 && (
        <div className={cn(isMobileBook ? "contents" : cn("flex flex-col space-y-4", !hideAction && "flex-1 overflow-hidden"))}>
          {!hideAction && (
            <h2 className={cn("text-pen-blue", isMobileBook ? "text-[18px] font-bold leading-none italic pb-1 flex-shrink-0" : "font-black text-4xl mb-4 flex-shrink-0")}>
              {isMarketSummon ? 'ДНК Яйца' : 'Анкета'}
            </h2>
          )}
          <div className={cn(isMobileBook ? "flex flex-col space-y-2.5 pb-4" : "flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-4")}>
            <div className="space-y-1">
              <label className={cn("text-pen-blue", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>Имя Призывателя</label>
              <button 
                onClick={() => openEditModal('name', profile.name)}
                className={cn("w-full text-left bg-transparent border-b-2 border-black/10 text-pen-blue focus:border-pen-blue outline-none transition-all", isMobileBook ? "font-normal text-[12px] h-[27px] ml-[-2px] mb-[-8px] pt-0 mt-0 pb-0 flex items-center" : "font-black py-1 text-2xl min-h-[2.5rem]")}
              >
                {profile.name || 'Назовите его...'}
              </button>
            </div>
            
            <div className={cn("grid grid-cols-2", isMobileBook ? "gap-2" : "gap-4")}>
               <div className="space-y-1">
                  <label className={cn("text-pen-blue block italic", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>Возраст</label>
                  <button 
                     onClick={() => openEditModal('age', profile.age.toString())}
                     className={cn("w-full bg-white/40 border-2 border-pen-blue/10 text-pen-blue hover:border-pen-blue outline-none transition-all text-left", isMobileBook ? "font-normal text-[12px] pt-0 pb-0 pl-[6px] ml-0 -mt-[8px] -mb-[4px]" : "p-2 text-xl font-black")}
                  >
                    {profile.age}
                  </button>
               </div>
               <div className="space-y-1">
                  <label className={cn("text-pen-blue block italic", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>Регион</label>
                  <button 
                    onClick={() => openEditModal('city', profile.city)}
                    className={cn("w-full text-left bg-transparent border-b-2 border-black/10 text-pen-blue focus:border-pen-blue outline-none transition-all placeholder:text-black/5", isMobileBook ? "font-normal text-[12px] pb-0 pt-[5px] pl-0 -mt-[3px]" : "py-1 text-xl font-black")}
                  >
                    {profile.city || 'Город...'}
                  </button>
               </div>
            </div>

             <div className="space-y-1">
                <label className={cn("text-pen-blue block italic", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>Пол</label>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setProfile({...profile, gender: 'male'})}
                     className={cn(
                       "flex-1 transition-all border-2 border-black",
                       isMobileBook ? "py-1 text-[10px] border-[#0047ab] font-bold text-[#0047ab]" : "py-4 text-base font-black",
                       profile.gender === 'male' ? "bg-sticker-yellow text-black rotate-1" : "bg-transparent text-pen-blue hover:bg-black/5"
                     )}
                   >Мужской</button>
                   <button 
                     onClick={() => setProfile({...profile, gender: 'female'})}
                     className={cn(
                       "flex-1 transition-all border-2 border-black",
                       isMobileBook ? "py-1 text-[10px] border-[#0047ab] font-bold text-[#0047ab]" : "py-4 text-base font-black",
                       profile.gender === 'female' ? "bg-sticker-yellow text-black -rotate-1" : "bg-transparent text-pen-blue hover:bg-black/5"
                     )}
                   >Женский</button>
                </div>
             </div>

             <div className="space-y-0.5">
                <label className={cn("text-pen-blue block italic", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>О себе</label>
                <button 
                   onClick={() => openEditModal('about', profile.about)}
                   className={cn("w-full text-left bg-white/20 border-2 border-black/5 text-pen-blue focus:border-pen-blue/20 outline-none transition-all resize-none placeholder:text-black/5 leading-relaxed", isMobileBook ? "font-normal min-h-[3.5rem] py-0 text-[10px] -mt-[4px] -mb-[16px] mr-0 pb-[24px] pl-[4px] pr-[4px]" : "p-3 text-base font-black min-h-[5rem]")}
                >
                  {profile.about || 'Кратко о себе...'}
               </button>
            </div>

            {!hideAction && (
              <div className={cn("flex justify-center", isMobileBook ? "pt-0 h-[43px]" : "pt-2")}>
                <NeonButton 
                  onClick={handleNext} 
                  disabled={!isStep1Valid}
                  className={cn(
                    "transition-all border-2",
                    isMobileBook ? "h-[33px] w-[83px] border-[#0047ab] mt-[7px] p-0 flex items-center justify-center font-bold text-[16px]" : "py-5 text-lg px-10 border-black font-black",
                    !isStep1Valid ? "opacity-20 grayscale cursor-not-allowed text-black/10" : "bg-sticker-yellow"
                  )}
                >
                  <span className={isMobileBook ? "font-bold text-[16px]" : ""}>Начать</span>
                </NeonButton>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className={cn(isMobileBook ? "contents" : "flex-1 flex flex-col overflow-hidden space-y-4")}>
          <h2 className={cn(isMobileBook ? "text-[#0047ab] text-[18px] font-bold leading-none italic pb-1" : "text-pen-blue font-black text-4xl leading-none", "flex-shrink-0")}>Настройка</h2>
          
          <div className={cn(isMobileBook ? "flex flex-col space-y-3 pb-4" : "flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4 py-1")}>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={cn("text-pen-blue", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>Увлечения</span>
                <span className={cn(isMobileBook ? "text-[#0047ab] text-[10px] font-bold" : "text-pen-blue/25 text-[10px] font-black")}>{profile.hobbies.length}/8</span>
              </div>
              <div className={cn("flex flex-wrap bg-white/10 border-2 border-dashed border-pen-blue/10", isMobileBook ? "gap-1 p-2 min-h-[50px]" : "gap-1.5 p-3 min-h-[60px]")}>
                {profile.hobbies.length === 0 ? (
                  <span className={cn("text-pen-blue/20 m-auto", isMobileBook ? "text-[10px]" : "text-xs")}>Ничего не выбрано</span>
                ) : (
                  profile.hobbies.map(h => (
                    <span key={h} className={cn("px-2 py-1 border-2 bg-sticker-yellow border-black rotate-1", isMobileBook ? "text-[10px] font-normal" : "text-xs font-black")}>{h}</span>
                  ))
                )}
              </div>
              <button 
                onClick={() => openEditModal('hobby')}
                className={cn("w-full border-2 border-pen-blue/20 text-pen-blue hover:bg-pen-blue/5 transition-all flex items-center justify-center gap-1", isMobileBook ? "text-[10px] font-bold h-[27px]" : "text-xs font-black py-2")}
              >
                <Plus className="h-3 w-3" /> Выбрать увлечения
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={cn("text-pen-blue", isMobileBook ? "text-[10px] font-bold" : "text-sm font-black")}>Черты Души</span>
                <span className={cn(isMobileBook ? "text-[#0047ab] text-[10px] font-bold" : "text-pen-blue/25 text-[10px] font-black")}>{profile.traits.length}/8</span>
              </div>
              <div className={cn("flex flex-wrap bg-white/10 border-2 border-dashed border-pen-blue/10", isMobileBook ? "gap-1 p-2 min-h-[50px]" : "gap-1.5 p-3 min-h-[60px]")}>
                {profile.traits.length === 0 ? (
                  <span className={cn("text-pen-blue/20 m-auto", isMobileBook ? "text-[10px]" : "text-xs")}>Ничего не выбрано</span>
                ) : (
                  profile.traits.map(t => (
                    <span key={t} className={cn("px-2 py-1 border-2 bg-sticker-pink border-black -rotate-1", isMobileBook ? "text-[10px] font-normal" : "text-xs font-black")}>{t}</span>
                  ))
                )}
              </div>
              <button 
                onClick={() => openEditModal('trait')}
                className={cn("w-full border-2 border-pen-blue/20 text-pen-blue hover:bg-pen-blue/5 transition-all flex items-center justify-center gap-1", isMobileBook ? "text-[10px] font-bold h-[27px]" : "text-xs font-black py-2")}
              >
                <Plus className="h-3 w-3" /> Выбрать теги
              </button>
            </div>

            {!hideAction && (
              <div className="pt-4 flex flex-col items-center">
                <NeonButton 
                  onClick={handleNext} 
                  disabled={!isStep2Valid}
                  className={cn(
                    "transition-all border-2",
                    isMobileBook ? "py-2 px-6 border-[#0047ab]" : "py-6 text-xl px-12 border-black font-black",
                    !isStep2Valid ? "opacity-20 grayscale cursor-not-allowed text-black/10" : "bg-sticker-yellow"
                  )}
                >
                  <span className={isMobileBook ? "font-bold text-[16px]" : ""}>{isMarketSummon ? 'Вылупить Яйцо' : 'Призвать сущность'}</span>
                </NeonButton>
                <p className={cn("mt-4 text-[12px] tracking-wide", isMobileBook ? "font-normal text-[#0047ab]" : "font-black text-pen-blue/30")}>
                  {isStep2Valid ? (isMarketSummon ? 'Яйцо готово' : 'Форма готова к призыву') : 'Выберите увлечения и черты души'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
