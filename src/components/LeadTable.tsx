import type { LenderLead } from '../lib/types';

export function renderLeadTable(leads: LenderLead[]): string {
  return leads.map((l) => `${l.person.name} | ${l.person.title} | ${l.company.name} | ${l.fit_score} | ${l.voice.audioUrl}`).join('\n');
}
