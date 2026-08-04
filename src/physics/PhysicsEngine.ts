import Matter from 'matter-js';
import { LevelDefinition, LevelObstacle, Point } from '../types';
import { soundManager } from '../audio/SoundSystem';

export interface PhysicsEngineCallbacks {
  onWin: () => void;
  onLose: (reason: string) => void;
  onShatter?: (x: number, y: number) => void;
  onPortalTeleport?: (x: number, y: number) => void;
}

export class PhysicsEngine {
  public engine: Matter.Engine;
  public world: Matter.World;

  public ball: Matter.Body | null = null;
  public glassParts: {
    left: Matter.Body;
    right: Matter.Body;
    bottom: Matter.Body;
    sensor: Matter.Body;
  } | null = null;

  private inkBodies: Matter.Body[] = [];
  private obstacleBodies: { body: Matter.Body; data: LevelObstacle }[] = [];

  private isBallReleased: boolean = false;
  private winTimer: number = 0; // ms accumulated with win conditions met
  private lastTime: number = performance.now();
  private portalCooldowns: Map<string, number> = new Map();

  private callbacks: PhysicsEngineCallbacks;
  public isGrounded: boolean = false;

  // Collision categories
  private readonly CATEGORY_BALL = 0x0001;
  private readonly CATEGORY_GLASS = 0x0002;
  private readonly CATEGORY_INK = 0x0004;
  private readonly CATEGORY_OBSTACLE = 0x0008;
  private readonly CATEGORY_SPIKE = 0x0010;
  private readonly CATEGORY_SENSOR = 0x0020;

  constructor(callbacks: PhysicsEngineCallbacks) {
    this.callbacks = callbacks;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0012 }
    });
    this.world = this.engine.world;

    this.setupCollisionEvents();
  }

  private setupCollisionEvents() {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Check ball collisions
        if (this.ball && (bodyA === this.ball || bodyB === this.ball)) {
          const other = bodyA === this.ball ? bodyB : bodyA;

          // Hazard / Spike collision
          if (other.label === 'spike') {
            this.callbacks.onLose('Hit a deadly obstacle!');
            return;
          }

          // Breakable block collision
          if (other.label === 'breakable') {
            const speed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
            if (speed > 1.8) {
              soundManager.playShatterSound();
              if (this.callbacks.onShatter) {
                this.callbacks.onShatter(other.position.x, other.position.y);
              }
              Matter.World.remove(this.world, other);
              this.obstacleBodies = this.obstacleBodies.filter(o => o.body !== other);
            }
          }

          // Play bounce sound based on relative velocity
          const impactSpeed = Math.hypot(
            this.ball.velocity.x - (other.velocity?.x || 0),
            this.ball.velocity.y - (other.velocity?.y || 0)
          );
          soundManager.playBounceSound(impactSpeed);
        }
      });
    });
  }

  public loadLevel(level: LevelDefinition, canvasWidth: number, canvasHeight: number) {
    // Clear existing world
    Matter.World.clear(this.world, false);
    this.inkBodies = [];
    this.obstacleBodies = [];
    this.portalCooldowns.clear();
    this.isBallReleased = false;
    this.winTimer = 0;
    this.isGrounded = false;

    // Reset gravity to default
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 1;

    // 1. Create Glass
    const glass = level.glass;
    const wallThick = 12;
    const gWidth = glass.width;
    const gHeight = glass.height;
    const gx = glass.x;
    const gy = glass.y;

    // Left wall
    const glassLeft = Matter.Bodies.rectangle(
      gx - gWidth / 2 + wallThick / 2,
      gy - wallThick / 2,
      wallThick,
      gHeight,
      {
        isStatic: true,
        friction: 0.9,
        restitution: 0.1,
        label: 'glassWall',
        collisionFilter: { category: this.CATEGORY_GLASS }
      }
    );

    // Right wall
    const glassRight = Matter.Bodies.rectangle(
      gx + gWidth / 2 - wallThick / 2,
      gy - wallThick / 2,
      wallThick,
      gHeight,
      {
        isStatic: true,
        friction: 0.9,
        restitution: 0.1,
        label: 'glassWall',
        collisionFilter: { category: this.CATEGORY_GLASS }
      }
    );

    // Bottom wall
    const glassBottom = Matter.Bodies.rectangle(
      gx,
      gy + gHeight / 2 - wallThick / 2,
      gWidth,
      wallThick,
      {
        isStatic: true,
        friction: 0.9,
        restitution: 0.1,
        label: 'glassBottom',
        collisionFilter: { category: this.CATEGORY_GLASS }
      }
    );

    // Interior bottom sensor (trigger for win condition)
    const glassSensor = Matter.Bodies.rectangle(
      gx,
      gy + gHeight / 2 - wallThick - 6,
      gWidth - wallThick * 2,
      12,
      {
        isStatic: true,
        isSensor: true,
        label: 'glassSensor',
        collisionFilter: { category: this.CATEGORY_SENSOR }
      }
    );

    if (glass.rotation) {
      Matter.Body.rotate(glassLeft, glass.rotation);
      Matter.Body.rotate(glassRight, glass.rotation);
      Matter.Body.rotate(glassBottom, glass.rotation);
      Matter.Body.rotate(glassSensor, glass.rotation);
    }

    this.glassParts = {
      left: glassLeft,
      right: glassRight,
      bottom: glassBottom,
      sensor: glassSensor
    };

    Matter.World.add(this.world, [glassLeft, glassRight, glassBottom, glassSensor]);

    // 2. Create Ball
    this.ball = Matter.Bodies.circle(level.ball.x, level.ball.y, level.ball.radius, {
      friction: 0.8,
      frictionAir: 0.005,
      restitution: 0.25,
      density: 0.003,
      isStatic: true, // Keep ball frozen until first touch release
      label: 'ball',
      collisionFilter: { category: this.CATEGORY_BALL }
    });

    Matter.World.add(this.world, this.ball);

    // 3. Create Obstacles
    level.obstacles.forEach((obs) => {
      this.createObstacleBody(obs);
    });
  }

  private createObstacleBody(obs: LevelObstacle) {
    let body: Matter.Body | null = null;
    const options: Matter.IBodyDefinition = {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      label: obs.type,
      collisionFilter: { category: obs.type === 'spike' ? this.CATEGORY_SPIKE : this.CATEGORY_OBSTACLE }
    };

    switch (obs.type) {
      case 'wall':
      case 'spike':
      case 'breakable': {
        body = Matter.Bodies.rectangle(obs.x, obs.y, obs.width || 100, obs.height || 20, options);
        if (obs.rotation) {
          Matter.Body.rotate(body, obs.rotation);
        }
        break;
      }
      case 'circle': {
        body = Matter.Bodies.circle(obs.x, obs.y, obs.radius || 30, options);
        break;
      }
      case 'rotator': {
        body = Matter.Bodies.rectangle(obs.x, obs.y, obs.width || 120, obs.height || 16, {
          ...options,
          isStatic: true
        });
        if (obs.rotation) {
          Matter.Body.rotate(body, obs.rotation);
        }
        break;
      }
      case 'moving': {
        body = Matter.Bodies.rectangle(obs.x, obs.y, obs.width || 100, obs.height || 20, options);
        break;
      }
      case 'fan':
      case 'portal':
      case 'magnet':
      case 'gravityZone': {
        // Trigger zones or non-solid physics bodies
        body = Matter.Bodies.rectangle(obs.x, obs.y, obs.width || 60, obs.height || 60, {
          isStatic: true,
          isSensor: true,
          label: obs.type
        });
        if (obs.rotation) {
          Matter.Body.rotate(body, obs.rotation);
        }
        break;
      }
    }

    if (body) {
      Matter.World.add(this.world, body);
      this.obstacleBodies.push({ body, data: obs });
    }
  }

  // Release ball on first drawing touch up
  public releaseBall() {
    if (!this.isBallReleased && this.ball) {
      this.isBallReleased = true;
      Matter.Body.setStatic(this.ball, false);
      Matter.Sleeping.set(this.ball, false);
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0.1 });
    }
  }

  public isReleased(): boolean {
    return this.isBallReleased;
  }

  // Add drawn ink stroke as solid physics bodies
  public addInkStrokeBodies(points: Point[], strokeThickness: number = 7) {
    if (points.length < 2) return;

    const strokeGroup = Matter.Body.nextGroup(true);

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);

      if (length < 2) continue; // skip tiny segments

      const angle = Math.atan2(dy, dx);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Create segment body with rounded corners chamfer
      const segment = Matter.Bodies.rectangle(midX, midY, length + strokeThickness, strokeThickness, {
        isStatic: true,
        friction: 0.85,
        restitution: 0.1,
        angle: angle,
        chamfer: { radius: strokeThickness / 2 },
        collisionFilter: { group: strokeGroup, category: this.CATEGORY_INK },
        label: 'inkSegment'
      });

      Matter.World.add(this.world, segment);
      this.inkBodies.push(segment);
    }
  }

  public update(deltaMs: number, canvasWidth: number, canvasHeight: number) {
    // 1. Step Matter.js Physics Engine with clamped delta to avoid tunneling/lag spikes on Android
    const safeDelta = Math.min(Math.max(deltaMs, 8), 33.33);
    Matter.Engine.update(this.engine, safeDelta);

    // 2. Update dynamic obstacles (Rotators, Moving Platforms, Special Zones)
    this.updateObstacles(deltaMs);

    // 3. Sound updates
    if (this.ball && this.isBallReleased) {
      const speed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
      
      // Check if grounded (colliding with ink or glass or obstacle)
      const pairs = this.engine.pairs.collisionStart;
      this.isGrounded = pairs.some(p => p.bodyA === this.ball || p.bodyB === this.ball);
      
      soundManager.updateRollingSound(speed, this.isGrounded);
    } else {
      soundManager.stopRollingSound();
    }

    // 4. Verify Win & Loss conditions
    this.checkWinLossConditions(deltaMs, canvasWidth, canvasHeight);
  }

  private updateObstacles(deltaMs: number) {
    const timeSec = performance.now() / 1000;

    // Portal cooldown decrement
    this.portalCooldowns.forEach((cd, key) => {
      if (cd > 0) {
        this.portalCooldowns.set(key, cd - deltaMs);
      }
    });

    this.obstacleBodies.forEach(({ body, data }) => {
      // Rotator update
      if (data.type === 'rotator') {
        const speed = (data.speed || 1.5) * 0.02;
        Matter.Body.setAngle(body, body.angle + speed);
      }

      // Moving platform update
      if (data.type === 'moving') {
        const dist = data.moveDistance || 100;
        const speed = data.speed || 1;
        const offset = Math.sin(timeSec * speed * 2) * dist;

        if (data.moveAxis === 'y') {
          Matter.Body.setPosition(body, { x: data.x, y: data.y + offset });
        } else {
          Matter.Body.setPosition(body, { x: data.x + offset, y: data.y });
        }
      }

      // Fan force field update
      if (data.type === 'fan' && this.ball) {
        if (Matter.Bounds.contains(body.bounds, this.ball.position)) {
          const dir = data.forceDirection || { x: 0, y: -1 };
          const mag = (data.forceMagnitude || 0.003);
          Matter.Body.applyForce(this.ball, this.ball.position, {
            x: dir.x * mag,
            y: dir.y * mag
          });
        }
      }

      // Magnet update
      if (data.type === 'magnet' && this.ball) {
        const dx = body.position.x - this.ball.position.x;
        const dy = body.position.y - this.ball.position.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = data.radius || 180;

        if (dist < maxDist && dist > 10) {
          const forceFactor = (1 - dist / maxDist) * (data.forceMagnitude || 0.002);
          const sign = data.isRepel ? -1 : 1;
          Matter.Body.applyForce(this.ball, this.ball.position, {
            x: (dx / dist) * forceFactor * sign,
            y: (dy / dist) * forceFactor * sign
          });
        }
      }

      // Gravity zone update
      if (data.type === 'gravityZone' && this.ball) {
        if (Matter.Bounds.contains(body.bounds, this.ball.position)) {
          const scale = data.gravityScale || { x: 0, y: -1 };
          // Apply counter gravity force + custom direction
          Matter.Body.applyForce(this.ball, this.ball.position, {
            x: scale.x * 0.0012 * this.ball.mass,
            y: (scale.y - 1) * 0.0012 * this.ball.mass
          });
        }
      }

      // Portal teleport update
      if (data.type === 'portal' && this.ball && data.targetPortalId) {
        if (Matter.Bounds.contains(body.bounds, this.ball.position)) {
          const cooldownKey = `${data.id}_${data.targetPortalId}`;
          if ((this.portalCooldowns.get(cooldownKey) || 0) <= 0) {
            // Find target portal
            const targetObs = this.obstacleBodies.find(o => o.data.id === data.targetPortalId);
            if (targetObs) {
              soundManager.playPortalWhoosh();
              if (this.callbacks.onPortalTeleport) {
                this.callbacks.onPortalTeleport(body.position.x, body.position.y);
              }
              // Set portal cooldown on both ends
              this.portalCooldowns.set(cooldownKey, 600);
              this.portalCooldowns.set(`${data.targetPortalId}_${data.id}`, 600);

              // Teleport ball position cleanly with slight offset
              Matter.Body.setPosition(this.ball, {
                x: targetObs.body.position.x,
                y: targetObs.body.position.y + 20
              });
            }
          }
        }
      }
    });
  }

  private checkWinLossConditions(deltaMs: number, canvasWidth: number, canvasHeight: number) {
    if (!this.ball) return;

    const bPos = this.ball.position;
    const bVel = this.ball.velocity;
    const bSpeed = Math.hypot(bVel.x, bVel.y);

    // 1. Loss Check: Out of Bounds
    if (
      bPos.y > canvasHeight + 120 ||
      bPos.x < -120 ||
      bPos.x > canvasWidth + 120
    ) {
      soundManager.playLoseSound();
      this.callbacks.onLose('Ball fell off the screen!');
      return;
    }

    // 2. Win Check: Ball inside Glass
    if (this.glassParts && this.isBallReleased) {
      const sensor = this.glassParts.sensor;
      const left = this.glassParts.left;
      const right = this.glassParts.right;

      // Ball center must be between glass left and right wall
      const isHorizontallyInside =
        bPos.x > left.position.x + 8 && bPos.x < right.position.x - 8;

      // Ball must be near glass bottom (below glass top rim and above sensor/bottom)
      const isVerticallyInside =
        bPos.y > left.position.y - 15 && bPos.y < this.glassParts.bottom.position.y + 10;

      // Ball speed must be resting (< 0.15 px/frame)
      const isResting = bSpeed < 0.18;

      if (isHorizontallyInside && isVerticallyInside && isResting) {
        this.winTimer += deltaMs;

        if (this.winTimer >= 300) {
          // WIN CONDITION SATISFIED!
          soundManager.playGlassDing();
          this.callbacks.onWin();
        }
      } else {
        this.winTimer = 0; // reset if ball shifts or moves away
      }
    }
  }

  public resetLevel(level: LevelDefinition, canvasWidth: number, canvasHeight: number) {
    this.loadLevel(level, canvasWidth, canvasHeight);
  }
}
