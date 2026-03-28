import '../styles/results.css';

interface LoseScreenProps {
  active: boolean;
  onClick: () => void;
}

export default function LoseScreen({ active, onClick }: LoseScreenProps) {
  return (
    <div className={`screen lose-screen${active ? ' active' : ''}`} onClick={active ? onClick : undefined}>
      <div className="result-content">
        <div className="result-icon">&#10007;</div>
        <div className="result-title">DETONATION</div>
        <div className="result-subtitle">DEFUSAL FAILED</div>
      </div>
    </div>
  );
}
