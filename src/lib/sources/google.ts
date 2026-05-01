import { runActor } from '../apify';

export type SignalHit = { title?: string; description?: string; url?: string };

const MOCK_HITS: SignalHit[] = [
  {
    title: 'Sarah Chen — VP, Collections at Upstart',
    description: 'Upstart Q3 charge-offs ticked up to 7.4% as the BNPL portfolio rolls forward; collections team scaling.',
    url: 'https://www.upstart.com/about'
  },
  {
    title: 'David Kim — Head of Recovery at LendingClub',
    description: 'LendingClub Series of CFPB filings spotlight collections experience; recovery org hiring across SF and Lehi.',
    url: 'https://www.lendingclub.com/company/about-us'
  },
  {
    title: 'Maria Lopez — Director of Collections at SoFi',
    description: 'SoFi Q3 update: lending segment grew 31% YoY, late-stage delinquencies under watch; new VP Collections role posted.',
    url: 'https://www.sofi.com/press/'
  },
  {
    title: 'Jordan Patel — CFO at Affirm',
    description: 'Affirm $750M securitization closes; CFO emphasizes loss-mitigation tooling on earnings call.',
    url: 'https://investors.affirm.com'
  },
  {
    title: 'Amelia Wright — VP Collections at Klarna',
    description: 'Klarna US collections center expands; recent CFPB complaint volume up 22% YoY per public dashboard.',
    url: 'https://www.consumerfinance.gov/data-research/consumer-complaints/'
  }
];

export async function searchSignals(queries: string[]): Promise<SignalHit[]> {
  if (!process.env.APIFY_TOKEN) return MOCK_HITS;
  return runActor<SignalHit>(
    'apify/google-search-scraper',
    { queries, maxItems: 10, resultsPerPage: 10 },
    60
  );
}
