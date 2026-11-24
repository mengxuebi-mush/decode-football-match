# Match Room content model

`src/match-data.json` is the only match-specific input to the template.

## Top level

```json
{
  "schemaVersion": 2,
  "locale": "en",
  "match": {},
  "videoSelection": {},
  "keyPlaySelection": {},
  "sources": [],
  "moments": []
}
```

Supported locales are `en` and `zh-CN`.

## Key-play selection

```json
{
  "minimum": 5,
  "included": 7,
  "strategy": "auto",
  "selectionRationale": "Seven distinct evidence-backed tactical plays survived review."
}
```

- `minimum`: always `5`.
- `included`: actual number of moments whose `group` is `play`; it must be at least five and has no maximum.
- `strategy`: `auto` for organic video-based selection, or `explicit` only when the user provides a number.
- `selectionRationale`: localized explanation of why this set survived evidence, spatial-clarity, usefulness, and redundancy review.
- `requested`: include only for `explicit`; it must be at least five and equal `included`.

In `auto`, do not store a target. Include all meaningful non-redundant plays from the video. If fewer than five survive after searching for fuller material, do not generate the Match Room. Context moments do not count.

## Video selection

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "platform": "youtube",
  "discovery": "youtube-search",
  "sourceId": "official-highlight",
  "sourceName": "Official broadcaster",
  "language": "en",
  "official": true,
  "availability": "available",
  "fallbackReason": ""
}
```

- `discovery`: `provided`, `youtube-search`, or `official-fallback`.
- `platform`: `youtube` or `official-site`.
- `sourceId`: registered source whose URL matches the selected video.
- `official`: true for search-selected YouTube videos and official fallbacks. A user-provided video may be false but requires corroboration.
- `availability`: must be `available` after opening the video in the user's region.
- `fallbackReason`: required for `official-fallback`; state why YouTube was unavailable.

Without a user URL, require `youtube-search` unless verified regional or playback failure requires `official-fallback`. `match.highlightUrl` must equal `videoSelection.url`.

## Match

Required fields:

- `id`: URL-safe match identifier.
- `homeTeam`, `awayTeam`, `score`: canonical display strings.
- `competition`: localized display name.
- `subtitle`: short localized context line.
- `highlightUrl`: direct `https` URL or empty only when no reliable highlight exists.
- `sourceDisclosure`: localized disclosure when the best video or source is not in the selected language.

## Sources

Each source requires:

- `id`, `name`, `url`, `language`;
- `classification`: `official-fact`, `reported-fact`, `attributed-analysis`, `official-law`, `general-knowledge`, or `teaching-reconstruction`;
- `supports`: a precise localized statement.

## Moments

Every moment requires:

- `id`: URL-safe and unique.
- `group`: `context` or `play`.
- `time`, `short`, `title`: localized strings.
- `sourceIds`: one or more IDs from `sources`.
- `evidenceLabel`: concise localized label.
- `legendSummary`: localized description of recorded actors versus teaching context.
- `phases`: phase array.

Order all `context` moments before all `play` moments.

Each `play` also requires `concept`:

```json
{
  "name": "Local overload",
  "canonicalTerm": "Local overload",
  "definition": "...",
  "watchCue": "...",
  "dilemma": "...",
  "transferCue": "..."
}
```

For `zh-CN`, `name` is Chinese and `canonicalTerm` remains English.

## Formation analysis

Exactly one `context` moment requires a `formationGuide` comparing both teams:

```json
{
  "formationGuide": {
    "title": "How the two shapes behave",
    "canonicalTerm": "Formation analysis",
    "definition": "...",
    "teams": [
      {
        "side": "home",
        "name": "England",
        "shape": "4–2–3–1",
        "attack": "...",
        "defend": "...",
        "tradeoff": "...",
        "sourceId": "attributed-analysis"
      },
      {
        "side": "away",
        "name": "Argentina",
        "shape": "4–3–3",
        "attack": "...",
        "defend": "...",
        "tradeoff": "...",
        "sourceId": "attributed-analysis"
      }
    ]
  }
}
```

Use one `home` and one `away` entry. Each `sourceId` must reference the source that supports that team's shape or behavior. Distinguish general structural tendencies from match-specific analysis and never present the formation as a fixed tracking position.

## Phases

Every play has exactly three phases. Each phase requires:

- `id`: stable URL token such as `setup`, `decision`, `outcome`.
- `label`: compact localized control text. Use one or two action-first words, at most 12 visible characters for English or 6 characters for Chinese. Do not include player names, explanatory clauses, or sentence-like copy.
- `note`: the full localized phase explanation shown in the pitch caption.
- `ball`: explicit ball position for this phase.
- `players`: array of player objects.
- optional `arrows`, `lines`, and `zones`.

Tactical plays automatically play all three phases when selected. Context moments may have one to three phases and do not autoplay by default.

Good English labels include `Block`, `Break line`, and `Finish`; good Chinese labels include `落位`, `破线`, and `射门`. Put detail such as “Messi controls and finishes with his left foot” in `note`, never in the control label.

### Ball

```json
{
  "x": 62,
  "y": 48,
  "playerId": "eng-10"
}
```

- `x` and `y` are required teaching coordinates from 0 to 100, not tracking data.
- `playerId` is optional. Include it only when that phase clearly shows a listed player controlling the ball; it must match a player ID in the same phase.
- Do not infer ball position from the final arrow, the first actor, or player order. Author it explicitly from the visible sequence.
- A tactical play must contain at least two distinct ball positions across its three phases.
- Ball movement between phases is teaching interpolation unless tracking data is explicitly available and sourced.

### Player

```json
{
  "id": "eng-10",
  "x": 62,
  "y": 48,
  "team": "home",
  "number": "10",
  "name": "Bellingham",
  "role": "actor"
}
```

- `x` and `y` are teaching coordinates from 0 to 100, not tracking data.
- `id` stays stable across phases.
- `team` is `home` or `away`.
- `role` is `actor` or `context`; contextual players render faded.
- Always show number and name when known. In Chinese prose use forms such as `10号 Bellingham`.

### Arrow

```json
{ "from": [62, 48], "to": [76, 42], "type": "run", "label": "Decoy run" }
```

Supported types: `run`, `pass`, `shot`, `recover`, `option`, `press`, and `carry`.

### Unit line

```json
{ "from": [70, 24], "to": [70, 76], "team": "away" }
```

Use dashed lines for formation or defensive units. They are not passing lines.

### Zone

```json
{ "x": 76, "y": 35, "radius": 10, "label": "Weak-side space" }
```

Use zones only when the space is part of the teaching claim.

## URL state

The template reads and writes:

```text
?moment=<moment-id>&phase=<phase-id>
```

Invalid values fall back to the first moment and its first phase.
