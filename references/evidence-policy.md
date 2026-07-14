# Evidence policy

## Source hierarchy

Use the strongest available source for each claim:

1. Official competition or federation match reports, lineups, disciplinary records, video, and laws.
2. Official club or national-team material for confirmed personnel and attributed statements.
3. Reputable match reporting for recorded events and timestamps.
4. Named, attributable tactical analysis for shape and tactical interpretation.
5. Established coaching or laws material for reusable football concepts.

Search in the selected locale first. A source in another language is acceptable when it is stronger or the only reliable source; disclose this in `sourceDisclosure`.

## Evidence classes

- `official-fact`: official match record, lineup, result, substitution, card, or competition video.
- `reported-fact`: a recorded event supported by reputable reporting.
- `attributed-analysis`: a formation, intention, or tactical reading attributed to a named analyst or publication.
- `official-law`: the governing law or official interpretation.
- `general-knowledge`: a reusable coaching principle that does not claim what happened in this match.
- `teaching-reconstruction`: approximate spacing added only to explain a sourced sequence.

## Claim rules

Attach at least one source URL and evidence class to every match-specific moment. Sources must state what they support; a general homepage is insufficient.

Do not infer as fact:

- exact formations or formation changes;
- exact player positions, distances, or off-ball runs;
- a player's intention;
- causal explanations for a goal or mistake;
- a timestamp not confirmed by the chosen video or report;
- a foul, offside, handball, or sanction beyond the official decision.

If only an analyst supports a claim, write “Analysis by … describes …” rather than presenting it as official. If spacing is reconstructed, label it as a teaching reconstruction and avoid precise-sounding coordinates.

Omit a moment when the available evidence cannot support the spatial lesson. Fewer trustworthy moments are better than a complete-looking timeline.

Select key plays organically from the available video. Require at least five and impose no maximum. Count only distinct moments with reliable evidence, clear spatial teaching value, and a reusable tactical concept. When fewer than five survive, find fuller source material; if that still fails, stop rather than fabricate.

## Concept boundary

General tactical knowledge may explain a sourced moment, but must not retroactively prove that a team intended the concept. Distinguish:

- what the report or video confirms;
- what an attributed analyst argues;
- what the diagram adds for teaching;
- what the user can recognize in future matches.

## Source register

For each source store:

- stable `id`;
- canonical `name`;
- direct `url`;
- `language` as BCP-47;
- `classification`;
- short `supports` statement.

Use direct links. Prefer the official highlight over reuploads. Never fabricate a URL, publication, quote, timestamp, lineup, or analyst.
