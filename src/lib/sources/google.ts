import { runActor } from '../apify';

export async function searchSignals(queries: string[]) {
  return runActor<{ title?: string; description?: string; url?: string }>('apify/google-search-scraper', {
    queries,
    maxItems: 10,
    resultsPerPage: 10
  }, 60);
}
