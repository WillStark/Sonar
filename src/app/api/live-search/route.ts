import fs from 'node:fs/promises';
import path from 'node:path';
import { callbookICP } from '../../../lib/icp-callbook';
import { searchSignals, type SignalHit } from '../../../lib/sources/google';
import { scoreLenderFit } from '../../../lib/scoring-lender';
import { draftOutreach, enrichLender } from '../../../lib/nebius';
import { generateVoice } from '../../../lib/kugelaudio';
import type { LenderLead, IcpInput } from '../../../lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function eventLine(obj: unknown) {
  return `${JSON.stringify(obj)}\n`;
}

function parsePerson(hit: SignalHit, fallback: string): { name: string; title: string; companyName: string } {
  const raw = (hit.title || '').trim();
  const split = raw.split(/[—\-·|]/).map((s) => s.trim()).filter(Boolean);
  let name = split[0] || fallback;
  let title = '';
  let companyName = '';

  if (split.length >= 2) {
    const tail = split.slice(1).join(' — ');
    const atIdx = tail.toLowerCase().indexOf(' at ');
    if (atIdx >= 0) {
      title = tail.slice(0, atIdx).replace(/^,\s*/, '').trim();
      companyName = tail.slice(atIdx + 4).trim();
    } else {
      title = tail.trim();
    }
  }

  if (name.length > 60) name = fallback;
  if (!title) title = 'Decision Maker';
  if (!companyName) companyName = 'Unknown Lender';
  return { name, title, companyName };
}

function inferIndustry(text: string, fallback: string): string {
  const t = text.toLowerCase();
  if (/bnpl|buy now/.test(t)) return 'BNPL';
  if (/auto/.test(t)) return 'auto lending';
  if (/student/.test(t)) return 'student lending';
  if (/credit|card/.test(t)) return 'consumer credit';
  return fallback;
}

async function loadDemoLeads(): Promise<LenderLead[] | null> {
  try {
    const file = path.join(process.cwd(), 'data', 'demo', 'leads.json');
    const txt = await fs.readFile(file, 'utf8');
    return JSON.parse(txt) as LenderLead[];
  } catch {
    return null;
  }
}

async function ensureVoiceFile(lead: LenderLead): Promise<void> {
  const file = path.join(process.cwd(), 'data', 'voice', `${lead.id}.wav`);
  try {
    await fs.access(file);
    return;
  } catch {
    // missing — regenerate via the same synth used by demo:prepare
    await generateVoice({ text: lead.voice.script, leadId: lead.id });
  }
}

export async function POST(req: Request): Promise<Response> {
  let icp: IcpInput;
  try {
    icp = (await req.json()) as IcpInput;
  } catch {
    icp = { industry: 'consumer credit', title: 'VP Collections', geography: 'US' };
  }

  const usingMocks =
    !process.env.APIFY_TOKEN || !process.env.NEBIUS_API_KEY || !process.env.KUGELAUDIO_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(new TextEncoder().encode(eventLine(obj)));
      try {
        if (usingMocks) {
          await runDemo(send, icp);
        } else {
          await runLive(send, icp);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'unknown error';
        send({ type: 'error', error: msg });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no'
    }
  });
}

async function runDemo(send: (o: unknown) => void, icp: IcpInput) {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  send({ type: 'phase', phase: 'crawl_start' });
  await wait(450);

  const seeds = await loadDemoLeads();
  if (!seeds || seeds.length === 0) {
    send({
      type: 'error',
      error: 'No demo data found. Run `npm run demo:prepare` to seed data/demo/leads.json.'
    });
    return;
  }

  send({ type: 'phase', phase: 'crawl_done' });
  await wait(300);
  send({ type: 'phase', phase: 'score_done' });
  await wait(300);
  send({ type: 'phase', phase: 'enrich_start' });

  for (let i = 0; i < seeds.length; i++) {
    const lead = seeds[i];
    await ensureVoiceFile(lead);
    await wait(500 + i * 250);
    send({ type: 'lead_partial', lead });
    send({ type: 'enrich_progress', done: i + 1, total: seeds.length });
  }

  send({
    type: 'done',
    leads: seeds,
    stats: {
      sourced: 12,
      scored: seeds.length,
      shipped: seeds.length,
      mode: 'demo',
      icp: `${icp.industry} · ${icp.title} · ${icp.geography}`
    },
    warning:
      'Demo mode — running on cached leads + synthesized voice. Set APIFY_TOKEN, NEBIUS_API_KEY, and KUGELAUDIO_API_KEY for live mode.'
  });
}

async function runLive(send: (o: unknown) => void, icp: IcpInput) {
  send({ type: 'phase', phase: 'crawl_start' });

  const queries = [
    `"${icp.title}" "${icp.industry}" site:linkedin.com/in`,
    `"${icp.industry}" lender "${icp.geography}" "recent funding"`,
    `"CFPB complaint" "${icp.industry}"`,
    ...callbookICP.queries
  ];
  const raw = await searchSignals(queries);
  send({ type: 'phase', phase: 'crawl_done' });

  const candidates = raw.slice(0, 6).map((hit, i) => {
    const parsed = parsePerson(hit, `Lead ${i + 1}`);
    const industry = inferIndustry(`${hit.title} ${hit.description}`, icp.industry);
    const score = scoreLenderFit({
      title: parsed.title,
      industry,
      recentSignal: hit.description,
      geography: icp.geography
    });
    const lead: LenderLead = {
      id: `lead_${i + 1}`,
      person: { name: parsed.name, title: parsed.title },
      company: { name: parsed.companyName, industry, recentSignal: hit.description },
      fit_score: score.fit_score,
      fit_reasons: score.reasons,
      pain_hypothesis: '',
      voice: { script: '', audioUrl: '', durationMs: 0 },
      email: { subject: '', body: '' },
      linkedin: { dm: '' },
      sources: [hit.url || ''],
      enriched_at: new Date().toISOString()
    };
    return lead;
  });

  candidates.sort((a, b) => b.fit_score - a.fit_score);
  const top = candidates.slice(0, 3);
  send({ type: 'phase', phase: 'score_done' });
  send({ type: 'phase', phase: 'enrich_start' });

  for (let i = 0; i < top.length; i++) {
    const lead = top[i];
    try {
      lead.pain_hypothesis = (await enrichLender(lead)).pain_hypothesis;
      const outreach = await draftOutreach(lead);
      lead.email = outreach.email;
      lead.linkedin = outreach.linkedin;
      lead.voice.script = outreach.voice.script;
      const voice = await generateVoice({
        text: lead.voice.script,
        voiceId: 'business_us_1',
        leadId: lead.id
      });
      lead.voice.audioUrl = voice.audioUrl;
      lead.voice.durationMs = voice.durationMs;
      send({ type: 'lead_partial', lead });
      send({ type: 'enrich_progress', done: i + 1, total: top.length });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'enrichment error';
      send({ type: 'error', error: `${lead.id}: ${msg}` });
    }
  }

  send({
    type: 'done',
    leads: top,
    stats: {
      sourced: raw.length,
      scored: candidates.length,
      shipped: top.length,
      mode: 'live'
    }
  });
}
