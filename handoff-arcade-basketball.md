> Historical project context. For the current simplified implementation, read [README](README.md) and [the code guide](docs/architecture-review.md).

# Project Handoff: Arcade Mini Basketball Machine

## Context
This is an Embedded Systems course project: a physical arcade-style mini basketball
hoop machine, similar to ones found in arcades. Build order is **software/frontend
first, hardware integration second**.

## Hardware (in progress, not yet built)
- A mini basketball hoop fitted with a sensor (IR break-beam or similar) across the rim.
- An Arduino reads the sensor and detects when a ball passes through.
- The chip-level schematic is already done by the team separately.
- Arduino connects to a laptop over **USB serial**.
- Arduino's only job: detect ball-through-hoop events and send them over serial.
  All game logic, scoring, and timing lives on the laptop side, not on the Arduino.

## Current phase: Software architecture
We have not yet started implementation. Requirements gathered so far:

**Scope:**
- Single hoop, single player only (no networking, no multi-hoop support).
- Local high score tracking only (e.g. top 5 scores in a local file — no database,
  no cloud sync).

**Functional requirements:**
- Real-time score display.
- Countdown timer for timed rounds (e.g. 30–60 sec).
- Game states: idle/attract screen → countdown → active play → game over/high score.
- Debounce logic so a single ball pass isn't double-counted.
- Frontend must tolerate the Arduino disconnecting/reconnecting without crashing.
- Frontend/game logic should be buildable and fully testable **before** the Arduino
  hardware exists — using a simulated/fake sensor input (e.g. keyboard key press
  standing in for a "ball scored" event) — then swapped for real serial input later
  with minimal code changes.

**Arduino → laptop protocol (proposed):**
- Prefer edge-triggered discrete messages (e.g. send `"SCORE\n"` once per made
  basket) over a raw continuous 1/0 stream, since it's far simpler to parse
  reliably and avoids re-triggering on sensor bounce/net movement.
- Baud rate 9600 as a starting point (adjust based on Arduino code once written).

## Not yet decided
- **Frontend tech stack** — options discussed: Python + Pygame, Node.js/Electron
  with a web frontend, or Processing. No final decision made yet. Team has
  moderate (not expert) coding experience — favor simplicity and something the
  team can debug themselves over a "more powerful" but unfamiliar stack.
- Exact sensor type/wiring for the hoop (IR break-beam assumed but not finalized).
- Whether sound effects / visual celebration animations are in scope for v1.

## Open idea (not committed)
Explored using a Kling AI MCP connector (AI video generation) to generate short
celebratory video clips or attract-mode animations for the frontend display, as
an alternative to sourcing stock video assets by hand. Not yet used or tested —
just a possibility if the frontend needs polish later. Not a dependency for
core functionality.

## What's needed next
1. Decide/confirm the frontend tech stack (see options above).
2. Scaffold the project with a clean separation between:
   - Serial listener / input adapter (with a fake/simulated input mode for
     development without hardware)
   - Game state manager (idle/countdown/playing/game over)
   - UI/rendering layer (score, timer, animations)
   - Local high score persistence (simple file-based storage)
3. Build out the "fake sensor" dev mode first so the whole game loop can be
   tested without any hardware present.
4. Once Arduino + mini hoop hardware is ready, write the actual Arduino sketch
   (sensor read → debounce → send `SCORE` over serial) and swap the fake input
   adapter for the real serial listener.

## Constraints to respect
- Keep this buildable by a student team in a single semester — avoid
  over-engineering (no need for a database, cloud services, or multi-device
  networking; local storage and USB serial only).
