# Sonar — Build Plan

**Product:** Sonar — the voice product that finds Callbook's lender customers. New product, new repo, separate from the Magnetron hackathon project this codebase is forked from.
**Event:** Fintech GTM Hackathon @ Frontier Tower (2026-04-30)
**Build window:** 5:30 PM kickoff → 8:00 PM submission. **~2.5 hours.**
**Submission:** Google Form + video + repo. Top 5 demo live at 8:30 PM.
**Codebase basis:** Forked from Magnetron's UI/UX scaffolding (committed to this repo as the starting point). Branch `callbook-gtm`. **Keep the shell, replace the data layer.**

**Why "Sonar":** send a signal, listen for echoes. The product sends signals across LinkedIn / Crunchbase / Google, listens for lender pain echoes, and answers back with a personalized AI voice call. One word, voice-native, finder-native.

---

## 1. Mission

Build the GTM system Callbook.ai uses tomorrow morning to find and pitch its next 50 lender customers. The pitch in one sentence:

> **"Callbook is a voice product for lenders. We built a voice product that finds Callbook's lenders."**

That sentence is the thesis. Every architectural decision below serves it.

---

## 2. Rubric scorecard — how we hit each weight

| Weight | Criterion | How we win it |
|---|---|---|
| **40%** | Tech built | End-to-end agentic pipeline: Apify (multi-source) → Nebius (lender-fit scoring + LLM enrichment) → KugelAudio (per-lead voice) → live streaming UI. Three sponsor APIs stacked, plus original code: lender ICP scorer, NDJSON streaming progress, multi-channel outreach panel. |
| **30%** | Outreach creativity | Personalized **AI voice cold-calls** generated per-lead — every prospect hears their own name + a public signal about their company. Channel mix: voice memo + matched email + LinkedIn opener, all from the same per-lead reasoning. Voice is the unlock — no other team will use it well, KugelAudio rewards it ($300 credits = 1st prize), and it dogfoods Callbook's own product category. |
| **20%** | Presentation | Single unforgettable demo moment: live-find a real lender on stage, generate the voice clip, **press play**. Plus a 60-sec problem → architecture → result narrative with the three sponsor logos visible. |
| **10%** | Lead-gen quality | Lender-specific sources (LinkedIn job titles, Crunchbase recently-funded fintech, Google site: queries against CFPB / news) — not Reddit/HN. Scoring rubric tuned for Callbook ICP. Repeatable: same query, similar quality leads. |

**Sponsor coverage:** Apify (sourcing) + Nebius (inference) + KugelAudio (voice) — all three sponsors visibly used in the demo. Each one has a judge in the room or a prize attached.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  IcpForm  ──submit──▶  /api/live-search?stream=true          │
│                                  │                            │
│                                  ▼                            │
│                         ┌────────────────┐                    │
│                         │ Source layer   │                    │
│                         │   • Apify LinkedIn (harvestapi)     │
│                         │   • Apify Crunchbase                │
│                         │   • Apify Google (CFPB / news)      │
│                         └────────┬───────┘                    │
│                                  │ raw candidates             │
│                                  ▼                            │
│                         ┌────────────────┐                    │
│                         │ Lender scorer  │ → fit_score 0–10  │
│                         │ (heuristic)    │                    │
│                         └────────┬───────┘                    │
│                                  │ top N                      │
│                                  ▼                            │
│                         ┌────────────────┐                    │
│                         │ Nebius LLM     │ → enrichment       │
│                         │ Llama-3.3-70B  │   pain hypothesis, │
│                         └────────┬───────┘   email, LI DM,    │
│                                  │            voice script    │
│                                  ▼                            │
│                         ┌────────────────┐                    │
│                         │ KugelAudio TTS │ → audio URL/blob   │
│                         │ kugel-1-turbo  │                    │
│                         └────────┬───────┘                    │
│                                  │                            │
│         NDJSON progress events ──┘                            │
│                                  │                            │
│                                  ▼                            │
│  Ticker  ◀──stream──  LeadTable  ◀── click ──  LeadDetail    │
│                                                  │            │
│                                            ┌─────┴─────┐     │
│                                            │OutreachPanel│   │
│                                            │ • VoicePlayer│  │
│                                            │ • Email draft│  │
│                                            │ • LinkedIn DM│  │
│                                            └─────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Stack

| Layer | Tech | Why |
|---|---|---|
| Framework | Next.js 16, React 19, Tailwind 4 | Already in repo, untouched |
| Sourcing | **Apify** REST API | Sponsor; covers LinkedIn + Crunchbase + Google in one auth |
| Inference | **Nebius Token Factory** (OpenAI-compatible) | Sponsor; drop-in replacement for [src/lib/tokenrouter.ts](src/lib/tokenrouter.ts) |
| Voice | **KugelAudio** REST + `npm i kugelaudio` | Sponsor; 1st prize is $300 of their credits |
| Streaming UX | NDJSON over `Response` body | Already proven in [src/app/api/live-search/route.ts](src/app/api/live-search/route.ts) |

**Env vars (add to `.env.local`):**
```
APIFY_TOKEN=apify_api_xxx
NEBIUS_API_KEY=...
KUGELAUDIO_API_KEY=...
```

`.env.local` is already in [.gitignore](.gitignore). Check before committing.

---

## 5. API integration cheatsheet

### Apify
- Base: `https://api.apify.com/v2`
- Auth: `?token=$APIFY_TOKEN` query param
- Pattern (one shot, up to 5 min):
  ```
  POST /acts/{actor~id}/run-sync-get-dataset-items?token=...&timeout=300
  ```
  Replace `/` in actorId with `~` in URL.
- Actors:
  | Actor | Purpose | ~$/1k | Key inputs |
  |---|---|---|---|
  | `harvestapi/linkedin-profile-search` | Find lender execs by title | $40–100 | `currentJobTitles`, `currentCompanies`, `industryIds`, `maxItems` |
  | `automation-lab/crunchbase-scraper` | Recently-funded fintech lenders | $1.50–5 | `mode: "searchOrganizations"`, `category: "fintech"`, `lastFundingOn` |
  | `apify/google-search-scraper` | CFPB complaints + news mentions | $3.50 | `queries`, `resultsPerPage` |
- Promo code: `FIN_TECH_FRONTIER_TOWERS` for credits.

### Nebius (Token Factory)
- Base: `https://api.tokenfactory.nebius.com/v1`
- Auth: `Authorization: Bearer $NEBIUS_API_KEY`
- **Fully OpenAI-compatible** — `/v1/chat/completions` works exactly like OpenAI. Just swap base URL + key in [src/lib/tokenrouter.ts](src/lib/tokenrouter.ts).
- Default model: `meta-llama/Llama-3.3-70B-Instruct` (good balance for our use)
- Speed/cheap: `meta-llama/Meta-Llama-3.1-8B-Instruct`
- Promo: https://nebius.com/promo-code?utm_promo_event_code=2026-04-builders-and-brews-sf

### KugelAudio
- Base: `https://api.kugelaudio.com/v1`
- Auth: `Authorization: Bearer $KUGELAUDIO_API_KEY`
- TTS: `POST /tts/generate` with `{text, model_id, voice_id, language}`
- Voices: `GET /features/voices` — pick one US-English business voice, hardcode the ID
- Default model: `kugel-1-turbo` (~39 ms TTFA, ~5s for 90s clip)
- Output format: PCM by default. SDK writes `.wav`. **Verify MP3 support tonight via SDK** — if no MP3, serve WAV directly to `<audio>` tag (browsers handle it).

---

## 6. Files: KEEP / CUT / CREATE / UPDATE

### KEEP unchanged
- [src/app/layout.tsx](src/app/layout.tsx) — fonts, root shell
- [src/app/globals.css](src/app/globals.css) — design tokens
- [src/components/Ticker.tsx](src/components/Ticker.tsx) — NDJSON streaming progress UI
- [tsconfig.json](tsconfig.json), `package.json` (only adding deps)
- [public/fonts/](public/fonts/) — keep loaded fonts

### KEEP shell, swap internals
- [src/components/IcpForm.tsx](src/components/IcpForm.tsx) — keep form, swap copy/labels for "Find lenders for Callbook"
- [src/components/LeadTable.tsx](src/components/LeadTable.tsx) — keep table primitive, swap columns to: Person · Title · Company · Fit · Voice ·
- [src/components/LeadDetail.tsx](src/components/LeadDetail.tsx) — keep modal, mount new `OutreachPanel` inside
- [src/app/api/live-search/route.ts](src/app/api/live-search/route.ts) — keep NDJSON streaming pattern; replace pipeline guts
- [src/lib/tokenrouter.ts](src/lib/tokenrouter.ts) — keep client shape, swap `BASE` + `KEY` for Nebius (or fork to `nebius.ts`)
- [src/app/proof/](src/app/proof/) — keep route; repurpose as a public "shareable lead report" page judges can visit live
- [src/app/page.tsx](src/app/page.tsx) — keep layout; rewrite hero copy

### CUT (irrelevant to Callbook)
- [src/lib/agenthansa.ts](src/lib/agenthansa.ts) — quest economy not relevant
- [src/lib/quest-payload.ts](src/lib/quest-payload.ts) — AgentHansa-specific format
- `src/app/api/agenthansa/` (entire directory) — quest API routes
- [src/lib/sources/reddit.ts](src/lib/sources/reddit.ts) — wrong audience for lenders
- Any `src/lib/sources/hn.ts` if present — same

### CREATE (new files)
- `src/lib/apify.ts` — REST client wrapper, one function: `runActor(actorId, input, timeoutSec)`
- `src/lib/sources/linkedin.ts` — `searchLenderExecs(titles, companies?)` → calls `harvestapi/linkedin-profile-search`
- `src/lib/sources/crunchbase.ts` — `findRecentlyFundedLenders()` → calls `automation-lab/crunchbase-scraper`
- `src/lib/sources/google.ts` — `searchSignals(queries[])` → calls `apify/google-search-scraper`; useful for CFPB mentions, complaint articles, hiring posts
- `src/lib/scoring-lender.ts` — `scoreLenderFit(candidate) → { fit_score, reasons[] }`. Heuristic: title weight (VP Collections / CRO / CFO / Head of Recovery / Director of Collections = 4 pts), industry match (consumer credit / BNPL / auto / student = 3 pts), recency signal (recent funding / hiring spike / complaint mention = 2 pts), geography US (1 pt). Max 10.
- `src/lib/nebius.ts` — OpenAI-compatible client. Exports `chat(messages, opts)` and `enrich(lead)` and `draftOutreach(lead)`. Drop-in replacement for tokenrouter.
- `src/lib/kugelaudio.ts` — `generateVoice({ text, voiceId }) → { audioUrl, durationMs }`. Returns base64 data URL or blob URL for `<audio>` tag.
- `src/lib/icp-callbook.ts` — Callbook ICP definition: target titles, target industries, sample queries, signal keywords. Centralizes the "what is a Callbook lead" decision.
- `src/lib/types.ts` — UPDATE: add `LenderLead` type:
  ```ts
  type LenderLead = {
    id: string;
    person: { name; title; linkedinUrl?; emailGuess? };
    company: { name; domain?; industry; size?; recentSignal? };
    fit_score: number;          // 0-10 from scoring-lender.ts
    fit_reasons: string[];      // bullets from heuristic
    pain_hypothesis: string;    // Nebius-generated, 1-2 sentences
    voice: { script: string; audioUrl: string; durationMs: number };
    email: { subject: string; body: string };
    linkedin: { dm: string };
    sources: string[];          // urls from Apify hits
    enriched_at: string;
  };
  ```
- `src/components/VoicePlayer.tsx` — `<audio>` with custom waveform/play button. ~40 lines. Important for the demo moment — it should look great.
- `src/components/OutreachPanel.tsx` — tabbed view: Voice / Email / LinkedIn. Each tab shows the generated content + copy button. Voice tab shows VoicePlayer + script transcript.
- `data/voice/` — local dir for cached audio blobs in dev (gitignored)

### UPDATE existing
- [src/app/page.tsx](src/app/page.tsx) — hero: **"Find Callbook's next 50 lender customers — and call them."** Subhead mentions Apify + Nebius + KugelAudio.
- [src/app/api/live-search/route.ts](src/app/api/live-search/route.ts) — rewire pipeline; emit NDJSON events: `{ phase: "sourcing" | "scoring" | "enriching" | "voicing" | "lead", payload }`. The Ticker already handles this shape — confirm event names match.
- [.gitignore](.gitignore) — add `data/voice/` and `.env.local` if not present
- `package.json` — add deps: `kugelaudio` (or call REST directly to skip the dep)

---

## 7. Build phases — minute-by-minute

> Treat T = 0:00 as 8:00 PM (submission). Budget: 2:30 build (5:30–8:00).

### Phase 0 — Setup (T-2:30 → T-2:15) · 15 min
1. `git checkout -b callbook-gtm`
2. Add env vars to `.env.local`. **Do not commit.**
3. Smoke-test all three APIs from terminal — one curl each. Don't move on until all 3 return 200.
4. Delete AgentHansa files in one commit: `git rm src/lib/agenthansa.ts src/lib/quest-payload.ts && git rm -r src/app/api/agenthansa src/lib/sources/reddit.ts`
5. `npm install kugelaudio` (optional — REST works fine).

**Definition of done:** Three curl smoke tests pass. AgentHansa files removed. Branch pushed.

### Phase 1 — Pipeline core (T-2:15 → T-1:30) · 45 min
1. Write `src/lib/apify.ts` (15 min). One function. Test by listing actors.
2. Write `src/lib/nebius.ts` (5 min — fork [src/lib/tokenrouter.ts](src/lib/tokenrouter.ts), swap base URL + auth).
3. Write `src/lib/kugelaudio.ts` (10 min). Test with one TTS call, save .wav locally, play it.
4. Write `src/lib/sources/google.ts` first (5 min — simplest actor, most reliable, cheapest). Run a query: `"VP of Collections" site:linkedin.com/in`.
5. Write `src/lib/scoring-lender.ts` (5 min). Pure function, no I/O. Just keyword matching.
6. Wire one happy path: Google search → score → Nebius enrich → Kugel voice → console.log lead. **Do this end-to-end before adding more sources.**

**Definition of done:** One real lead in your terminal with a working `audioUrl`. Open the URL — it plays.

### Phase 2 — UI integration (T-1:30 → T-0:45) · 45 min
1. Update `live-search/route.ts` (15 min): swap pipeline, emit NDJSON events. Test by hitting it from curl, watch the stream.
2. Update [src/components/IcpForm.tsx](src/components/IcpForm.tsx) (5 min): "Find lenders for Callbook" copy, fields: industry filter, title filter, geography. Pre-fill with Callbook defaults so empty submit still works.
3. Update [src/components/LeadTable.tsx](src/components/LeadTable.tsx) (10 min): columns Name · Title · Company · Fit · 🔊.
4. Build `src/components/VoicePlayer.tsx` (10 min). Custom-styled `<audio controls>`. Show duration + waveform stub.
5. Build `src/components/OutreachPanel.tsx` (15 min). Tabs: Voice (default, shows VoicePlayer + script) / Email / LinkedIn. Each tab has a "Copy" button.
6. Mount `OutreachPanel` inside [src/components/LeadDetail.tsx](src/components/LeadDetail.tsx).

**Definition of done:** Click submit → Ticker animates → leads appear → click a lead → modal opens → voice plays.

### Phase 3 — Add LinkedIn + Crunchbase sources (T-0:45 → T-0:25) · 20 min
1. Add `src/lib/sources/linkedin.ts` (10 min) — `harvestapi/linkedin-profile-search`. Run one query.
2. Add `src/lib/sources/crunchbase.ts` (10 min) — `automation-lab/crunchbase-scraper`. Run one query. **If it errors, delete the file and skip — Google + LinkedIn alone are enough for the demo.**

**Definition of done:** All three sources merge into one candidate pool in the route. Or two, if Crunchbase blew up.

### Phase 4 — Polish + demo prep (T-0:25 → T-0:10) · 15 min
1. Hero copy on [src/app/page.tsx](src/app/page.tsx). Add small footer: "Powered by Apify · Nebius · KugelAudio".
2. Pre-run the live search **twice** with the exact prompt you'll use on stage. Pick the run with the best 3 leads. Note their IDs.
3. Pre-generate voice clips for those 3 leads. Save `.wav` files locally as backup in case live KugelAudio call fails on stage.
4. Optional: cache the run's NDJSON to a JSON file. If WiFi dies on stage, replay the cached run from a `?demo=1` query param.

**Definition of done:** You can demo offline if WiFi fails.

### Phase 5 — Video + submit (T-0:10 → T-0:00) · 10 min
1. Record 90-sec video (screen capture, voiceover): problem (10s) → live demo with voice playback (60s) → architecture + sponsors (15s) → ask (5s).
2. Upload video.
3. `git push origin callbook-gtm`. Make repo public.
4. Submit Google Form: video + repo URL + team info.

**Definition of done:** Submitted before 8:00 PM.

---

## 8. Demo script (3 min on stage if top 5)

> **Slide 0** (opening, 0:00–0:15): Single sentence, big text on screen.
> "Callbook is a voice product for lenders. We built a voice product that finds Callbook's lenders."

> **Live demo** (0:15–1:45): Switch to browser.
> "I'll type 'BNPL lenders, US, Series B–D, last 12 months.' [submit] Apify is searching LinkedIn, Crunchbase, and Google in parallel. Nebius scores each candidate against our Callbook fit rubric and writes a personalized pain hypothesis. KugelAudio generates a voice clip — in their CFO's name — for the top leads. [stream completes, ~30s] Here's CFO Jane Doe at Acme Lending. Watch this — [click VoicePlayer, audio plays]: 'Hi Jane, I noticed Acme's Q3 charge-offs ticked up 18 percent year over year. We help lenders like Acme recover 12 to 15 percent more without expanding ops. Got 60 seconds for a quick story?' That clip didn't exist 30 seconds ago."

> **Architecture** (1:45–2:30): Show one-slide architecture diagram with the 3 sponsor logos lit up.
> "Three sponsor APIs, stacked: Apify for sourcing across three platforms in one call; Nebius for the lender-fit scorer and the voice script; KugelAudio for sub-100ms TTS. Original code: the lender ICP scoring rubric, the streaming agent loop, and the multi-channel outreach panel that gives Callbook a voice memo, an email, and a LinkedIn opener for every lead."

> **Why we win** (2:30–3:00):
> "Callbook bootstrapped to a million ARR in eight months selling AI voice to lenders. The bottleneck on the next ten million is finding more lenders. Tonight we built that engine. The first lender Callbook signs through this pays for everything. Thanks."

---

## 9. Submission checklist

- [ ] Repo pushed, public, on `callbook-gtm` branch (or merged to main)
- [ ] README updated with run instructions (`npm i && cp .env.example .env.local && npm run dev`)
- [ ] `.env.example` checked in with empty keys
- [ ] 90-sec video recorded
- [ ] Google Form submitted: https://docs.google.com/forms/d/e/1FAIpQLSem2q9qEwPhR8R9W-3_pLS4-wVpBKMZKJWAmXW5yla6_CMCTg/viewform
- [ ] Voice clips for 3 demo leads cached locally as fallback
- [ ] Architecture slide ready (single image, three sponsor logos)

---

## 10. Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Apify LinkedIn actor flaky / rate-limited | M | Google search scraper as fallback — surfaces LinkedIn URLs anyway. Run sources in parallel with `Promise.allSettled`, never `Promise.all`. |
| Crunchbase actor needs its own API key | M | Skip the file. Two sources is enough. Don't burn 30 min debugging. |
| KugelAudio output is PCM, not MP3 | L | Browsers play `.wav` natively. Set `<audio src="data:audio/wav;base64,...">`. Ship WAV. |
| Nebius rate limits during demo | L | Pre-cache the demo run (Phase 4). Replay from JSON if needed. |
| Live search >30s on stage | M | Pre-warm: hit the API once before going on stage. Or use `?demo=1` cached replay. |
| WiFi dies | L | Cached run + cached audio files. Demo is identical. |
| Voice quality is robotic / awkward | M | Spend 5 min in Phase 4 picking the right voice ID from `/features/voices`. Listen before you commit. |
| AgentHansa code accidentally referenced after deletion | L | TypeScript will catch it at build. Run `npm run build` once at end of Phase 0. |
| Time overrun | H | Hard cut at T-0:25. Demo prep is non-negotiable. A working demo with 1 source beats a broken demo with 3. |

---

## 11. Stretch goals (only if ahead of schedule)

In this order — pick up the next one each time you finish ahead:

1. **"Send to Callbook" button** that downloads a CSV. (5 min)
2. Email-send via Resend free tier — actually fire one demo email live on stage. (15 min, requires API key)
3. Multi-language voice (KugelAudio supports 40+) — Spanish version of the same script. (10 min)
4. Slack notification webhook on each high-fit lead. (10 min)
5. Per-lead "Why this lead" expandable card showing the heuristic breakdown. (10 min)
6. Public shareable proof page (already routed at [src/app/proof/[id]/page.tsx](src/app/proof/[id]/page.tsx)) — repurpose for "Send Callbook this report" link. (10 min)

**Do not start any stretch before the core demo is recordable.**

---

## 12. Definition of "winning build"

By 8:00 PM the repo can:
1. Accept a Callbook ICP query
2. Hit Apify (≥1 actor working, ideally 2)
3. Score and rank lenders against a Callbook fit rubric
4. Enrich top leads via Nebius
5. Generate a personalized KugelAudio voice clip per top lead
6. Play that clip in the browser
7. Show matching email + LinkedIn drafts
8. Look polished — Magnetron-grade UI, Callbook-branded copy

If 7 of 8 work, ship. Don't burn submission time chasing 8/8.

---

## 13. PRESSURE-TEST CORRECTIONS — these override earlier sections

A red-team pass surfaced cold-start traps the cloud agent will hit if it follows §1–12 verbatim. **The corrections below are authoritative.**

### Override A — `tokenrouter.ts` migration is NOT a 5-minute swap (was: §6 KEEP shell, §7 Phase 1)
- Existing env vars are `TOKENROUTER_BASE_URL` / `TOKENROUTER_API_KEY` — rename reads to `NEBIUS_API_KEY`, hardcode `BASE = "https://api.tokenfactory.nebius.com/v1"`.
- Replace `MODEL_CHAIN` with Nebius slugs only: `["meta-llama/Llama-3.3-70B-Instruct", "meta-llama/Meta-Llama-3.1-8B-Instruct"]`. The existing DeepSeek/OpenAI fallbacks will 404 on Nebius.
- Replace the entire `SYSTEM_PROMPT` (currently scoped to "B2B buying-intent analyst Reddit/HN posts") with a Callbook lender pain-hypothesis prompt.
- Add new exports: `enrichLender(lead)` and `draftOutreach(lead)` returning `{pain_hypothesis, email{subject,body}, linkedin{dm}, voice{script}}`.
- **Realistic budget: 20 minutes, not 5.** Either fork to `nebius.ts` cleanly or rewrite tokenrouter in place.

### Override B — CUT list is incomplete (was: §6 CUT)
Add to the CUT list:
- [src/lib/sources/hn.ts](src/lib/sources/hn.ts) — imported by route.ts alongside reddit.ts
- [src/lib/scoring.ts](src/lib/scoring.ts) — SaaS-pain heuristic, replaced by `scoring-lender.ts`
- [src/lib/enrich.ts](src/lib/enrich.ts) — current enrichment wrapper, replaced by `nebius.ts` exports
- All AgentHansa references in [src/app/page.tsx](src/app/page.tsx) (`QuestsResp`, `SubmissionResp`, `handleSubmitToHansa`, `/api/agenthansa/quests` fetch) — **TypeScript will NOT catch the runtime fetch.** Must rewrite page.tsx.

### Override C — Files marked "swap internals" are full rewrites (was: §6 KEEP shell, swap internals)
- [src/components/LeadTable.tsx](src/components/LeadTable.tsx) — currently reads `lead.urgency`, `lead.intent_score`, `lead.competitor_signal`, `lead.subreddit`, `lead.source` — none exist on `LenderLead`. **Full rewrite, ~30 min.**
- [src/components/LeadDetail.tsx](src/components/LeadDetail.tsx) — reads `lead.dm_draft`, `lead.urgency`, `lead.subreddit`, `lead.source`. **Full rewrite, ~15 min.**
- [src/lib/icps.ts](src/lib/icps.ts) — preset ICPs are AI-outreach / eng-PM / scheduling. **Replace presets with lender categories** (BNPL / consumer credit / auto lending / student lending / debt buyers).
- [src/app/api/live-search/route.ts](src/app/api/live-search/route.ts) — drop ALL existing imports (`reddit`, `hn`, `scoring`, `enrich`). Treat as **rewrite from scratch**, not "swap internals."

### Override D — NDJSON event contract must match what the page parser expects (was: §7 Phase 2)
[src/app/page.tsx](src/app/page.tsx) (lines ~200–238) parses these specific shapes:
- `{type: "phase", phase: "crawl_start" | "crawl_done" | "score_done" | "enrich_start"}`
- `{type: "enrich_progress", done, total}`
- `{type: "done", leads, stats, warning?}`
- `{type: "error", error}`

**Two valid options — pick ONE:**
- **(i)** Keep existing event names; rebrand only the human-facing line copy in [src/components/Ticker.tsx](src/components/Ticker.tsx). Faster.
- **(ii)** Update both the route emitter AND the page parser in lockstep with new names (`sourcing | scoring | enriching | voicing`). Cleaner narrative.

Do **not** invent new event names without updating both sides — Ticker will silently render nothing.

### Override E — Route timeout collision (was: missing from §10 Risks)
Apify's `run-sync-get-dataset-items` can block up to 5 min. Existing route has `maxDuration = 120`. **Set `maxDuration = 300`** in `live-search/route.ts`. Alternatively, cap each actor with `?timeout=60` query param and accept partial results.

### Override F — Sourcing reality check (was: §7 Phase 3)
- `apify/google-search-scraper` returns search-result snippets, **not structured profile data**. It's a SIGNAL source (CFPB complaints, news mentions, hiring posts) — not a profile source.
- For structured person+title data you need `harvestapi/linkedin-profile-search`. **Don't demote LinkedIn to stretch.**
- `automation-lab/crunchbase-scraper` requires its own Crunchbase API key field — verify on the actor page; if blocked, skip immediately.

**Cost discipline:** cap `maxItems: 10` on every actor call. Run the LinkedIn actor **at most 3 times total** before submission — promo credits are limited.

### Override G — KugelAudio format verification moves to Phase 0 (was: §7 Phase 4)
KugelAudio docs say PCM by default. `<audio src="data:audio/wav;base64,...">` won't decode raw PCM without a WAV header. **Phase 0 smoke test must:**
1. POST `/tts/generate` with a 5-second test string
2. Save the bytes locally
3. Open the file in a browser `<audio>` tag
4. Confirm playback. If raw PCM, prepend a 44-byte WAV header before serving.

Don't write the wrapper before this works.

### Override H — Demo lead must be a real person at a real company (was: §8 demo script)
"CFO Jane Doe at Acme Lending" reads as synthetic in 2 seconds to any GTM judge. The demo lead in §8 must be:
- A real, named exec
- At a real, identifiable lender
- With a real, **on-screen** public signal (recent funding press release URL, hiring page, CFPB complaint URL) shown during voice playback

Otherwise the win-moment looks like a Mad Lib. The voice clip line "Q3 charge-offs ticked up 18%" is unverifiable unless the source URL is visible.

### Override I — Streaming behavior on Next.js 16 (was: missing from §10)
`Response` body NDJSON streaming has historically buffered behind some Next.js dev configs. **Phase 0 smoke test:** `curl -N` the live-search route and watch for line-by-line output. If buffered, pad first chunk with 1KB of whitespace to force flush.

### Override J — Voice clip persistence (was: missing from §10)
KugelAudio may return a signed URL with TTL. Plan loosely says "audioUrl." **Decision:** download the audio bytes server-side, write to `data/voice/{leadId}.wav`, serve from a new route `/api/voice/[id]/route.ts`. Cached. Replayable post-demo. Add `data/voice/` to `.gitignore`.

### Override K — Updated Phase 2 budget + must-have cut (was: §7)
Realistic Phase 2 (UI integration) budget is **~90 min**, not 45. UI rewrites of page.tsx + IcpForm copy + LeadTable + LeadDetail + VoicePlayer + OutreachPanel can't be done in 45 min cold.

**Hard cut rule:** if Phase 2 isn't done by **T-0:45**, drop LinkedIn + Crunchbase entirely and ship with Apify Google scraper as the only source. A working demo with one source beats a broken demo with three.

### Override L — Sponsor narrative sharpening (was: §8 demo script)
- Architecture beat compresses to **20 sec**, not 45. Spend the saved time replaying the voice clip + showing the email + LinkedIn variants generated from the same reasoning.
- Nebius story: use Llama-3.1-8B for bulk per-lead enrichment, Llama-3.3-70B only for the demo lead's voice script. Talking point: "We pick model size per task on Nebius."

---

## 14. Phase-gate smoke tests

**Do not advance phases until each gate passes.**

### Gate 0 (end of Phase 0)
- [ ] `curl` Apify `apify/google-search-scraper` returns 200 with results
- [ ] `curl` Nebius `/v1/chat/completions` with `Llama-3.3-70B-Instruct` returns 200
- [ ] `curl` KugelAudio `/v1/tts/generate` returns audio bytes
- [ ] Saved audio bytes play in a browser `<audio>` tag (don't trust docs — open the file)
- [ ] `npm run build` passes
- [ ] AgentHansa files deleted, no compile errors

### Gate 1 (end of Phase 1)
- [ ] One real `LenderLead` logged to terminal with a working `audioUrl`
- [ ] Open the URL in browser — voice plays end-to-end

### Gate 2 (end of Phase 2)
- [ ] Submit form → Ticker animates with real counts (not just filler) → table populates → modal opens → audio plays
- [ ] Email tab + LinkedIn tab both populated with non-stub copy

### Gate 3 (end of Phase 3)
- [ ] Either LinkedIn or Crunchbase actor merging into the candidate pool, OR conscious cut documented in commit message

### Gate 4 (end of Phase 4)
- [ ] Three pre-generated voice clips cached on disk as offline fallback
- [ ] Demo run replayable from `?demo=1` cached JSON
- [ ] Three real demo leads identified with on-screen public-signal URLs

---

## 15. Cloud-agent handoff prompt — copy this verbatim

> You are executing the Magnetron → Callbook GTM hackathon build.
>
> **SOURCE OF TRUTH:** `BUILD_PLAN.md` at the repo root. Read it fully before doing anything. Sections 13–14 contain pressure-test corrections that override earlier sections — treat those as authoritative.
>
> **WORKING BRANCH:** `callbook-gtm` (create from `main`).
>
> **ENV VARS** — write to `.env.local` (already gitignored):
> ```
> APIFY_TOKEN=...
> NEBIUS_API_KEY=...
> KUGELAUDIO_API_KEY=...
> ```
> Do NOT commit `.env.local`. Do update `.env.local.example` with the new keys (empty values).
>
> **SUCCESS CRITERIA** — section 12 of the plan: 7-of-8 minimum.
>
> **TOP TWO RISKS:**
> - **Time overrun.** Plan undercounts UI rewrites by ~2x. **Hard cut:** if Phase 2 isn't done by T-0:45, drop LinkedIn + Crunchbase entirely. Ship with Apify Google scraper only. Working-with-one beats broken-with-three.
> - **KugelAudio output format.** Verify in **Phase 0** (not Phase 4) that TTS output plays in a browser `<audio>` tag. Test the actual file. If raw PCM, wrap with 44-byte WAV header before serving.
>
> **DO NOT ADVANCE PHASES** until the smoke tests in §14 pass.
>
> **Apify cost discipline:** cap `maxItems: 10` on every call. Run LinkedIn actor at most 3 times total.
>
> **Final acceptance:** report back the dev server URL, the names of the three pre-generated demo leads, confirmation that `npm run build` passes with zero TypeScript errors, and the path to `BUILD_PLAN.md`.
