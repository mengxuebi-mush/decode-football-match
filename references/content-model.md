# Match Room content model

`src/match-data.json` is the only match-specific input to the template.

## Top level

```json
{
  "schemaVersion": 1,
  "locale": "en",
  "match": {},
  "keyPlaySelection": {},
  "sources": [],
  "moments": []
}
```

Supported locales are `en` and `zh-CN`.

## Key-play selection

```json
{
  "target": 6,
  "included": 6,
  "strategy": "auto",
  "limitationNote": ""
}
```

- `target`: requested number of tactical plays. Default to 6; accept 1–12.
- `included`: actual number of moments whose `group` is `play`.
- `strategy`: `auto` when the default is used, or `explicit` when the user provides a number.
- `limitationNote`: required localized disclosure when `included` is lower than `target` because the evidence gate removed candidates.

Never exceed `target`. Never add unsupported filler to reach it. Context moments do not count toward either number.

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

## Phases

Every play has exactly three phases. Each phase requires:

- `id`: stable URL token such as `setup`, `decision`, `outcome`.
- `label`, `note`: localized strings.
- `players`: array of player objects.
- optional `arrows`, `lines`, and `zones`.

Context moments may have one to three phases and do not autoplay by default.

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
