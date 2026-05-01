import type { LenderLead } from '../lib/types';
import { OutreachPanel } from './OutreachPanel';

export function renderLeadDetail(lead: LenderLead) {
  return { lead, outreach: OutreachPanel(lead) };
}
