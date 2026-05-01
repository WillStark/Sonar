import type { LenderLead } from './types';

const BASE = 'https://api.tokenfactory.nebius.com/v1';
const MODELS = {
  big: 'meta-llama/Llama-3.3-70B-Instruct',
  fast: 'meta-llama/Meta-Llama-3.1-8B-Instruct'
};

export async function chat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  model: string = MODELS.fast
): Promise<string> {
  const key = process.env.NEBIUS_API_KEY;
  if (!key) throw new Error('Missing NEBIUS_API_KEY');
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.4 })
  });
  if (!res.ok) throw new Error(`Nebius failed: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

export async function enrichLender(lead: LenderLead): Promise<{ pain_hypothesis: string }> {
  if (!process.env.NEBIUS_API_KEY) {
    return { pain_hypothesis: synthPain(lead) };
  }
  const sys = `You are a B2B GTM analyst for Callbook, a voice-AI product for lenders. Given a lender lead, write ONE crisp pain hypothesis (1-2 sentences) tying their public signal to a Callbook value prop (recover more on charge-offs, scale collections, reduce ops headcount). Plain text, no preamble.`;
  const user = `Lead: ${lead.person.name}, ${lead.person.title} at ${lead.company.name} (${lead.company.industry}). Public signal: ${lead.company.recentSignal ?? 'n/a'}.`;
  const txt = await chat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    MODELS.fast
  );
  return { pain_hypothesis: txt.trim() || synthPain(lead) };
}

export async function draftOutreach(
  lead: LenderLead
): Promise<Pick<LenderLead, 'email' | 'linkedin' | 'voice'>> {
  if (!process.env.NEBIUS_API_KEY) {
    return synthOutreach(lead);
  }
  const sys = `You write B2B outreach for Callbook (voice-AI for lenders). Output STRICT JSON with keys: email{subject,body}, linkedin{dm}, voice{script}. The voice.script must be under 60 words, sound like a friendly human, name the prospect, reference the public signal. The email body is 80-120 words. The LinkedIn dm is one paragraph under 50 words.`;
  const user = `Prospect: ${lead.person.name}, ${lead.person.title} at ${lead.company.name}. Pain hypothesis: ${lead.pain_hypothesis}. Public signal: ${lead.company.recentSignal ?? 'n/a'}. Return JSON only.`;
  const txt = await chat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    MODELS.big
  );
  try {
    const json = JSON.parse(extractJson(txt));
    const out: Pick<LenderLead, 'email' | 'linkedin' | 'voice'> = {
      email: { subject: String(json.email?.subject ?? ''), body: String(json.email?.body ?? '') },
      linkedin: { dm: String(json.linkedin?.dm ?? '') },
      voice: {
        script: String(json.voice?.script ?? ''),
        audioUrl: lead.voice.audioUrl,
        durationMs: lead.voice.durationMs
      }
    };
    if (!out.voice.script) out.voice.script = synthOutreach(lead).voice.script;
    if (!out.email.subject || !out.email.body) {
      const fallback = synthOutreach(lead);
      out.email = fallback.email;
    }
    if (!out.linkedin.dm) out.linkedin = synthOutreach(lead).linkedin;
    return out;
  } catch {
    return synthOutreach(lead);
  }
}

function extractJson(s: string): string {
  const m = s.match(/\{[\s\S]*\}/);
  return m ? m[0] : '{}';
}

function synthPain(lead: LenderLead): string {
  const signal = lead.company.recentSignal || 'rising charge-offs in consumer credit';
  return `${lead.company.name} is leaning into ${signal}, which puts pressure on ${lead.person.title.toLowerCase()} workflows. A voice-AI layer can recover 12–15% more on aged receivables without expanding the ops team.`;
}

function synthOutreach(lead: LenderLead): Pick<LenderLead, 'email' | 'linkedin' | 'voice'> {
  const first = lead.person.name.split(' ')[0];
  const co = lead.company.name;
  const signal = lead.company.recentSignal || 'recent moves in your portfolio';
  return {
    email: {
      subject: `Quick idea for ${co}'s collections team`,
      body: `Hi ${first},\n\nNoticed ${signal} — congrats on the momentum. We help lenders like ${co} recover 12–15% more on aged receivables with AI voice agents that make the calls your team can't get to. Worth a 15-minute look?\n\n— Callbook`
    },
    linkedin: {
      dm: `Hi ${first} — saw ${signal} at ${co}. Curious if your team has thought about voice-AI for collections. We're seeing 12–15% lift on aged receivables. Quick chat next week?`
    },
    voice: {
      script: `Hi ${first}, quick voice memo from Callbook. I noticed ${signal} at ${co} — feels like exactly the moment a voice-AI layer on your collections stack would compound. We help lenders like yours recover twelve to fifteen percent more without growing ops. Worth sixty seconds next week?`,
      audioUrl: lead.voice.audioUrl,
      durationMs: lead.voice.durationMs
    }
  };
}
