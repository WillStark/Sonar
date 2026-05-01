import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const maxDuration = 60;

function safeId(id: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return id;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const safe = safeId(id);
  if (!safe) return new Response('bad id', { status: 400 });
  const file = path.join(process.cwd(), 'data', 'voice', `${safe}.wav`);
  try {
    const bytes = await fs.readFile(file);
    return new Response(new Uint8Array(bytes), {
      headers: {
        'content-type': 'audio/wav',
        'cache-control': 'public, max-age=3600',
        'content-length': String(bytes.length)
      }
    });
  } catch {
    return new Response('not found', { status: 404 });
  }
}
