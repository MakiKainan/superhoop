import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Cpu,
  Layers,
  FileCode,
  ShieldAlert,
  FolderTree,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface ArchitectureDocModalProps {
  onClose: () => void;
}

export const ArchitectureDocModal: React.FC<ArchitectureDocModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<'STACK' | 'MODULES' | 'PROTOCOL' | 'MOCK_SWAP' | 'STORAGE' | 'EDGE_CASES' | 'STRUCTURE'>('STACK');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-chakra font-bold text-neutral-100 uppercase tracking-wide">
                Embedded Systems & Software Architecture Spec
              </h2>
              <p className="text-xs font-mono text-cyan-400">
                Senior Architect Technical Specification — Arcade Mini Basketball Hoop Machine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation bar for the 7 architectural deliverables */}
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-2.5 bg-neutral-900/40 border-b border-neutral-800/80 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveSection('STACK')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'STACK' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            1. Tech Stack
          </button>
          <button
            onClick={() => setActiveSection('MODULES')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'MODULES' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Separation of Concerns
          </button>
          <button
            onClick={() => setActiveSection('PROTOCOL')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'PROTOCOL' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            3. Serial Protocol
          </button>
          <button
            onClick={() => setActiveSection('MOCK_SWAP')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'MOCK_SWAP' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            4. HAL & Mock Driver
          </button>
          <button
            onClick={() => setActiveSection('STORAGE')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'STORAGE' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            5. High Scores
          </button>
          <button
            onClick={() => setActiveSection('EDGE_CASES')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'EDGE_CASES' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            6. Edge Cases & Failures
          </button>
          <button
            onClick={() => setActiveSection('STRUCTURE')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'STRUCTURE' ? 'bg-cyan-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            7. Project Folder Structure
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto font-sans text-neutral-300 text-sm leading-relaxed space-y-6">
          {/* SECTION 1: TECH STACK */}
          {activeSection === 'STACK' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                1. Recommended Tech Stack Comparison
              </h3>
              <p className="text-neutral-300">
                For an undergraduate Embedded Systems course where the team has moderate coding experience, you need a stack that provides:
                <strong> rapid UI iteration, seamless projector resolution scaling, zero-install deployment, and reliable serial communication</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3 font-sans">
                {/* Option A: Web Serial + React/Vite (RECOMMENDED) */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-chakra font-bold text-emerald-400 text-base">Option A: Web Serial + React (Our Choice)</span>
                      <span className="text-[10px] font-mono bg-emerald-500 text-neutral-950 font-black px-2 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mb-3">
                      HTML5/React frontend running in Chrome/Edge communicating directly with Arduino over USB via the W3C Web Serial API.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="text-emerald-300"><strong>Pros:</strong> Zero desktop drivers needed; single-click USB connect in browser; instant hot-reload; responsive full-screen projector canvas; CSS transforms for hoop alignment.</div>
                      <div className="text-neutral-400 mt-1"><strong>Cons:</strong> Requires Chromium browser (Chrome/Edge/Brave).</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-800/40 text-[11px] font-mono text-emerald-300">
                    Difficulty: Low-Medium | Dev Speed: Very Fast
                  </div>
                </div>

                {/* Option B: Python w/ Pygame + PySerial */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-chakra font-bold text-neutral-200 text-base">Option B: Python + Pygame</span>
                      <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                        TRADITIONAL
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">
                      Python script using `pyserial` on a background thread and `pygame` for a 2D graphics game loop.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="text-neutral-300"><strong>Pros:</strong> Python is taught in almost every engineering curriculum; PySerial is straightforward and battle-tested.</div>
                      <div className="text-red-300 mt-1"><strong>Cons:</strong> Pygame UI layout is rigid and cumbersome; text rendering and responsive projector scaling take tedious manual pixel math; threading crashes if GIL blocks serial.</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-800 text-[11px] font-mono text-neutral-400">
                    Difficulty: Medium | Dev Speed: Moderate
                  </div>
                </div>

                {/* Option C: Node.js / Electron */}
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-chakra font-bold text-neutral-200 text-base">Option C: Electron + SerialPort</span>
                      <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                        HEAVYWEIGHT
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-3">
                      Desktop wrapper packaging Node.js with native C++ `serialport` library and Chromium window.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="text-neutral-300"><strong>Pros:</strong> Full filesystem access; can auto-detect COM ports without user dialog prompt.</div>
                      <div className="text-red-300 mt-1"><strong>Cons:</strong> Native node-gyp build toolchain frequently fails on student Windows/Mac laptops; huge package footprint (150MB+); high complexity for a semester project.</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-800 text-[11px] font-mono text-neutral-400">
                    Difficulty: High | Dev Speed: Slow
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                <strong>Architect Verdict:</strong> Choose <strong>Option A (Web Serial + Modern Frontend)</strong>. It completely eliminates "it doesn't compile on my partner's machine" issues, lets you drag and calibrate the hoop position with live CSS transforms, and provides instant sound synthesis via the Web Audio API without needing external `.wav` files.
              </div>
            </div>
          )}

          {/* SECTION 2: SEPARATION OF CONCERNS */}
          {activeSection === 'MODULES' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                2. Module Architecture & Clean Separation of Concerns
              </h3>
              <p className="text-neutral-300">
                To guarantee that software development and hardware fabrication can happen in parallel without blocking each other, we establish 4 strictly decoupled modules communicating through an Event-Driven interface:
              </p>

              <div className="bg-black p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-300">
                <pre className="text-cyan-400 whitespace-pre">{`
 [ HARDWARE LAYER ]                  [ LAPTOP SOFTWARE ARCHITECTURE ]
 +------------------+                +---------------------------------------+
 |  IR Break-Beam   |                | 1. HARDWARE ABSTRACTION LAYER (HAL)   |
 |  Sensor on Rim   |                |    ISensorDriver interface            |
 +--------+---------+                |    - WebSerialDriver (reads USB)      |
          | Interrupt / Poll         |    - MockSensorDriver (Spacebar/Click)|
          v                          +-------------------+-------------------+
 +------------------+                                    |
 |   Arduino Uno    |                                    | onScore(event)
 |  Hardware Debounce|                                    v
 +--------+---------+                +---------------------------------------+
          | Serial USB String        | 2. GAME STATE MANAGER                 |
          | "SCORE:2\\n"              |    State: IDLE -> COUNTDOWN -> ACTIVE |
          v                          |    Timer, score streak, combos        |
 +------------------+                +---------+--------------------+--------+
 | USB Serial Cable |                          |                    |
 +------------------+                          v                    v
                                      +----------------+   +-----------------+
                                      | 3. UI RENDERER |   | 4. AUDIO ENGINE |
                                      | HUD, Rim Glow, |   | Procedural      |
                                      | Calibration    |   | Web Audio Synth |
                                      +----------------+   +-----------------+
                `}</pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <h4 className="font-chakra font-bold text-amber-300 text-sm mb-1">Module 1: Hardware Abstraction Layer (HAL)</h4>
                  <p className="text-neutral-400">
                    Exposes an identical `onScore(callback)` event listener regardless of whether scores arrive from a physical USB Arduino or a keyboard spacebar press. The rest of the app never knows which one is active.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <h4 className="font-chakra font-bold text-amber-300 text-sm mb-1">Module 2: Game State Manager</h4>
                  <p className="text-neutral-400">
                    A pure state machine governing game round progression: IDLE (Attract) ➔ COUNTDOWN (3s prep) ➔ PLAYING (active countdown) ➔ GAMEOVER (final whistle). Handles points math, multiplier streaks, and high score checks.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <h4 className="font-chakra font-bold text-amber-300 text-sm mb-1">Module 3: Projector UI & Calibration Renderer</h4>
                  <p className="text-neutral-400">
                    Displays high-contrast graphics suitable for ambient projector light. Provides draggable calibration coordinates (X, Y, Scale) to align perfectly with the physical hoop on the wall.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <h4 className="font-chakra font-bold text-amber-300 text-sm mb-1">Module 4: Audio & Feedback Engine</h4>
                  <p className="text-neutral-400">
                    Procedural audio synthesizers (swish, buzzer, chime, crowd) that trigger in response to state transitions without disk I/O latency.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SERIAL PROTOCOL */}
          {activeSection === 'PROTOCOL' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                3. Arduino ⇄ Laptop Serial Protocol Specification
              </h3>
              <p className="text-neutral-300">
                Keep the protocol <strong>text-based, newline-delimited, and human-readable</strong>. Binary packet formats are unnecessary for low-bandwidth event rates and make debugging with the Arduino IDE Serial Monitor very difficult.
              </p>

              <div className="p-4 bg-black rounded-xl border border-neutral-800 font-mono text-xs">
                <div className="text-neutral-400 mb-2">// Serial Settings: 115200 Baud, 8 Data Bits, 1 Stop Bit, No Parity (8-N-1)</div>
                <table className="w-full text-left text-neutral-300">
                  <thead>
                    <tr className="border-b border-neutral-800 text-amber-400">
                      <th className="pb-1">Direction</th>
                      <th className="pb-1">Packet Payload</th>
                      <th className="pb-1">Meaning & Handling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    <tr>
                      <td className="py-2 text-emerald-400 font-bold">Arduino ➔ Laptop</td>
                      <td className="py-2 text-amber-300 font-bold">SCORE:2\n</td>
                      <td className="py-2">Ball broke IR beam. Increment score by 2 points.</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400 font-bold">Arduino ➔ Laptop</td>
                      <td className="py-2 text-amber-300 font-bold">SYSTEM:READY\n</td>
                      <td className="py-2">Sent on Arduino power-up / reset. Clears handshake error.</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-cyan-400 font-bold">Laptop ➔ Arduino</td>
                      <td className="py-2 text-neutral-300">PING\n</td>
                      <td className="py-2">(Optional) Heartbeat check if port is responsive.</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400 font-bold">Arduino ➔ Laptop</td>
                      <td className="py-2 text-neutral-300">PONG\n</td>
                      <td className="py-2">Heartbeat acknowledgment response.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-chakra font-bold text-neutral-200 uppercase">Parsing & Validation Algorithm on Laptop:</h4>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                  <li>Accumulate incoming bytes into a line buffer until `\n` is encountered.</li>
                  <li>Trim whitespace and carriage returns (`\r`).</li>
                  <li>Check if packet matches regex: <code className="text-amber-300 bg-neutral-900 px-1 py-0.5 rounded">/^SCORE:([0-9]+)$/</code></li>
                  <li>Check timestamp against laptop software debounce window (e.g. discard if &lt; 350ms since previous score).</li>
                  <li>If valid, fire <code className="text-cyan-300">onScore()</code> callback to increment game state.</li>
                </ol>
              </div>
            </div>
          )}

          {/* SECTION 4: MOCK SWAP */}
          {activeSection === 'MOCK_SWAP' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                4. Sensor Driver Abstraction (Mock vs Real Hardware)
              </h3>
              <p className="text-neutral-300">
                Here is the TypeScript / JavaScript pattern for the Hardware Abstraction Layer. This allows the team to demo the complete game with keyboard spacebar presses during Week 2, and switch to the physical Arduino in Week 10 with <strong>zero changes to the UI or game logic</strong>:
              </p>

              <div className="relative bg-black p-4 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300">
                <button
                  onClick={() => copySnippet(`// 1. Define standard interface
export interface ISensorDriver {
  init(): void;
  cleanup(): void;
  onScore(callback: (event: SensorEvent) => void): () => void;
}

// 2. Factory or Context Provider
const driver: ISensorDriver = USE_REAL_HARDWARE 
  ? new WebSerialDriver() 
  : new MockSensorDriver();

driver.init();
driver.onScore(event => {
  gameStateManager.recordBasket(event.points);
});`, 'hal-code')}
                  className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded text-[11px] transition"
                >
                  {copiedCode === 'hal-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'hal-code' ? 'Copied' : 'Copy'}
                </button>
                <pre className="text-cyan-300 whitespace-pre">{`// 1. Common Sensor Driver Interface
export interface ISensorDriver {
  init(): void;
  cleanup(): void;
  onScore(callback: (event: SensorEvent) => void): () => void;
}

// 2. Software Driver Factory
// Toggle between hardware and mock with a single flag or UI dropdown:
const driver: ISensorDriver = useHardware 
  ? new WebSerialDriver(baudRate) 
  : new MockSensorDriver();

driver.init();

// 3. UI and Game State listen identically:
driver.onScore(event => {
  gameState.handleBasket(event.points);
  audioEngine.playSwish();
});`}</pre>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                <strong>Course Benefit:</strong> If your hardware team runs into a burnt resistor, delayed shipping on sensors, or a loose solder joint on demo day, you can immediately switch to Simulation Mode and still present full gameplay without failing the project presentation!
              </div>
            </div>
          )}

          {/* SECTION 5: HIGH SCORES */}
          {activeSection === 'STORAGE' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                5. High Scores Storage Strategy
              </h3>
              <p className="text-neutral-300">
                For a semester project, avoid complex databases (SQL, MongoDB) or external cloud services. A simple local JSON document persisted in client-side storage is robust, offline-capable, and completely reliable.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-black rounded-xl border border-neutral-800">
                  <div className="text-amber-400 font-bold mb-2">// Sample Data Format (highscores.json)</div>
                  <pre className="text-neutral-300 whitespace-pre">{`[
  {
    "id": "1",
    "initials": "KOB",
    "score": 62,
    "date": "2026-09-01",
    "durationSeconds": 60,
    "accuracyStreak": 9
  },
  {
    "id": "2",
    "initials": "MJ2",
    "score": 54,
    "date": "2026-09-02",
    "durationSeconds": 60
  }
]`}</pre>
                </div>

                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                  <h4 className="font-chakra font-bold text-neutral-200 text-sm">Persistence Lifecycle:</h4>
                  <ul className="list-disc list-inside text-neutral-400 space-y-1">
                    <li><strong>Storage Location:</strong> Browser `localStorage` key (`ARCADE_HOOP_HIGHSCORES_V1`) or local JSON file.</li>
                    <li><strong>When Reads Occur:</strong> Once on app startup. If empty or corrupted, fallback to seed array of classic records.</li>
                    <li><strong>When Writes Occur:</strong> Only when a round ends and the player submits their initials (atomic write).</li>
                    <li><strong>Backup & Grading:</strong> Includes one-click "Export JSON" button so students can save their leaderboard to turn in with their code repository.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: EDGE CASES */}
          {activeSection === 'EDGE_CASES' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                6. Critical Failure Points & Embedded Edge Cases
              </h3>
              <p className="text-neutral-300">
                Physical sensor projects fail in messy real-world ways. Here are the 5 classic failure modes and our architectural mitigations:
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40">
                  <h4 className="font-chakra font-bold text-red-400 text-sm mb-1">
                    1. Double Counting from Ball Bounce & Net Ripple
                  </h4>
                  <p className="text-neutral-300 mb-1">
                    <strong>The Problem:</strong> When the mini basketball goes through the net, the net cords sway back through the IR beam, or the ball rattles on the rim and trips the sensor 2 or 3 times in 100 milliseconds.
                  </p>
                  <p className="text-emerald-400 font-mono">
                    <strong>Solution (Dual-Debounce):</strong> Arduino implements a non-blocking `millis()` lockout (350ms). In addition, the laptop software layer implements a defensive 400ms software lockout. Any secondary pulses within this window are discarded.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40">
                  <h4 className="font-chakra font-bold text-red-400 text-sm mb-1">
                    2. Ambient Sunlight & Projector Light Flooding IR Sensor
                  </h4>
                  <p className="text-neutral-300 mb-1">
                    <strong>The Problem:</strong> Bright room fluorescent lights or the projector beam itself shines directly into a simple photodiode, saturating it and causing permanent LOW or HIGH state.
                  </p>
                  <p className="text-emerald-400 font-mono">
                    <strong>Solution:</strong> Use an IR break-beam sensor with a shrouded receiver tube (or 38kHz modulated receiver like TSOP38238). Mount the sensor underneath the rim rim flange pointing horizontally across the rim throat.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40">
                  <h4 className="font-chakra font-bold text-red-400 text-sm mb-1">
                    3. USB Cable Disconnection / Serial Port Dropping
                  </h4>
                  <p className="text-neutral-300 mb-1">
                    <strong>The Problem:</strong> A player bumps the laptop or yanks the USB cable mid-game. Unhandled serial exceptions crash traditional apps with fatal errors.
                  </p>
                  <p className="text-emerald-400 font-mono">
                    <strong>Solution:</strong> Web Serial driver listens for `serial.addEventListener('disconnect')`. The frontend marks the device as DISCONNECTED without crashing the UI or discarding the game state, and allows one-click reconnect.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/40">
                  <h4 className="font-chakra font-bold text-red-400 text-sm mb-1">
                    4. Timer Race Conditions & JavaScript Drift
                  </h4>
                  <p className="text-neutral-300 mb-1">
                    <strong>The Problem:</strong> Using simple `setInterval(..., 1000)` causes timer drift because browser timers are delayed when backgrounded or during heavy DOM rendering.
                  </p>
                  <p className="text-emerald-400 font-mono">
                    <strong>Solution:</strong> Store `roundStartTime = Date.now()` and calculate `timeRemaining = duration - ((Date.now() - roundStartTime)/1000)`. This guarantees wall-clock precision regardless of JS frame rate.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: STRUCTURE */}
          {activeSection === 'STRUCTURE' && (
            <div className="space-y-4">
              <h3 className="text-xl font-chakra font-bold text-amber-400 uppercase tracking-wide">
                7. Suggested Project Folder Structure
              </h3>
              <p className="text-neutral-300">
                A clean, modular repository layout organized for clear team division (Firmware vs Frontend vs Mechanical):
              </p>

              <div className="p-4 bg-black rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300">
                <pre className="text-emerald-300 whitespace-pre">{`arcade-basketball-project/
├── arduino/                        # Microcontroller Firmware (Hardware Team)
│   └── hoop_sensor/
│       ├── hoop_sensor.ino         # Main Arduino sketch (IR sensing + debouncing)
│       └── wiring_diagram.png      # Breadboard & pinout schematics
│
├── frontend/                       # Projector Display & Game Logic (Software Team)
│   ├── src/
│   │   ├── components/             # Visual UI Modules
│   │   │   ├── CourtBackground.tsx # Scalable court themes (Sunset, Pacific, Neon)
│   │   │   ├── HoopPlaceholder.tsx # Draggable projector calibration & rim overlay
│   │   │   ├── ScoreboardHUD.tsx   # Real-time score, countdown clock, streak
│   │   │   ├── CalibrationControls.tsx # Alignment sliders & theme toggle
│   │   │   ├── SerialMonitorModal.tsx  # Packet console & baud config
│   │   │   └── GameOverModal.tsx   # Initials input & top-5 leaderboard
│   │   ├── services/               # Decoupled Core Services
│   │   │   ├── hardwareAbstraction.ts # WebSerialDriver & MockSensorDriver
│   │   │   ├── audioEngine.ts      # Web Audio API procedural sound engine
│   │   │   └── scoreStorage.ts     # localStorage & JSON backup exporter
│   │   ├── types.ts                # TypeScript interfaces & GameState enum
│   │   ├── App.tsx                 # Master state coordinator & keyboard shortcuts
│   │   └── main.tsx                # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                           # Course Submission Deliverables
│   ├── architecture_spec.md        # This systems design document
│   ├── bill_of_materials.md        # IR sensors, mini hoop, fasteners, Arduino
│   └── highscores.json             # Sample export file for grading
└── README.md                       # Quickstart instructions for professors & team`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>Project: Arcade Mini Basketball Hoop Machine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-chakra font-bold cursor-pointer transition"
          >
            RETURN TO GAME
          </button>
        </div>
      </div>
    </div>
  );
};
