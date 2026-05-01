export type LenderLead = {
  id: string;
  person: { name: string; title: string; linkedinUrl?: string; emailGuess?: string };
  company: { name: string; domain?: string; industry: string; size?: string; recentSignal?: string };
  fit_score: number;
  fit_reasons: string[];
  pain_hypothesis: string;
  voice: { script: string; audioUrl: string; durationMs: number };
  email: { subject: string; body: string };
  linkedin: { dm: string };
  sources: string[];
  enriched_at: string;
};

export type StreamEvent =
  | { type: 'phase'; phase: 'crawl_start' | 'crawl_done' | 'score_done' | 'enrich_start' }
  | { type: 'enrich_progress'; done: number; total: number }
  | { type: 'lead_partial'; lead: LenderLead }
  | { type: 'done'; leads: LenderLead[]; stats: Record<string, unknown>; warning?: string }
  | { type: 'error'; error: string };

export type IcpInput = { industry: string; title: string; geography: string };
