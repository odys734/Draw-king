import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStats, GameStateStatus, LevelDefinition, Point, InkStroke } from '../types';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { HANDCRAFTED_LEVELS } from '../levels/levelData';
import { ProceduralGenerator } from '../levels/proceduralGenerator';
import { soundManager } from '../audio/SoundSystem';
import { UIOverlay } from './UIOverlay';
import { saveManager, ExtendedGameStats } from '../utils/saveManager';
import { triggerHapticImpact, triggerHapticNotification, setHapticsEnabled } from '../utils/haptics';
import { initCapacitorAndroid } from '../utils/capacitor';

export const InkDropGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game Stats State with SaveManager
  const [stats, setStats] = useState<ExtendedGameStats>(() => saveManager.loadStats());
  const [showLevelGrid, setShowLevelGrid] = useState<boolean>(false);

  const [currentLevelId, setCurrentLevelId] = useState<number>(() => stats.lastPlayedLevel || 1);
  const [levelDef, setLevelDef] = useState<LevelDefinition>(HANDCRAFTED_LEVELS[0]);
  const [gameStatus, setGameStatus] = useState<GameStateStatus>('ready');
  const [defeatReason, setDefeatReason] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Synchronize Haptics module setting
  useEffect(() => {
    setHapticsEnabled(stats.hapticsEnabled ?? true);
  }, [stats.hapticsEnabled]);

  // Capacitor Android Initialization & Hardware Back Button
  useEffect(() => {
    initCapacitorAndroid({
      onHardwareBack: () => {
        if (showLevelGrid) {
          setShowLevelGrid(false);
          return true;
        }
        if (gameStatus === 'paused') {
          setGameStatus('playing');
          return true;
        }
        if (gameStatus === 'playing') {
          setGameStatus('paused');
          return true;
        }
        if (gameStatus === 'won' || gameStatus === 'lost') {
          initLevel(levelDef);
          return true;
        }
        return false; // Exit app if on main ready screen
      }
    });
  }, [showLevelGrid, gameStatus, levelDef]);

  // Ink tracking
  const [inkUsed, setInkUsed] = useState<number>(0);
  const inkStrokesRef = useRef<InkStroke[]>([]);
  const currentPointsRef = useRef<Point[]>([]);

  // Critical Mobile Input Ref Tracking
  const activePointerIdRef = useRef<number | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const hasBallDroppedRef = useRef<boolean>(false);
  const inkUsedRef = useRef<number>(0);
  const levelDefRef = useRef<LevelDefinition>(levelDef);

  useEffect(() => {
    inkUsedRef.current = inkUsed;
  }, [inkUsed]);

  useEffect(() => {
    levelDefRef.current = levelDef;
  }, [levelDef]);

  // Physics Engine Ref
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Particles & Visual FX
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    life: number;
    maxLife: number;
  }>>([]);

  // Save Stats to LocalStorage using saveManager
  const saveStats = useCallback((newStats: ExtendedGameStats) => {
    setStats(newStats);
    saveManager.saveStats(newStats);
  }, []);

  // Load level definition
  const getLevelDefinition = useCallback((levelId: number): LevelDefinition => {
    if (levelId <= HANDCRAFTED_LEVELS.length) {
      return HANDCRAFTED_LEVELS[levelId - 1];
    }
    // Procedural level generation for higher levels!
    return ProceduralGenerator.generateLevel(levelId);
  }, []);

  // Level Win Callback
  const handleWin = useCallback(() => {
    soundManager.playWinSound();
    triggerHapticNotification('success');
    setGameStatus('won');

    // Calculate stars
    const remainingRatio = Math.max(0, (levelDef.maxInk - inkUsed) / levelDef.maxInk);
    let stars = 1;
    if (remainingRatio >= levelDef.threeStarInkRatio) {
      stars = 3;
    } else if (remainingRatio >= levelDef.twoStarInkRatio) {
      stars = 2;
    }

    // Trigger victory confetti particles
    const particles = particlesRef.current;
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: levelDef.glass.x,
        y: levelDef.glass.y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 2,
        radius: Math.random() * 4 + 2,
        color: ['#171717', '#404040', '#fbbf24', '#f59e0b'][Math.floor(Math.random() * 4)],
        life: 0,
        maxLife: 60 + Math.random() * 40
      });
    }

    // Update stats
    setStats((prev) => {
      const prevStars = prev.completedLevels[levelDef.id] || 0;
      const newStars = Math.max(prevStars, stars);
      const updatedLevels = { ...prev.completedLevels, [levelDef.id]: newStars };

      const totalStars = Object.values(updatedLevels).reduce((acc: number, curr: number) => acc + curr, 0);
      const unlockedLevel = Math.max(prev.unlockedLevel, levelDef.id + 1);

      const nextStats: ExtendedGameStats = {
        ...prev,
        completedLevels: updatedLevels,
        unlockedLevel,
        totalStars,
        lastPlayedLevel: levelDef.id + 1
      };
      saveStats(nextStats);
      return nextStats;
    });
  }, [levelDef, inkUsed, saveStats]);

  // Level Lose Callback
  const handleLose = useCallback((reason: string) => {
    setDefeatReason(reason);
    triggerHapticNotification('error');
    setGameStatus('lost');
  }, []);

  // Initialize Physics Engine & Level
  const initLevel = useCallback((level: LevelDefinition) => {
    setGameStatus('ready');
    setDefeatReason('');
    setInkUsed(0);
    inkStrokesRef.current = [];
    currentPointsRef.current = [];
    activePointerIdRef.current = null;
    isDrawingRef.current = false;
    hasBallDroppedRef.current = false;
    particlesRef.current = [];

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!physicsEngineRef.current) {
      physicsEngineRef.current = new PhysicsEngine({
        onWin: handleWin,
        onLose: handleLose,
        onShatter: (x, y) => {
          // Shatter particles
          for (let i = 0; i < 20; i++) {
            particlesRef.current.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              radius: Math.random() * 3 + 1,
              color: '#525252',
              life: 0,
              maxLife: 30
            });
          }
        },
        onPortalTeleport: (x, y) => {
          // Teleport sparkles
          for (let i = 0; i < 15; i++) {
            particlesRef.current.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: Math.random() * 3 + 1,
              color: '#3b82f6',
              life: 0,
              maxLife: 25
            });
          }
        }
      });
    }

    physicsEngineRef.current.loadLevel(level, canvas.width, canvas.height);
  }, [handleWin, handleLose]);

  // Load current level
  useEffect(() => {
    const level = getLevelDefinition(currentLevelId);
    setLevelDef(level);
    initLevel(level);
  }, [currentLevelId, getLevelDefinition, initLevel]);

  // Toggle Sound
  const handleToggleSound = () => {
    const nextVal = !stats.soundEnabled;
    soundManager.setEnabled(nextVal);
    saveStats({ ...stats, soundEnabled: nextVal });
  };

  // Toggle Haptics
  const handleToggleHaptics = () => {
    const nextVal = !(stats.hapticsEnabled ?? true);
    setHapticsEnabled(nextVal);
    saveStats({ ...stats, hapticsEnabled: nextVal });
  };

  // Smooth Points using Catmull-Rom or Bezier interpolation
  const smoothPoints = (points: Point[]): Point[] => {
    if (points.length < 3) return points;
    const smoothed: Point[] = [];
    smoothed.push(points[0]);

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const cp1x = curr.x + (next.x - prev.x) * 0.15;
      const cp1y = curr.y + (next.y - prev.y) * 0.15;

      smoothed.push({ x: cp1x, y: cp1y });
    }
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  // Coordinates helper
  const getCanvasCoords = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY))
    };
  }, []);

  // Drawing & Pointer Event Functions
  const finishCurrentDrawing = useCallback((pointerId: number) => {
    if (activePointerIdRef.current !== pointerId) return;

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        if (canvas.hasPointerCapture(pointerId)) {
          canvas.releasePointerCapture(pointerId);
        }
      } catch {
        // capture release fallback
      }
    }

    activePointerIdRef.current = null;

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    soundManager.stopDrawingSound();

    const rawPts = currentPointsRef.current;

    // Convert single tap point into a tiny dot segment
    if (rawPts.length === 1) {
      rawPts.push({ x: rawPts[0].x + 1, y: rawPts[0].y + 1 });
    }

    if (rawPts.length >= 2) {
      const smoothed = smoothPoints(rawPts);

      let len = 0;
      for (let i = 0; i < smoothed.length - 1; i++) {
        len += Math.hypot(smoothed[i + 1].x - smoothed[i].x, smoothed[i + 1].y - smoothed[i].y);
      }

      const newStroke: InkStroke = {
        id: `stroke_${Date.now()}_${Math.random()}`,
        points: rawPts,
        smoothedPoints: smoothed,
        length: len
      };

      inkStrokesRef.current.push(newStroke);

      if (physicsEngineRef.current) {
        physicsEngineRef.current.addInkStrokeBodies(smoothed);
      }
    }

    // The ball drops ONLY once, after the player's first real finger release.
    if (!hasBallDroppedRef.current) {
      if (physicsEngineRef.current && !physicsEngineRef.current.isReleased()) {
        physicsEngineRef.current.releaseBall();
        hasBallDroppedRef.current = true;
        triggerHapticImpact('medium');
      }
    }

    currentPointsRef.current = [];
  }, []);

  // Primary Pointer Event Listeners + Gesture Prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();

      if (gameStatus === 'won' || gameStatus === 'lost' || gameStatus === 'paused') return;

      // Ignore non-primary buttons on mouse (secondary clicks)
      if (e.button !== undefined && e.button !== 0) return;

      // Maintain a single active pointer. Ignore additional touches (multi-touch / second finger)
      if (activePointerIdRef.current !== null) return;

      activePointerIdRef.current = e.pointerId;

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }

      const pt = getCanvasCoords(e.clientX, e.clientY);
      isDrawingRef.current = true;
      currentPointsRef.current = [pt];
      soundManager.startDrawingSound();
      triggerHapticImpact('light');
    };

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();

      // Ignore every event that does NOT match the active pointer
      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
        return;
      }

      if (!isDrawingRef.current) return;

      const pt = getCanvasCoords(e.clientX, e.clientY);
      const pts = currentPointsRef.current;
      if (pts.length === 0) {
        pts.push(pt);
        return;
      }

      const last = pts[pts.length - 1];
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 3) {
        if (inkUsedRef.current + dist > levelDefRef.current.maxInk) {
          // Exceeded ink limit: finish drawing stroke
          finishCurrentDrawing(e.pointerId);
          return;
        }

        pts.push(pt);
        setInkUsed((prev) => prev + dist);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();

      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
        return;
      }

      finishCurrentDrawing(e.pointerId);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      e.preventDefault();

      if (activePointerIdRef.current === null || e.pointerId !== activePointerIdRef.current) {
        return;
      }

      finishCurrentDrawing(e.pointerId);
    };

    // Mobile gesture & scroll prevention listeners
    const preventDefaultHandler = (e: Event) => {
      e.preventDefault();
    };

    // Attach Pointer Events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);

    // Suppress browser gestures, scrolling, pull-to-refresh, double-tap zoom & context menu
    canvas.addEventListener('touchstart', preventDefaultHandler, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultHandler, { passive: false });
    canvas.addEventListener('touchend', preventDefaultHandler, { passive: false });
    canvas.addEventListener('touchcancel', preventDefaultHandler, { passive: false });
    canvas.addEventListener('contextmenu', preventDefaultHandler);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);

      canvas.removeEventListener('touchstart', preventDefaultHandler);
      canvas.removeEventListener('touchmove', preventDefaultHandler);
      canvas.removeEventListener('touchend', preventDefaultHandler);
      canvas.removeEventListener('touchcancel', preventDefaultHandler);
      canvas.removeEventListener('contextmenu', preventDefaultHandler);
    };
  }, [gameStatus, getCanvasCoords, finishCurrentDrawing]);

  // Render Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const deltaMs = Math.min(32, time - lastTime);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Step Physics Engine if playing
      if (physicsEngineRef.current && gameStatus !== 'paused') {
        physicsEngineRef.current.update(deltaMs, canvas.width, canvas.height);
      }

      // --- CLEAR & PAPER BACKGROUND ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#faf9f6'; // Warm Off-White Paper Canvas
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Paper grid pattern
      ctx.strokeStyle = '#e5e5e5';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // --- DRAW HINT GUIDELINE ---
      if (showHint && levelDef.hintPath && levelDef.hintPath.length >= 2) {
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#a3a3a3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(levelDef.hintPath[0].x, levelDef.hintPath[0].y);
        for (let i = 1; i < levelDef.hintPath.length; i++) {
          ctx.lineTo(levelDef.hintPath[i].x, levelDef.hintPath[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // --- DRAW OBSTACLES ---
      levelDef.obstacles.forEach((obs) => {
        ctx.save();
        ctx.translate(obs.x, obs.y);
        if (obs.rotation) ctx.rotate(obs.rotation);

        switch (obs.type) {
          case 'wall': {
            ctx.fillStyle = '#262626';
            ctx.fillRect(-(obs.width || 100) / 2, -(obs.height || 20) / 2, obs.width || 100, obs.height || 20);
            ctx.strokeStyle = '#171717';
            ctx.lineWidth = 2;
            ctx.strokeRect(-(obs.width || 100) / 2, -(obs.height || 20) / 2, obs.width || 100, obs.height || 20);
            break;
          }
          case 'spike': {
            const w = obs.width || 100;
            const h = obs.height || 20;
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-w / 2, -h / 2, w, h);

            // Spike danger teeth
            ctx.fillStyle = '#171717';
            const toothCount = Math.floor(w / 12);
            const toothWidth = w / toothCount;
            for (let i = 0; i < toothCount; i++) {
              ctx.beginPath();
              ctx.moveTo(-w / 2 + i * toothWidth, -h / 2);
              ctx.lineTo(-w / 2 + (i + 0.5) * toothWidth, -h / 2 - 8);
              ctx.lineTo(-w / 2 + (i + 1) * toothWidth, -h / 2);
              ctx.fill();
            }
            break;
          }
          case 'rotator': {
            // Find current rotator body angle from physics engine
            const obsRef = physicsEngineRef.current?.world.bodies.find(b => b.label === 'rotator');
            const angle = obsRef ? obsRef.angle : 0;

            ctx.rotate(angle);
            ctx.fillStyle = '#171717';
            ctx.fillRect(-(obs.width || 120) / 2, -(obs.height || 16) / 2, obs.width || 120, obs.height || 16);

            // Pivot wheel
            ctx.fillStyle = '#737373';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'moving': {
            ctx.fillStyle = '#404040';
            ctx.fillRect(-(obs.width || 100) / 2, -(obs.height || 20) / 2, obs.width || 100, obs.height || 20);
            break;
          }
          case 'fan': {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(-(obs.width || 60) / 2, -(obs.height || 60) / 2, obs.width || 60, obs.height || 60);

            // Animated wind particles
            ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            const t = performance.now() * 0.003;
            for (let i = 0; i < 4; i++) {
              const py = ((-(obs.height || 60) / 2) + ((t * 40 + i * 15) % (obs.height || 60)));
              ctx.beginPath();
              ctx.arc(0, py, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          }
          case 'portal': {
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.arc(0, 0, (obs.width || 50) / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, (obs.width || 50) / 3, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          case 'magnet': {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(0, 0, obs.radius || 120, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = obs.isRepel ? '#ef4444' : '#22c55e';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'breakable': {
            ctx.fillStyle = '#a3a3a3';
            ctx.fillRect(-(obs.width || 100) / 2, -(obs.height || 20) / 2, obs.width || 100, obs.height || 20);
            ctx.strokeStyle = '#525252';
            ctx.lineWidth = 2;
            ctx.strokeRect(-(obs.width || 100) / 2, -(obs.height || 20) / 2, obs.width || 100, obs.height || 20);
            break;
          }
        }
        ctx.restore();
      });

      // --- DRAW GLASS ---
      const g = levelDef.glass;
      ctx.save();
      ctx.translate(g.x, g.y);
      if (g.rotation) ctx.rotate(g.rotation);

      const gw = g.width;
      const gh = g.height;
      const wt = 10;

      // Glass Body Gradient Fill
      const glassGrad = ctx.createLinearGradient(-gw / 2, 0, gw / 2, 0);
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.6)');

      ctx.fillStyle = glassGrad;
      ctx.fillRect(-gw / 2, -gh / 2, gw, gh);

      // Glass Thick Black Outline
      ctx.fillStyle = '#171717';
      ctx.fillRect(-gw / 2, -gh / 2, wt, gh); // Left wall
      ctx.fillRect(gw / 2 - wt, -gh / 2, wt, gh); // Right wall
      ctx.fillRect(-gw / 2, gh / 2 - wt, gw, wt); // Bottom wall

      // Glass Shine Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-gw / 2 + wt + 4, -gh / 2 + 8);
      ctx.lineTo(-gw / 2 + wt + 4, gh / 2 - wt - 8);
      ctx.stroke();

      ctx.restore();

      // --- DRAW COMPLETED INK STROKES ---
      ctx.fillStyle = '#171717';
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      inkStrokesRef.current.forEach((stroke) => {
        if (stroke.smoothedPoints.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke.smoothedPoints[0].x, stroke.smoothedPoints[0].y);
        for (let i = 1; i < stroke.smoothedPoints.length; i++) {
          ctx.lineTo(stroke.smoothedPoints[i].x, stroke.smoothedPoints[i].y);
        }
        ctx.stroke();
      });

      // --- DRAW ACTIVE INK STROKE IN PROGRESS ---
      if (isDrawingRef.current && currentPointsRef.current.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(currentPointsRef.current[0].x, currentPointsRef.current[0].y);
        for (let i = 1; i < currentPointsRef.current.length; i++) {
          ctx.lineTo(currentPointsRef.current[i].x, currentPointsRef.current[i].y);
        }
        ctx.stroke();
      }

      // --- DRAW BALL ---
      const ballBody = physicsEngineRef.current?.ball;
      if (ballBody) {
        const bx = ballBody.position.x;
        const by = ballBody.position.y;
        const br = levelDef.ball.radius;

        ctx.save();
        ctx.translate(bx, by);

        // Black Ball
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.arc(0, 0, br, 0, Math.PI * 2);
        ctx.fill();

        // Ball shine curve
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-br * 0.3, -br * 0.3, br * 0.4, Math.PI * 0.8, Math.PI * 1.7);
        ctx.stroke();

        ctx.restore();
      }

      // --- DRAW PARTICLES ---
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameStatus, levelDef, showHint]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-neutral-100 overflow-hidden"
    >
      {/* Game Canvas Container */}
      <div className="relative w-full max-w-[420px] aspect-[420/600] max-h-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-neutral-300">
        <canvas
          ref={canvasRef}
          width={420}
          height={600}
          className="w-full h-full touch-none select-none cursor-crosshair"
          id="game-canvas"
        />

        {/* UI Overlay */}
        <UIOverlay
          currentLevel={levelDef}
          stats={stats}
          gameStatus={gameStatus}
          inkRemaining={levelDef.maxInk - inkUsed}
          maxInk={levelDef.maxInk}
          showHint={showHint}
          defeatReason={defeatReason}
          onToggleSound={handleToggleSound}
          onToggleHaptics={handleToggleHaptics}
          onToggleHint={() => setShowHint((prev) => !prev)}
          onRestart={() => initLevel(levelDef)}
          onNextLevel={() => setCurrentLevelId((prev) => prev + 1)}
          onPause={() => setGameStatus('paused')}
          onResume={() => setGameStatus('playing')}
          onSelectLevel={(id) => setCurrentLevelId(id)}
          totalLevelsCount={HANDCRAFTED_LEVELS.length}
          showLevelGrid={showLevelGrid}
          setShowLevelGrid={setShowLevelGrid}
        />
      </div>
    </div>
  );
};
