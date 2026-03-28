import '../styles/menu.css';

type Screen = 'idle' | 'countdown';

interface MenuScreenProps {
  active: boolean;
  onSelect: (screen: Screen) => void;
}

export default function MenuScreen({ active, onSelect }: MenuScreenProps) {
  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div className="menu-content">
        <div className="menu-title">ESCAPE ROOM</div>
        <div className="menu-subtitle">SELECT ACTIVITY</div>
        <div className="menu-buttons">
          <button className="menu-btn" onClick={() => onSelect('idle')}>
            <span className="menu-btn-icon">&#9889;</span>
            <span className="menu-btn-label">WIRE DEFUSAL</span>
          </button>
          <button className="menu-btn" onClick={() => onSelect('countdown')}>
            <span className="menu-btn-icon">&#9201;</span>
            <span className="menu-btn-label">COUNTDOWN TIMER</span>
          </button>
        </div>
      </div>
    </div>
  );
}
