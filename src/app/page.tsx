'use client';

import { useEffect, useState } from 'react';
import { IcpForm } from '../components/IcpForm';
import { LeadTable } from '../components/LeadTable';
import { LeadDetail } from '../components/LeadDetail';
import { Ticker, type TickerLine } from '../components/Ticker';
import type { IcpInput, LenderLead, StreamEvent } from '../lib/types';

const PHASE_COPY: Record<string, string> = {
  crawl_start: 'Pinging LinkedIn · Crunchbase · Google via Apify…',
  crawl_done: 'Candidates returned. Filtering for Callbook ICP.',
  score_done: 'Lender-fit scoring complete. Selecting top leads.',
  enrich_start: 'Nebius drafting pain hypothesis + outreach.'
};

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [leads, setLeads] = useState<LenderLead[]>([]);
  const [lines, setLines] = useState<TickerLine[]>([]);
  const [selected, setSelected] = useState<LenderLead | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const append = (text: string, tone?: TickerLine['tone']) =>
    setLines((prev) => [...prev, { ts: Date.now(), text, tone }]);

  async function runSearch(input: IcpInput) {
    setBusy(true);
    setLeads([]);
    setLines([]);
    setStats(null);
    setWarning(null);
    append(`Sending signal: ${input.industry} · ${input.title} · ${input.geography}`);

    try {
      const res = await fetch('/api/live-search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!res.body) throw new Error('No stream from server');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }
          if (evt.type === 'phase') {
            append(PHASE_COPY[evt.phase] ?? evt.phase);
          } else if (evt.type === 'enrich_progress') {
            append(`Enriched ${evt.done}/${evt.total} leads.`);
          } else if (evt.type === 'lead_partial') {
            setLeads((prev) => mergeLead(prev, evt.lead));
            append(`Lead ready: ${evt.lead.person.name} (${evt.lead.fit_score.toFixed(1)})`, 'ok');
          } else if (evt.type === 'done') {
            setLeads(evt.leads);
            setStats(evt.stats);
            if (evt.warning) {
              setWarning(evt.warning);
              append(evt.warning, 'err');
            }
            append(`Done. ${evt.leads.length} leads ready.`, 'ok');
          } else if (evt.type === 'error') {
            append(`Error: ${evt.error}`, 'err');
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      append(`Stream failed: ${msg}`, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
      <header className="mb-10">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-sky-300/70">
          <span>Sonar</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">voice-native lender finder</span>
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
          Find the next lender customers.
          <br />
          <span className="text-sky-300">And call them.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Send a signal across LinkedIn, Crunchbase, and Google. Listen for lender pain echoes. Answer back with a personalized AI voice memo, in their CFO&apos;s name. Powered by Apify · Nebius · KugelAudio.
        </p>
      </header>

      <div className="space-y-6">
        <IcpForm onSubmit={runSearch} busy={busy} />
        <Ticker lines={lines} />
        <LeadTable leads={leads} onSelect={setSelected} />
        {warning && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            {warning}
          </div>
        )}
        {stats && (
          <div className="text-xs text-zinc-500">
            {Object.entries(stats)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' · ')}
          </div>
        )}
      </div>

      <footer className="mt-16 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
        Powered by <span className="text-zinc-300">Apify</span> · <span className="text-zinc-300">Nebius</span> ·{' '}
        <span className="text-zinc-300">KugelAudio</span>. Built at the Fintech GTM Hackathon @ Frontier Tower.
      </footer>

      {selected && <LeadDetail lead={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function mergeLead(prev: LenderLead[], next: LenderLead): LenderLead[] {
  const idx = prev.findIndex((l) => l.id === next.id);
  if (idx === -1) return [...prev, next];
  const out = [...prev];
  out[idx] = next;
  return out;
}
