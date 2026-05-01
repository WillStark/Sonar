# Sonar Hackathon Prototype (Submission Ready)

GTM prototype using Apify + Nebius + KugelAudio.

## Setup
1. Copy `.env.local.example` → `.env.local`
2. Fill keys:
   - `APIFY_TOKEN`
   - `NEBIUS_API_KEY`
   - `KUGELAUDIO_API_KEY`

## Commands
- `npm run build` — TypeScript check
- `npm run demo:prepare` — creates three pre-generated demo leads in `data/demo/leads.json`
- `npm run dev` — prints local dev URL placeholder

## Stream Contract
`/api/live-search` emits NDJSON events:
- `phase` (`crawl_start`, `crawl_done`, `score_done`, `enrich_start`)
- `enrich_progress`
- `done`
- `error`

## Audio
- KugelAudio bytes are wrapped with a 44-byte WAV header.
- Persisted under `data/voice/{leadId}.wav`.
- Served by `/api/voice/[id]` as `audio/wav`.
