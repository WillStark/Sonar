'use client';

import { useEffect, useRef, useState } from 'react';

export function VoicePlayer({
  audioUrl,
  durationMs,
  script
}: {
  audioUrl: string;
  durationMs?: number;
  script?: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime / Math.max(a.duration || 1, 1));
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
      if (!a.paused) a.pause();
    };
  }, []);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      const p = a.play();
      setPlaying(true);
      if (p && typeof p.catch === 'function') p.catch(() => setPlaying(false));
    }
  };

  return (
    <div className="rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-950/40 to-zinc-950 p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!audioUrl}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-500 text-zinc-950 transition hover:bg-sky-400 disabled:opacity-40"
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3.5" height="12" rx="1" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5v11l11-5.5L3 2.5z" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs uppercase tracking-wider text-sky-200/80">Personalized voice memo</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {durationMs ? `${Math.round(durationMs / 1000)}s` : '—'}
            {audioUrl ? '' : ' · audio unavailable'}
          </div>
        </div>
      </div>
      {script && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 font-mono text-xs leading-relaxed text-zinc-300">
          {script}
        </div>
      )}
      <audio ref={ref} src={audioUrl} preload="metadata" hidden />
    </div>
  );
}
