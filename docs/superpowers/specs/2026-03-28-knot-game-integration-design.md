# Knot Game Integration Design

## Overview

Integrate the "Wire Override" knot mastery game as the first phase of the escape room's sequential game flow. The player must complete the knot untangling puzzles before proceeding to wire defusal and code entry. A single shared timer runs across all phases.

## Game Flow

```
Menu → Idle → [Timer starts] → KnotGame (7 sectors + passcode 1947) → WireDefusal (cut correct wire) → CodeEntry (code 1977) → Win
                                              ↓ (timeout at any point)
                                             Lose
```

The countdown timer activity remains a separate menu option, unchanged.

## Phases

### Phase 1: Knot Game (Wire Override)

- Player untangles graph puzzles across 7 sectors of increasing difficulty
- Each sector presents colored nodes connected by wires on an SVG canvas
- Player drags nodes to eliminate all wire crossings
- After clearing all 7 sectors, player enters override passcode: **1947**
- Wrong passcode attempts apply a **5-second penalty** to the shared timer

### Phase 2: Wire Defusal

- Existing wire cutting gameplay, unchanged
- Player identifies and cuts the correct wire (wire #3)
- Wrong wire cuts apply a **20-second penalty**

### Phase 3: Code Entry

- Existing code entry gameplay, unchanged
- Player enters code **1977**
- Wrong code attempts apply a **10-second penalty**

## Timer

- Single shared timer starts when Phase 1 begins
- Runs continuously through all 3 phases
- Default duration: **900 seconds (15 minutes)** — configurable in `config.ts`
- Reaching zero at any phase triggers the Lose screen
- Penalty deductions from any phase affect the same timer

## Files to Create

### `src/lib/knotPuzzleEngine.ts`
Port of `puzzleEngine.ts` from the knot mastery repo. Pure logic — no UI dependencies. Contains:
- `generatePuzzle(nodeCount, extraEdges)` — generates node positions and edges
- `countCrossings(nodes, edges)` — counts intersecting wire pairs
- `ccw()` / `intersects()` — geometry helpers for crossing detection
- Difficulty progression config for 7 sectors

### `src/components/KnotGameBoard.tsx`
SVG-based game board for the knot puzzles. Ported from `GameBoard.tsx`, restyled with plain CSS to match the escape room's CRT/hacker aesthetic. Features:
- 600x600 SVG canvas with draggable nodes
- Wire rendering with crossing detection (red for crossing, green for clear)
- "SECTOR CLEAR" overlay when puzzle is solved
- Sector counter, difficulty indicator, crossing count display

### `src/components/KnotPasscodeEntry.tsx`
4-digit passcode entry screen shown after completing all 7 sectors. Correct code: 1947. Wrong attempts trigger shake animation and 5-second timer penalty.

### `src/components/KnotGame.tsx`
Orchestrator component for Phase 1. Manages:
- Current sector progression (1-7)
- Transition between puzzle board and passcode entry
- Receives `timeLeft`, `applyPenalty`, and `onComplete` as props

### `src/styles/knot-game.css`
Styles for all knot game components, matching the existing CRT/hacker aesthetic (scanlines, monospace fonts, glow effects, dark background).

## Files to Modify

### `src/config.ts`
Add knot game configuration:
- `knotTimerSeconds: 900` (total time for all phases combined, replaces current `timerSeconds: 480`)
- `knotSectorCount: 7`
- `knotPasscode: '1947'`
- `knotPenaltySeconds: 5`
- `knotNodeCount: 10`
- Difficulty settings per sector (extra edge counts)

### `src/components/WireDefusalGame.tsx`
Add `'knot'` as the initial phase before `'wires'`:
- Phase order: `'knot'` → `'wires'` → `'code'`
- Timer starts at the beginning of knot phase
- When knot game calls `onComplete`, transition to `'wires'` phase
- Pass shared timer state to KnotGame component

### `src/App.tsx`
No structural changes needed — WireDefusalGame already manages sub-phases.

## What Stays Unchanged

- `MenuScreen.tsx` — activity selection (wire defusal vs countdown)
- `IdleScreen.tsx` — pre-game screen with fullscreen trigger
- `WireDefusalScreen.tsx` — wire cutting UI
- `WireCanvas.tsx` — canvas wire rendering
- `CodeEntryScreen.tsx` — final code entry
- `WinScreen.tsx` / `LoseScreen.tsx` — result screens
- `CountdownScreen.tsx` — separate countdown activity
- `useCountdown.ts` — countdown timer hook
- `useAudio.ts` / `AudioManager.ts` — audio system
- `WireRenderer.ts` — canvas wire rendering

## Visual Design

All knot game components use the existing escape room visual language:
- Dark background with CRT scanline overlay
- Monospace font (inherit from existing global styles)
- Green/red accent colors for clear/crossing wires
- Glow effects on nodes and solved states
- Screen shake on wrong passcode
- Red flash on penalties
- Consistent with existing `wire-defusal.css` and `code-entry.css` patterns

## Source Reference

Knot mastery game source: `~/Documents/personal/remix-of-knot-mastery/src/`
- `lib/puzzleEngine.ts` — puzzle generation logic to port
- `components/GameBoard.tsx` — SVG board UI to port and restyle
- `components/PasscodeEntry.tsx` — passcode UI to port and restyle
