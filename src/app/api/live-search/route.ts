import { callbookICP } from '../../../lib/icp-callbook';
import { searchSignals } from '../../../lib/sources/google';
import { scoreLenderFit } from '../../../lib/scoring-lender';
import { draftOutreach, enrichLender } from '../../../lib/nebius';
import { generateVoice } from '../../../lib/kugelaudio';
import type { LenderLead } from '../../../lib/types';

export const maxDuration = 300;

function eventLine(obj: unknown) { return `${JSON.stringify(obj)}\n`; }

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(eventLine({ type: 'phase', phase: 'crawl_start' }));
        const raw = await searchSignals(callbookICP.queries);
        controller.enqueue(eventLine({ type: 'phase', phase: 'crawl_done' }));

        const leads: LenderLead[] = raw.slice(0, 3).map((r: any, i: number) => {
          const score = scoreLenderFit({ title: r.title, industry: 'consumer credit', recentSignal: r.description, geography: 'US' });
          return {
            id: `lead_${i+1}`,
            person: { name: (r.title || 'Unknown').split(' - ')[0], title: 'Decision Maker' },
            company: { name: 'Unknown Lender', industry: 'consumer credit', recentSignal: r.description },
            fit_score: score.fit_score,
            fit_reasons: score.reasons,
            pain_hypothesis: '',
            voice: { script: '', audioUrl: '', durationMs: 0 },
            email: { subject: '', body: '' },
            linkedin: { dm: '' },
            sources: [r.url || ''],
            enriched_at: new Date().toISOString()
          };
        });
        controller.enqueue(eventLine({ type: 'phase', phase: 'score_done' }));
        controller.enqueue(eventLine({ type: 'phase', phase: 'enrich_start' }));

        for (let i = 0; i < leads.length; i++) {
          leads[i].pain_hypothesis = (await enrichLender(leads[i])).pain_hypothesis;
          const outreach = await draftOutreach(leads[i]);
          leads[i].email = outreach.email;
          leads[i].linkedin = outreach.linkedin;
          leads[i].voice.script = outreach.voice.script;
          const voice = await generateVoice({ text: leads[i].voice.script, voiceId: 'business_us_1', leadId: leads[i].id });
          leads[i].voice.audioUrl = voice.audioUrl;
          leads[i].voice.durationMs = voice.durationMs;
          controller.enqueue(eventLine({ type: 'enrich_progress', done: i + 1, total: leads.length }));
        }

        controller.enqueue(eventLine({ type: 'done', leads, stats: { total: raw.length, selected: leads.length } }));
      } catch (e: any) {
        controller.enqueue(eventLine({ type: 'error', error: e?.message || 'unknown error' }));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } });
}
