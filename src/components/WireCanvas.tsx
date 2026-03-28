import { useEffect, useRef } from 'react';
import { WireRenderer } from '../lib/WireRenderer';
import '../styles/wire-defusal.css';

interface WireCanvasProps {
  cutWires: Set<number>;
  onWireCut: (index: number) => void;
  running: boolean;
}

export default function WireCanvas({ cutWires, onWireCut, running }: WireCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WireRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new WireRenderer(canvasRef.current);
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setOnWireCut(onWireCut);
  }, [onWireCut]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setCutWires(cutWires);
  }, [cutWires]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (running) {
      renderer.start();
    } else {
      renderer.stop();
    }
  }, [running]);

  return <canvas ref={canvasRef} className="wire-canvas" />;
}
