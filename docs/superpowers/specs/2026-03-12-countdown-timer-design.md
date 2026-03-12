# Second Activity: Countdown Timer + Menu System

## Summary

Add a menu system as the app's entry point and a new "Countdown Timer" activity alongside the existing wire defusal puzzle. The menu allows escape room staff to select which activity to run. The timer is a 90-second countdown with spacebar start/pause/unpause, millisecond precision display, and a buzzer when time expires.

## Menu System

- New `MENU` state becomes the default entry point (replaces wire defusal idle screen as the landing page)
- Displays title and two activity buttons styled in the existing dark/neon theme
- Activities: "Wire Defusal" and "Countdown Timer"
- Each activity manages its own internal states independently
- A small "MENU" button in the top-left corner of every activity screen returns to the menu

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
   - "RESET" button appears to return to Waiting state for quick re-runs

### Audio

- Buzzer on timer expiry: synthesized via Web Audio API (low-frequency sawtooth, ~1 second duration)
- No other sounds for this activity

### Corner Button

- Small "MENU" text in top-left corner on all states
- Returns to the menu screen

## File Structure

| File | Purpose |
|------|---------|
| `js/menu.js` | Menu screen rendering and activity selection |
| `js/timer.js` | Countdown timer activity (states, spacebar handling, buzzer) |
| `js/game.js` | Refactored to be launched from menu (internal logic unchanged) |
| `index.html` | New script tags, menu HTML section, timer HTML section |
| `css/style.css` | Menu and timer styles, consistent with existing theme |

## Visual Style

- Same dark metal panel background, scanline overlay, neon colors
- LED-style timer font with tabular-nums (existing)
- Red pulsing effect under 30 seconds (existing pattern)
- Consistent with wire defusal aesthetic throughout

## Architecture

- Menu is the new entry point; each activity is a self-contained module
- Activities communicate with menu only via show/hide — no tight coupling
- Adding future activities requires only a new JS file, HTML section, and menu button
