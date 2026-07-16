# Match Room UI contract

The files in `assets/match-room-template/` are the fixed interface. Populate data; do not redesign per match.

## Visual identity

- Restrained dark broadcast-analysis-room aesthetic.
- Charcoal-black surfaces, muted pitch greens, restrained gold emphasis, red opposition accents.
- No gradients as decorative theme, glassmorphism, bright dashboard color coding, generic card grids, gamification, progress UI, quizzes, or knowledge trees.
- Typography is quiet and editorial. The match and pitch dominate; chrome recedes.
- Use the bundled Atkinson Hyperlegible files for Latin text, with system Chinese fallbacks. Do not fetch fonts at runtime.
- No visible interface, timeline, teaching, legend, or canvas text may render below 14px.
- Keep the replay action as a borderless 44px icon-only button immediately after the three phase tabs. Give it an accessible name and a visible hover/focus tooltip. Moment titles stay on one line when the analysis width can contain them and wrap naturally otherwise; a title must never collide with or slide under the phase controls at any width.
- Normal text must meet a 4.5:1 contrast ratio. Large text and essential graphical controls must meet 3:1. Do not lower contrast by applying opacity to a parent containing text.

## Desktop hierarchy

Use one viewport with internal scrolling:

1. Quiet match header with score, competition, and `View match highlights` when available.
2. Compact left timeline.
3. Dominant analysis surface containing title, source links, phase controls, striped pitch, and expanded learning card.
4. Codex conversation outside the preview.

Place `Match context` before `Key tactical plays`. Never add an embedded fake chat panel.

Group every source for the selected moment inside one compact localized `Sources` dropdown beneath the analysis title. Show the source count on the closed control, preserve every direct source link inside the open menu, and overlay the menu without moving or shrinking the pitch. The dropdown shares one compact meta row with the pitch legend — dropdown at the inline start, legend right-aligned — so the legend does not consume a separate full-width bar; the row stacks vertically at narrow widths.

Render the full organically selected key-play set in the timeline. Require at least five plays and impose no UI maximum; the timeline scrolls internally as needed. Do not truncate the set merely to keep the timeline short.

Timeline cards show only the match time, plain-language moment title, and reusable tactical concept. Keep source and evidence classifications near the analysis title, not inside the timeline. Cards must grow with localized content; never use a fixed height for variable text.

## Pitch anatomy

- Render alternating vertical grass stripes.
- Put the legend in the shared meta row directly above the pitch (right-aligned beside the `Sources` dropdown), always above the plotted action.
- Do not draw an additional outer border around the pitch shell. The pitch's own field boundary provides sufficient containment.
- Show numbered circles and player names.
- Show relevant attacking support, defenders, cover, goalkeeper, defensive lines, arrows, and highlighted space.
- Use solid opacity for event actors and faded opacity for contextual teaching players.
- Use dashed unit/formation lines; never let them resemble a pass.
- Formation comparison places both teams on the same full pitch, each in its own half. Connect each formation line so the first `4`, midfield line, and forward line are legible.
- Keep a readable landscape pitch ratio. On a narrow phone, preserve the pitch width and allow horizontal scrolling inside the pitch surface instead of squeezing names into collisions.
- Place 14px-or-larger player labels with collision-aware candidate positions. Labels may use a leader line when displaced. Never allow player names, numbers, or zone labels to overlap each other.

## Motion

- Tactical plays have exactly three phase controls and a quiet replay action.
- Selecting a tactical play automatically starts its three-phase sequence from the first phase. Context moments do not autoplay.
- Replay continuously interpolates stable player identities, lines, zones, and arrows. It must not look like slide changes.
- Manual phase selection interrupts autoplay immediately.
- Replay stops on the final phase.
- Under `prefers-reduced-motion: reduce`, skip interpolation and update states immediately.
- Disclose teaching reconstruction through the selected moment's registered source and evidence metadata near the title, never as a persistent label over the pitch and never as tracking data.

## Learning card

Keep the tactical-learning card permanently expanded beneath the pitch. Show:

- localized concept name plus canonical English term;
- simple definition;
- `What to watch`;
- `Key dilemma`;
- `Recognize it next time`.

Do not use the card for source provenance labels such as “Verified sequence.” Sources belong near the moment title.

Guide body text (`What to watch`, `Key dilemma`, `Recognize it next time`) uses the 16px body size, never the 14px floor. Show each piece of concept content exactly once: the summary carries the name, canonical term, and definition; the guide cells carry the cues. Never duplicate a cue in the card summary.

## Responsive behavior

- Keep the pitch primary at every size.
- On wide but height-constrained laptops, size the pitch from both the available width and the analysis-panel height. At initial scroll, preserve at least a 64px preview of the expanded learning card below the pitch; do not make users discover the teaching content only by scrolling.
- Desktop uses a fixed viewport; timeline and learning card scroll internally when needed.
- At tablet width, move the timeline into a horizontal rail above the pitch.
- On mobile, simplify secondary chrome, retain phase controls and concept content, and avoid an excessively tall document.
- Minimum interactive target is 44px in both dimensions.
- Localized labels must wrap without overflow.
- At 200% text zoom, keep document-width overflow at zero; use internal timeline/pitch scrolling where needed.

## Required UI validation

Run `npm run test:ui` after populating real match data. It builds the current source and tests every moment at 1440×900, a short 1440×800 laptop viewport, 1024×768, 390×844, 320×844, and 200% text zoom.

The generated room is not complete unless the validator confirms:

- every visible DOM and canvas font is at least 14px;
- normal text contrast is at least 4.5:1 and large text contrast is at least 3:1;
- interactive targets are at least 44×44px;
- timeline rows do not overlap or clip;
- localized content does not create document-level horizontal overflow;
- the pitch retains a readable landscape ratio;
- all generated screenshots have been reviewed against the approved desktop, narrow-desktop, and mobile baselines.

Test the actual generated English or Chinese content, not only the bundled demo. Long player names, translated concepts, phase names, evidence links, and source names must all survive the same checks.

## Allowed changes

Content generation may change match data, localized text, sources, players, coordinates, arrows, zones, and tactical concepts.

## Forbidden deviations

Do not introduce dashboards, new card systems, decorative gradients, gamification, embedded simulated chat, a new theme, a different palette, slide-like phase cuts, collapsed concept content, or an iframe/video-player recreation.
