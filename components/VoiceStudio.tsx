'use client';

import { useState, useCallback, useRef } from 'react';
import { getEngine } from '@/lib/audio/engine';
import { getPreset } from '@/lib/audio/presets';
import type { PresetName, AudioSettings, ProcessorStatus } from '@/types/audio';
import Visualizer from './Visualizer';
import PresetGrid from './PresetGrid';
import AudioSliders from './AudioSliders';

const DEFAULT_SETTINGS: AudioSettings = {
  pitch: 0,
  formant: 1.0,
  distortion: 0,
  reverb: 0,
  volume: 1.0,
};

export default function VoiceStudio() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<ProcessorStatus>('idle');
  const [activePreset, setActivePreset] = useState<PresetName>('normal');
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [usingWorklet, setUsingWorklet] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const engineRef = useRef(getEngine());

  const toggleMic = useCallback(async () => {
    const engine = engineRef.current;

    if (active) {
      engine.stop();
      setActive(false);
      setStatus('idle');
      setAnalyser(null);
      setUsingWorklet(false);
    } else {
      try {
        setStatus('idle');
        engine.onStatusChange = setStatus;
        await engine.start();
        engine.applyPreset(getPreset(activePreset));
        setAnalyser(engine.getAnalyser());
        setUsingWorklet(engine.isUsingWorklet());
        setActive(true);
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    }
  }, [active, activePreset]);

  const handlePresetChange = useCallback(
    (name: PresetName) => {
      setActivePreset(name);
      const preset = getPreset(name);
      setSettings({
        pitch: preset.pitch,
        formant: preset.formant,
        distortion: preset.distortion,
        reverb: preset.reverb,
        volume: preset.volume,
      });
      if (active) {
        engineRef.current.applyPreset(preset);
      }
    },
    [active],
  );

  const handleSliderChange = useCallback(
    (key: keyof AudioSettings, value: number) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        if (active) engineRef.current.updateSettings({ [key]: value });
        return next;
      });
    },
    [active],
  );

  const statusLabel =
    status === 'active'
      ? usingWorklet
        ? '⚡ Phase Vocoder Active'
        : '✓ Processing Active'
      : status === 'error'
        ? '✕ Mic Error — Check Permissions'
        : '○ Idle';

  const statusColor =
    status === 'active' ? 'text-black' : status === 'error' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className="space-y-8">
      {/* Waveform */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Waveform
          </span>
          <span className={`text-xs font-mono ${statusColor}`}>{statusLabel}</span>
        </div>
        <Visualizer analyser={analyser} active={active} />
      </div>

      {/* Mic toggle */}
      <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl">
        <div>
          <p className="font-semibold text-sm">Microphone</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {active ? 'Click to stop voice processing' : 'Click to activate voice changer'}
          </p>
        </div>
        <button
          onClick={toggleMic}
          className={`relative flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold transition-all
            ${
              active
                ? 'bg-black text-white'
                : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'
            }
          `}
        >
          {active && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
          )}
          {active ? 'Stop' : 'Start Mic'}
        </button>
      </div>

      {/* Preset grid */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
          Voice Presets
        </p>
        <PresetGrid active={activePreset} onChange={handlePresetChange} />
      </div>

      {/* Sliders */}
      <div className="p-5 border border-gray-200 rounded-xl space-y-5">
        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          Manual Controls
        </p>
        <AudioSliders
          pitch={settings.pitch}
          reverb={settings.reverb}
          distortion={settings.distortion}
          volume={settings.volume}
          onPitch={(v) => handleSliderChange('pitch', v)}
          onReverb={(v) => handleSliderChange('reverb', v)}
          onDistortion={(v) => handleSliderChange('distortion', v)}
          onVolume={(v) => handleSliderChange('volume', v)}
        />
      </div>
    </div>
  );
}
