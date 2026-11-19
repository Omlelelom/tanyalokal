# Project review

Reviewed on 19 November 2026 for the requested local and shareable prototype.

## Supplied bundle

The outer archive contained a nested `tanyalokal-codex.zip`, an MVP prompt, a CSV, a JSON guide file and a standalone HTML reference. The nested archive contained the same brief, seed files and HTML. There was no existing package manifest, Next.js source, backend, database, admin implementation or runnable development command.

The HTML reference depended on `window.claude` for model sampling and storage, and its QR code defaulted to a Claude artifact URL. Those capabilities would not work on an ordinary local server or Vercel website. The reference loaded QR code JavaScript from a CDN.

## Changes for this request

- Kept the supplied layout, illustration, typography, colours and four tabs.
- Separated the reference into `index.html`, `src/styles.css` and `src/app.js`.
- Added a Vite development server, production build, pinned npm lockfile and Vercel route configuration.
- Replaced host-only model calls with deterministic, browser-side demo replies tied to the supplied directory and draft guides. The interface and README disclose this mode.
- Replaced unavailable shared storage with visit-only Insights held in memory. Redact phone numbers, IC numbers and email addresses before adding question text to Insights. Issue summaries use fixed categories without personal details.
- Removed claims about saved questions, town-wide statistics and submitted reports. Added a bilingual privacy notice.
- Bundled QR generation and pointed the QR at the current origin's locality page. Preserved a four-module quiet zone around the QR.
- Added an unchecked notice on every place card. No seed place, address, phone or hours was invented or updated.

## Directly checked data

194 unique entries: 180 marked `osm`, 14 marked `wiki`. Fourteen entries have phone numbers; 16 have opening hours; all 14 Wikipedia entries have no address. There are two `dentist` records and one district `dental office`. All five guides retain `status: draft`. Source provenance and real-world accuracy were not independently verified.

## Limits

This is an interactive frontend prototype, not the full MVP described in the bundled brief. There is no production AI, database, administration, cross-user analytics, server-side quota/rate limiting or public-service integration. It supports bounded English/Malay examples rather than arbitrary natural-language answers. A future live system needs server-side retrieval, verification, privacy controls and suitable persistent hosting. See the README for the full boundary and setup instructions.

No credentials were included in the prepared source. Raw archives and duplicate input copies are ignored by Git; reference, briefing and seed input files are excluded from the published build. Place data is public source material, not private resident data.
