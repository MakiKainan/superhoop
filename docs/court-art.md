# Court artwork and animation

This step moves feedback away from the hoop, gives streaks a strict three-second active-play deadline, softens the fire, and keeps spectators behind the baseline. The round is still 60 seconds and the rim remains 64px.

## The five generated assets

Created with the built-in image_gen tool. All generation prompts are preserved in [prompts.json](../public/art/court/prompts.json). The visual direction follows the existing court: purple/orange dusk, thick dark outlines, cel shading and halftone accents.

| Asset | What moves | What stays fixed |
| --- | --- | --- |
| `court-dusk-v1.png` | A separate CSS sky-light overlay gently changes opacity | Court markings, skyline and fence stay still so the hoop remains aligned |
| `spectators-watching-v1.png` | The whole group sways slightly | Individual arms/legs are not independently animated |
| `spectators-cheering-v1.png` | The whole group bounces; extra groups fade in | This is a single cutout, not a frame-by-frame character animation |
| `spectators-watching-v2.png` | Four different regulars sway on the right | Same proportions, ink outlines and teal/plum/cream/amber palette as v1 |
| `spectators-cheering-v2.png` | Six different fans alternate with v1 across the two cheering rows | Distinct faces, clothes and silhouettes break up repetition |

All five images are saved in `public/art/court/`. Spectator PNGs contain real transparency. The two new variants were generated with the built-in image_gen tool, using v1 as the style/scale reference, then passed through background extraction to remove the initially painted checkerboard. Their generation and extraction prompts are saved in `prompts.json`. The app loads WebP copies with alpha preserved. No image is generated during play. Fire remains entirely code-based.

## What the player sees

- Below a streak of 3: four regular spectators on each side.
- At 3 consecutive makes: a six-person cheering group joins each side, with moving flames on all four screen borders and a subtle red tint.
- At 6 consecutive makes: another group joins each side and the red tint gently strengthens from 2% to approximately 3.5%.
- Three seconds after the last make, the streak and bonus reset; the extra crowd and fire fade away.
- Pause and resume preparation freeze the scene animation. Reset/game over return to the small crowd.
- Reduced-motion settings remove loops and transitions. The crowd and a static flame border still show the current streak.

## Follow the code

1. `App.tsx` converts the existing streak into a visual energy value: 0, 1 or 2.
2. `CourtBackground.tsx` draws the court and crowd. `StreakBorder.tsx` draws the border using inline SVG paths and CSS overlays. Both components are memoized, so unchanged energy/pause props skip renders during timer and score updates.
3. `index.css` controls visibility and animation. The animations use transforms/opacity; there are no extra JavaScript timers.

## Streak deadline

`STREAK_WINDOW_MS` in `sessionEngine.ts` is 3,000ms. Each accepted basket records the current active-play time. Before every command, the engine compares elapsed time with that deadline. At exactly 3,000ms without a make, it clears the streak before awarding points for a new shot. That shot starts at streak 1 and scores the normal 2 points. The third and later consecutive makes still earn the existing +1 bonus; no separate multiplier can remain active after expiry.

Pause and resume preparation freeze active-play time, preserving the remaining streak time. Duplicate/invalid packets never refresh it. The existing 50ms UI tick publishes expiry without another basket; delayed ticks cannot extend the scoring deadline. No additional timeout callback is introduced.

## Basket feedback

`BasketFeedback.tsx` draws score pills and “Woww!”, “Awesome!!”, or “On Fire!” callouts outside the board. `feedbackLayout.ts` accounts for calibration position, board size and rotation. It chooses the right side, then the left; narrow screens use the space below the net or above the board. If an oversized custom board leaves no safe space, decorative bubbles are suppressed.

The latest three bubbles use separate vertical slots, pop briefly, float away and fade over 1.25 seconds. Animation completion removes them; a burst never creates unbounded elements or cleanup timers. Pause/reset clears feedback, and reduced motion uses a stationary fade. The displayed score still counts every accepted make, including bursts larger than the visual limit.

## Crowd boundary

The background is 1672 × 941, with its baseline at approximately 64% of image height. `.court-crowd-zone` computes where that line lands after centered `object-cover` cropping, subtracts a 6px safety margin and clips everything below it. All sprite bottom offsets are inside this zone. Back rows render before the regulars, so no new row is placed onto the court floor. This is enforced by one shared boundary rather than independent screen-height percentages.

## How the code-only fire works

- Four SVG strips each contain 12 two-color flame shapes, rotated to point inward. The orange/gold shapes match the comic artwork. The count stays fixed, even during rapid scoring.
- Each flame stretches and leans slowly at a different speed and starting offset. Static gradient masks dissolve the inward tips; removing the dark stroke and lowering strip opacity to 32% softens the edges. The glow animates only opacity. No image requests, particle dependencies, canvas loops, animated blur or turbulence filters are used.
- The border stays mounted and fades over 650ms. Visibility becomes hidden after fade-out; a new streak can smoothly reverse a fade already in progress.
- The red wash is a 2% solid-color overlay. A separate 1.5% layer fades in at energy 2.
- Flame depth scales between 18px and 38px with the viewport. Static masks fade the shape tips before the strip boundary, and SVG overflow is visible to avoid cutting off motion. The center stays clear. The overlay ignores pointer events and is hidden from screen readers.
- Pause and resume preparation freeze the CSS loops. At energy 0, loops remain paused while the last frame fades away. Reduced motion shows static flames.

To adjust the effect, change `--flame-depth`, the tint alpha values, or `streak-blaze` in `index.css`. Change the paths in `StreakBorder.tsx` to alter flame shapes. Keep scoring logic in the existing session engine.

The generated background replaces the previous drawn skyline/court. The existing goal post and calibrated hoop remain separate. Decorative images cannot intercept clicks and are hidden from screen readers.

## Test this change

1. Run `npm run dev`, start a round, and wait for preparation. Different regulars should watch from behind the baseline on each side.
2. Press S once, then again. Score and hype bubbles should pop outside the board. Press S a third time before three seconds pass: the score should total 7, with “On Fire!”, extra spectators and faint fire.
3. Press S three more times within 3 seconds. A second row should join and the tint should gently strengthen.
4. Press P. Check that crowd/fire motion stops. Resume to continue.
5. Stop scoring for 3 seconds during play. Allow another 650ms for the border and tint to fade out. A new streak during that fade should fade back in smoothly.
6. Make another basket after expiry: it should add 2 points. Rapidly press S several times; bubbles should stay in separate slots and disappear, while every basket counts.
7. Click the ring and HUD controls while the fire is visible. They should remain responsive. Check that all crowd feet stay behind the baseline even at streak 6.
8. Test a narrow window and rotate/move the board in calibration. Bubbles should stay outside it, spectators should stay behind the baseline, and flames should remain subtle. Enable reduced motion: flames/crowd should be static and bubbles should only fade.

The PNGs are the editable source artwork. To change a character pose or separate individual limbs later, generate a new asset rather than trying to animate parts of one flattened picture.

## Runtime image size

The five court/crowd WebP files total approximately 1.45 MB. Source PNGs are preserved alongside them. Dimensions and alpha are preserved. Conversion uses the Sharp CLI at quality 85 / alpha quality 100 as a one-time development command; no runtime dependency was added.

Regenerate the delivery copies from this project folder with:

```sh
npm exec --yes --package=sharp-cli -- sharp -i public/art/court/court-dusk-v1.png public/art/court/spectators-watching-v1.png public/art/court/spectators-cheering-v1.png public/art/court/spectators-watching-v2.png public/art/court/spectators-cheering-v2.png -o public/art/court -f webp -q 85 --alphaQuality 100
```

Run `npm test`, `npm run lint` and `npm run build` for regression, type and production checks. The 32 tests include deadline refresh, exact-boundary expiry, rejected events, pause/resume, and feedback positioning on desktop/narrow/rotated boards. Use the manual steps above to check appearance and motion; these tests do not measure rendering performance.

On narrow screens, the background is center-cropped rather than stretched. The crowd groups scale down separately, preserving character proportions and the clear shooting lane.

