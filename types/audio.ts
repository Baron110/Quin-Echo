export type PresetName =
  | 'normal'
  | 'deep'
  | 'female'
  | 'robot'
  | 'echo'
  | 'radio'
  | 'ghost'
  | 'alien';

export interface VoicePreset {
  name: PresetName;
  label: string;
  emoji: string;
  description: string;
  pitch: number;      // semitones, -12 to +12
  formant: number;    // multiplier, 0.5 to 2.0
  distortion: number; // 0 to 1
  reverb: number;     // 0 to 1
  volume: number;     // 0 to 1.5
}

export interface AudioSettings {
  pitch: number;
  formant: number;
  distortion: number;
  reverb: number;
  volume: number;
}

export type ProcessorStatus = 'idle' | 'active' | 'error';
