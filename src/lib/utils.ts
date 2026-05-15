import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUniqueCode(prefix: string = 'ITEM', suffix: string = ''): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}${suffix}`;
}
