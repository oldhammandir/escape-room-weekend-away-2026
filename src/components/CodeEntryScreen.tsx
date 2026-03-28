import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '../config';
import { formatTime } from '../hooks/useTimer';
import '../styles/code-entry.css';

interface CodeEntryScreenProps {
  active: boolean;
  timeRemaining: number;
  onCorrect: () => void;
  onPenalty: () => void;
}

export default function CodeEntryScreen({
  active,
  timeRemaining,
  onCorrect,
  onPenalty,
}: CodeEntryScreenProps) {
  const [codeEntry, setCodeEntry] = useState('');
  const [statusText, setStatusText] = useState('');
  const codeLength = CONFIG.correctCode.length;

  useEffect(() => {
    if (active) {
      setCodeEntry('');
      setStatusText('');
    }
  }, [active]);

  const enterDigit = useCallback((digit: string) => {
    setCodeEntry(prev => {
      if (prev.length >= codeLength) return prev;
      return prev + digit;
    });
  }, [codeLength]);

  const clearCode = useCallback(() => {
    setCodeEntry('');
    setStatusText('');
  }, []);

  const submitCode = useCallback(() => {
    if (codeEntry.length !== codeLength) return;

    if (codeEntry === CONFIG.correctCode) {
      onCorrect();
    } else {
      onPenalty();
      setStatusText(`WRONG CODE — PENALTY ${CONFIG.codePenaltySeconds}s`);
      setCodeEntry('');
      setTimeout(() => setStatusText(''), 2000);
    }
  }, [codeEntry, codeLength, onCorrect, onPenalty]);

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        enterDigit(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitCode();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clearCode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, enterDigit, submitCode, clearCode]);

  const digits = Array.from({ length: codeLength }, (_, i) => {
    const char = i < codeEntry.length ? codeEntry[i] : '_';
    const filled = i < codeEntry.length;
    return (
      <span key={i} className={`code-digit${filled ? ' filled' : ''}`}>
        {char}
      </span>
    );
  });

  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div className="code-content">
        <div className="code-timer-display">
          <div className="timer-label">TIME REMAINING</div>
          <div className={`code-timer-value${timeRemaining <= 30 ? ' warning' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="code-title">ENTER DEFUSAL CODE</div>
        <div className="code-display">{digits}</div>
        <div className="code-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
            <button key={key} className="keypad-btn" onClick={() => enterDigit(key)}>
              {key}
            </button>
          ))}
          <button className="keypad-btn keypad-clear" onClick={clearCode}>CLR</button>
          <button className="keypad-btn" onClick={() => enterDigit('0')}>0</button>
          <button className="keypad-btn keypad-enter" onClick={submitCode}>&#9166;</button>
        </div>
        <div className="code-status">{statusText}</div>
      </div>
    </div>
  );
}
