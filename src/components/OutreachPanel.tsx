'use client';

import { useState } from 'react';
import type { LenderLead } from '../lib/types';
import { VoicePlayer } from './VoicePlayer';

type Tab = 'voice' | 'email' | 'linkedin';

export function OutreachPanel({ lead }: { lead: LenderLead }) {
  const [tab, setTab] = useState<Tab>('voice');

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-950/60 p-1">
        <TabBtn active={tab === 'voice'} onClick={() => setTab('voice')}>Voice</TabBtn>
        <TabBtn active={tab === 'email'} onClick={() => setTab('email')}>Email</TabBtn>
        <TabBtn active={tab === 'linkedin'} onClick={() => setTab('linkedin')}>LinkedIn</TabBtn>
      </div>

      {tab === 'voice' && (
        <VoicePlayer audioUrl={lead.voice.audioUrl} durationMs={lead.voice.durationMs} script={lead.voice.script} />
      )}

      {tab === 'email' && (
        <div className="space-y-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Subject</div>
            <div className="text-zinc-100">{lead.email.subject}</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
            {lead.email.body}
          </div>
          <CopyButton text={`Subject: ${lead.email.subject}\n\n${lead.email.body}`} />
        </div>
      )}

      {tab === 'linkedin' && (
        <div className="space-y-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
            {lead.linkedin.dm}
          </div>
          <CopyButton text={lead.linkedin.dm} />
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm transition ${
        active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-sky-500/40 hover:text-sky-200"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}
