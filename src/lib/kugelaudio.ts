import fs from 'node:fs/promises';

export function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const blockAlign = channels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32); header.writeUInt16LE(bitsPerSample, 34); header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function generateVoice(params: { text: string; voiceId: string; leadId: string }) {
  const key = process.env.KUGELAUDIO_API_KEY;
  if (!key) throw new Error('Missing KUGELAUDIO_API_KEY');
  const res = await fetch('https://api.kugelaudio.com/v1/tts/generate', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: params.text, model_id: 'kugel-1-turbo', voice_id: params.voiceId, language: 'en-US' })
  });
  if (!res.ok) throw new Error(`KugelAudio failed: ${res.status}`);
  const arr = Buffer.from(await res.arrayBuffer());
  const wav = pcmToWav(arr);
  await fs.mkdir('data/voice', { recursive: true });
  const filepath = `data/voice/${params.leadId}.wav`;
  await fs.writeFile(filepath, wav);
  return { audioUrl: `/api/voice/${params.leadId}`, durationMs: 0, filepath };
}
