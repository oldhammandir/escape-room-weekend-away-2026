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
      {/* Timer */}
      <div className="timer-display">
        <div className="timer-label">TIME REMAINING</div>
        <div className={`knot-timer-value${timeRemaining <= 30 ? ' warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Header */}
      <div className="knot-header">
        <div className="knot-title">WIRE OVERRIDE</div>
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
