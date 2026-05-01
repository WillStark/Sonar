import type { LenderLead } from '../lib/types';
import { VoicePlayer } from './VoicePlayer';

export function OutreachPanel(lead: LenderLead) {
  return {
    voice: VoicePlayer({ audioUrl: lead.voice.audioUrl, durationMs: lead.voice.durationMs }),
    email: `${lead.email.subject}\n\n${lead.email.body}`,
    linkedin: lead.linkedin.dm
  };
}
