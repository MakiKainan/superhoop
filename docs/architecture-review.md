# Step 1 — make the existing game reliable

## Our goal

Keep one familiar game and make its scoring, timer and pause/resume easy to trust and explain. Do not add game modes or hardware setup yet.

The previous expansion has been removed: streak survival, shot clocks, extra simulation controls, input switching, event scheduling and separate leaderboards for different modes. The original timed streak bonus remains part of the 60-second game.

## 1. Fix the sensor restart bug

**Before:** the sensor listener depended on the current streak. Changing the streak caused React to remove and recreate the sensor drivers.

**Now:** `App.tsx` creates one mock driver and subscribes it to the session once. Cleanup removes its listener when the app unmounts. Scoring does not recreate the driver.

Read `src/App.tsx`, starting at `mock.onEvent(store.receive)`.

## 2. Put game rules in one file

Read `src/game/sessionEngine.ts`.

The important function is:

```ts
transition(previousSession, command, time)
```

It takes the previous game state, one action and the current time, then returns the next game state. It does not draw anything, play sounds or read browser storage. That makes it easy to test.

The only rules are:

- Three seconds to get ready, then 60 seconds to play.
- Made baskets add their points; the mock sends 2.
- The third and later baskets in a streak get 1 extra point. The streak expires after 3 seconds of active play without a make.
- Paused and finished games cannot score.
- Reset clears the game, including the best streak and basket count.

The three time constants are at the top of the file. There is no configurable rules system to learn.

## 3. Check the clock before counting a basket

A timer callback may run late. Therefore, the engine checks elapsed time before **every** action, including a basket.

For example, a basket arriving exactly at the 60-second deadline is rejected even if the next timer callback has not run yet.

`activeMs` means time spent playing. It does not increase during pause or preparation. This preserves the exact remaining time and the streak window when a player resumes.

We use `performance.now()` for elapsed time. Calendar time is only used for saved dates. The timer callback refreshes the display; it is not the source of truth for how much time has passed.

## 4. Process baskets in order

Read `src/game/sessionStore.ts`.

The store owns the current session. Calling `receive(event)` updates the session immediately, without waiting for React to render. Two quick baskets therefore see the correct score and streak.

Each mock event has an ID. The store ignores duplicate IDs, invalid points and stale timestamps. Reset assigns a new session ID. IDs are remembered during the session, with a 100,000-event safety limit; at that limit further input is ignored until reset.

The small command queue also protects against a listener requesting another action while an update is being delivered. This is not a network queue or a background worker.

## 5. Show the result efficiently

Read `src/hooks/useSession.ts`, then `src/game/frameSubscription.ts`.

React reads a snapshot: the values needed to draw the game. If a timer check does not change the displayed values, the store reuses that snapshot.

When several baskets arrive together, the engine counts them all immediately, but the UI notification is combined into the next animation frame. The court and unchanged hoop are memoized so they can skip unnecessary redraws.

Only the latest 12 score popups are kept. This limits animation work, not points. Sounds follow state changes; the final warning beeps once per displayed second. Timers and subscriptions are cleaned up when the app unmounts.

## Follow one basket through the code

```text
Space or rim click
  -> MockSensorDriver.simulateScore() creates a basket event
  -> SessionStore.receive() checks and orders the input
  -> transition() checks the time and calculates the new score
  -> useSession() gives React the updated snapshot
  -> ScoreboardHUD and HoopPlaceholder show the result
```

The UI does not know how a physical sensor works. For now, learn and test this path only.

## What was preserved

Calibration, the court design, audio/mute, fullscreen, score popups, the original streak bonus and the single high-score table remain. Existing default high scores use the same storage key. Data saved under the removed experimental modes is not loaded or deleted.

`WebSerialDriver` was already part of the project. It remains in `hardwareAbstraction.ts` with strict packet parsing and connection cleanup fixes, but is not started by `App`. Its legacy protocol is made baskets only: `SCORE`, `SCORE:1`, `SCORE:2`, `SCORE:3`, `BASKET`, `GOAL`, or a HIGH/LOW rising edge, at 115200 baud by default. Do not integrate it in this step.

## How we verify this step

Run `npm test`, `npm run lint`, and `npm run build`. The tests cover rapid baskets, deadline boundaries, fractional pause/resume, reset, duplicate input, render notification batching, local score loading and the retained serial adapter's cleanup. Tests for removed features were removed too.

Use the short manual checklist in `README.md` to check the same behavior on screen. Physical sensor accuracy and device reconnect behavior still require real hardware tests later.

## Next step, when the team is ready

Have each teammate explain the basket path above, then complete the manual checklist. Only after that should we connect one sensor and verify one made basket. No further feature is needed to finish this step.

## Verification of the simplified version

- 24 automated tests pass.
- TypeScript check and production build pass. The existing optional Phathouse font warnings remain.
- Browser check: the settings and simulator panel are absent; three quick baskets produce 7 points; pausing freezes the clock and ignores another basket.

## Later visual step — generated court artwork

The game rules above still apply. The court artwork reacts to the existing streak using separate crowd image layers and a memoized SVG/CSS flame border. Fire uses no image assets or additional timers. Read [the short asset guide](court-art.md) for this visual change; the earlier static court description refers to the first optimization step.

