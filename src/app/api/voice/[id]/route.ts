import fs from 'node:fs/promises';

export const maxDuration = 60;

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bytes = await fs.readFile(`data/voice/${id}.wav`);
  return new Response(bytes, { headers: { 'content-type': 'audio/wav' } });
}
