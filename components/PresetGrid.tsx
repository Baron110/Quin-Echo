'use client';

import { PRESETS } from '@/lib/audio/presets';
import type { PresetName } from '@/types/audio';

interface PresetGridProps {
  active: PresetName;
  onChange: (name: PresetName) => void;
  disabled?: boolean;
}

export default function PresetGrid({ active, onChange, disabled }: PresetGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {PRESETS.map((preset) => (
        <button
          key={preset.name}
          onClick={() => !disabled && onChange(preset.name)}
          disabled={disabled}
          aria-pressed={active === preset.name}
          className={`preset-card flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all text-left
            ${
              active === preset.name
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-200 hover:border-gray-400'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="preset-emoji text-2xl">{preset.emoji}</span>
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-work-sans)' }}
          >
            {preset.label}
          </span>
          <span
            className={`text-[10px] leading-tight text-center ${
              active === preset.name ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            {preset.description}
          </span>
        </button>
      ))}
    </div>
  );
}
