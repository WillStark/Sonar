'use client';

import { useState } from 'react';
import type { IcpInput } from '../lib/types';

const PRESETS: IcpInput[] = [
  { industry: 'BNPL', title: 'VP Collections', geography: 'US' },
  { industry: 'consumer credit', title: 'Head of Recovery', geography: 'US' },
  { industry: 'auto lending', title: 'CFO', geography: 'US' },
  { industry: 'student lending', title: 'Director of Collections', geography: 'US' }
];

export function IcpForm({
  onSubmit,
  busy
}: {
  onSubmit: (input: IcpInput) => void;
  busy: boolean;
}) {
  const [input, setInput] = useState<IcpInput>(PRESETS[0]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(input);
      }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sonar-glow"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <Field label="Industry">
          <input
            value={input.industry}
            onChange={(e) => setInput({ ...input, industry: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="BNPL"
          />
        </Field>
        <Field label="Title">
          <input
            value={input.title}
            onChange={(e) => setInput({ ...input, title: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="VP Collections"
          />
        </Field>
        <Field label="Geography">
          <input
            value={input.geography}
            onChange={(e) => setInput({ ...input, geography: e.target.value })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="US"
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="h-10 shrink-0 rounded-lg bg-sky-500 px-5 text-sm font-medium text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Pinging…' : 'Send signal'}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.industry + p.title}
            type="button"
            onClick={() => setInput(p)}
            className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-400 transition hover:border-sky-500/40 hover:text-sky-200"
          >
            {p.industry} · {p.title}
          </button>
        ))}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
