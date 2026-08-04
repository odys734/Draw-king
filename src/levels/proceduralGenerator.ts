import Matter from 'matter-js';
import { LevelDefinition, LevelObstacle } from '../types';

export class ProceduralGenerator {
  public static generateLevel(levelId: number): LevelDefinition {
    let candidateLevel: LevelDefinition | null = null;
    let attempts = 0;

    while (!candidateLevel && attempts < 25) {
      attempts++;
      const raw = this.createRandomCandidate(levelId);
      if (this.validateLevelWithPhysics(raw)) {
        candidateLevel = raw;
      }
    }

    // Fallback if random attempts fail: return structured template
    if (!candidateLevel) {
      candidateLevel = this.createFallbackLevel(levelId);
    }

    return candidateLevel;
  }

  private static createRandomCandidate(levelId: number): LevelDefinition {
    // Canvas reference dimensions: 420 x 600
    const ballX = 60 + Math.floor(Math.random() * 300);
    const ballY = 80 + Math.floor(Math.random() * 40);

    let glassX = 60 + Math.floor(Math.random() * 300);
    while (Math.abs(glassX - ballX) < 100) {
      glassX = 60 + Math.floor(Math.random() * 300);
    }
    const glassY = 460 + Math.floor(Math.random() * 60);

    const obstacleCount = 1 + Math.floor(Math.random() * 3);
    const obstacles: LevelObstacle[] = [];

    const obstaclePool: Array<LevelObstacle['type']> = [
      'wall', 'rotator', 'moving', 'fan', 'portal', 'magnet', 'breakable', 'spike'
    ];

    for (let i = 0; i < obstacleCount; i++) {
      const type = obstaclePool[Math.floor(Math.random() * obstaclePool.length)];
      const obsX = 100 + Math.floor(Math.random() * 220);
      const obsY = 220 + i * 80 + Math.floor(Math.random() * 40);

      if (type === 'wall' || type === 'spike' || type === 'breakable') {
        obstacles.push({
          id: `p_obs_${i}`,
          type,
          x: obsX,
          y: obsY,
          width: 100 + Math.floor(Math.random() * 60),
          height: 16,
          rotation: (Math.random() - 0.5) * 0.6
        });
      } else if (type === 'rotator') {
        obstacles.push({
          id: `p_obs_${i}`,
          type: 'rotator',
          x: obsX,
          y: obsY,
          width: 120,
          height: 16,
          speed: (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random())
        });
      } else if (type === 'moving') {
        obstacles.push({
          id: `p_obs_${i}`,
          type: 'moving',
          x: obsX,
          y: obsY,
          width: 110,
          height: 16,
          moveDistance: 80,
          speed: 1.2,
          moveAxis: Math.random() > 0.5 ? 'x' : 'y'
        });
      } else if (type === 'fan') {
        obstacles.push({
          id: `p_obs_${i}`,
          type: 'fan',
          x: obsX,
          y: obsY,
          width: 80,
          height: 100,
          forceDirection: { x: (Math.random() - 0.5) * 1.5, y: -0.6 },
          forceMagnitude: 0.003
        });
      } else if (type === 'portal') {
        const portal2Id = `p_obs_${i}_target`;
        obstacles.push({
          id: `p_obs_${i}`,
          type: 'portal',
          x: obsX,
          y: obsY,
          width: 50,
          height: 50,
          targetPortalId: portal2Id
        });
        obstacles.push({
          id: portal2Id,
          type: 'portal',
          x: 80 + Math.floor(Math.random() * 260),
          y: obsY - 80,
          width: 50,
          height: 50
        });
      } else if (type === 'magnet') {
        obstacles.push({
          id: `p_obs_${i}`,
          type: 'magnet',
          x: obsX,
          y: obsY,
          radius: 120,
          forceMagnitude: 0.0025,
          isRepel: Math.random() > 0.5
        });
      }
    }

    return {
      id: levelId,
      title: `Procedural Level ${levelId - 20}`,
      maxInk: 180 + Math.floor(Math.random() * 60),
      threeStarInkRatio: 0.50,
      twoStarInkRatio: 0.25,
      ball: { x: ballX, y: ballY, radius: 14 },
      glass: { x: glassX, y: glassY, width: 70, height: 80 },
      obstacles
    };
  }

  // Headless AI Physics Validation
  private static validateLevelWithPhysics(level: LevelDefinition): boolean {
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });

    // 1. Build Glass in headless engine
    const gx = level.glass.x;
    const gy = level.glass.y;
    const gWidth = level.glass.width;
    const gHeight = level.glass.height;
    const wallThick = 12;

    const glassLeft = Matter.Bodies.rectangle(gx - gWidth / 2 + wallThick / 2, gy - wallThick / 2, wallThick, gHeight, { isStatic: true });
    const glassRight = Matter.Bodies.rectangle(gx + gWidth / 2 - wallThick / 2, gy - wallThick / 2, wallThick, gHeight, { isStatic: true });
    const glassBottom = Matter.Bodies.rectangle(gx, gy + gHeight / 2 - wallThick / 2, gWidth, wallThick, { isStatic: true });

    Matter.World.add(engine.world, [glassLeft, glassRight, glassBottom]);

    // Build obstacles
    level.obstacles.forEach((obs) => {
      if (obs.type === 'wall' || obs.type === 'spike' || obs.type === 'breakable') {
        const body = Matter.Bodies.rectangle(obs.x, obs.y, obs.width || 100, obs.height || 20, { isStatic: true });
        if (obs.rotation) Matter.Body.rotate(body, obs.rotation);
        Matter.World.add(engine.world, body);
      }
    });

    // TEST A: Check if solvable WITHOUT drawing (i.e. Trivial check)
    const ballA = Matter.Bodies.circle(level.ball.x, level.ball.y, level.ball.radius, {
      friction: 0.8,
      restitution: 0.2
    });
    Matter.World.add(engine.world, ballA);

    let landedWithoutInk = false;
    for (let step = 0; step < 250; step++) {
      Matter.Engine.update(engine, 1000 / 60);
      const bPos = ballA.position;
      if (bPos.x > gx - gWidth / 2 + 10 && bPos.x < gx + gWidth / 2 - 10 && bPos.y > gy - 10 && bPos.y < gy + gHeight / 2) {
        landedWithoutInk = true;
        break;
      }
    }

    if (landedWithoutInk) {
      // Discard trivial level!
      return false;
    }

    // TEST B: Check if solvable with an artificial direct ramp from ball to glass
    Matter.World.remove(engine.world, ballA);

    const ballB = Matter.Bodies.circle(level.ball.x, level.ball.y, level.ball.radius, {
      friction: 0.8,
      restitution: 0.2
    });
    Matter.World.add(engine.world, ballB);

    // Create synthetic test ramp
    const rampX = (level.ball.x + level.glass.x) / 2;
    const rampY = (level.ball.y + level.glass.y) / 2 + 40;
    const dx = level.glass.x - level.ball.x;
    const dy = level.glass.y - level.ball.y;
    const angle = Math.atan2(dy, dx);

    const testRamp = Matter.Bodies.rectangle(rampX, rampY, Math.hypot(dx, dy) * 1.2, 16, {
      isStatic: true,
      angle: angle * 0.5
    });
    Matter.World.add(engine.world, testRamp);

    let reachedGlassWithRamp = false;
    for (let step = 0; step < 300; step++) {
      Matter.Engine.update(engine, 1000 / 60);
      const bPos = ballB.position;
      if (bPos.x > gx - gWidth / 2 - 20 && bPos.x < gx + gWidth / 2 + 20 && bPos.y > gy - 40 && bPos.y < gy + gHeight / 2 + 40) {
        reachedGlassWithRamp = true;
        break;
      }
    }

    return reachedGlassWithRamp;
  }

  private static createFallbackLevel(levelId: number): LevelDefinition {
    return {
      id: levelId,
      title: `Procedural Puzzle ${levelId}`,
      maxInk: 180,
      threeStarInkRatio: 0.50,
      twoStarInkRatio: 0.25,
      ball: { x: 100, y: 100, radius: 14 },
      glass: { x: 320, y: 480, width: 70, height: 80 },
      obstacles: [
        { id: 'f_obs_1', type: 'wall', x: 210, y: 280, width: 140, height: 16, rotation: 0.3 },
        { id: 'f_obs_2', type: 'rotator', x: 300, y: 380, width: 100, height: 16, speed: 1.2 }
      ]
    };
  }
}
