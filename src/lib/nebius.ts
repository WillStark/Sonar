import type { LenderLead } from './types';

const BASE = 'https://api.tokenfactory.nebius.com/v1';
const MODELS = ['meta-llama/Llama-3.3-70B-Instruct', 'meta-llama/Meta-Llama-3.1-8B-Instruct'];

export async function chat(messages: Array<{ role: string; content: string }>, model = MODELS[1]) {
  const key = process.env.NEBIUS_API_KEY;
  if (!key) throw new Error('Missing NEBIUS_API_KEY');
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.3 })
  });
  if (!res.ok) throw new Error(`Nebius failed: ${res.status}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

export async function enrichLender(lead: LenderLead): Promise<Pick<LenderLead, 'pain_hypothesis'>> {
  const prompt = `Generate a 1-2 sentence lender pain hypothesis for ${lead.person.name} at ${lead.company.name}.`;
  return { pain_hypothesis: await chat([{ role: 'user', content: prompt }]) };
}

export async function draftOutreach(lead: LenderLead): Promise<Pick<LenderLead, 'email' | 'linkedin' | 'voice'>> {
  const prompt = `Return JSON with email.subject, email.body, linkedin.dm, voice.script for ${lead.person.name} at ${lead.company.name}.`;
  const txt = await chat([{ role: 'user', content: prompt }], MODELS[0]);
  const parsed = JSON.parse(txt);
  return {
    email: parsed.email,
    linkedin: parsed.linkedin,
    voice: { script: parsed.voice.script, audioUrl: lead.voice.audioUrl, durationMs: lead.voice.durationMs }
  };
}
