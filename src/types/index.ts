export type Rarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary' | 'divine';
export type Element = 'fire' | 'ice' | 'dark' | 'light';
export type Personality = 'aggressive' | 'calm';
export type Habitat = 'forest' | 'space' | 'ocean';
export type AgeStage = 'детство' | 'молодость' | 'зрелость' | 'мудрость' | 'божественность';
export type PowerRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface PetStats {
  attack: number;
  defense: number;
  speed: number;
  magic: number;
  regeneration: number;
  health: number;
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
  personality: Personality;
  habitat: Habitat;
  image: string; // Base64
  stats: PetStats;
  classification: Classification;
  abilities: string[];
  lore: string;
  level: number;
  experience: number;
  materials: Record<string, number>;
  ageStage: AgeStage;
  isRankRevealed: boolean;
  statPoints: number;
}

export interface UserProgress {
  pets: Pet[];
  activePetId: string | null;
  currency: number; // Rubles
  inventory: Record<string, number>;
  bestiary: Classification[]; // Discovered species
}
