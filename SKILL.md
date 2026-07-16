---
name: decode-football-match
description: Research a real football match and transform reliable evidence into an interactive tactical Match Room with a sourced timeline, animated pitch diagrams, reusable football concepts, and contextual Codex follow-up. Use when a user wants to understand tactics, formations, rules, or critical plays through a specific real match.
---

# Decode Football Match

Create a sourced, runnable tactical-learning experience for a casual fan. Keep the real match primary, teach only when a moment creates curiosity, and keep Codex—not the preview—as the conversation surface.

## Inputs

Accept a match, competition or year, learning goal, optional highlight URL, optional locale, optional explicit key-play count, and optional output directory. If the match identity is ambiguous and reliable research cannot resolve it, ask one concise question. Otherwise proceed.

Choose the number of key plays organically from the video and evidence. Do not ask the user for a count and do not apply a default target or maximum. Require at least five distinct, evidence-backed tactical plays. Treat a user-provided number as an optional explicit override, never as the normal flow.

Choose the locale in this order:

1. Explicitly requested locale.
2. Language of the user's request.
3. Active conversation locale.
4. `en`.

V1 supports `en` and `zh-CN`. Use a BCP-47 value in `match-data.json`. Preserve canonical player, club, competition, and source names when translation reduces accuracy. Prefer highlight videos and sources in the selected language; disclose when only another-language material is available.

## Required workflow

### 1. Read the contracts

Read these files before researching or generating:

- `references/evidence-policy.md`
- `references/content-model.md`
- `references/ui-contract.md`

Treat `assets/match-room-template/` as an immutable visual base. Modify match content and structured data, not the component hierarchy, visual theme, diagram grammar, responsive behavior, or motion model.

### 2. Acquire the primary highlight video

Make video discovery the first research action. If the user provides a URL, verify that it shows the requested match, is accessible in the user's region, and record its language and publisher.

If the user does not provide a URL, search YouTube first using the teams, competition, year, “highlights,” and the selected language. Prefer, in order, official competition or federation channels, official team channels, and official broadcaster or rights-holder channels. Do not choose an unofficial reupload when an official version is available.

Open the selected video and verify that the page and playback are available in the user's region rather than relying on a search result alone. If YouTube is blocked, geo-restricted, removed, or otherwise unavailable, search for another official highlight video hosted by the competition, federation, team, broadcaster, or rights holder. Record why the YouTube-first path failed in `videoSelection.fallbackReason`.

Treat articles as supporting evidence, not the primary match surface. Use them to confirm events, lineups, rules, and attributed tactical interpretations; never use article prose to invent spatial movement that the video does not support.

### 3. Establish an evidence register

After selecting the video, search for official match reports, team sheets, reliable reporting, attributed tactical analysis, and official laws when rules are involved. Record each candidate claim with source URL, evidence class, and the exact fact or interpretation it supports. Register the selected video as a source.

Separate:

- confirmed match facts;
- attributed tactical analysis;
- official laws;
- general football knowledge;
- unsupported claims.

Apply `references/evidence-policy.md`. Omit unsupported formations, positions, timestamps, intentions, causal claims, and player locations. Never turn a plausible inference into a match fact.

### 4. Select teachable moments

Put `Match context` before `Key tactical plays`. Include only moments that have reliable support and teach a reusable spatial idea. A goal is not automatically a tactical moment.

Build a candidate list from the whole available video before drawing. Rank by evidence strength, tactical reusability, spatial clarity, and variety. Remove administrative events, spatially unclear moments, and plays that merely repeat an already-covered idea. Include every remaining meaningful play; stop when another play adds no new tactical understanding. Do not impose a numeric maximum.

Require at least five surviving plays. If the first highlight yields fewer than five, search for a longer or alternative highlight and supporting reliable material. If fewer than five still survive, stop and report that the source material is insufficient; never fabricate or weaken the evidence gate to reach the minimum.

For every tactical play provide:

- localized concept name and canonical English term;
- one-sentence definition;
- what to watch;
- the key decision or defensive dilemma;
- how to recognize the pattern in another match.

Prefer concepts such as decoy run, side overload, local overload, third-player run, rest defense, pinning, line-breaking carry, counterpress, pressing trap, and weak-side isolation only when the evidence and visible sequence support them.

### 5. Build three spatial phases

Create exactly three materially different phases for every tactical play. Preserve stable player IDs across phases. Show the relevant ball carrier, supporting attackers, defenders, cover, goalkeeper, defensive units, movement, passing options, and highlighted space when supported.

Use solid actors for recorded event participants and faded contextual players for teaching context. Mark reconstructed spacing and interpolation as teaching motion, not tracking data. Do not claim exact coordinates.

### 6. Scaffold and populate

Default to `./football-companion-<match-slug>` unless the user supplies an output path. Run:

```bash
python3 <skill-dir>/scripts/scaffold_match_room.py <output-dir> --locale <locale>
```

Replace `<output-dir>/src/match-data.json` with data conforming to `references/content-model.md`. Do not hardcode localized copy in React components; interface labels come from `src/i18n.js`.

If `<output-dir>` is an existing Match Room, treat it as untrusted legacy output until it passes the current validator. Before editing or previewing it, verify that `package.json` includes `test:ui`, `scripts/validate-ui.mjs` exists, and Playwright is installed. If any are missing, bring those validation files and package entries forward from `assets/match-room-template/`, preserve the room's match data and intentional customizations, then run the current validator as a baseline. Never infer compliance from the installed skill version or from CSS tokens alone; enforce it against the rendered room.

### 7. Validate and build

Run:

```bash
node <skill-dir>/scripts/validate_match_data.mjs <output-dir>/src/match-data.json
npm install
npm run test:ui
```

`npm run test:ui` builds the current source, selects every moment, and tests desktop, short-laptop, narrow-desktop, mobile, compact-mobile, and 200% text-zoom layouts. Resolve every validation error; do not open or deliver a room that fails. The validator enforces a 14px minimum for visible DOM and canvas text, readable contrast, 44px targets, non-overlapping timeline content, document overflow protection, a legible pitch ratio, and an initially visible learning-card preview on height-constrained laptops.

Inspect the generated screenshots in `<output-dir>/test-results/` against `assets/visual-baselines/desktop.png`, `narrow-desktop.png`, and `mobile.png`. Check the actual localized content, especially long source names, moment titles, concepts, player labels, and phase names. Verify that selecting a tactical play automatically starts its three-phase sequence, manual phase selection interrupts it, replay restarts from phase one, playback stops after the final interpolation, reduced-motion fallback works, internal timeline and pitch scrolling work, and URL state such as `?moment=two-v-one&phase=decision` remains addressable without forced autoplay.

### 8. Open the direct preview

Start the local Vite preview, capture its actual port, and open the direct preview beside Codex. Do not use Lavish. Do not embed a fake chat panel or simulated agent. The user asks follow-up questions in the real Codex task; use URL state to understand the visible moment and phase.

## Language contract

For `en`, render all interface labels, explanations, phase names, and teaching content in English. For `zh-CN`, render the interface and explanations in Simplified Chinese and show the canonical English tactical term beside each Chinese concept. Never mix fallback languages within one screen.

## Completion criteria

Finish only when:

- every match-specific claim has a registered source and evidence class;
- `videoSelection` records a verified, region-available primary video; absent a user URL, it records YouTube-first discovery or an explained official fallback;
- `keyPlaySelection.included` matches the timeline, is at least five, and was selected from the video without a default target or maximum;
- unsupported claims have been removed;
- context precedes plays;
- every play has exactly three meaningful phases and stable identities;
- selecting any tactical play automatically plays all three phases with continuous player motion;
- every concept has definition, watch cue, dilemma, and transfer cue;
- both validation and production build pass;
- the rendered UI passes `npm run test:ui` for every moment, including the 14px type floor, contrast, 44px targets, overlap, overflow, pitch-ratio, and 200% zoom checks;
- desktop and mobile preserve the Match Room UI contract;
- the direct preview opens without Lavish or embedded chat.
