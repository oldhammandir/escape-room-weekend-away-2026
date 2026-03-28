import { useState, useCallback } from 'react';
import { CONFIG } from '../config';
import { formatTime } from '../hooks/useTimer';
import { generateLevel, getLevelConfig, countCrossingPairs, TOTAL_SECTORS } from '../lib/knotPuzzleEngine';
import KnotGameBoard from './KnotGameBoard';
import KnotPasscodeEntry from './KnotPasscodeEntry';
import '../styles/knot-game.css';

interface KnotGameProps {
  active: boolean;
  timeRemaining: number;
  applyPenalty: (seconds: number) => void;
  onComplete: () => void;
}

export default function KnotGame({ active, timeRemaining, applyPenalty, onComplete }: KnotGameProps) {
  const [level, setLevel] = useState(0);
  const [puzzle, setPuzzle] = useState(() => generateLevel(0));
  const [showWin, setShowWin] = useState(false);
  const [phase, setPhase] = useState<'playing' | 'passcode'>('playing');

  const config = getLevelConfig(level);
  const crossings = countCrossingPairs(puzzle.nodes, puzzle.edges);

  const resetLevel = useCallback(() => {
    setPuzzle(generateLevel(level));
    setShowWin(false);
  }, [level]);

  const nextLevel = useCallback(() => {
    const next = level + 1;
    if (next >= TOTAL_SECTORS) {
      setPhase('passcode');
      return;
    }
    setLevel(next);
    setPuzzle(generateLevel(next));
    setShowWin(false);
  }, [level]);

  const onSolved = useCallback(() => {
    setShowWin(true);
  }, []);

  const handlePasscodeCorrect = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handlePasscodeWrong = useCallback(() => {
    applyPenalty(CONFIG.knotPenaltySeconds);
  }, [applyPenalty]);

  const difficultyClass =
    config.difficulty === 'Easy' ? 'easy' :
    config.difficulty === 'Medium' ? 'medium' :
    config.difficulty === 'Hard' ? 'hard' : 'critical';

  if (!active) return null;

  return (
    <div className={`screen${active ? ' active' : ''} knot-game-screen`}>
      {/* Timer bar */}
      {(() => {
        const isCritical = timeRemaining < 30;
        const isUrgent = timeRemaining < 60;
        const pct = (timeRemaining / CONFIG.timerSeconds) * 100;
        const statusClass = isCritical ? 'critical' : isUrgent ? 'urgent' : '';
        return (
          <div className="knot-timer-bar-wrap">
            <div className={`knot-timer-bar ${statusClass}`}>
              <div className="knot-timer-bar-left">
                <svg className="knot-timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {isUrgent ? (
                    <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                  ) : (
                    <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></>
                  )}
                </svg>
                <span className="knot-timer-label">
                  {isCritical ? 'CRITICAL' : isUrgent ? 'WARNING' : 'TIME REMAINING'}
                </span>
              </div>
              <span className="knot-timer-digits">{formatTime(timeRemaining)}</span>
            </div>
            <div className="knot-timer-progress">
              <div className={`knot-timer-progress-fill ${statusClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="knot-header">
        <div className="knot-title">
          <svg className="knot-shield-icon" viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>WIRE OVERRIDE</span>
          <svg className="knot-shield-icon" viewBox="0 0 24 24" fill="none" stroke="#ff3333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div className="knot-subtitle">REROUTE THE CIRCUITS — ELIMINATE ALL CROSSINGS</div>
      </div>

      {phase === 'passcode' ? (
        <KnotPasscodeEntry
          correctCode={CONFIG.knotPasscode}
          onCorrect={handlePasscodeCorrect}
          onWrong={handlePasscodeWrong}
        />
      ) : (
        <>
          {/* Stats bar */}
          <div className="knot-stats">
            <div className="knot-stat">
              SECTOR <span className="knot-stat-value">{level + 1}/{TOTAL_SECTORS}</span>
            </div>
            <div className={`knot-stat knot-stat-difficulty ${difficultyClass}`}>
              {config.difficulty.toUpperCase()}
            </div>
            <div className="knot-stat">
              FAULTS <span className={`knot-stat-value ${crossings > 0 ? 'danger' : 'safe'}`}>
                {crossings}
              </span>
            </div>
            <div className="knot-stat">
              NODES <span className="knot-stat-value">{config.nodeCount}</span>
            </div>
          </div>

          {/* Game board */}
          <KnotGameBoard
            initialNodes={puzzle.nodes}
            edges={puzzle.edges}
            onSolved={onSolved}
          />

          {/* Controls */}
          <div className="knot-controls">
            <button className="knot-btn" onClick={resetLevel}>
              SCRAMBLE
            </button>
            {showWin && (
              <button className="knot-btn knot-btn-next" onClick={nextLevel}>
                {level + 1 >= TOTAL_SECTORS ? 'ENTER OVERRIDE CODE' : 'NEXT SECTOR'}
              </button>
            )}
          </div>

          {/* Win message */}
          {showWin && (
            <div className="knot-cleared">SECTOR CLEARED</div>
          )}
        </>
      )}
    </div>
  );
}
