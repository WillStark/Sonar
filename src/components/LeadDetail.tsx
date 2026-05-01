'use client';

import type { LenderLead } from '../lib/types';
import { OutreachPanel } from './OutreachPanel';

export function LeadDetail({ lead, onClose }: { lead: LenderLead; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-800 bg-gradient-to-br from-sky-950/40 to-zinc-950 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-sky-300/70">Lender lead · fit {lead.fit_score.toFixed(1)}/10</div>
              <h2 className="mt-1 truncate text-2xl font-semibold">{lead.person.name}</h2>
              <div className="text-sm text-zinc-400">
                {lead.person.title} · {lead.company.name} · {lead.company.industry}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100"
            >
              Close
            </button>
          </div>
          <p className="mt-4 text-sm text-zinc-300">{lead.pain_hypothesis}</p>
          {lead.fit_reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lead.fit_reasons.map((r, i) => (
                <span key={i} className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-xs text-zinc-400">
                  {r}
                </span>
              ))}
            </div>
          )}
          {lead.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {lead.sources.map((s, i) =>
                s ? (
                  <a
                    key={i}
                    href={s}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300/90 underline-offset-2 hover:underline"
                  >
                    public signal ↗
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>
        <div className="p-6">
          <OutreachPanel lead={lead} />
        </div>
      </div>
    </div>
  );
}
