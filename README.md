# 🏀 Arcade Hoop Projector

An arcade-style mini basketball machine, built as an Embedded Systems course
project. A React frontend projects a scoreboard, timer, and virtual
backboard/hoop over a physical mini hoop, and reads made-basket events from
an Arduino over USB serial — or from a keyboard, while the hardware isn't
built yet.

## How it works

- **Frontend/game logic first, hardware second.** All game state, scoring,
  and timing live on the laptop. The Arduino's only job is to detect a ball
  passing through the rim and send a line of text over serial.
- **Two interchangeable sensor drivers**, both behind the same interface
  (`src/services/hardwareAbstraction.ts`):
  - `MockSensorDriver` — Space bar / click simulates a made basket. Used for
    all development and testing before the hardware exists.
  - `WebSerialDriver` — reads real Arduino input directly in the browser via
    the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
    (`navigator.serial`). No backend/Node process needed — Chrome or Edge
    talks to the Arduino directly.
- **Projector calibration.** A virtual backboard/rim overlay can be resized,
  repositioned, and rotated to line up with the physical hoop once it's
  projected on a wall.
- **Local-only persistence.** Top-5 high scores and calibration settings are
  saved to `localStorage`. No database, no network, no cloud sync.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in **Chrome or Edge** (Web Serial API support is
required for real Arduino input — the keyboard/mock sensor works in any
browser).

Other scripts:

```bash
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # type-check with tsc
```

## Controls

| Key / Action     | Effect                                  |
|-------------------|------------------------------------------|
| `Space` / click rim | Simulate a made basket (mock sensor)    |
| `C`               | Toggle hoop/projector calibration mode  |
| `M`               | Mute / unmute audio                     |
| `F`               | Toggle fullscreen (for projector setups)|
| `D`               | Open the architecture spec doc          |
| `Esc`             | Close any open modal / exit calibration |

## Arduino → laptop protocol

The Arduino only needs to send one line of text per made basket over serial
(default baud rate `115200`, configurable in the Serial Monitor panel in-app).
Recognized line formats (see `WebSerialDriver.parseIncomingLine`):

```
SCORE       -> +2 points
SCORE:3     -> +3 points
BASKET      -> +2 points
GOAL        -> +2 points
```

Edge-triggered messages (send once per made basket) are preferred over a raw
continuous sensor stream — it's simpler to parse reliably and avoids
re-triggering on sensor bounce or net movement. The frontend also applies its
own debounce (400ms) as defense-in-depth.

**Not yet written:** the actual Arduino sketch (sensor read → debounce → send
`SCORE` over serial). That's the next step once the physical hoop + sensor
are wired up.

## Project structure

```
src/
  App.tsx                     # game state machine, round timer, wiring
  types.ts                    # shared types (GameState, HoopCalibration, ...)
  components/
    ScoreboardHUD.tsx         # score, timer, start/game-over prompts
    HoopPlaceholder.tsx       # projected virtual backboard/rim + score popups
    CalibrationControls.tsx   # hoop alignment + court theme panel
    CourtBackground.tsx       # background court themes
    SerialMonitorModal.tsx    # Arduino connect/packet log/test console
    GameOverModal.tsx         # final score + high score entry
    ArchitectureDocModal.tsx  # in-app course architecture spec
  services/
    hardwareAbstraction.ts    # ISensorDriver: Mock + WebSerial drivers
    scoreStorage.ts           # localStorage high scores + calibration
    audioEngine.ts            # procedural sound effects
```

## Scope

Single hoop, single player, local high scores only — no networking,
database, or multi-hoop support. Kept deliberately simple so it's buildable
and debuggable by a student team in one semester.
