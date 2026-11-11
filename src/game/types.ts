import type React from 'react';

export interface MissionInfo {
  id: number;
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  descEn: string;
  descBn: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  accentColor: string;
  unlocked: boolean;
  stars: number; // 0 to 3
  nasaData: string;
}
