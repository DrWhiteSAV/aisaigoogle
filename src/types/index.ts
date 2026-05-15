export type Rarity = 
  | 'normal' 
  | 'advanced'
  | 'rare' 
  | 'perfect'
  | 'epic' 
  | 'legendary' 
  | 'mythical' 
  | 'eternal'
  | 'divine'
  | 'transcendent';

export type Element = 'water' | 'fire' | 'air' | 'earth';
export type Attribute = 'light' | 'dark' | 'void' | 'time';

export type Personality = 'aggressive' | 'calm';
export type Habitat = 'forest' | 'space' | 'ocean';
export type AgeStage = 
  | 'F - младенчество' 
  | 'E - детство' 
  | 'D - отрочество' 
  | 'C - молодость' 
  | 'B - взросление' 
  | 'A - зрелость' 
  | 'S - мудрость' 
  | 'EX - единство' 
  | 'UX - пробуждение' 
  | 'Z - абсолютность';

export type SummonerRankName = 
  | 'Ученик' 
  | 'Мастер' 
  | 'Командир' 
  | 'Генерал' 
  | 'Монарх' 
  | 'Император' 
  | 'Владыка' 
  | 'Идол' 
  | 'Полубог' 
  | 'Божество';

export interface PetStats {
  attack: number;
  defense: number;
  health: number;
  maxHealth: number;
  speed: number;
  magic: number;
  regeneration: number;
  luck: number;
  rage: number;
  maxRage: number;
}

export type SkillType = 'passive' | 'active_buff' | 'active_debuff';

export interface Skill {
  id: string;
  code: string; // Unique tracking code
  name: string;
  description: string;
  type: SkillType;
  targetStat: keyof PetStats;
  value: number; // Percentage
  image?: string;
  fallbackEmoji?: string;
  hue?: number;
  element?: Element;
  attribute?: Attribute;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  age: number;
  city: string;
  hobbies: string[];
  traits: string[];
  about: string;
}

export interface Classification {
  type: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
}

export interface Pet {
  id: string;
  name: string;
  rarity: Rarity;
  element: Element;
  attribute: Attribute;
  personality: Personality;
  habitat: Habitat;
  image: string; // Base64 or URL
  stats: PetStats;
  classification: Classification;
  skills: Skill[];
  abilities: string[];
  lore: string;
  level: number;
  experience: number;
  materials: Record<string, number>;
  ageStage: AgeStage;
  rank: string;
  isRankRevealed: boolean;
  statPoints: number;
  imageHistory?: string[];
}

export interface InventoryItem {
  id: string;
  code: string; // Unique tracking code
  name: string;
  type: 'energy' | 'material' | 'food' | 'egg' | 'artifact' | 'skill';
  value: number;
  description: string;
  image?: string;
  fallbackEmoji?: string;
  hue?: number;
  effect?: {
    stat: keyof PetStats;
    value: number;
  };
  skillData?: {
    type: SkillType;
    targetStat: keyof PetStats;
    value: number;
    element?: Element;
    attribute?: Attribute;
  };
}

export interface UserProgress {
  id: string; // Summoner ID
  pets: Pet[];
  activePetId: string | null;
  sprouts: number; // 🌱 (Sprouts)
  inventory: InventoryItem[];
  energy: number;
  lastEnergyUpdate: number; // timestamp
  summonerRank: string;
  marketInventory?: InventoryItem[];
  totalBattles?: number;
  wonBattles?: number;
  lostBattles?: number;
  totalQuests?: number;
  successfulQuests?: number;
  failedQuests?: number;
}
