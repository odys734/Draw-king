import { GameStats } from '../types';

const STORAGE_KEY = 'ink_drop_stats_v2';

export interface ExtendedGameStats extends GameStats {
  hapticsEnabled?: boolean;
  lastPlayedLevel?: number;
  bestInkRatio?: Record<number, number>;
}

export const saveManager = {
  loadStats(): ExtendedGameStats {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          completedLevels: parsed.completedLevels || {},
          unlockedLevel: parsed.unlockedLevel || 1,
          totalStars: parsed.totalStars || 0,
          soundEnabled: parsed.soundEnabled ?? true,
          hapticsEnabled: parsed.hapticsEnabled ?? true,
          lastPlayedLevel: parsed.lastPlayedLevel || 1,
          bestInkRatio: parsed.bestInkRatio || {},
        };
      }
    } catch (e) {
      console.warn('Failed to load saved stats:', e);
    }

    return {
      completedLevels: {},
      unlockedLevel: 1,
      totalStars: 0,
      soundEnabled: true,
      hapticsEnabled: true,
      lastPlayedLevel: 1,
      bestInkRatio: {},
    };
  },

  saveStats(stats: ExtendedGameStats): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      return true;
    } catch (e) {
      console.warn('Failed to save stats locally:', e);
      return false;
    }
  },

  clearProgress(): ExtendedGameStats {
    const defaultStats: ExtendedGameStats = {
      completedLevels: {},
      unlockedLevel: 1,
      totalStars: 0,
      soundEnabled: true,
      hapticsEnabled: true,
      lastPlayedLevel: 1,
      bestInkRatio: {},
    };
    this.saveStats(defaultStats);
    return defaultStats;
  }
};
