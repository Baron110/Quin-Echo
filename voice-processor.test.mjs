import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let Processor;
vm.runInNewContext(fs.readFileSync('public/worklets/voice-processor.js', 'utf8'), {
  AudioWorkletProcessor: class { constructor() { this.port = {}; } },
  sampleRate: 48000,
  registerProcessor: (_, implementation) => { Processor = implementation; },
});
for (const pitch of [0, -6, 5]) {
  const processor = new Processor();
  processor.port.onmessage({ data: { type: 'pitch', value: pitch } });
  const samples = [];
  for (let block = 0; block < 400; block++) {
    const input = Float32Array.from({ length: 128 }, (_, i) => 0.2 * Math.sin(2 * Math.PI * 440 * (block * 128 + i) / 48000));
    const output = new Float32Array(128);
    processor.process([[input]], [[output]]);
    output.forEach((sample, i) => {
      assert(Number.isFinite(sample));
      if (!pitch) assert(Math.abs(sample - input[i]) < 1e-7);
      if (block > 100) samples.push(sample);
    });
  }
  let strongest = 0, peak = 0;
  const expected = 440 * 2 ** (pitch / 12);
  for (let frequency = Math.floor(expected - 40); frequency <= expected + 40; frequency++) {
    let real = 0, imag = 0;
    for (let i = 0; i < 24000; i++) {
      real += samples[i] * Math.cos(2 * Math.PI * frequency * i / 48000);
      imag += samples[i] * Math.sin(2 * Math.PI * frequency * i / 48000);
    }
    const power = real * real + imag * imag;
    if (power > strongest) { strongest = power; peak = frequency; }
  }
  assert(Math.abs(peak - expected) < 12, `Expected ${expected} Hz, received ${peak}`);
  console.log(`PASS ${pitch} semitones: ${peak} Hz`);
}
