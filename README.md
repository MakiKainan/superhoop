# Smart Basketball Hoop — current step

We are making the existing game reliable before adding hardware or more features.

## What the app does now

- One 60-second game, with a three-second preparation countdown.
- Space, S, or clicking the rim simulates a made basket.
- A normal basket adds 2 points. The existing streak bonus adds 1 extra point from the third basket onward, if baskets are less than 3 seconds apart.
- P pauses or resumes. The clock and streak timing stop while paused. Resume gives another three-second countdown.
- The original high scores, calibration, sound and fullscreen controls remain.

There is no mode selector, shot clock, miss/rim simulator, burst button, scheduled simulation or USB connection panel. The existing serial adapter is kept in the source for a later step, but the app only starts the mock input.

## Run the app

From the project folder:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal. You only need `npm ci` for initial setup or after dependencies change.

## Test it yourself

1. Click **BALL UP**. Check that 3, 2, 1 appears before the 60-second game starts.
2. Make three baskets quickly using Space or the rim. The scores should be **2, 4, 7**.
3. Wait at least 3 seconds, then make another basket. It should add **2**, because the streak has expired.
4. Press **P**. Note the score and time. Press Space while paused: neither should change.
5. Press **P** again. After the preparation countdown, the game should continue with the saved time and score.
6. Click **END ROUND**, then start again. The score, basket count and streak should start fresh.
7. Let a round reach zero. More Space presses must not change the final score.

Space activates a focused button normally. To use it as a basket key, click an empty part of the court first, or use **S**. Holding a key does not repeatedly score.

## Check the code

```sh
npm test
npm run lint
npm run build
```

- `test`: checks scoring and timing with a controlled clock, without waiting for real rounds.
- `lint`: checks TypeScript types.
- `build`: makes the production version.

The optional Phathouse font files are not included, so the build warns about them and uses fallback fonts. See [font notes](public/fonts/README.md).

## Understand the change

Read [the step-by-step code guide](docs/architecture-review.md). It explains the original bug, the small responsibilities of each file, and how a basket reaches the screen.

Active games are held in memory and reset on page reload. High scores and calibration use local storage. No physical sensor is needed for this step.

## Hoop size

The standard rim is 64px wide, with a compact 240 × 150px backboard. The clickable area stays at least 56px tall so a smaller ring is still easy to use. **Calibrate Hoop → Std Scale** restores these dimensions. Previously saved standard dimensions are updated on load; custom dimensions are preserved.
Game buttons sit beneath the timer to keep the rim visible. Empty HUD space lets pointer events reach the hoop; the buttons remain clickable. Verified the smaller rim by clicking it during a round and confirming a 2-point score.


## Crowd and streak visuals

Basket feedback pops outside the backboard with “Woww!”, “Awesome!!” and “On Fire!” callouts. Every made shot refreshes a three-second streak deadline; expiry clears the streak and bonus. A streak of 3 adds cheering spectators and faint SVG/CSS fire; 6 adds another row. All crowd sprites stay behind the baseline, with two new character groups to reduce repetition. See [the scene and testing guide](docs/court-art.md) for the code, assets and testing steps.

