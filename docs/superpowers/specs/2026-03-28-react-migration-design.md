# React Migration Design Spec

## Overview

Migrate the escape room prop app from vanilla JS to a Vite + React + TypeScript SPA. The app is a kiosk-style display for an in-person escape room with two activities: Wire Defusal and Countdown Timer.

### Goals

- Fix wire cut state being lost on window resize
- Fix wire cutting not working on some devices (hit detection / input handling)
- Fix text overlapping on smaller screens
- Improve maintainability with React component architecture
- Deploy as static files via GitHub Pages

### Non-Goals

- No routing library (kiosk app, no URL navigation needed)
- No global state library (useState sufficient for 2 activities)
- No new features — this is a migration + bug fix

## Architecture

### Tech Stack

- **Vite** — build tool, dev server with HMR
- **React 18** — UI framework
- **TypeScript** — type safety
- **CSS** — split per-component, no CSS-in-JS (keeps existing aesthetic)

### Project Structure

```
escape-room-oldham/
├── index.html              ← Vite entry point
├── vite.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── main.tsx             ← React entry
    ├── App.tsx              ← Screen switcher + activeScreen state
    ├── config.ts            ← CONFIG object (same values)
    ├── styles/
    │   ├── global.css       ← Reset, container, scanlines, flash, shake
    │   ├── menu.css
    │   ├── wire-defusal.css
    │   ├── code-entry.css
    │   ├── countdown.css
    │   └── results.css
    ├── components/
    │   ├── MenuScreen.tsx
    │   ├── IdleScreen.tsx
    │   ├── WireDefusalScreen.tsx
    │   ├── WireCanvas.tsx   ← Wraps canvas renderer via useRef
    │   ├── CodeEntryScreen.tsx
    │   ├── CountdownScreen.tsx
    │   ├── WinScreen.tsx
    │   └── LoseScreen.tsx
    ├── hooks/
    │   ├── useTimer.ts      ← Shared countdown logic
    │   └── useAudio.ts      ← AudioManager wrapper
    └── lib/
        ├── WireRenderer.ts  ← Canvas class (preserved from vanilla)
        └── AudioManager.ts  ← Audio class (preserved from vanilla)
```

### Component Hierarchy

```
<App>                           — manages activeScreen state
├── <MenuScreen />
├── <IdleScreen />
├── <WireDefusalGame>           — owns cutWires, timer (wraps both screens below)
│   ├── <WireDefusalScreen>     — wire cutting UI
│   │   ├── <TimerDisplay />
│   │   ├── <WireCanvas />      — useRef to canvas + WireRenderer
│   │   └── <StatusBar />
│   └── <CodeEntryScreen>       — code input UI
│       ├── <TimerDisplay />
│       ├── <CodeDisplay />
│       └── <Keypad />
├── <CountdownScreen />         — independent timer
├── <WinScreen />
└── <LoseScreen />

Overlays (always rendered):
├── <Scanlines />
└── <ScreenFlash />
```

## State Management

### App-Level State

```typescript
activeScreen: 'menu' | 'idle' | 'wire-defusal' | 'code-entry'
             | 'countdown' | 'win' | 'lose'
```

This is the only app-level state. Each activity manages its own state internally.

### Wire Defusal Game State

A `WireDefusalGame` wrapper component owns state shared between the wire and code entry screens:

```typescript
// Owned by WireDefusalGame
cutWires: Set<number>       // which wires have been cut
timeRemaining: number       // seconds left (shared with code entry)
gamePhase: 'wires' | 'code' // which sub-screen is active

// Owned by CodeEntryScreen
codeEntry: string           // digits entered so far
```

### useTimer Hook

```typescript
const { timeRemaining, applyPenalty, stop } = useTimer({
  initialSeconds: CONFIG.timerSeconds,
  onExpire: () => setScreen('lose')
});
```

The timer is owned by `WireDefusalGame` so it survives the wire → code screen transition. Both sub-screens receive `timeRemaining` as a prop and `applyPenalty` as a callback.

### Countdown Timer State

Independent from wire defusal. Owns its own state:

```typescript
state: 'waiting' | 'running' | 'stopped' | 'finished'
remainingMs: number
```

## Bug Fixes

### 1. Wire State Lost on Resize

**Root cause:** `WireRenderer.resize()` calls `generateWires()` which creates a new wire array with all `cut: false`. Cut state is stored on the wire objects themselves.

**Fix:** Cut state (`Set<number>`) lives in React state, separate from the renderer. On resize, `WireRenderer` regenerates wire positions but reads cut state from the passed-in set. React state is not affected by canvas resize.

### 2. Wire Cutting Not Working on Some Devices

**Root cause:** Multiple issues:
- Hit detection uses a fixed 15px threshold that doesn't scale with screen size
- Mouse coordinates may not account for devicePixelRatio in hit testing
- Touch handling only uses `touchstart`, no feedback

**Fixes:**
- Hit detection threshold scales relative to canvas height: `Math.max(15, height * 0.025)`
- All input coordinates normalized against canvas logical size (not physical pixels)
- Add `touchend` for reliable detection
- Wire thickness scales with viewport
- Minimum wire spacing enforced on small screens

### 3. Text Overlapping on Small Screens

**Fixes:**
- CSS media queries at breakpoints: 480px and 768px (both height and width)
- Timer display: reduced top margin on short screens
- Status bar: reduced bottom margin, smaller font on narrow screens
- Code entry keypad: tighter grid gap, smaller buttons on compact viewports
- Menu buttons: reduce min-width on narrow screens
- Expand use of `clamp()` for fluid sizing

## Side Effects Strategy

### Screen Flash & Shake

Triggered via CSS classes on the game container, same as current implementation. Managed via `useRef` + `setTimeout` — not React state — to avoid unnecessary re-renders for visual-only effects.

### Audio

`AudioManager` class stays unchanged. Exposed via `useAudio()` hook that creates a single instance (via `useRef`) and returns it. Components call `audio.playSnip()` etc. directly.

### Fullscreen

Requested on idle screen click, same as current.

### Canvas Animation

`WireRenderer` runs its own `requestAnimationFrame` loop. React does not manage the animation — it mounts/unmounts the canvas component and passes state (cutWires set) in. The renderer reads this state each frame.

## Deployment

- `npm run build` outputs static files to `dist/`
- GitHub Pages serves `dist/` directly
- Can be automated with a GitHub Action on push to main

## Migration Strategy

The old vanilla JS files (`js/`, `css/`, root `index.html`) will be replaced entirely. This is a full rewrite into the `src/` directory, not an incremental migration. The existing canvas rendering and audio logic are preserved as classes in `src/lib/` with minimal changes (TypeScript types added, hit detection fixes applied).
