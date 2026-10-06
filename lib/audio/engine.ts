/**
 * Quin-Echo Audio Engine
 * Manages Web Audio API context, AudioWorklet, reverb, and routing
 */

import type { VoicePreset, AudioSettings, ProcessorStatus } from '@/types/audio';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private outputGainNode: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private useWorklet = false;

  public status: ProcessorStatus = 'idle';
  public onStatusChange?: (s: ProcessorStatus) => void;

  private setStatus(s: ProcessorStatus) {
    this.status = s;
    this.onStatusChange?.(s);
  }

  async start(): Promise<MediaStream> {
    try {
      this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });

      // Get mic — disable all browser processing so we get raw audio
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      this.sourceNode = this.ctx.createMediaStreamSource(this.stream);

      // Try to load AudioWorklet for high-quality processing
      try {
        await this.ctx.audioWorklet.addModule('/worklets/voice-processor.js');
        this.workletNode = new AudioWorkletNode(this.ctx, 'voice-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });
        this.useWorklet = true;
      } catch {
        console.warn('AudioWorklet unavailable, using passthrough');
        this.useWorklet = false;
      }

      // Reverb via convolution
      this.reverbNode = this.ctx.createConvolver();
      this.reverbGainNode = this.ctx.createGain();
      this.dryGainNode = this.ctx.createGain();
      this.outputGainNode = this.ctx.createGain();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Generate impulse response for reverb
      await this.generateReverb(0.5);

      // Virtual output (what VB-Cable or BlackHole picks up)
      this.destinationNode = this.ctx.createMediaStreamDestination();

      // Routing:
      // source → worklet → [dry gain + reverb(wet gain)] → output gain → analyser → destination
      const processingNode = this.useWorklet ? this.workletNode! : this.sourceNode;

      if (this.useWorklet) {
        this.sourceNode.connect(this.workletNode!);
      }

      // Dry path
      processingNode.connect(this.dryGainNode);
      this.dryGainNode.connect(this.outputGainNode);

      // Wet (reverb) path
      processingNode.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbGainNode);
      this.reverbGainNode.connect(this.outputGainNode);

      // Output
      this.outputGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.destinationNode);
      // Also route to speakers so user can monitor
      this.analyserNode.connect(this.ctx.destination);

      this.setStatus('active');
      return this.destinationNode.stream;
    } catch (err) {
      this.setStatus('error');
      throw err;
    }
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.ctx = null;
    this.stream = null;
    this.sourceNode = null;
    this.workletNode = null;
    this.analyserNode = null;
    this.reverbNode = null;
    this.reverbGainNode = null;
    this.dryGainNode = null;
    this.outputGainNode = null;
    this.destinationNode = null;
    this.useWorklet = false;
    this.setStatus('idle');
  }

  applyPreset(preset: VoicePreset) {
    if (!this.ctx) return;

    // Send to worklet
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'preset',
        preset: {
          pitch: preset.pitch,
          formant: preset.formant,
          distortion: preset.distortion,
          volume: preset.volume,
        },
      });
    }

    // Reverb mix
    this.updateReverb(preset.reverb);
  }

  updateSettings(settings: Partial<AudioSettings>) {
    if (!this.ctx) return;

    if (settings.pitch !== undefined && this.workletNode) {
      this.workletNode.port.postMessage({ type: 'pitch', value: settings.pitch });
    }
    if (settings.formant !== undefined && this.workletNode) {
      this.workletNode.port.postMessage({ type: 'formant', value: settings.formant });
    }
    if (settings.distortion !== undefined && this.workletNode) {
      this.workletNode.port.postMessage({ type: 'distortion', value: settings.distortion });
    }
    if (settings.volume !== undefined && this.outputGainNode) {
      this.outputGainNode.gain.setTargetAtTime(settings.volume, this.ctx.currentTime, 0.01);
    }
    if (settings.reverb !== undefined) {
      this.updateReverb(settings.reverb);
    }
  }

  private updateReverb(amount: number) {
    if (!this.ctx || !this.dryGainNode || !this.reverbGainNode) return;
    const t = this.ctx.currentTime;
    this.dryGainNode.gain.setTargetAtTime(1 - amount * 0.5, t, 0.05);
    this.reverbGainNode.gain.setTargetAtTime(amount, t, 0.05);
  }

  private async generateReverb(duration: number) {
    if (!this.ctx || !this.reverbNode) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const ir = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = ir.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.reverbNode.buffer = ir;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  isUsingWorklet(): boolean {
    return this.useWorklet;
  }
}

// Singleton
let engine: AudioEngine | null = null;
export function getEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
