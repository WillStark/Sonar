export function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export function synthDemoWav(durationMs: number, seed = 1): Buffer {
  const sampleRate = 24000;
  const samples = Math.floor((sampleRate * durationMs) / 1000);
  const pcm = Buffer.alloc(samples * 2);
  const baseFreq = 180 + (seed % 7) * 12;
  const vibratoFreq = 4 + (seed % 3);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t * 6) * Math.min(1, (durationMs / 1000 - t) * 4);
    const vibrato = 1 + 0.04 * Math.sin(2 * Math.PI * vibratoFreq * t);
    const fundamental = Math.sin(2 * Math.PI * baseFreq * vibrato * t) * 0.5;
    const second = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.18;
    const third = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.08;
    const noise = (Math.random() - 0.5) * 0.05;
    const speech = (fundamental + second + third + noise) * env;
    const wordRate = 3.5;
    const wordEnv = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.PI * wordRate * t));
    const sample = Math.max(-1, Math.min(1, speech * wordEnv * 0.9));
    pcm.writeInt16LE(Math.round(sample * 32000), i * 2);
  }

  return pcmToWav(pcm, sampleRate);
}
