'use client';

export type TickerLine = { ts: number; text: string; tone?: 'info' | 'ok' | 'err' };

export function Ticker({ lines }: { lines: TickerLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-sky-500" />
          <span className="absolute inset-0 rounded-full bg-sky-500 opacity-75 pulse-ring" />
        </span>
        Live signal
      </div>
      <ul className="space-y-1 font-mono text-xs">
        {lines.slice(-12).map((l, i) => (
          <li
            key={i}
            className={
              l.tone === 'err'
                ? 'text-rose-400'
                : l.tone === 'ok'
                ? 'text-emerald-300'
                : 'text-zinc-300'
            }
          >
            <span className="mr-2 text-zinc-600">{new Date(l.ts).toLocaleTimeString([], { hour12: false })}</span>
            {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
