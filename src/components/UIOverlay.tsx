import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Volume2, VolumeX, Lightbulb, Grid, Pause, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { GameStats, GameStateStatus, LevelDefinition } from '../types';

interface UIOverlayProps {
  currentLevel: LevelDefinition;
  stats: GameStats;
  gameStatus: GameStateStatus;
  inkRemaining: number; // 0 to maxInk
  maxInk: number;
  showHint: boolean;
  defeatReason: string;
  onToggleSound: () => void;
  onToggleHint: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onPause: () => void;
  onResume: () => void;
  onSelectLevel: (levelId: number) => void;
  totalLevelsCount: number;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  currentLevel,
  stats,
  gameStatus,
  inkRemaining,
  maxInk,
  showHint,
  defeatReason,
  onToggleSound,
  onToggleHint,
  onRestart,
  onNextLevel,
  onPause,
  onResume,
  onSelectLevel,
  totalLevelsCount
}) => {
  const [showLevelGrid, setShowLevelGrid] = React.useState(false);

  const inkRatio = Math.max(0, Math.min(1, inkRemaining / maxInk));
  const inkPercent = Math.round(inkRatio * 100);

  // Calculate potential stars earned based on remaining ink
  let currentStars = 1;
  if (inkRatio >= currentLevel.threeStarInkRatio) {
    currentStars = 3;
  } else if (inkRatio >= currentLevel.twoStarInkRatio) {
    currentStars = 2;
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-sans select-none">
      {/* --- TOP BAR --- */}
      <div className="pointer-events-auto flex items-center justify-between bg-white/90 backdrop-blur-md border border-neutral-300 rounded-2xl p-3 shadow-md">
        {/* Level badge */}
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm tracking-wide uppercase">
            Level {currentLevel.id}
          </div>
          <span className="text-sm font-semibold text-neutral-800 hidden sm:inline">
            {currentLevel.title}
          </span>
        </div>

        {/* Ink Meter Bar */}
        <div className="flex-1 max-w-[180px] sm:max-w-[240px] mx-3">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1">
            <span>INK</span>
            <span>{inkPercent}%</span>
          </div>
          <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden border border-neutral-300 shadow-inner">
            <motion.div
              className="h-full bg-neutral-900 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${inkPercent}%` }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
            {/* Star Threshold Ticks */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 opacity-80"
              style={{ left: `${currentLevel.twoStarInkRatio * 100}%` }}
              title="2 Star threshold"
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 opacity-90"
              style={{ left: `${currentLevel.threeStarInkRatio * 100}%` }}
              title="3 Star threshold"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleHint}
            className={`p-2 rounded-xl border transition-all ${
              showHint
                ? 'bg-amber-100 border-amber-400 text-amber-700 shadow-inner scale-95'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
            }`}
            title="Toggle Hint"
            id="hint-btn"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 transition-all"
            title="Toggle Sound"
            id="sound-btn"
          >
            {stats.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-500" />}
          </button>

          <button
            onClick={onPause}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 transition-all"
            title="Pause Game"
            id="pause-btn"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- BOTTOM BAR --- */}
      <div className="pointer-events-auto flex items-center justify-between">
        <button
          onClick={() => setShowLevelGrid(true)}
          className="flex items-center gap-2 bg-white/90 hover:bg-white text-neutral-800 font-semibold text-xs uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-neutral-300 shadow-md backdrop-blur-md transition-all active:scale-95"
          id="level-select-btn"
        >
          <Grid className="w-4 h-4 text-neutral-600" />
          <span>Levels</span>
        </button>

        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-neutral-300 rounded-xl px-3 py-1.5 shadow-md">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Stars:</span>
          <div className="flex gap-0.5 text-amber-500 font-bold text-sm">
            ★ {stats.totalStars}
          </div>
        </div>

        <button
          onClick={onRestart}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
          id="restart-btn"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart</span>
        </button>
      </div>

      {/* --- LEVEL COMPLETE OVERLAY --- */}
      <AnimatePresence>
        {gameStatus === 'won' && (
          <motion.div
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white border border-neutral-300 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400" />
              
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase mb-1">
                Level Complete!
              </h2>
              <p className="text-xs font-medium text-neutral-500 mb-4">
                Ball guided safely into glass
              </p>

              {/* Animated Stars */}
              <div className="flex justify-center gap-2 mb-5">
                {[1, 2, 3].map((starNum) => (
                  <motion.div
                    key={starNum}
                    className={`text-4xl ${
                      starNum <= currentStars ? 'text-amber-400 drop-shadow-md' : 'text-neutral-300'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15 * starNum, type: 'spring' }}
                  >
                    ★
                  </motion.div>
                ))}
              </div>

              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 mb-5 text-xs text-neutral-600 flex justify-between">
                <span>Ink Saved:</span>
                <span className="font-bold text-neutral-900">{inkPercent}% remaining</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onRestart}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                  id="win-restart-btn"
                >
                  Replay
                </button>
                <button
                  onClick={onNextLevel}
                  className="flex-2 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all"
                  id="win-next-btn"
                >
                  <span>Next Level</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LEVEL DEFEAT OVERLAY --- */}
      <AnimatePresence>
        {gameStatus === 'lost' && (
          <motion.div
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white border border-neutral-300 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl relative overflow-hidden"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase mb-1">
                Level Failed
              </h2>
              <p className="text-xs font-medium text-neutral-500 mb-5">
                {defeatReason || 'Try drawing a different ramp!'}
              </p>

              <button
                onClick={onRestart}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                id="defeat-retry-btn"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PAUSE MENU MODAL --- */}
      <AnimatePresence>
        {gameStatus === 'paused' && (
          <motion.div
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white border border-neutral-300 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-3"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase mb-4">
                Game Paused
              </h2>

              <button
                onClick={onResume}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                id="pause-resume-btn"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>

              <button
                onClick={onRestart}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                id="pause-restart-btn"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Level</span>
              </button>

              <button
                onClick={() => {
                  onResume();
                  setShowLevelGrid(true);
                }}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                id="pause-levels-btn"
              >
                <Grid className="w-4 h-4" />
                <span>Select Level</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LEVEL SELECTION GRID MODAL --- */}
      <AnimatePresence>
        {showLevelGrid && (
          <motion.div
            className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white border border-neutral-300 rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
                <div>
                  <h2 className="text-lg font-black text-neutral-900 uppercase tracking-wide">
                    Select Level
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Total Stars: <span className="font-bold text-amber-500">{stats.totalStars}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowLevelGrid(false)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold uppercase transition-all"
                  id="close-levels-btn"
                >
                  Close
                </button>
              </div>

              {/* Grid of Levels */}
              <div className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2.5 p-1 pr-2">
                {Array.from({ length: Math.max(20, totalLevelsCount) }).map((_, idx) => {
                  const levelNum = idx + 1;
                  const isUnlocked = levelNum <= stats.unlockedLevel;
                  const starsEarned = stats.completedLevels[levelNum] || 0;
                  const isCurrent = levelNum === currentLevel.id;

                  return (
                    <button
                      key={levelNum}
                      disabled={!isUnlocked}
                      onClick={() => {
                        onSelectLevel(levelNum);
                        setShowLevelGrid(false);
                      }}
                      className={`relative flex flex-col items-center justify-center h-16 rounded-2xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg ring-2 ring-neutral-400'
                          : isUnlocked
                          ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-800 shadow-sm'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed'
                      }`}
                      id={`level-grid-item-${levelNum}`}
                    >
                      <span className="text-sm font-black">{levelNum}</span>
                      {isUnlocked && starsEarned > 0 && (
                        <span className="text-[10px] font-bold text-amber-500 mt-0.5">
                          {'★'.repeat(starsEarned)}
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-[10px] font-bold text-neutral-400">Locked</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
