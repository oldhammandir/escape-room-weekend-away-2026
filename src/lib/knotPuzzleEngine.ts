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
