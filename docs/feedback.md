# Rubric Feedback — Smart Basketball Hoop

> Written as an embedded-systems course review of the project against the LO1/LO2/LO3
> proficiency rubric. Assumes the project is completed as scoped in
> [handoff-arcade-basketball.md](../handoff-arcade-basketball.md): Arduino firmware
> written, IR break-beam sensor wired, and `WebSerialDriver` connected end-to-end.

## Rubric assessment

| LO | Key Indicator | Level | Notes |
|---|---|---|---|
| LO1 | Architectural Understanding | Excellent | Block diagram (sensor -> Arduino -> USB serial -> laptop -> UI) is explicit and consistent across the docs, and traceable end-to-end (see "Follow one basket through the code" in `architecture-review.md`). |
| LO1 | Embedded Software Layering | Excellent | `ISensorDriver` is a clean HAL: `MockSensorDriver` and `WebSerialDriver` are interchangeable behind one interface, with the *purpose* of the layering (swap fake input for real hardware, zero changes to game logic/UI) demonstrated, not just the shape of it. |
| LO1 | Integrated System Workflow | Excellent | Idle -> countdown -> active play -> game over is fully specified, including startup/boot handshake behavior (`SYSTEM:READY` lines that must never score). |
| LO2 | Code Implementation | Good | Debounce (400ms lockout) and line-buffering (`LineFramer`) are correct and tested against adversarial input (`tools/hoop_sim.py` noise/split/debounce modes). Capped below Excellent because the interrupt-vs-polling decision on the Arduino side isn't documented/justified anywhere. |
| LO2 | Resource Optimization | Good | PC side shows real optimization (memoized components, batched UI updates, snapshot reuse) and the Arduino's role is deliberately minimal. Not Excellent: no explicit accounting of MCU-side memory/power — all optimization evidence shown is laptop-side, not embedded-target-side. |
| LO2 | System Design & Integration | Excellent | Modular and testable: pure state machine (`sessionEngine.transition`) decoupled from I/O, storage, and rendering, backed by 24 automated tests plus a hardware simulator to validate the serial contract without real hardware. |
| LO3 | Architectural Mapping | Excellent | Input -> process -> output mapping matches what was actually built. |
| LO3 | Implementation & Efficiency | Good | Real constraints identified and respected (single semester, no cloud/networking, disconnect/reconnect tolerance, testable before hardware exists). Short of Excellent: no discussion of the sensor's physical/timing constraints (break-beam response time vs. ball speed, false triggers from net movement). |
| LO3 | Sensor & Actuator Selection | Good | IR break-beam is a sound, well-justified sensor choice. Capped at Good because there is no actuator in the design — no physical feedback (buzzer, LED, servo) on the hardware side, only screen/audio feedback on the laptop. |

**Overall: ~83/100 — Good, bordering Excellent.** The software engineering (testable
pure-function core, HAL-style driver abstraction, adversarial serial testing) is above
the bar typically expected at this level. The gaps are specifically embedded-systems
gaps: no actuator, no documented interrupt/power reasoning, no MCU-side resource
accounting.

## Recommendation steps

1. **Write the Arduino sketch** (highest priority — nothing else on the hardware side
   can proceed without it). Wire the IR break-beam sensor to a digital pin, use
   `attachInterrupt()` for edge detection instead of polling in `loop()` (and document
   why — lower latency, doesn't block other work), and debounce in firmware too, not
   only in `WebSerialDriver`. Emit exactly the packet format the parser already expects
   (`SCORE`, `SCORE:2`, `SYSTEM:READY`, `DEVICE:BASKETBALL_HOOP_V1`) at 115200 baud.

2. **Add a physical actuator.** This is the single biggest rubric gap. A buzzer, LED
   strip, or small servo driven directly by the Arduino on a made basket (independent
   of the laptop) turns this from a sensor input pipeline into an actual
   sensor+actuator embedded system.

3. **Document the resource/power reasoning on the MCU side.** A short `docs/firmware.md`
   covering: why interrupt over polling, approximate memory footprint of the sketch,
   and any power consideration (or explicitly note "USB-powered only, no power budget
   constraint" if that's the case).

4. **Wire `WebSerialDriver` back into `App.tsx`** for a real end-to-end demo. Add a
   "Connect Arduino" UI path using the Web Serial API's `requestPort()` chooser. Test
   the swap using `tools/hoop_sim.py` (via a com0com virtual port pair) before touching
   real hardware, to isolate serial-parsing bugs from sensor-wiring bugs.

5. **Validate against real physical failure modes, not just simulated ones.** Repeat
   the simulator's split/debounce/noise scenarios with the real sensor: does a
   slow-arcing ball vs. a fast dunk both register exactly once? Does ambient light or a
   hand's shadow ever false-trigger it? Record the results — this is the "physical
   sensor accuracy" testing `architecture-review.md` already flags as pending.

6. **Tie the finished work back to the rubric explicitly** in the final writeup: point
   to the ISR code for "interrupt mechanisms," the actuator for "sensor & actuator
   selection," and `docs/firmware.md` for "resource optimization," so the mapping is
   obvious to a grader rather than something they have to hunt for.

Suggested order: 1 -> 2 -> 4 -> 5 -> 3 -> 6 — get the sketch talking to real hardware
first, validate it under real conditions, then backfill documentation once you know
what actually happened rather than writing it speculatively.
