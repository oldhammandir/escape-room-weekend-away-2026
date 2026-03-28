import { useState, useRef, useCallback, useEffect } from 'react';
import { PegNode, RopeEdge, countCrossings } from '../lib/knotPuzzleEngine';

interface KnotGameBoardProps {
  initialNodes: PegNode[];
  edges: RopeEdge[];
  onSolved: () => void;
}

const BOARD_SIZE = 600;

export default function KnotGameBoard({ initialNodes, edges, onSolved }: KnotGameBoardProps) {
  const [nodes, setNodes] = useState<PegNode[]>(initialNodes);
  const [dragging, setDragging] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setSolved(false);
  }, [initialNodes]);

  const crossedEdges = countCrossings(nodes, edges);
  const crossingCount = crossedEdges.size;

  useEffect(() => {
    if (crossingCount === 0 && nodes.length > 0 && !solved) {
      setSolved(true);
      setTimeout(onSolved, 300);
    }
  }, [crossingCount, nodes, solved, onSolved]);

  const getPointerPos = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, id: number) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(id);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging === null) return;
    const pos = getPointerPos(e);
    const clamped = {
      x: Math.max(30, Math.min(BOARD_SIZE - 30, pos.x)),
      y: Math.max(30, Math.min(BOARD_SIZE - 30, pos.y)),
    };
    setNodes(prev => prev.map(n => n.id === dragging ? { ...n, ...clamped } : n));
  }, [dragging, getPointerPos]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="knot-board">
      <div className="knot-board-corner tl" />
      <div className="knot-board-corner tr" />
      <div className="knot-board-corner bl" />
      <div className="knot-board-corner br" />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Grid pattern */}
        <defs>
          <pattern id="knot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="url(#knot-grid)" opacity="0.4" />

        {/* Wire lines */}
        {edges.map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from);
          const to = nodes.find(n => n.id === edge.to);
          if (!from || !to) return null;
          const isCrossed = crossedEdges.has(`${i}`);
          return (
            <line
              key={`edge-${i}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={solved ? '#33ff88' : isCrossed ? '#ff3333' : '#33ff88'}
              strokeWidth={isCrossed ? 3 : 2}
              opacity={isCrossed ? 0.9 : 0.5}
            />
          );
        })}

        {/* Peg nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            onPointerDown={e => handlePointerDown(e, node.id)}
            style={{ cursor: 'grab' }}
          >
            {/* Glow */}
            <circle
              cx={node.x} cy={node.y} r={18}
              fill={node.color}
              opacity={0.15}
              style={{ filter: 'blur(6px)' }}
            />
            {/* Outer ring */}
            <circle
              cx={node.x} cy={node.y} r={12}
              fill="#0a0a0a"
              stroke={node.color}
              strokeWidth={2}
            />
            {/* Inner peg */}
            <circle
              cx={node.x} cy={node.y} r={8}
              fill={node.color}
            />
            {/* Highlight */}
            <circle
              cx={node.x - 2} cy={node.y - 2} r={3}
              fill="white"
              opacity={0.2}
            />
          </g>
        ))}

        {/* Solved overlay */}
        {solved && (
          <text
            x={BOARD_SIZE / 2} y={BOARD_SIZE / 2}
            textAnchor="middle" dominantBaseline="central"
            fill="#33ff88"
            fontSize="36"
            fontWeight="bold"
            fontFamily="'Share Tech Mono', monospace"
            letterSpacing="0.15em"
            style={{ filter: 'drop-shadow(0 0 15px rgba(51, 255, 136, 0.5))' }}
          >
            SECTOR CLEAR
          </text>
        )}
      </svg>
    </div>
  );
}
