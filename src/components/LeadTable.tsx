'use client';

import type { LenderLead } from '../lib/types';

export function LeadTable({
  leads,
  onSelect
}: {
  leads: LenderLead[];
  onSelect: (lead: LenderLead) => void;
}) {
  if (leads.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Person</th>
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-left font-medium">Company</th>
            <th className="px-4 py-3 text-left font-medium">Fit</th>
            <th className="px-4 py-3 text-left font-medium">Voice</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              onClick={() => onSelect(l)}
              className="cursor-pointer border-b border-zinc-800/60 transition last:border-b-0 hover:bg-zinc-800/40"
            >
              <td className="px-4 py-3 font-medium">{l.person.name}</td>
              <td className="px-4 py-3 text-zinc-400">{l.person.title}</td>
              <td className="px-4 py-3 text-zinc-400">{l.company.name}</td>
              <td className="px-4 py-3">
                <FitBadge score={l.fit_score} />
              </td>
              <td className="px-4 py-3">
                {l.voice.audioUrl ? (
                  <span className="inline-flex items-center gap-1 text-xs text-sky-300">▶ play</span>
                ) : (
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FitBadge({ score }: { score: number }) {
  const tier = score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low';
  const cls =
    tier === 'high'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : tier === 'mid'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {score.toFixed(1)}
    </span>
  );
}
