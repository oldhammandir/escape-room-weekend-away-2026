import { formatTime } from '../hooks/useTimer';
import WireCanvas from './WireCanvas';
import '../styles/wire-defusal.css';

interface WireDefusalScreenProps {
  active: boolean;
  timeRemaining: number;
  cutWires: Set<number>;
  statusMessage: string;
  onWireCut: (index: number) => void;
}

export default function WireDefusalScreen({
  active,
  timeRemaining,
  cutWires,
  statusMessage,
  onWireCut,
}: WireDefusalScreenProps) {
  return (
    <div className={`screen wire-defusal-screen${active ? ' active' : ''}`}>
      <div className="timer-display">
        <div className="timer-label">TIME REMAINING</div>
        <div className={`timer-value${timeRemaining <= 30 ? ' warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      <WireCanvas cutWires={cutWires} onWireCut={onWireCut} running={active} />
      <div className="status-bar">
        <div className="status-text">{statusMessage}</div>
      </div>
    </div>
  );
}
