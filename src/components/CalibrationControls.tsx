import React from 'react';
import { HoopCalibration } from '../types';
import {
  Sliders,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Move,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CalibrationControlsProps {
  calibration: HoopCalibration;
  onChange: (updated: HoopCalibration) => void;
  onClose: () => void;
  onReset: () => void;
}

export const CalibrationControls: React.FC<CalibrationControlsProps> = ({
  calibration,
  onChange,
  onClose,
  onReset,
}) => {
  const update = (partial: Partial<HoopCalibration>) => {
    onChange({ ...calibration, ...partial });
  };

  return (
    <div
      id="projector-calibration-modal"
      className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] bg-neutral-950/95 border border-amber-500/40 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] backdrop-blur-md p-4 text-xs select-none max-h-[85vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="font-street text-sm text-neutral-100 uppercase tracking-wider">
            Projector Hoop Alignment
          </h3>
        </div>
        <button
          id="close-calib-btn"
          onClick={onClose}
          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-street px-2.5 py-1 rounded-lg text-xs cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          DONE
        </button>
      </div>

      <p className="text-neutral-400 text-[11px] mb-3 leading-relaxed">
        Align the projected hoop with your physical mini-hoop mounted on the wall or screen. Drag the hoop directly or use sliders below.
      </p>

      {/* Sliders Grid */}
      <div className="space-y-3">
        {/* X Position */}
        <div>
          <div className="flex justify-between font-mono text-[11px] text-neutral-300 mb-1">
            <span className="flex items-center gap-1"><Move className="w-3 h-3 text-neutral-400" /> Position X</span>
            <span className="text-amber-400">{calibration.xPercent}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="0.5"
            value={calibration.xPercent}
            onChange={e => update({ xPercent: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 cursor-ew-resize"
          />
        </div>

        {/* Y Position */}
        <div>
          <div className="flex justify-between font-mono text-[11px] text-neutral-300 mb-1">
            <span className="flex items-center gap-1"><Move className="w-3 h-3 text-neutral-400" /> Position Y</span>
            <span className="text-amber-400">{calibration.yPercent}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="85"
            step="0.5"
            value={calibration.yPercent}
            onChange={e => update({ yPercent: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 cursor-ns-resize"
          />
        </div>

        {/* Width & Height */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between font-mono text-[11px] text-neutral-300 mb-1">
              <span>Width</span>
              <span className="text-amber-400">{calibration.widthPx}px</span>
            </div>
            <input
              type="range"
              min="200"
              max="600"
              step="5"
              value={calibration.widthPx}
              onChange={e => update({ widthPx: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-400"
            />
          </div>
          <div>
            <div className="flex justify-between font-mono text-[11px] text-neutral-300 mb-1">
              <span>Height</span>
              <span className="text-amber-400">{calibration.heightPx}px</span>
            </div>
            <input
              type="range"
              min="140"
              max="450"
              step="5"
              value={calibration.heightPx}
              onChange={e => update({ heightPx: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        {/* Rim Diameter */}
        <div>
          <div className="flex justify-between font-mono text-[11px] text-neutral-300 mb-1">
            <span>Rim Diameter Target</span>
            <span className="text-amber-400">{calibration.rimDiameterPx}px</span>
          </div>
          <input
            type="range"
            min="70"
            max="220"
            step="2"
            value={calibration.rimDiameterPx}
            onChange={e => update({ rimDiameterPx: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-400"
          />
        </div>

        {/* Rotation */}
        <div>
          <div className="flex justify-between font-mono text-[11px] text-neutral-300 mb-1">
            <span>Rotation Tilt</span>
            <span className="text-amber-400">{calibration.rotationDeg}°</span>
          </div>
          <input
            type="range"
            min="-15"
            max="15"
            step="0.5"
            value={calibration.rotationDeg}
            onChange={e => update({ rotationDeg: parseFloat(e.target.value) })}
            className="w-full accent-amber-400"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
        <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
          <span className="flex items-center gap-1.5 text-[11px] font-mono">
            {calibration.guideVisible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-500" />}
            Show Alignment Crosshairs
          </span>
          <input
            type="checkbox"
            checked={calibration.guideVisible}
            onChange={e => update({ guideVisible: e.target.checked })}
            className="rounded accent-amber-400"
          />
        </label>

        <label className="flex items-center justify-between text-neutral-300 cursor-pointer">
          <span className="flex items-center gap-1.5 text-[11px] font-mono">
            Project Virtual Backboard
          </span>
          <input
            type="checkbox"
            checked={calibration.renderVirtualBoard}
            onChange={e => update({ renderVirtualBoard: e.target.checked })}
            className="rounded accent-amber-400"
          />
        </label>
      </div>

      {/* Bottom Preset / Reset */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-[11px]">
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>

        <div className="flex gap-1.5 font-mono">
          <button
            onClick={() => update({ xPercent: 50, yPercent: 25 })}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800 text-neutral-300"
            title="Snap to Center Top"
          >
            Center
          </button>
          <button
            onClick={() => update({ widthPx: 395, heightPx: 250, rimDiameterPx: 118 })}
            className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800 text-neutral-300"
            title="Standard Scale"
          >
            Std Scale
          </button>
        </div>
      </div>
    </div>
  );
};
