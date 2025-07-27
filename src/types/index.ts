export interface Card {
  id: string;
  name: string;
  description: string;
  level: number;
  progress: number;
  image: string;
  type: CardType;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  energy: number;
  maxEnergy: number;
  lastEnergyRegeneration: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnergyInfo {
  current: number;
  max: number;
  regenerationTime: number; // seconds until next regeneration
  regenerationRate: number; // energy per minute
}

export interface ProgressResponse {
  progress: number;
  energy: number;
  level?: number;
  success: boolean;
  message?: string;
}

export interface LevelUpResponse {
  level: number;
  progress: number;
  success: boolean;
  message?: string;
}

export interface EnergyResponse {
  energy: number;
  regenerationTime: number;
  regenerationRate: number;
  success: boolean;
}

export type CardType = 
  | 'uzun_kilic'
  | 'savas_baltasi'
  | 'buyu_asasi'
  | 'kalkan'
  | 'savas_cekici'
  | 'egri_kilic'
  | 'kisa_kilic'
  | 'buyu_kitabi';

export interface CardData {
  type: CardType;
  name: string;
  description: string;
  images: {
    level1: string;
    level2: string;
    level3: string;
  };
  levelDescriptions: {
    level1: string;
    level2: string;
    level3: string;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
} 