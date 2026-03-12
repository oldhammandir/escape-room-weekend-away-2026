# Second Activity: Countdown Timer + Menu System

## Summary

Add a menu system as the app's entry point and a new "Countdown Timer" activity alongside the existing wire defusal puzzle. The menu allows escape room staff to select which activity to run. The timer is a 90-second countdown with spacebar start/pause/unpause, millisecond precision display, and a buzzer when time expires.

## Menu System

- New `MENU` state becomes the default entry point (replaces wire defusal idle screen as the landing page)
- Displays title (e.g., "ESCAPE ROOM") and two activity buttons styled in the existing dark/neon theme
- Activities: "Wire Defusal" and "Countdown Timer"
- Each activity manages its own internal states independently
- A small "MENU" button in the top-left corner of every activity screen returns to the menu
- Clicking MENU from any activity resets that activity to its initial state and returns to menu
- Page `<title>` updated to something activity-neutral (e.g., "ESCAPE ROOM")

## Countdown Timer Activity

### States

1. **Waiting**
   - Timer displays `1:30.000` (full value, static)
   - Pulsing "PRESS SPACEBAR TO START" message below
   - Neon green text matching existing theme

2. **Running / Paused**
   - Timer counts down with millisecond precision via `requestAnimationFrame`
   - Display format: `M:SS.mmm` (e.g., `1:29.437`)
   - Spacebar toggles pause/unpause
   - When paused: timer freezes, "PAUSED" indicator pulses
   - Under 30 seconds: timer turns red and pulses (matching wire defusal urgency style)

3. **Finished**
   - Timer reads `0:00.000`
   - "TIMES UP!" in large red neon text
   - Buzzer sound plays (synthesized via Web Audio API, harsh low-frequency ~1s)
   - "RESET" button (clickable DOM button) appears to return to Waiting state for quick re-runs
   - Spacebar is ignored in this state (must click RESET)

### Input

- **Spacebar** is the primary input for start/pause/unpause
- **Touch/tap** on the timer area also triggers start/pause/unpause (tablet support — the app already has mobile/tablet meta tags)
- Keyboard listeners are scoped to the active activity only — when wire defusal is active, timer listeners are inactive and vice versa

### Audio

- Buzzer on timer expiry: `playBuzzer()` method added to existing `AudioManager` in `js/audio.js` (low-frequency sawtooth, ~1 second duration)
- No other sounds for this activity

### Rendering

- Pure DOM rendering (no canvas). The timer is text-based — no need for `renderer.js`.

### Corner Button

- Small "MENU" text in top-left corner on all states
- Returns to the menu screen, resetting timer to Waiting state

### Fullscreen

- No fullscreen request for the timer activity (unlike wire defusal). The menu does not request fullscreen either — each activity decides independently.

## File Structure

| File | Purpose |
|------|---------|
| `js/menu.js` | Menu screen rendering and activity selection |
| `js/timer.js` | Countdown timer activity (states, spacebar handling, touch input) |
| `js/game.js` | Refactored: `Game` class still auto-constructs but defers showing idle screen until launched from menu |
| `js/audio.js` | Add `playBuzzer()` method to existing `AudioManager` |
| `index.html` | New script tags, menu HTML section, timer HTML section. Load order: config → audio → renderer → game → timer → menu (menu last, orchestrates others) |
| `css/style.css` | Menu and timer styles, consistent with existing theme |

## Configuration

- Timer duration added to `config.js` as `CONFIG.countdownSeconds = 90` (consistent with existing `CONFIG.timerSeconds` pattern)

## Visual Style

- Same dark metal panel background, scanline overlay, neon colors
- LED-style timer font with tabular-nums (existing)
- Red pulsing effect under 30 seconds (existing pattern)
- Consistent with wire defusal aesthetic throughout

## Architecture

- Menu is the new entry point; each activity is a self-contained module
- `Game` constructor still runs on page load (creates DOM refs, renderer, audio) but does not show idle screen until menu launches it
- Activities communicate with menu only via show/hide and reset — no tight coupling
- Keyboard/touch listeners are scoped per activity (attached on show, removed on hide)
- Adding future activities requires only a new JS file, HTML section, and menu button
