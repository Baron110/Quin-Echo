// Dual crossfaded delay lines: pitch effects with continuous real-time output.
class VoiceProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(16384);
    this.write = 0;
    this.phase = 0;
    this.ratio = 1;
    this.distortion = 0;
    this.tone = 1;
    this.low = 0;
    this.port.onmessage = ({ data }) => {
      const settings = data.type === 'preset' ? data.preset : { [data.type]: data.value };
      if (settings.pitch !== undefined) this.ratio = Math.pow(2, settings.pitch / 12);
      if (settings.distortion !== undefined) this.distortion = settings.distortion;
      if (settings.formant !== undefined) this.tone = settings.formant;
    };
  }
  read(delay) {
    const position = (this.write - delay + this.buffer.length) % this.buffer.length;
    const index = Math.floor(position);
    const fraction = position - index;
    return this.buffer[index] * (1 - fraction) + this.buffer[(index + 1) % this.buffer.length] * fraction;
  }
  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!output) return true;
    const window = sampleRate * 0.04;
    for (let i = 0; i < output.length; i++) {
      const dry = input?.[i] ?? 0;
      this.buffer[this.write] = dry;
      let value = dry;
      if (Math.abs(this.ratio - 1) > 0.001) {
        const second = (this.phase + 0.5) % 1;
        const weight = 0.5 - 0.5 * Math.cos(2 * Math.PI * this.phase);
        value = this.read(32 + this.phase * window) * weight + this.read(32 + second * window) * (1 - weight);
        this.phase = (this.phase + (1 - this.ratio) / window + 1) % 1;
      }
      // Tone coloration, not independent vocal formant reconstruction.
      this.low += 0.12 * (value - this.low);
      if (this.tone < 1) value = value * this.tone + this.low * (1 - this.tone);
      if (this.tone > 1) value += (value - this.low) * (this.tone - 1);
      if (this.distortion > 0) {
        const drive = 1 + this.distortion * 12;
        value = Math.tanh(value * drive) / drive ** 0.5;
      }
      output[i] = Math.max(-1, Math.min(1, value));
      this.write = (this.write + 1) % this.buffer.length;
    }
    return true;
  }
}
registerProcessor('voice-processor', VoiceProcessor);
