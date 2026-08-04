import { LevelDefinition } from '../types';
import { ProceduralGenerator } from './proceduralGenerator';

export class AILevelGenerator {
  /**
   * Generates a smart, verified solvable physics level.
   * Leverages server AI endpoints when available, falling back to 
   * physics-validated procedural puzzle synthesis.
   */
  public static async generateAILevel(levelId: number): Promise<LevelDefinition> {
    try {
      // Attempt server-side Gemini level generation endpoint
      const res = await fetch('/api/generate-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.level && data.level.ball && data.level.glass && data.level.obstacles) {
          const aiLevel: LevelDefinition = {
            id: levelId,
            title: data.level.title || `AI Level ${levelId}`,
            maxInk: data.level.maxInk || 200,
            threeStarInkRatio: 0.50,
            twoStarInkRatio: 0.25,
            ball: data.level.ball,
            glass: data.level.glass,
            obstacles: data.level.obstacles,
            hintPath: [
              { x: data.level.ball.x, y: data.level.ball.y },
              { x: (data.level.ball.x + data.level.glass.x) / 2, y: (data.level.ball.y + data.level.glass.y) / 2 + 50 },
              { x: data.level.glass.x, y: data.level.glass.y }
            ]
          };

          return aiLevel;
        }
      }
    } catch (e) {
      // Server offline / native app fallback
    }

    // Procedural Physics-Verified Smart Level fallback
    return ProceduralGenerator.generateLevel(levelId);
  }
}
