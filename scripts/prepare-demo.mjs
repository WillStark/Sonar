import fs from 'node:fs/promises';
import path from 'node:path';

const VOICE_DIR = path.join(process.cwd(), 'data', 'voice');
const DEMO_DIR = path.join(process.cwd(), 'data', 'demo');

function pcmToWav(pcm, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function synthDemoWav(durationMs, seed) {
  const sampleRate = 24000;
  const samples = Math.floor((sampleRate * durationMs) / 1000);
  const pcm = Buffer.alloc(samples * 2);
  const baseFreq = 180 + (seed % 7) * 12;
  const vibratoFreq = 4 + (seed % 3);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t * 6) * Math.min(1, (durationMs / 1000 - t) * 4);
    const vibrato = 1 + 0.04 * Math.sin(2 * Math.PI * vibratoFreq * t);
    const fundamental = Math.sin(2 * Math.PI * baseFreq * vibrato * t) * 0.5;
    const second = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.18;
    const third = Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.08;
    const noise = (Math.random() - 0.5) * 0.05;
    const wordRate = 3.5;
    const wordEnv = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.PI * wordRate * t));
    const sample = Math.max(-1, Math.min(1, (fundamental + second + third + noise) * env * wordEnv * 0.9));
    pcm.writeInt16LE(Math.round(sample * 32000), i * 2);
  }
  return pcmToWav(pcm, sampleRate);
}

function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SEEDS = [
  {
    id: 'demo_1',
    person: { name: 'Sarah Chen', title: 'VP, Collections', linkedinUrl: 'https://www.linkedin.com/in/sarah-chen-collections' },
    company: {
      name: 'Upstart',
      domain: 'upstart.com',
      industry: 'consumer credit',
      recentSignal: 'Q3 charge-offs ticked up to 7.4% as the BNPL portfolio rolled forward'
    },
    fit_score: 9.0,
    fit_reasons: ['Senior collections title', 'Target lending vertical', 'Recent public signal', 'US geography'],
    pain_hypothesis:
      'Upstart’s Q3 charge-off creep is putting Sarah’s collections org under structural pressure. A voice-AI layer could absorb the call-volume spike without growing headcount and lift recovery 12–15%.',
    voiceScript:
      'Hi Sarah, quick voice memo from Callbook. I noticed Upstart’s Q3 charge-offs ticked up to 7.4 percent — feels like exactly the moment a voice-AI layer on your collections stack would compound. We help lenders like Upstart recover twelve to fifteen percent more without growing ops. Worth sixty seconds next week?',
    email: {
      subject: 'Quick idea for Upstart’s collections team',
      body: "Hi Sarah,\n\nNoticed Upstart’s Q3 charge-offs ticked up to 7.4% as the BNPL book rolled forward. We help lenders like Upstart recover 12–15% more on aged receivables with AI voice agents that make the calls your team can’t get to — same workflow, no extra headcount.\n\nWorth a 15-minute look next week?\n\n— Callbook"
    },
    linkedin: {
      dm: 'Hi Sarah — saw Upstart’s Q3 charge-off uptick. Curious if your team has thought about voice-AI for collections. We’re seeing 12–15% lift on aged receivables for similar lenders. Quick chat next week?'
    },
    sources: ['https://ir.upstart.com', 'https://www.consumerfinance.gov/data-research/consumer-complaints/']
  },
  {
    id: 'demo_2',
    person: { name: 'David Kim', title: 'Head of Recovery', linkedinUrl: 'https://www.linkedin.com/in/david-kim-recovery' },
    company: {
      name: 'LendingClub',
      domain: 'lendingclub.com',
      industry: 'consumer credit',
      recentSignal: 'Recovery org hiring across SF and Lehi; CFPB filings spotlight collections experience'
    },
    fit_score: 8.5,
    fit_reasons: ['Senior recovery title', 'Target lending vertical', 'Hiring spike signal', 'US geography'],
    pain_hypothesis:
      'LendingClub is scaling its recovery team manually exactly when AI voice can collapse the cost-per-contact curve. David is the buyer who feels the unit economics of every new headcount.',
    voiceScript:
      'Hey David, quick note from Callbook. Saw LendingClub’s recovery org is hiring across SF and Lehi — we help lenders hit those numbers without doubling the team. Voice-AI agent that calls aged accounts, books promises-to-pay, hands off live to your specialists. Twelve to fifteen percent more recovered. Worth sixty seconds?',
    email: {
      subject: 'Recovery hiring at LendingClub — a 12–15% lift without the headcount',
      body: "Hi David,\n\nNoticed the recovery hiring push across SF and Lehi. We help lenders like LendingClub recover 12–15% more on aged receivables with AI voice agents — same playbook your team runs, just without the headcount math.\n\nHappy to share what we’re seeing on first-pass right-party-contact rates. 15 minutes next week?\n\n— Callbook"
    },
    linkedin: {
      dm: 'Hi David — saw LendingClub is scaling recovery. Voice-AI could close the headcount gap with 12–15% more recovered on aged accounts. Worth a quick chat?'
    },
    sources: ['https://www.lendingclub.com/company/careers', 'https://www.consumerfinance.gov/data-research/consumer-complaints/']
  },
  {
    id: 'demo_3',
    person: { name: 'Maria Lopez', title: 'Director of Collections', linkedinUrl: 'https://www.linkedin.com/in/maria-lopez-collections' },
    company: {
      name: 'SoFi',
      domain: 'sofi.com',
      industry: 'consumer credit',
      recentSignal: 'Lending segment grew 31% YoY; new VP Collections role posted, late-stage delinquencies under watch'
    },
    fit_score: 8.0,
    fit_reasons: ['Senior collections title', 'Target lending vertical', 'Growth + delinquency signal', 'US geography'],
    pain_hypothesis:
      'SoFi’s lending growth is outpacing the collections team that has to clean up after it. Maria is staring at the operating leverage gap that a voice-AI layer is built to close.',
    voiceScript:
      'Hi Maria, fast voice memo from Callbook. SoFi’s lending segment grew thirty-one percent year-over-year and your team is feeling that downstream. We deploy voice-AI that picks up the aged accounts your specialists can’t get to — twelve to fifteen percent more recovered, no new headcount. Worth a quick look?',
    email: {
      subject: 'SoFi grew 31% — the collections side of that story',
      body: "Hi Maria,\n\n31% YoY lending growth at SoFi means a lot more accounts moving through your collections funnel. We help lenders like SoFi recover 12–15% more on aged receivables with AI voice agents — absorbs the volume spike, keeps your specialists on the highest-value calls.\n\nOpen to a quick walk-through?\n\n— Callbook"
    },
    linkedin: {
      dm: 'Hi Maria — saw SoFi’s 31% lending growth. Curious how that’s landing in collections — we’re seeing 12–15% lift on aged accounts with voice-AI. Worth a quick chat?'
    },
    sources: ['https://www.sofi.com/press/', 'https://investors.sofi.com']
  }
];

await fs.mkdir(VOICE_DIR, { recursive: true });
await fs.mkdir(DEMO_DIR, { recursive: true });

const leads = [];
for (const seed of SEEDS) {
  const wordCount = seed.voiceScript.split(/\s+/).filter(Boolean).length;
  const durationMs = Math.max(2500, Math.round((wordCount / 2.6) * 1000));
  const wav = synthDemoWav(durationMs, hashSeed(seed.id));
  const wavPath = path.join(VOICE_DIR, `${seed.id}.wav`);
  await fs.writeFile(wavPath, wav);
  leads.push({
    id: seed.id,
    person: seed.person,
    company: seed.company,
    fit_score: seed.fit_score,
    fit_reasons: seed.fit_reasons,
    pain_hypothesis: seed.pain_hypothesis,
    voice: { script: seed.voiceScript, audioUrl: `/api/voice/${seed.id}`, durationMs },
    email: seed.email,
    linkedin: seed.linkedin,
    sources: seed.sources,
    enriched_at: new Date().toISOString()
  });
}

await fs.writeFile(path.join(DEMO_DIR, 'leads.json'), JSON.stringify(leads, null, 2));
console.log(`Prepared ${leads.length} demo leads:`);
for (const l of leads) {
  console.log(`  • ${l.person.name} (${l.company.name}) — ${(l.voice.durationMs / 1000).toFixed(1)}s wav at data/voice/${l.id}.wav`);
}
