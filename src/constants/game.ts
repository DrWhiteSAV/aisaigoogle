import { AgeStage, PowerRank } from '../types';

export const MAX_LEVEL = 300;
export const POINTS_PER_LEVEL = 30;
export const INITIAL_EXP = 100;
export const EXP_GROWTH = 0.1;

export const getExpNeeded = (level: number): number => {
  return Math.floor(INITIAL_EXP * Math.pow(1 + EXP_GROWTH, level - 1));
};

export const getAgeStage = (level: number): AgeStage => {
  if (level >= 240) return 'божественность';
  if (level >= 180) return 'мудрость';
  if (level >= 120) return 'зрелость';
  if (level >= 60) return 'молодость';
  return 'детство';
};

export const getPowerRank = (level: number): PowerRank => {
  if (level >= 270) return 'SSS';
  if (level >= 240) return 'SS';
  if (level >= 210) return 'S';
  if (level >= 180) return 'A';
  if (level >= 150) return 'B';
  if (level >= 120) return 'C';
  if (level >= 90) return 'D';
  return 'E';
};
