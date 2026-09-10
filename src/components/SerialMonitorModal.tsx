import React, { useState } from 'react';
import { SerialStatus } from '../types';
import {
  Usb,
  X,
  Copy,
  Check,
  Play,
  RotateCcw,
  Terminal,
  AlertTriangle,
  Code2,
} from 'lucide-react';

interface SerialMonitorModalProps {
  status: SerialStatus;
  packetLogs: Array<{ id: string; time: string; message: string; type: 'IN' | 'SIM' | 'SYS' }>;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onBaudRateChange: (baud: number) => void;
  onSendTestPacket: (packet: string) => void;
  onClearLogs: () => void;
  onClose: () => void;
}

const ARDUINO_SKETCH_CODE = `/*
 * Arcade Mini Basketball Hoop - Sensor Firmware
 * Hardware: Arduino Uno / Nano / ESP32 + IR Break-Beam Sensor (e.g. Adafruit 2167 / 2168)
 * Wiring:
 *   - IR Receiver Yellow/White (Signal) -> Arduino Digital Pin 2 (INPUT_PULLUP)
 *   - IR Receiver Black (GND)           -> Arduino GND
 *   - IR Receiver Red (VCC)             -> Arduino 5V
 *   - IR Emitter Red/Black              -> 5V & GND
 */

const int BEAM_PIN = 2;              // Digital pin connected to IR sensor
const unsigned long DEBOUNCE_MS = 350; // Lockout to prevent ball bounce multi-triggers
const int POINTS_PER_BASKET = 2;     // Standard made shot points

volatile unsigned long lastScoreTime = 0;
int lastBeamState = HIGH;            // Beam unbroken = HIGH (with internal pullup)

void setup() {
  // Start Serial communication at high speed for minimal latency
  Serial.begin(115200);
  while (!Serial) {
    ; // Wait for native USB if using Leonardo/Micro/RP2040
  }

  pinMode(BEAM_PIN, INPUT_PULLUP);
  
  // Power-on handshake packet
  Serial.println("SYSTEM:READY");
  Serial.println("DEVICE:BASKETBALL_HOOP_V1");
}

void loop() {
  int currentBeamState = digitalRead(BEAM_PIN);
  unsigned long now = millis();

  // IR Break-Beam is LOW when the basketball breaks the light path
  if (currentBeamState == LOW && lastBeamState == HIGH) {
    if (now - lastScoreTime > DEBOUNCE_MS) {
      lastScoreTime = now;
      
      // Send discrete score event packet over USB serial to laptop
      Serial.print("SCORE:");
      Serial.println(POINTS_PER_BASKET);
    }
  }

  lastBeamState = currentBeamState;

  // Optional: Check if laptop sent any command (e.g. "PING" or "RESET")
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd == "PING") {
      Serial.println("PONG");
    }
  }

  delay(2); // Short 2ms polling sleep for stable digital read
}
`;

export const SerialMonitorModal: React.FC<SerialMonitorModalProps> = ({
  status,
  packetLogs,
  onConnect,
  onDisconnect,
  onBaudRateChange,
  onSendTestPacket,
  onClearLogs,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'ARDUINO_CODE'>('CONSOLE');
  const [customPacket, setCustomPacket] = useState('SCORE:2');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ARDUINO_SKETCH_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${status.connected ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-street text-neutral-100 uppercase tracking-wide">
                Hardware & Serial Monitor
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                Arduino USB Communication & Sensor Driver
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
              <button
                onClick={() => setActiveTab('CONSOLE')}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'CONSOLE' ? 'bg-neutral-800 text-amber-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                <Terminal className="w-3.5 h-3.5 inline mr-1" />
                Serial Console
              </button>
              <button
                onClick={() => setActiveTab('ARDUINO_CODE')}
                className={`px-3 py-1 rounded-lg transition ${activeTab === 'ARDUINO_CODE' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                <Code2 className="w-3.5 h-3.5 inline mr-1" />
                Arduino (.ino) Code
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Serial Console */}
        {activeTab === 'CONSOLE' && (
          <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs font-mono">
            {/* Connection Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-500'}`} />
                <div>
                  <div className="font-bold text-neutral-200">
                    STATUS: {status.connected ? 'CONNECTED TO ARDUINO' : 'DISCONNECTED'}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {status.portName || 'Using Web Serial API (Chrome/Edge)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={status.baudRate}
                  onChange={e => onBaudRateChange(Number(e.target.value))}
                  disabled={status.connected}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono disabled:opacity-50"
                >
                  <option value={115200}>115200 Baud</option>
                  <option value={9600}>9600 Baud</option>
                  <option value={57600}>57600 Baud</option>
                </select>

                {!status.connected ? (
                  <button
                    onClick={onConnect}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <Usb className="w-3.5 h-3.5" />
                    CONNECT ARDUINO
                  </button>
                ) : (
                  <button
                    onClick={onDisconnect}
                    className="flex items-center gap-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/80 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    DISCONNECT
                  </button>
                )}
              </div>
            </div>

            {status.error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-950/50 border border-red-800/50 rounded-lg text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{status.error}</span>
              </div>
            )}

            {!status.supported && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300">
                <strong>Note on Web Serial:</strong> The native browser Web Serial API is supported in Google Chrome, Microsoft Edge, and Opera on desktop. You can test fully with the built-in keyboard simulator in any browser!
              </div>
            )}

            {/* Packet Log Terminal */}
            <div className="flex-1 flex flex-col bg-black rounded-xl border border-neutral-800 p-3 min-h-[220px]">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2 mb-2 text-neutral-400">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Terminal className="w-3.5 h-3.5" />
                  SERIAL PACKET LOG STREAM
                </span>
                <button
                  onClick={onClearLogs}
                  className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
                {packetLogs.length === 0 ? (
                  <div className="text-neutral-600 italic py-8 text-center">
                    No incoming packets yet. Press Spacebar to simulate, or plug in Arduino and trigger the IR sensor.
                  </div>
                ) : (
                  packetLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-neutral-600">[{log.time}]</span>
                      <span
                        className={`font-bold ${
                          log.type === 'IN'
                            ? 'text-emerald-400'
                            : log.type === 'SIM'
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {log.type === 'IN' ? '[RX-USB]' : log.type === 'SIM' ? '[SIM-KB]' : '[SYSTEM]'}
                      </span>
                      <span className="text-neutral-200">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Test Packet Injector */}
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-bold">Inject Packet:</span>
                <input
                  type="text"
                  value={customPacket}
                  onChange={e => setCustomPacket(e.target.value)}
                  className="bg-black border border-neutral-700 rounded px-2 py-1 text-amber-300 font-mono w-32"
                  placeholder="e.g. SCORE:2"
                />
                <button
                  onClick={() => onSendTestPacket(customPacket)}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-2.5 py-1 rounded transition cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  Send
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Presets:</span>
                <button
                  onClick={() => onSendTestPacket('SCORE:2')}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  SCORE:2
                </button>
                <button
                  onClick={() => onSendTestPacket('SCORE:3')}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  SCORE:3
                </button>
                <button
                  onClick={() => onSendTestPacket('PING')}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  PING
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Ready-to-Flash Arduino C++ Code */}
        {activeTab === 'ARDUINO_CODE' && (
          <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-3 font-mono text-xs">
            <div className="flex items-center justify-between bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
              <div className="text-neutral-300 text-[11px]">
                Copy and flash this sketch onto your <strong>Arduino Uno / Nano / ESP32</strong> via Arduino IDE.
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED TO CLIPBOARD' : 'COPY .INO CODE'}
              </button>
            </div>

            <div className="bg-black rounded-xl border border-neutral-800 p-4 overflow-x-auto text-[11px] text-neutral-300 font-mono max-h-[380px]">
              <pre className="whitespace-pre">{ARDUINO_SKETCH_CODE}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
