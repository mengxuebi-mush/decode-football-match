# Match Room UI contract

The files in `assets/match-room-template/` are the fixed interface. Populate data; do not redesign per match.

## Visual identity

- Restrained dark broadcast-analysis-room aesthetic.
- Charcoal-black surfaces, muted pitch greens, restrained gold emphasis, red opposition accents.
- No gradients as decorative theme, glassmorphism, bright dashboard color coding, generic card grids, gamification, progress UI, quizzes, or knowledge trees.
- Typography is quiet and editorial. The match and pitch dominate; chrome recedes.

## Desktop hierarchy

Use one viewport with internal scrolling:

1. Quiet match header with score, competition, and `View match highlights` when available.
2. Compact left timeline.
3. Dominant analysis surface containing title, source links, phase controls, striped pitch, and expanded learning card.
4. Codex conversation outside the preview.

Place `Match context` before `Key tactical plays`. Never add an embedded fake chat panel.

Render the full selected key-play set in the timeline. A normal full-match room targets six plays; a one-play timeline is valid only when the user explicitly requests one or the evidence-limitation disclosure explains why only one survived.

## Pitch anatomy

- Render alternating vertical grass stripes.
- Put the legend above plotted action, at the top of the pitch.
- Show numbered circles and player names.
- Show relevant attacking support, defenders, cover, goalkeeper, defensive lines, arrows, and highlighted space.
- Use solid opacity for event actors and faded opacity for contextual teaching players.
- Use dashed unit/formation lines; never let them resemble a pass.
- Formation comparison places both teams on the same full pitch, each in its own half. Connect each formation line so the first `4`, midfield line, and forward line are legible.

## Motion

- Tactical plays have exactly three phase controls and a quiet replay action.
- Replay continuously interpolates stable player identities, lines, zones, and arrows. It must not look like slide changes.
- Manual phase selection interrupts autoplay immediately.
- Replay stops on the final phase.
- Under `prefers-reduced-motion: reduce`, skip interpolation and update states immediately.
- Caption the animation as teaching motion or reconstruction, never tracking data.

## Learning card

Keep the tactical-learning card permanently expanded beneath the pitch. Show:

- localized concept name plus canonical English term;
- simple definition;
- `What to watch`;
- `Key dilemma`;
- `Recognize it next time`.

Do not use the card for source provenance labels such as “Verified sequence.” Sources belong near the moment title.

## Responsive behavior

- Keep the pitch primary at every size.
- Desktop uses a fixed viewport; timeline and learning card scroll internally when needed.
- At tablet width, move the timeline into a horizontal rail above the pitch.
- On mobile, simplify secondary chrome, retain phase controls and concept content, and avoid an excessively tall document.
- Minimum touch target is 40px where space permits.
- Localized labels must wrap without overflow.

## Allowed changes

Content generation may change match data, localized text, sources, players, coordinates, arrows, zones, and tactical concepts.

## Forbidden deviations

Do not introduce dashboards, new card systems, decorative gradients, gamification, embedded simulated chat, a new theme, a different palette, slide-like phase cuts, collapsed concept content, or an iframe/video-player recreation.
