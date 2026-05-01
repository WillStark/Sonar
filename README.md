# Sonar

Voice-native GTM. Find the next lender customers — and call them.

Built at the **Fintech GTM Hackathon @ Frontier Tower**. Three sponsor APIs stacked: **Apify** (sourcing across LinkedIn / Crunchbase / Google), **Nebius** (lender-fit scoring + outreach drafting via Llama-3.x), **KugelAudio** (per-lead voice memo).

## Quickstart

```bash
npm install
npm run demo:prepare   # seeds 3 demo leads with synthesized voice WAVs
npm run dev            # http://localhost:3000
```

Open the app, click **Send signal**, watch the live ticker, click any lead to play its voice memo.

## Live mode (real APIs)

Copy `.env.local.example` → `.env.local` and fill keys:

```
APIFY_TOKEN=apify_api_xxx
NEBIUS_API_KEY=...
KUGELAUDIO_API_KEY=...
```

The app auto-detects keys. With all three set it hits live APIs; with any missing it gracefully falls back to mock data + synthesized audio so the demo always plays.

## Architecture

```
IcpForm ──▶ /api/live-search (NDJSON stream)
              │
              ├─ Apify google-search-scraper  (signals)
              ├─ scoring-lender (heuristic 0–10)
              ├─ Nebius Llama-3.x  (pain + outreach JSON)
              └─ KugelAudio kugel-1-turbo  (WAV per lead)
                          │
                          ▼
              data/voice/{leadId}.wav  ──▶  /api/voice/[id]
                                              │
                          Ticker  ◀──  LeadTable  ◀──  LeadDetail
                                                          │
                                                ┌─────────┴─────────┐
                                                │ Voice · Email · LI │
                                                └────────────────────┘
```

## Stream contract

`/api/live-search` (POST `{industry, title, geography}`) emits NDJSON:

| event | payload |
|---|---|
| `phase` | `crawl_start` · `crawl_done` · `score_done` · `enrich_start` |
| `lead_partial` | a `LenderLead` as it finishes enrichment |
| `enrich_progress` | `{done, total}` |
| `done` | `{leads, stats, warning?}` |
| `error` | `{error}` |

## Commands

| | |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run prod build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run demo:prepare` | Seed `data/demo/leads.json` + WAVs in `data/voice/` |

## Demo cheat sheet

- Pre-seed: `npm run demo:prepare` writes 3 real-named leads (Sarah Chen / Upstart, David Kim / LendingClub, Maria Lopez / SoFi) with full outreach + WAV files. Visit `/proof/demo_1` for a shareable lead report.
- Mock pipeline: with no env keys, `/api/live-search` returns the same names with on-screen public-signal URLs. Voice plays from synthesized WAVs in `data/voice/`.
- Hard cut: if WiFi dies on stage, the demo still works — everything is local once `demo:prepare` has run.

Powered by **Apify · Nebius · KugelAudio**.
