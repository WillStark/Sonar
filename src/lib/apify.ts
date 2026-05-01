export async function runActor<T>(actorId: string, input: Record<string, unknown>, timeoutSec = 60): Promise<T[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('Missing APIFY_TOKEN');
  const actor = actorId.replace('/', '~');
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`;
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error(`Apify failed: ${res.status}`);
  return res.json() as Promise<T[]>;
}
