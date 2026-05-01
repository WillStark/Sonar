import fs from 'node:fs/promises';
import path from 'node:path';
import { pcmToWav, synthDemoWav } from './wav';

export { pcmToWav } from './wav';

const VOICE_DIR = path.join(process.cwd(), 'data', 'voice');

export type VoiceResult = { audioUrl: string; durationMs: number; filepath: string; fallback?: boolean };

export async function generateVoice(params: {
  text: string;
  voiceId?: string;
  leadId: string;
}): Promise<VoiceResult> {
  await fs.mkdir(VOICE_DIR, { recursive: true });
  const filepath = path.join(VOICE_DIR, `${params.leadId}.wav`);
  const audioUrl = `/api/voice/${params.leadId}`;

  const key = process.env.KUGELAUDIO_API_KEY;
  if (!key) {
    const wordCount = params.text.split(/\s+/).filter(Boolean).length;
    const durationMs = Math.max(2500, Math.round((wordCount / 2.6) * 1000));
    const wav = synthDemoWav(durationMs, hashSeed(params.leadId));
    await fs.writeFile(filepath, wav);
    return { audioUrl, durationMs, filepath, fallback: true };
  }

  const res = await fetch('https://api.kugelaudio.com/v1/tts/generate', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      text: params.text,
      model_id: 'kugel-1-turbo',
      voice_id: params.voiceId ?? 'business_us_1',
      language: 'en-US'
    })
  });

  if (!res.ok) throw new Error(`KugelAudio failed: ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const isWav = buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF';
  const wav = isWav ? buf : pcmToWav(buf);
  await fs.writeFile(filepath, wav);
  const durationMs = estimateDurationMs(wav);
  return { audioUrl, durationMs, filepath };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function estimateDurationMs(wav: Buffer): number {
  if (wav.length < 44) return 0;
  const sampleRate = wav.readUInt32LE(24);
  const bitsPerSample = wav.readUInt16LE(34);
  const channels = wav.readUInt16LE(22);
  const dataLen = wav.length - 44;
  const samples = dataLen / (channels * (bitsPerSample / 8));
  return Math.round((samples / sampleRate) * 1000);
}
