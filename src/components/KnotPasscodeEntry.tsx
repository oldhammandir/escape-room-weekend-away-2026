import { useState, useRef } from 'react';

interface KnotPasscodeEntryProps {
  correctCode: string;
  onCorrect: () => void;
  onWrong: () => void;
}

export default function KnotPasscodeEntry({ correctCode, onCorrect, onWrong }: KnotPasscodeEntryProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const code = digits.join('');
    if (code.length < 4) {
      setError('ENTER ALL 4 DIGITS');
      return;
    }
    if (code === correctCode) {
      onCorrect();
    } else {
      onWrong();
      setShake(true);
      setError('INVALID CODE — 5 SEC PENALTY');
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className={`knot-passcode${shake ? ' shaking' : ''}`}>
      <div className="knot-passcode-title">OVERRIDE CODE</div>
      <div className="knot-passcode-hint">
        ALL SECTORS CLEARED. ENTER THE MASTER DISARM CODE.
      </div>
      <div className="knot-passcode-digits">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="knot-passcode-digit"
          />
        ))}
      </div>
      <div className="knot-passcode-error">{error}</div>
      <button className="knot-passcode-submit" onClick={handleSubmit}>
        SUBMIT OVERRIDE
      </button>
    </div>
  );
}
