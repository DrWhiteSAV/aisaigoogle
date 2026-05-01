import { Pet, Rarity, Element, Attribute, AgeStage, UserProgress, PetStats, SummonerRankName } from '../types';

export const PET_RANK_ORDER: AgeStage[] = [
  'F - младенчество',
  'E - детство',
  'D - отрочество',
  'C - молодость',
  'B - взросление',
  'A - зрелость',
  'S - мудрость',
  'EX - единство',
  'UX - пробуждение',
  'Z - абсолютность'
];

export const RARITY_WEIGHTS: Record<Rarity, { weight: number, base: number, growth: number, label: string }> = {
  normal: { weight: 32, base: 20, growth: 5, label: 'Обычный' },
  advanced: { weight: 20, base: 50, growth: 10, label: 'Продвинутый' },
  rare: { weight: 15, base: 100, growth: 15, label: 'Редкий' },
  perfect: { weight: 10, base: 200, growth: 20, label: 'Идеальный' },
  epic: { weight: 8, base: 300, growth: 25, label: 'Эпический' },
  legendary: { weight: 5, base: 400, growth: 30, label: 'Легендарный' },
  mythical: { weight: 4, base: 500, growth: 35, label: 'Мифический' },
  eternal: { weight: 3, base: 600, growth: 40, label: 'Вечный' },
  divine: { weight: 2, base: 800, growth: 45, label: 'Божественный' },
  transcendent: { weight: 1, base: 1000, growth: 50, label: 'Трансцендентный' }
};

export const ELEMENT_CYCLE: Element[] = ['water', 'fire', 'air', 'earth']; // Water -> Fire -> Air -> Earth -> Water
export const ATTRIBUTE_CYCLE: Attribute[] = ['light', 'dark', 'void', 'time']; // Light -> Dark -> Void -> Time -> Light

export function getExpNeeded(level: number): number {
  return Math.floor(100 * Math.pow(1.1, level));
}

export function getQuestRewardExp(level: number, success: boolean): number {
  const n = level;
  // (30±25)*0,95^n*100% for success, (5±3)*0,95^n*100% for failure
  const mid = success ? 30 : 5;
  const scatter = success ? 25 : 3;
  const randomPercent = (mid + (Math.random() * scatter * 2 - scatter)) / 100;
  const modifier = Math.pow(0.95, n);
  
  // Percentage of CURRENT level's requirement
  const baseReward = getExpNeeded(n) * randomPercent * modifier;
  return Math.max(1, Math.round(baseReward));
}

export function getPetRankByLevel(level: number): AgeStage {
  if (level <= 10) return 'F - младенчество';
  if (level <= 20) return 'E - детство';
  if (level <= 30) return 'D - отрочество';
  if (level <= 40) return 'C - молодость';
  if (level <= 50) return 'B - взросление';
  if (level <= 60) return 'A - зрелость';
  if (level <= 70) return 'S - мудрость';
  if (level <= 80) return 'EX - единство';
  if (level <= 90) return 'UX - пробуждение';
  return 'Z - абсолютность';
}

export function getElementAdvantageMultiplier(attacker: Element, defender: Element): number {
  const attackIndex = ELEMENT_CYCLE.indexOf(attacker);
  const targetIndex = ELEMENT_CYCLE.indexOf(defender);
  // Water(0) -> Fire(1) -> Air(2) -> Earth(3) -> Water(0)
  if ((attackIndex + 1) % ELEMENT_CYCLE.length === targetIndex) return 2;
  return 1;
}

export function getAttributeDefenseMultiplier(attacker: Attribute, defender: Attribute): number {
  const attackIndex = ATTRIBUTE_CYCLE.indexOf(attacker);
  const targetIndex = ATTRIBUTE_CYCLE.indexOf(defender);
  // Light -> Dark -> Void -> Time -> Light
  // Defender is stronger if attacker is the one defender beats? 
  // User: "Питомцы с более сильным атрибутом имеют защиту в 2 раза выше"
  // If Defender Attribute > Attacker Attribute, defense is 2x.
  if ((targetIndex + 1) % ATTRIBUTE_CYCLE.length === attackIndex) return 2;
  return 1;
}

export function calculateCP(pet: Pet): number {
  const { attack, defense, health, speed, regeneration, magic } = pet.stats;
  // TZ: "сумма всех статов, навыков, предметов, материалов, корма - все что влияет на показатели"
  // Assuming abilities/materials etc are already reflected in stats or we add a bonus.
  const abilitiesBonus = pet.abilities.length * 50; 
  return attack + defense + health + speed + regeneration + magic + abilitiesBonus;
}

export function getSummonerRank(pets: Pet[]): { name: string, limit: number } {
  if (pets.length === 0) return { name: 'Новичок', limit: 1 };
  
  const rankCodes = pets.map(p => (p.ageStage || 'F').split(' ')[0]);
  
  // TZ Mapping (correct order):
  // F -> Ученик (2)
  // E -> Мастер (3)
  // D -> Командир (5)
  // C -> Генерал (7)
  // B -> Монарх (9)
  // A -> Император (11)
  // S -> Владыка (15)
  // EX -> Идол (20)
  // UX -> Полубог (25)
  // Z -> Божество (50)
  
  if (rankCodes.includes('Z')) return { name: 'Божество', limit: 50 };
  if (rankCodes.includes('UX')) return { name: 'Полубог', limit: 25 }; 
  if (rankCodes.includes('EX')) return { name: 'Идол', limit: 20 };
  if (rankCodes.includes('S')) return { name: 'Владыка', limit: 15 };
  if (rankCodes.includes('A')) return { name: 'Император', limit: 11 };
  if (rankCodes.includes('B')) return { name: 'Монарх', limit: 9 };
  if (rankCodes.includes('C')) return { name: 'Генерал', limit: 7 };
  if (rankCodes.includes('D')) return { name: 'Командир', limit: 5 };
  if (rankCodes.includes('E')) return { name: 'Мастер', limit: 3 }; 
  if (rankCodes.includes('F')) return { name: 'Ученик', limit: 2 };

  return { name: 'Новичок', limit: 1 };
}

export function rollPotential(): Rarity {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const [rarity, data] of Object.entries(RARITY_WEIGHTS)) {
    roll -= data.weight;
    if (roll <= 0) return rarity as Rarity;
  }
  return 'normal';
}

export function getNextLevelReward(level: number, success: boolean = true): number {
  // Reward based on level and success
  const base = 100 + (level * 10);
  return success ? base : Math.floor(base * 0.2);
}

export function updateEnergy(progress: UserProgress): UserProgress {
  const now = Date.now();
  const elapsedMs = now - progress.lastEnergyUpdate;
  const energyToAdd = Math.floor(elapsedMs / (5 * 60 * 1000));
  
  if (energyToAdd > 0) {
    return {
      ...progress,
      energy: progress.energy + energyToAdd,
      lastEnergyUpdate: progress.lastEnergyUpdate + (energyToAdd * 5 * 60 * 1000)
    };
  }
  return progress;
}
