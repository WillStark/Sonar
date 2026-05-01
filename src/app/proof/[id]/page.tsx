import fs from 'node:fs/promises';
import path from 'node:path';
import type { LenderLead } from '../../../lib/types';

export const dynamic = 'force-dynamic';

async function loadLead(id: string): Promise<LenderLead | null> {
  try {
    const file = path.join(process.cwd(), 'data', 'demo', 'leads.json');
    const txt = await fs.readFile(file, 'utf8');
    const all = JSON.parse(txt) as LenderLead[];
    return all.find((l) => l.id === id) ?? null;
  } catch {
    return null;
  }
}

export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await loadLead(id);

  if (!lead) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Lead not found</h1>
        <p className="mt-2 text-zinc-400">This shareable lead report has expired or never existed.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-6 text-xs uppercase tracking-[0.3em] text-sky-300/70">Sonar · shareable lead report</div>
      <h1 className="text-3xl font-semibold">{lead.person.name}</h1>
      <p className="mt-1 text-zinc-400">
        {lead.person.title} · {lead.company.name} · {lead.company.industry}
      </p>
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="text-xs uppercase tracking-wider text-zinc-500">Pain hypothesis</div>
        <p className="mt-1 text-zinc-200">{lead.pain_hypothesis}</p>
      </div>
      <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-sky-200">Voice memo</div>
        <audio controls src={lead.voice.audioUrl} className="w-full" />
        <p className="mt-3 font-mono text-xs text-zinc-300">{lead.voice.script}</p>
      </div>
    </main>
  );
}
