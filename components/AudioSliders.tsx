'use client';

interface AudioSlidersProps {
  pitch: number;
  reverb: number;
  distortion: number;
  volume: number;
  onPitch: (v: number) => void;
  onReverb: (v: number) => void;
  onDistortion: (v: number) => void;
  onVolume: (v: number) => void;
  disabled?: boolean;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold uppercase tracking-widest text-gray-600">
          {label}
        </label>
        <span className="text-sm font-mono text-black">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={disabled ? 'opacity-40 cursor-not-allowed' : ''}
      />
    </div>
  );
}

export default function AudioSliders({
  pitch,
  reverb,
  distortion,
  volume,
  onPitch,
  onReverb,
  onDistortion,
  onVolume,
  disabled,
}: AudioSlidersProps) {
  return (
    <div className="space-y-5">
      <Slider
        label="Pitch"
        value={pitch}
        min={-12}
        max={12}
        step={0.5}
        displayValue={pitch === 0 ? '0 st' : `${pitch > 0 ? '+' : ''}${pitch} st`}
        onChange={onPitch}
        disabled={disabled}
      />
      <Slider
        label="Reverb"
        value={reverb}
        min={0}
        max={1}
        step={0.01}
        displayValue={`${Math.round(reverb * 100)}%`}
        onChange={onReverb}
        disabled={disabled}
      />
      <Slider
        label="Distortion"
        value={distortion}
        min={0}
        max={1}
        step={0.01}
        displayValue={`${Math.round(distortion * 100)}%`}
        onChange={onDistortion}
        disabled={disabled}
      />
      <Slider
        label="Volume"
        value={volume}
        min={0}
        max={1.5}
        step={0.01}
        displayValue={`${Math.round(volume * 100)}%`}
        onChange={onVolume}
        disabled={disabled}
      />
    </div>
  );
}
