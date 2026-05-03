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

export const AGE_STAGE_RECORDS: Record<number, { code: string; label: string }> = {
  10: { code: 'F', label: 'младенчество' },
  20: { code: 'E', label: 'детство' },
  30: { code: 'D', label: 'отрочество' },
  40: { code: 'C', label: 'молодость' },
  50: { code: 'B', label: 'взросление' },
  60: { code: 'A', label: 'зрелость' },
  70: { code: 'S', label: 'мудрость' },
  80: { code: 'EX', label: 'единство' },
  90: { code: 'UX', label: 'пробуждение' },
  100: { code: 'Z', label: 'абсолютность' }
};

export function getQuestRewardExp(level: number, success: boolean): number {
  const n = level;
  // (30±25)*0,95^n for success, (5±3)*0,95^n for failure
  const mid = success ? 30 : 5;
  const scatter = success ? 25 : 3;
  const baseRewardPercent = (mid + (Math.random() * scatter * 2 - scatter));
  const modifier = Math.pow(0.95, n);
  
  const finalPercent = (baseRewardPercent * modifier) / 100;
  
  // Percentage of XP needed for current level
  const expNeeded = getExpNeeded(n);
  const rewardXP = Math.round(expNeeded * finalPercent);
  
  return Math.max(1, rewardXP);
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
  // Light -> Dark -> Void -> Time -> Light (Stronger beats weaker)
  // User: "Питомцы с более сильным атрибутом имеют защиту в 2 раза выше"
  // Stronger beats weaker. So if defender is the stronger one in the cycle relative to attacker.
  // Cycle: Light beats Dark beats Void beats Time beats Light
  if ((targetIndex + 1) % ATTRIBUTE_CYCLE.length === attackIndex) return 1; // Defender is weaker
  if ((attackIndex + 1) % ATTRIBUTE_CYCLE.length === targetIndex) return 2; // Defender is stronger
  return 1;
}

export function distributeStats(totalPoints: number): PetStats {
  const stats: PetStats = {
    attack: 0,
    defense: 0,
    health: 0,
    maxHealth: 0,
    speed: 0,
    regeneration: 0,
    magic: 0,
    luck: 5,
    rage: 0,
    maxRage: 100
  };

  // Ensure health gets a chunk (30-50%)
  const healthPoints = Math.floor(totalPoints * (0.3 + Math.random() * 0.2));
  stats.health = healthPoints;
  stats.maxHealth = healthPoints;
  
  let remaining = totalPoints - healthPoints;
  const otherKeys: (keyof PetStats)[] = ['attack', 'defense', 'speed', 'regeneration', 'magic'];
  
  // Distribute remaining
  while (remaining > 0) {
    const key = otherKeys[Math.floor(Math.random() * otherKeys.length)];
    const chunk = Math.min(remaining, Math.floor(Math.random() * 5) + 1);
    (stats[key] as number) += chunk;
    remaining -= chunk;
  }

  return stats;
}

export function checkLevelUp(pet: Pet): Pet {
  let currentPet = { ...pet };
  let expNeeded = getExpNeeded(currentPet.level);
  
  while (currentPet.experience >= expNeeded && currentPet.level < 100) {
    currentPet.experience -= expNeeded;
    currentPet.level += 1;
    
    // Add stats automatically instead of just statPoints if preferred, 
    // but the user mentions "распределите свободные очки характеристик" in Setup.tsx text.
    // However, the prompt says "код распределяя случайно статы и суммируя в игровом процессе".
    // I'll add to statPoints so user can distribute, OR distribute automatically.
    // Let's do automatic distribution as well to show immediate CP growth.
    const growth = RARITY_WEIGHTS[currentPet.rarity].growth;
    const gStats = distributeStats(growth);
    
    currentPet.statPoints = (currentPet.statPoints || 0) + growth; // Use correct growth points from weights
    
    currentPet.stats.attack += gStats.attack;
    currentPet.stats.defense += gStats.defense;
    currentPet.stats.health += gStats.health;
    currentPet.stats.maxHealth += gStats.health;
    currentPet.stats.speed += gStats.speed;
    currentPet.stats.regeneration += gStats.regeneration;
    currentPet.stats.magic += gStats.magic;
    
    // Update age stage if needed
    currentPet.ageStage = getPetRankByLevel(currentPet.level);
    expNeeded = getExpNeeded(currentPet.level);
  }
  
  return currentPet;
}

export function calculateCP(pet: Pet): number {
  if (!pet || !pet.stats) return 0;
  const { attack, defense, health, speed, regeneration, magic } = pet.stats;
  // CP is the sum of main stats + 10 points per ability
  const abilitiesBonus = pet.abilities.length * 10; 
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
