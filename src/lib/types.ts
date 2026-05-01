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
