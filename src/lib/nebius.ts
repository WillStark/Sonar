const BASE = 'https://api.tokenfactory.nebius.com/v1';
const MODELS = ['meta-llama/Llama-3.3-70B-Instruct', 'meta-llama/Meta-Llama-3.1-8B-Instruct'];

export async function chat(messages: Array<{ role: string; content: string }>, model = MODELS[1]) {
  const key = process.env.NEBIUS_API_KEY;
  if (!key) throw new Error('Missing NEBIUS_API_KEY');
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.4 })
  });
  if (!res.ok) throw new Error(`Nebius failed: ${res.status}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}
