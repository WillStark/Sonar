import { runActor } from '../apify';

export async function searchLenderExecs(titles: string[], companies?: string[]) {
  return runActor<any>('harvestapi/linkedin-profile-search', {
    currentJobTitles: titles,
    currentCompanies: companies || [],
    maxItems: 10
  }, 60);
}
