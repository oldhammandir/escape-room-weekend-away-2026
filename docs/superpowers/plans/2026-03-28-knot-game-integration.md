# Knot Game Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Wire Override knot puzzle game as Phase 1 before the existing wire defusal, with a single shared timer across all phases.

**Architecture:** The `WireDefusalGame` component gains a `'knot'` phase before `'wires'`. New components `KnotGame`, `KnotGameBoard`, and `KnotPasscodeEntry` are added with plain CSS styling. The puzzle engine is ported as pure logic. The existing `useTimer` hook drives all phases.

**Tech Stack:** React 19, TypeScript, plain CSS, SVG for game board

---

## File Structure

### New Files
- `src/lib/knotPuzzleEngine.ts` — Pure logic: puzzle generation, crossing detection, level configs
- `src/components/KnotGame.tsx` — Phase 1 orchestrator: sector progression + passcode entry
- `src/components/KnotGameBoard.tsx` — SVG board with draggable nodes and wire rendering
- `src/components/KnotPasscodeEntry.tsx` — 4-digit passcode entry (code: 1947)
- `src/styles/knot-game.css` — All knot game styles matching CRT/hacker aesthetic

### Modified Files
- `src/config.ts` — Add knot game config, increase timer to 900s
- `src/components/WireDefusalGame.tsx` — Add `'knot'` phase, pass timer to KnotGame

---

### Task 1: Port Puzzle Engine

**Files:**
- Create: `src/lib/knotPuzzleEngine.ts`

- [ ] **Step 1: Create the puzzle engine**

This is a direct port of the pure logic from the knot mastery repo. The only change is replacing CSS variable color references with hex colors that match the escape room palette.

```typescript
// src/lib/knotPuzzleEngine.ts

export interface PegNode {
  id: number;
  x: number;
  y: number;
  color: string;
}

export interface RopeEdge {
  from: number;
  to: number;
}

function ccw(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

export function segmentsIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const d1 = ccw(x3, y3, x4, y4, x1, y1);
  const d2 = ccw(x3, y3, x4, y4, x2, y2);
  const d3 = ccw(x1, y1, x2, y2, x3, y3);
  const d4 = ccw(x1, y1, x2, y2, x4, y4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function findNode(nodes: PegNode[], id: number): PegNode | undefined {
  return nodes.find(n => n.id === id);
}

export function countCrossings(nodes: PegNode[], edges: RopeEdge[]): Set<string> {
  const crossedEdges = new Set<string>();
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i];
      const b = edges[j];
      if (a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to) continue;
      const n1 = findNode(nodes, a.from), n2 = findNode(nodes, a.to);
      const n3 = findNode(nodes, b.from), n4 = findNode(nodes, b.to);
      if (!n1 || !n2 || !n3 || !n4) continue;
      if (segmentsIntersect(n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y)) {
        crossedEdges.add(`${i}`);
        crossedEdges.add(`${j}`);
      }
    }
  }
  return crossedEdges;
}

export function countCrossingPairs(nodes: PegNode[], edges: RopeEdge[]): number {
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i];
      const b = edges[j];
      if (a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to) continue;
      const n1 = findNode(nodes, a.from), n2 = findNode(nodes, a.to);
      const n3 = findNode(nodes, b.from), n4 = findNode(nodes, b.to);
      if (!n1 || !n2 || !n3 || !n4) continue;
      if (segmentsIntersect(n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y)) {
        count++;
      }
    }
  }
  return count;
}

const PEG_COLORS = [
  '#ff3333', '#3388ff', '#33ff88', '#ffdd33',
  '#cc44ff', '#ff8833', '#33ddff', '#ff66aa',
];

export interface LevelConfig {
  nodeCount: number;
  maxExtraEdges: number;
  difficulty: string;
  name: string;
}

export const TOTAL_SECTORS = 7;

export function getLevelConfig(level: number): LevelConfig {
  const levels: LevelConfig[] = [
    { nodeCount: 10, maxExtraEdges: 15, difficulty: 'Easy', name: 'Sector 1' },
    { nodeCount: 10, maxExtraEdges: 15, difficulty: 'Easy', name: 'Sector 2' },
    { nodeCount: 10, maxExtraEdges: 16, difficulty: 'Medium', name: 'Sector 3' },
    { nodeCount: 10, maxExtraEdges: 16, difficulty: 'Medium', name: 'Sector 4' },
    { nodeCount: 10, maxExtraEdges: 17, difficulty: 'Hard', name: 'Sector 5' },
    { nodeCount: 10, maxExtraEdges: 17, difficulty: 'Hard', name: 'Sector 6' },
    { nodeCount: 10, maxExtraEdges: 18, difficulty: 'Critical', name: 'Sector 7' },
  ];
  if (level < levels.length) return levels[level];
  return levels[levels.length - 1];
}

function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function generateLevel(level: number): { nodes: PegNode[]; edges: RopeEdge[] } {
  const config = getLevelConfig(level);
  const { nodeCount, maxExtraEdges } = config;

  const cx = 300, cy = 300, r = 220;
  const solvedNodes: PegNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
    solvedNodes.push({
      id: i,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      color: PEG_COLORS[i % PEG_COLORS.length],
    });
  }

  const edges: RopeEdge[] = [];
  for (let i = 0; i < nodeCount; i++) {
    edges.push({ from: i, to: (i + 1) % nodeCount });
  }

  const possibleExtras: RopeEdge[] = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (!(i === 0 && j === nodeCount - 1)) {
        possibleExtras.push({ from: i, to: j });
      }
    }
  }
  shuffleArray(possibleExtras);
  let added = 0;
  for (const e of possibleExtras) {
    if (added >= maxExtraEdges) break;
    edges.push(e);
    if (countCrossings(solvedNodes, edges).size > 0) {
      edges.pop();
    } else {
      added++;
    }
  }

  const scrambledNodes = solvedNodes.map(n => ({ ...n }));
  const margin = 50;
  const range = 600 - margin * 2;
  const TARGET_CROSSINGS = 30;

  let bestScramble = scrambledNodes.map(n => ({ ...n }));
  let bestCrossings = 0;

  for (let attempt = 0; attempt < 200; attempt++) {
    if (attempt % 3 === 0) {
      const clusters = 2 + Math.floor(Math.random() * 3);
      const clusterCenters = Array.from({ length: clusters }, () => ({
        x: margin + Math.random() * range,
        y: margin + Math.random() * range,
      }));
      for (const n of scrambledNodes) {
        const c = clusterCenters[Math.floor(Math.random() * clusters)];
        n.x = Math.max(margin, Math.min(600 - margin, c.x + (Math.random() - 0.5) * 120));
        n.y = Math.max(margin, Math.min(600 - margin, c.y + (Math.random() - 0.5) * 120));
      }
    } else if (attempt % 3 === 1) {
      const angle = Math.random() * Math.PI;
      for (let i = 0; i < scrambledNodes.length; i++) {
        const t = (i / scrambledNodes.length) * range;
        scrambledNodes[i].x = Math.max(margin, Math.min(600 - margin, margin + t * Math.cos(angle) + (Math.random() - 0.5) * 80));
        scrambledNodes[i].y = Math.max(margin, Math.min(600 - margin, 300 + t * Math.sin(angle) + (Math.random() - 0.5) * 80));
      }
    } else {
      for (const n of scrambledNodes) {
        n.x = margin + Math.random() * range;
        n.y = margin + Math.random() * range;
      }
    }

    const crossings = countCrossingPairs(scrambledNodes, edges);
    if (crossings > bestCrossings) {
      bestCrossings = crossings;
      bestScramble = scrambledNodes.map(n => ({ ...n }));
      if (crossings >= TARGET_CROSSINGS) break;
    }
  }

  for (let i = 0; i < scrambledNodes.length; i++) {
    scrambledNodes[i].x = bestScramble[i].x;
    scrambledNodes[i].y = bestScramble[i].y;
  }

  return { nodes: scrambledNodes, edges };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/pritamsangani/Documents/personal/escape-room-oldham && npx tsc --noEmit src/lib/knotPuzzleEngine.ts 2>&1 || echo "Check for errors"`

Expected: No type errors (this is pure logic with no imports)

- [ ] **Step 3: Commit**

```bash
git add src/lib/knotPuzzleEngine.ts
git commit -m "feat: port knot puzzle engine from Wire Override game"
```

---

### Task 2: Add Knot Game Styles

**Files:**
- Create: `src/styles/knot-game.css`

- [ ] **Step 1: Create the CSS file**

Style the knot game components using the same visual language as the existing escape room (Share Tech Mono font, green/red colors, glow effects, dark background).

```css
/* src/styles/knot-game.css */

/* === KNOT GAME SCREEN === */
.knot-game-screen {
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.knot-game-screen .timer-display {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
}

.knot-timer-value {
  font-size: clamp(2rem, 5vw, 3.5rem);
  color: #33ff88;
  text-shadow: 0 0 20px rgba(51, 255, 136, 0.5), 0 0 40px rgba(51, 255, 136, 0.2);
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
}

.knot-timer-value.warning {
  color: #ff3333;
  text-shadow: 0 0 20px rgba(255, 51, 51, 0.5), 0 0 40px rgba(255, 51, 51, 0.2);
  animation: pulse-timer 0.5s ease-in-out infinite;
}

/* === HEADER === */
.knot-header {
  text-align: center;
  z-index: 10;
  padding-top: clamp(4rem, 10vh, 6rem);
}

.knot-title {
  font-size: clamp(1.2rem, 3vw, 2rem);
  color: #ff3333;
  letter-spacing: 0.3em;
  text-shadow: 0 0 15px rgba(255, 51, 51, 0.4);
}

.knot-subtitle {
  font-size: clamp(0.6rem, 1.5vw, 0.8rem);
  color: #666;
  letter-spacing: 0.3em;
  margin-top: 0.3rem;
}

/* === STATS BAR === */
.knot-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
}

.knot-stat {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(102, 102, 102, 0.3);
  padding: 0.3rem 0.7rem;
  font-size: clamp(0.6rem, 1.5vw, 0.75rem);
  letter-spacing: 0.15em;
  color: #888;
}

.knot-stat-value {
  color: #ccc;
  font-weight: bold;
}

.knot-stat-value.danger {
  color: #ff3333;
}

.knot-stat-value.safe {
  color: #33ff88;
}

.knot-stat-difficulty.easy { color: #33ff88; }
.knot-stat-difficulty.medium { color: #ffdd33; }
.knot-stat-difficulty.hard { color: #ff3333; }
.knot-stat-difficulty.critical { color: #ff3333; font-weight: bold; }

/* === GAME BOARD === */
.knot-board {
  position: relative;
  max-width: min(85vw, 500px);
  aspect-ratio: 1;
  margin: 0 auto;
  z-index: 10;
}

.knot-board svg {
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
  cursor: crosshair;
}

.knot-board-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(255, 51, 51, 0.3);
}

.knot-board-corner.tl { top: 0; left: 0; border-top: 2px solid; border-left: 2px solid; }
.knot-board-corner.tr { top: 0; right: 0; border-top: 2px solid; border-right: 2px solid; }
.knot-board-corner.bl { bottom: 0; left: 0; border-bottom: 2px solid; border-left: 2px solid; }
.knot-board-corner.br { bottom: 0; right: 0; border-bottom: 2px solid; border-right: 2px solid; }

/* === CONTROLS === */
.knot-controls {
  display: flex;
  gap: 0.7rem;
  z-index: 10;
  justify-content: center;
}

.knot-btn {
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(0.65rem, 1.5vw, 0.8rem);
  letter-spacing: 0.15em;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(102, 102, 102, 0.3);
  background: rgba(255, 255, 255, 0.03);
  color: #888;
}

.knot-btn:hover {
  color: #ccc;
  border-color: rgba(204, 204, 204, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.knot-btn-next {
  color: #33ff88;
  border-color: rgba(51, 255, 136, 0.3);
  background: rgba(51, 255, 136, 0.05);
  animation: pulse-text 2s ease-in-out infinite;
}

.knot-btn-next:hover {
  background: rgba(51, 255, 136, 0.15);
  border-color: rgba(51, 255, 136, 0.6);
}

/* === SECTOR CLEARED MESSAGE === */
.knot-cleared {
  font-size: clamp(0.7rem, 1.5vw, 0.9rem);
  color: #33ff88;
  letter-spacing: 0.3em;
  text-shadow: 0 0 10px rgba(51, 255, 136, 0.4);
  z-index: 10;
  animation: pulse-text 2s ease-in-out infinite;
}

/* === PASSCODE ENTRY === */
.knot-passcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  z-index: 10;
  max-width: 320px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid rgba(255, 51, 51, 0.2);
  background: rgba(255, 51, 51, 0.03);
}

.knot-passcode-title {
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  color: #ff3333;
  letter-spacing: 0.3em;
  text-shadow: 0 0 10px rgba(255, 51, 51, 0.3);
}

.knot-passcode-hint {
  font-size: clamp(0.6rem, 1.2vw, 0.7rem);
  color: #666;
  letter-spacing: 0.2em;
  text-align: center;
}

.knot-passcode-digits {
  display: flex;
  gap: clamp(0.5rem, 2vw, 1rem);
}

.knot-passcode-digit {
  width: clamp(2.5rem, 7vw, 3.5rem);
  height: clamp(3rem, 8vw, 4rem);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 51, 51, 0.3);
  color: #33ff88;
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  text-align: center;
  outline: none;
  caret-color: #33ff88;
  text-shadow: 0 0 10px rgba(51, 255, 136, 0.4);
}

.knot-passcode-digit:focus {
  border-color: #ff3333;
  box-shadow: 0 0 10px rgba(255, 51, 51, 0.2);
}

.knot-passcode-submit {
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(0.7rem, 1.5vw, 0.85rem);
  letter-spacing: 0.2em;
  padding: 0.6rem 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 51, 51, 0.3);
  background: rgba(255, 51, 51, 0.08);
  color: #ff3333;
  width: 100%;
}

.knot-passcode-submit:hover {
  background: rgba(255, 51, 51, 0.2);
  border-color: rgba(255, 51, 51, 0.6);
}

.knot-passcode-error {
  font-size: clamp(0.6rem, 1.2vw, 0.75rem);
  color: #ff3333;
  letter-spacing: 0.2em;
  animation: pulse-timer 0.5s ease-in-out infinite;
  min-height: 1.2em;
}

@keyframes knot-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.knot-passcode.shaking {
  animation: knot-shake 0.5s ease-in-out;
}

/* === RESPONSIVE === */
@media (max-height: 700px) {
  .knot-header {
    padding-top: clamp(3rem, 8vh, 4.5rem);
  }
  .knot-game-screen {
    gap: 0.5rem;
  }
}

@media (max-height: 480px) {
  .knot-game-screen .timer-display {
    top: 0.5rem;
  }
  .knot-header {
    padding-top: 2.5rem;
  }
  .knot-board {
    max-width: min(70vw, 350px);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/knot-game.css
git commit -m "feat: add knot game CSS styles matching CRT aesthetic"
```

---

### Task 3: Create KnotGameBoard Component

**Files:**
- Create: `src/components/KnotGameBoard.tsx`

- [ ] **Step 1: Create the SVG game board component**

Port the game board from the knot mastery repo, replacing Tailwind classes with the plain CSS classes from `knot-game.css`.

```tsx
// src/components/KnotGameBoard.tsx

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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/pritamsangani/Documents/personal/escape-room-oldham && npx tsc --noEmit 2>&1 | head -20`

Expected: No type errors related to KnotGameBoard

- [ ] **Step 3: Commit**

```bash
git add src/components/KnotGameBoard.tsx
git commit -m "feat: add KnotGameBoard SVG component with drag interaction"
```

---

### Task 4: Create KnotPasscodeEntry Component

**Files:**
- Create: `src/components/KnotPasscodeEntry.tsx`

- [ ] **Step 1: Create the passcode entry component**

4-digit input for the override code (1947). Uses plain HTML inputs styled with knot-game.css. Calls `onWrong` for penalties.

```tsx
// src/components/KnotPasscodeEntry.tsx

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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/pritamsangani/Documents/personal/escape-room-oldham && npx tsc --noEmit 2>&1 | head -20`

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/KnotPasscodeEntry.tsx
git commit -m "feat: add KnotPasscodeEntry component for override code input"
```

---

### Task 5: Create KnotGame Orchestrator Component

**Files:**
- Create: `src/components/KnotGame.tsx`

- [ ] **Step 1: Create the KnotGame orchestrator**

This component manages sector progression and transitions between the puzzle board and passcode entry. It receives the shared timer state as props.

```tsx
// src/components/KnotGame.tsx

import { useState, useCallback } from 'react';
import { CONFIG } from '../config';
import { formatTime } from '../hooks/useTimer';
import { generateLevel, getLevelConfig, countCrossingPairs, TOTAL_SECTORS } from '../lib/knotPuzzleEngine';
import KnotGameBoard from './KnotGameBoard';
import KnotPasscodeEntry from './KnotPasscodeEntry';
import '../styles/knot-game.css';

interface KnotGameProps {
  active: boolean;
  timeRemaining: number;
  applyPenalty: (seconds: number) => void;
  onComplete: () => void;
}

export default function KnotGame({ active, timeRemaining, applyPenalty, onComplete }: KnotGameProps) {
  const [level, setLevel] = useState(0);
  const [puzzle, setPuzzle] = useState(() => generateLevel(0));
  const [showWin, setShowWin] = useState(false);
  const [phase, setPhase] = useState<'playing' | 'passcode'>('playing');

  const config = getLevelConfig(level);
  const crossings = countCrossingPairs(puzzle.nodes, puzzle.edges);

  const resetLevel = useCallback(() => {
    setPuzzle(generateLevel(level));
    setShowWin(false);
  }, [level]);

  const nextLevel = useCallback(() => {
    const next = level + 1;
    if (next >= TOTAL_SECTORS) {
      setPhase('passcode');
      return;
    }
    setLevel(next);
    setPuzzle(generateLevel(next));
    setShowWin(false);
  }, [level]);

  const onSolved = useCallback(() => {
    setShowWin(true);
  }, []);

  const handlePasscodeCorrect = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handlePasscodeWrong = useCallback(() => {
    applyPenalty(CONFIG.knotPenaltySeconds);
  }, [applyPenalty]);

  const difficultyClass =
    config.difficulty === 'Easy' ? 'easy' :
    config.difficulty === 'Medium' ? 'medium' :
    config.difficulty === 'Hard' ? 'hard' : 'critical';

  if (!active) return null;

  return (
    <div className={`screen${active ? ' active' : ''} knot-game-screen`}>
      {/* Timer */}
      <div className="timer-display">
        <div className="timer-label">TIME REMAINING</div>
        <div className={`knot-timer-value${timeRemaining <= 30 ? ' warning' : ''}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Header */}
      <div className="knot-header">
        <div className="knot-title">WIRE OVERRIDE</div>
        <div className="knot-subtitle">REROUTE THE CIRCUITS — ELIMINATE ALL CROSSINGS</div>
      </div>

      {phase === 'passcode' ? (
        <KnotPasscodeEntry
          correctCode={CONFIG.knotPasscode}
          onCorrect={handlePasscodeCorrect}
          onWrong={handlePasscodeWrong}
        />
      ) : (
        <>
          {/* Stats bar */}
          <div className="knot-stats">
            <div className="knot-stat">
              SECTOR <span className="knot-stat-value">{level + 1}/{TOTAL_SECTORS}</span>
            </div>
            <div className={`knot-stat knot-stat-difficulty ${difficultyClass}`}>
              {config.difficulty.toUpperCase()}
            </div>
            <div className="knot-stat">
              FAULTS <span className={`knot-stat-value ${crossings > 0 ? 'danger' : 'safe'}`}>
                {crossings}
              </span>
            </div>
            <div className="knot-stat">
              NODES <span className="knot-stat-value">{config.nodeCount}</span>
            </div>
          </div>

          {/* Game board */}
          <KnotGameBoard
            initialNodes={puzzle.nodes}
            edges={puzzle.edges}
            onSolved={onSolved}
          />

          {/* Controls */}
          <div className="knot-controls">
            <button className="knot-btn" onClick={resetLevel}>
              SCRAMBLE
            </button>
            {showWin && (
              <button className="knot-btn knot-btn-next" onClick={nextLevel}>
                {level + 1 >= TOTAL_SECTORS ? 'ENTER OVERRIDE CODE' : 'NEXT SECTOR'}
              </button>
            )}
          </div>

          {/* Win message */}
          {showWin && (
            <div className="knot-cleared">SECTOR CLEARED</div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

This will fail because `CONFIG.knotPasscode` and `CONFIG.knotPenaltySeconds` don't exist yet. That's expected — we'll add them in the next task.

- [ ] **Step 3: Commit**

```bash
git add src/components/KnotGame.tsx
git commit -m "feat: add KnotGame orchestrator for sector progression"
```

---

### Task 6: Update Config and WireDefusalGame

**Files:**
- Modify: `src/config.ts`
- Modify: `src/components/WireDefusalGame.tsx`

- [ ] **Step 1: Update config.ts**

Add knot game settings and increase the total timer.

In `src/config.ts`, replace the entire file:

```typescript
export const CONFIG = {
  timerSeconds: 900,
  penaltySeconds: 20,
  codePenaltySeconds: 10,
  correctCode: '1977',
  wireCount: 5,
  correctWire: 3,
  wireColors: ['#ff3333', '#3388ff', '#33ff88', '#ffdd33', '#ffffff'],
  wireLabels: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'WHITE'],
  countdownSeconds: 90,
  knotPasscode: '1947',
  knotPenaltySeconds: 5,
} as const;
```

- [ ] **Step 2: Update WireDefusalGame.tsx**

Add `'knot'` as the initial phase. The timer starts immediately. When the knot game completes, transition to `'wires'` phase and start the alarm.

Replace the entire `src/components/WireDefusalGame.tsx`:

```tsx
import { useState, useCallback, useRef } from 'react';
import { CONFIG } from '../config';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import KnotGame from './KnotGame';
import WireDefusalScreen from './WireDefusalScreen';
import CodeEntryScreen from './CodeEntryScreen';

interface WireDefusalGameProps {
  active: boolean;
  onWin: () => void;
  onLose: () => void;
  flashScreen: (color: 'red' | 'white') => void;
  shakeScreen: (heavy?: boolean) => void;
}

export default function WireDefusalGame({
  active,
  onWin,
  onLose,
  flashScreen,
  shakeScreen,
}: WireDefusalGameProps) {
  const [phase, setPhase] = useState<'knot' | 'wires' | 'code'>('knot');
  const [cutWires, setCutWires] = useState<Set<number>>(new Set());
  const [statusMessage, setStatusMessage] = useState('SELECT WIRE TO CUT');
  const audio = useAudio();
  const alarmStartedRef = useRef(false);

  const { timeRemaining, applyPenalty, reset: resetTimer } = useTimer({
    initialSeconds: CONFIG.timerSeconds,
    running: active,
    onExpire: () => {
      audio.stopAlarm();
      audio.playExplosion();
      flashScreen('white');
      shakeScreen(true);
      setTimeout(() => onLose(), 1500);
    },
  });

  // Start alarm when entering wires phase
  if (active && phase === 'wires' && !alarmStartedRef.current) {
    alarmStartedRef.current = true;
    audio.startAlarm();
  }
  if (!active && alarmStartedRef.current) {
    alarmStartedRef.current = false;
    audio.stopAll();
    setCutWires(new Set());
    setPhase('knot');
    setStatusMessage('SELECT WIRE TO CUT');
    resetTimer();
  }

  const handleKnotComplete = useCallback(() => {
    setPhase('wires');
  }, []);

  const handleWireCut = useCallback((wireIndex: number) => {
    if (cutWires.has(wireIndex)) return;

    const newCutWires = new Set(cutWires);
    newCutWires.add(wireIndex);
    setCutWires(newCutWires);
    audio.playSnip();

    if (wireIndex === CONFIG.correctWire - 1) {
      audio.stopAlarm();
      setTimeout(() => {
        setPhase('code');
      }, 1500);
    } else {
      applyPenalty(CONFIG.penaltySeconds);
      flashScreen('red');
      shakeScreen();
      audio.playZap();
      setStatusMessage(`WRONG WIRE — PENALTY ${CONFIG.penaltySeconds}s`);
      setTimeout(() => {
        setStatusMessage('SELECT WIRE TO CUT');
      }, 2000);
    }
  }, [cutWires, audio, applyPenalty, flashScreen, shakeScreen]);

  const handleCodeCorrect = useCallback(() => {
    audio.playSuccess();
    setTimeout(() => onWin(), 1000);
  }, [audio, onWin]);

  const handleCodePenalty = useCallback(() => {
    applyPenalty(CONFIG.codePenaltySeconds);
    flashScreen('red');
    shakeScreen();
    audio.playZap();
  }, [applyPenalty, flashScreen, shakeScreen, audio]);

  return (
    <>
      <KnotGame
        active={active && phase === 'knot'}
        timeRemaining={timeRemaining}
        applyPenalty={applyPenalty}
        onComplete={handleKnotComplete}
      />
      <WireDefusalScreen
        active={active && phase === 'wires'}
        timeRemaining={timeRemaining}
        cutWires={cutWires}
        statusMessage={statusMessage}
        onWireCut={handleWireCut}
      />
      <CodeEntryScreen
        active={active && phase === 'code'}
        timeRemaining={timeRemaining}
        onCorrect={handleCodeCorrect}
        onPenalty={handleCodePenalty}
      />
    </>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/pritamsangani/Documents/personal/escape-room-oldham && npx tsc --noEmit 2>&1 | head -20`

Expected: No type errors

- [ ] **Step 4: Verify it builds**

Run: `cd /Users/pritamsangani/Documents/personal/escape-room-oldham && npm run build 2>&1 | tail -10`

Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/components/WireDefusalGame.tsx
git commit -m "feat: integrate knot game as Phase 1 with shared timer"
```

---

### Task 7: Manual Smoke Test

- [ ] **Step 1: Start dev server**

Run: `cd /Users/pritamsangani/Documents/personal/escape-room-oldham && npm run dev`

- [ ] **Step 2: Test the full flow**

Open the app in a browser and verify:
1. Menu screen loads with both activities
2. Select "Wire Defusal" → Idle screen → Click to start
3. Knot game appears with timer counting down from 15:00
4. Drag nodes to untangle wires — crossing count decreases
5. "SECTOR CLEAR" appears when all crossings eliminated
6. "NEXT SECTOR" button advances through sectors 1-7
7. After sector 7, passcode entry appears
8. Wrong passcode shows error and deducts 5 seconds
9. Correct passcode (1947) transitions to wire defusal screen
10. Timer continues from where it was (no reset)
11. Wire defusal and code entry work as before
12. Alarm starts only when entering wire defusal phase
13. Menu button returns to menu from any phase

- [ ] **Step 3: Fix any issues found during testing**

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address smoke test findings"
```
