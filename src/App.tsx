import { useState, useRef, useCallback } from 'react';
import MenuScreen from './components/MenuScreen';
import IdleScreen from './components/IdleScreen';
import WinScreen from './components/WinScreen';
import LoseScreen from './components/LoseScreen';
import WireDefusalGame from './components/WireDefusalGame';

type Screen = 'menu' | 'idle' | 'wire-defusal' | 'countdown' | 'win' | 'lose';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const containerRef = useRef<HTMLDivElement>(null);

  const flashScreen = useCallback((color: 'red' | 'white') => {
    const flash = containerRef.current?.querySelector('.screen-flash');
    if (!flash) return;
    flash.className = `screen-flash ${color}`;
    setTimeout(() => {
      flash.classList.add('fade-out');
      setTimeout(() => {
        flash.className = 'screen-flash';
      }, 500);
    }, 150);
  }, []);

  const shakeScreen = useCallback((heavy = false) => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove('shaking', 'shaking-heavy');
    void el.offsetWidth;
    el.classList.add(heavy ? 'shaking-heavy' : 'shaking');
    setTimeout(() => {
      el.classList.remove('shaking', 'shaking-heavy');
    }, heavy ? 800 : 400);
  }, []);

  const handleMenuSelect = useCallback((selected: 'idle' | 'countdown') => {
    setScreen(selected);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleIdleStart = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
    setScreen('wire-defusal');
  }, []);

  return (
    <div id="game-container" ref={containerRef}>
      <MenuScreen active={screen === 'menu'} onSelect={handleMenuSelect} />
      <IdleScreen active={screen === 'idle'} onStart={handleIdleStart} />
      <WireDefusalGame
        active={screen === 'wire-defusal'}
        onWin={() => setScreen('win')}
        onLose={() => setScreen('lose')}
        flashScreen={flashScreen}
        shakeScreen={shakeScreen}
      />
      <WinScreen active={screen === 'win'} onClick={handleReturnToMenu} />
      <LoseScreen active={screen === 'lose'} onClick={handleReturnToMenu} />

      {screen !== 'menu' && (
        <button className="corner-menu-btn" onClick={handleReturnToMenu}>
          &#9666; MENU
        </button>
      )}

      <div className="scanlines" />
      <div className="screen-flash" />
    </div>
  );
}
