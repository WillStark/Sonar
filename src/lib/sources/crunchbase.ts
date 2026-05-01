import { runActor } from '../apify';

export async function findRecentlyFundedLenders() {
  return runActor<any>('automation-lab/crunchbase-scraper', {
    mode: 'searchOrganizations',
    category: 'fintech',
    maxItems: 10
  }, 60);
}
