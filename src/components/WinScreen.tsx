import '../styles/results.css';

interface WinScreenProps {
  active: boolean;
  onClick: () => void;
}

export default function WinScreen({ active, onClick }: WinScreenProps) {
  return (
    <div className={`screen win-screen${active ? ' active' : ''}`} onClick={active ? onClick : undefined}>
      <div className="result-content">
        <div className="result-icon">&#10003;</div>
        <div className="result-title">BOMB DEFUSED</div>
        <div className="result-subtitle">SYSTEM NEUTRALIZED</div>
      </div>
    </div>
  );
}
