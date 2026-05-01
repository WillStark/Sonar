export function VoicePlayer({ audioUrl, durationMs }: { audioUrl: string; durationMs?: number }) {
  return `<div class="voice-player"><audio controls src="${audioUrl}"></audio><div>${durationMs ? Math.round(durationMs/1000)+'s' : ''}</div></div>`;
}
