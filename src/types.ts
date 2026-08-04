export interface Point {
  x: number;
  y: number;
}

export interface InkStroke {
  id: string;
  points: Point[];
  smoothedPoints: Point[];
  length: number;
}

export type ObstacleType = 
  | 'wall'           // Static rectangular or polygon barrier
  | 'circle'         // Static circle barrier
  | 'rotator'        // Rotating bar or wheel
  | 'moving'         // Platform moving along path
  | 'fan'            // Blows ball in direction
  | 'portal'         // Teleports ball from in to out
  | 'magnet'         // Pulls or repels ball
  | 'gravityZone'    // Inverts or changes gravity
  | 'breakable'      // Destructible block on impact
  | 'spike';         // Deadly hazard

export interface LevelObstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  speed?: number;          // For rotator or moving
  moveDistance?: number;   // For moving platform
  moveAxis?: 'x' | 'y';
  forceDirection?: { x: number; y: number }; // For fan
  forceMagnitude?: number; // For fan/magnet
  targetPortalId?: string; // For portal
  isRepel?: boolean;       // For magnet
  gravityScale?: { x: number; y: number }; // For gravityZone
}

export interface GlassConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface BallConfig {
  x: number;
  y: number;
  radius: number;
}

export interface LevelDefinition {
  id: number;
  title: string;
  maxInk: number;          // Total ink units available
  threeStarInkRatio: number; // e.g. 0.6 = >60% remaining for 3 stars
  twoStarInkRatio: number;   // e.g. 0.3 = >30% remaining for 2 stars
  ball: BallConfig;
  glass: GlassConfig;
  obstacles: LevelObstacle[];
  hintPath?: Point[];      // Suggested solution guideline for hint feature
}

export interface GameStats {
  completedLevels: Record<number, number>; // levelId -> stars earned (1..3)
  unlockedLevel: number;
  totalStars: number;
  soundEnabled: boolean;
}

export type GameStateStatus = 'ready' | 'playing' | 'won' | 'lost' | 'paused';
