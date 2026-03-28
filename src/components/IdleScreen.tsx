interface IdleScreenProps {
  active: boolean;
  onStart: () => void;
}

export default function IdleScreen({ active, onStart }: IdleScreenProps) {
  return (
    <div className={`screen${active ? ' active' : ''}`} onClick={active ? onStart : undefined}>
      <div className="idle-content">
        <div className="idle-title">WIRE DEFUSAL SYSTEM</div>
        <div className="idle-subtitle">AUTHORIZED PERSONNEL ONLY</div>
        <div className="idle-prompt">[ CLICK TO INITIATE ]</div>
      </div>
    </div>
  );
}
