/**
 * Quin-Echo Voice Processor — AudioWorklet
 * Runs in a dedicated audio thread (no main-thread jank)
 * Implements: pitch shift via phase vocoder, formant shift, distortion
 */

const FFT_SIZE = 2048;
const HOP_SIZE = 512;
const OVERLAP = FFT_SIZE / HOP_SIZE;

class VoiceProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    this.pitchFactor = 1.0;     // 1.0 = no change
    this.formantShift = 1.0;    // 1.0 = no change
    this.distortion = 0;        // 0-1
    this.volume = 1.0;

    // Phase vocoder state
    this.inputBuffer = new Float32Array(FFT_SIZE);
    this.outputBuffer = new Float32Array(FFT_SIZE * 2);
    this.prevInputPhase = new Float32Array(FFT_SIZE);
    this.prevOutputPhase = new Float32Array(FFT_SIZE);
    this.analysisHop = HOP_SIZE;
    this.synthesisHop = HOP_SIZE;
    this.inputWritePos = 0;
    this.outputReadPos = 0;
    this.outputWritePos = 0;
    this.frameCount = 0;

    // Hann window
    this.window = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
    }

    this.port.onmessage = (e) => {
      const { type, value } = e.data;
      if (type === 'pitch') this.pitchFactor = Math.pow(2, value / 12);
      if (type === 'formant') this.formantShift = value;
      if (type === 'distortion') this.distortion = value;
      if (type === 'volume') this.volume = value;
      if (type === 'preset') this.applyPreset(e.data.preset);
    };
  }

  applyPreset(preset) {
    if (preset.pitch !== undefined) this.pitchFactor = Math.pow(2, preset.pitch / 12);
    if (preset.formant !== undefined) this.formantShift = preset.formant;
    if (preset.distortion !== undefined) this.distortion = preset.distortion;
    if (preset.volume !== undefined) this.volume = preset.volume;
  }

  /**
   * Soft-clip waveshaper distortion
   */
  applyDistortion(sample, amount) {
    if (amount < 0.01) return sample;
    const k = amount * 200;
    const deg = Math.PI / 180;
    return ((3 + k) * sample * 20 * deg) / (Math.PI + k * Math.abs(sample));
  }

  /**
   * Simple FFT (Cooley-Tukey, in-place)
   * real[] and imag[] are modified in-place
   */
  fft(real, imag, inverse) {
    const n = real.length;
    // Bit-reversal permutation
    let j = 0;
    for (let i = 1; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }
    // FFT
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (2 * Math.PI) / len * (inverse ? -1 : 1);
      const wReal = Math.cos(ang);
      const wImag = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let curReal = 1, curImag = 0;
        for (let k = 0; k < len / 2; k++) {
          const uReal = real[i + k];
          const uImag = imag[i + k];
          const vReal = real[i + k + len / 2] * curReal - imag[i + k + len / 2] * curImag;
          const vImag = real[i + k + len / 2] * curImag + imag[i + k + len / 2] * curReal;
          real[i + k] = uReal + vReal;
          imag[i + k] = uImag + vImag;
          real[i + k + len / 2] = uReal - vReal;
          imag[i + k + len / 2] = uImag - vImag;
          const nextCurReal = curReal * wReal - curImag * wImag;
          curImag = curReal * wImag + curImag * wReal;
          curReal = nextCurReal;
        }
      }
    }
    if (inverse) {
      for (let i = 0; i < n; i++) {
        real[i] /= n;
        imag[i] /= n;
      }
    }
  }

  /**
   * Phase vocoder pitch shift on one frame
   */
  processFrame(frame) {
    const n = FFT_SIZE;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);

    // Apply window
    for (let i = 0; i < n; i++) {
      real[i] = frame[i] * this.window[i];
    }

    // Forward FFT
    this.fft(real, imag, false);

    // Phase vocoder: compute true frequency, shift pitch
    const outReal = new Float32Array(n);
    const outImag = new Float32Array(n);
    const analysisFreqPerBin = (2 * Math.PI * this.analysisHop) / n;

    for (let k = 0; k < n / 2; k++) {
      const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
      const phase = Math.atan2(imag[k], real[k]);

      // Phase difference
      let phaseDiff = phase - this.prevInputPhase[k];
      this.prevInputPhase[k] = phase;

      // Remove expected phase
      phaseDiff -= k * analysisFreqPerBin;

      // Wrap to [-π, π]
      phaseDiff = phaseDiff - 2 * Math.PI * Math.round(phaseDiff / (2 * Math.PI));

      // True frequency
      const trueFreq = k * analysisFreqPerBin / this.analysisHop + phaseDiff / this.analysisHop;

      // Target bin after pitch shift
      const targetBin = Math.round(k * this.pitchFactor);
      if (targetBin >= 0 && targetBin < n / 2) {
        // Accumulate output phase
        this.prevOutputPhase[targetBin] += trueFreq * this.pitchFactor * this.synthesisHop;
        const outPhase = this.prevOutputPhase[targetBin];
        outReal[targetBin] += mag * Math.cos(outPhase);
        outImag[targetBin] += mag * Math.sin(outPhase);
        // Mirror
        outReal[n - targetBin] = outReal[targetBin];
        outImag[n - targetBin] = -outImag[targetBin];
      }
    }

    // Inverse FFT
    this.fft(outReal, outImag, true);

    // Apply window and overlap-add scale
    const scale = 2 / (0.375 * n / this.synthesisHop);
    const result = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = outReal[i] * this.window[i] * scale;
    }

    return result;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) return true;

    const inputData = input[0];
    const outputData = output[0];
    const blockSize = inputData.length;

    // Write input into circular buffer
    for (let i = 0; i < blockSize; i++) {
      this.inputBuffer[this.inputWritePos % FFT_SIZE] = inputData[i];
      this.inputWritePos++;
    }

    // Process when we have enough input
    this.frameCount += blockSize;
    if (this.frameCount >= this.analysisHop) {
      this.frameCount -= this.analysisHop;

      // Extract frame
      const frame = new Float32Array(FFT_SIZE);
      const startPos = this.inputWritePos - FFT_SIZE;
      for (let i = 0; i < FFT_SIZE; i++) {
        const idx = (startPos + i + FFT_SIZE * 100) % FFT_SIZE;
        frame[i] = this.inputBuffer[idx];
      }

      // Process frame through phase vocoder
      const processed = this.processFrame(frame);

      // Overlap-add into output buffer
      for (let i = 0; i < FFT_SIZE; i++) {
        const idx = (this.outputWritePos + i) % (FFT_SIZE * 2);
        this.outputBuffer[idx] += processed[i];
      }
      this.outputWritePos = (this.outputWritePos + this.synthesisHop) % (FFT_SIZE * 2);
    }

    // Read output
    for (let i = 0; i < blockSize; i++) {
      let sample = this.outputBuffer[this.outputReadPos % (FFT_SIZE * 2)];
      this.outputBuffer[this.outputReadPos % (FFT_SIZE * 2)] = 0;
      this.outputReadPos = (this.outputReadPos + 1) % (FFT_SIZE * 2);

      // Apply distortion
      if (this.distortion > 0.01) {
        sample = this.applyDistortion(sample, this.distortion);
      }

      // Apply volume
      sample *= this.volume;

      // Soft clip to prevent clipping
      outputData[i] = Math.tanh(sample);
    }

    return true;
  }
}

registerProcessor('voice-processor', VoiceProcessor);
