# TanyaLokal prototype

A shareable, mobile-first Teluk Intan prototype adapted from the supplied HTML reference. It preserves the illustration, layout, Malay/English switch, topic browsing, directory cards, Insights and QR screen.

## Run locally

Use Node.js 24.

```sh
npm ci
npm run dev
```

Open http://localhost:3000/teluk-intan. No API key or environment variables are required. `npm run build` produces `dist/`; `npm run preview` serves the production build. `npm test` checks the directory count, redaction, bounded recommendations, missing-data fallback, and starter-question behaviour. `npm run lint` checks JavaScript syntax.

## What this preview does

- Browse and search all 194 supplied entries without modifying the original seed data.
- Answer supported questions with deterministic browser-side keyword matching and draft guides. It makes **no live AI calls** and cannot answer arbitrary questions.
- Display place cards directly from the supplied records and mark them as unchecked.
- Show redacted Insights for this visit only. Questions are held in memory, cleared on reload, and never sent to an application database or authority.
- Generate a QR code locally for the current origin at `/teluk-intan?src=scan-screen`. QR attribution is a URL parameter only; it is not logged.
- Serve a bilingual privacy notice at `/privacy.html` (also `/privacy` on Vercel).

The original archive contains an MVP implementation brief, not an existing Next.js project. The current user request was to extract, review, run and share the prototype. This preview therefore uses Vite and plain JavaScript while retaining the supplied design. The broader brief is preserved in [docs/MVP-BRIEF.md](docs/MVP-BRIEF.md) as background requirements, **not a claim of implemented features**.

## Not implemented

There is no database, admin login, CRUD/import UI, verification queue, persistent sessions, shared council dashboard, embeddings, real language model, server-side rate limiting or token budget. The browser-side text animation is not model streaming. Questions in languages other than Malay/English have no dedicated answer support. No public-service report is submitted by this prototype. The seed data has not been checked against current real-world information.

## Data and licence

Place data © OpenStreetMap contributors (ODbL), with some names from Wikipedia. The supplied seed notes describe OpenStreetMap/Nominatim and the English Wikipedia Teluk Intan article as the sources, collected/read on 19 November 2026. That provenance was supplied in the bundle and was not independently verified during this prototype preparation.

- Original inputs: `seed/entries.csv` and `seed/guides.json`.
- Browser copies: `src/data/entries.json` and `src/data/guides.json`.
- All entries remain unverified; all five guides remain drafts.
- Known gaps from the supplied brief: no massage/reflexology listings, only two private dentists, 14 entries with phone numbers, 16 with opening hours, and 14 Wikipedia entries without addresses. These counts are supplied context; see the review notes for directly checked counts.
- Keep attribution and applicable source licence obligations when redistributing the directory. No new licence is asserted over the supplied design or source content.

## Deployment

Deploy this repository to Vercel with framework **Vite**, build command `npm run build`, and output directory `dist`. No secrets or environment variables are needed. `vercel.json` enables direct links to `/teluk-intan` and `/privacy`. The source repository may be private while the prototype website is public.

The published site serves only the build output. The original zip files, instructions, HTML reference, tests and seed CSV are not deployed. Google Fonts is requested externally; QR generation runs from the bundled npm dependency. Maps links open Google Maps only when selected. Vercel may process normal hosting request metadata; there is no application analytics tracker.

## Future MVP work

Before implementing the broader brief, choose a persistent database compatible with the intended hosting runtime, add authenticated administration and privacy controls, introduce a server-side provider interface with explicit mock/live modes, enforce locality scoping and retrieved-id checks on the server, and add rate limits and budgets. Adding a second locality and swapping live LLM providers are future MVP tasks; this preview is specifically scoped to the supplied Teluk Intan dataset.
