# Decode Football Match

Turn a real football match into an interactive tactical learning experience for casual fans.

`decode-football-match` is a Codex skill that researches reliable match evidence, finds an official highlight video, identifies teachable tactical moments, and builds a runnable Match Room with an annotated timeline, animated pitch diagrams, and reusable football concepts.

The match remains the primary experience. There are no courses, quizzes, dashboards, progress systems, or simulated chat panels. Follow-up questions stay in the real Codex conversation.

## Install

Clone the repository into your personal Codex skills directory:

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/mengxuebi-mush/decode-football-match.git \
  ~/.codex/skills/decode-football-match
```

The repository is currently private, so GitHub authentication is required. Restart Codex after installation so it discovers the skill.

To update an existing installation:

```bash
git -C ~/.codex/skills/decode-football-match pull
```

## Use

Invoke the skill by name and identify the match you want to understand:

```text
Use $decode-football-match to explain the tactics in England vs Norway at the 2026 World Cup.
```

You can also provide a learning goal or highlight URL:

```text
Use $decode-football-match to analyze this match. Help me understand side overloads and rest defense: <highlight-url>
```

The experience follows the language of the request unless you explicitly choose another language:

```text
使用 $decode-football-match，通过这场比赛帮我理解诱饵跑动和局部人数优势。
```

English (`en`) and Simplified Chinese (`zh-CN`) are supported in V1. Chinese explanations retain the canonical English tactical term beside the translated concept.

## What it creates

- A sourced match timeline with match context before tactical plays
- An organically selected set of tactical key plays, based on what the video can reliably teach
- At least five distinct key plays; if the available evidence cannot support five, the skill reports that limitation instead of inventing moments
- Three materially different phases for every play, with continuous player motion
- Tactical concepts such as decoy runs, side overloads, pressing traps, rest defense, pinning, and line-breaking carries when the evidence supports them
- A permanently visible learning card explaining the concept, what to watch, the key dilemma, and how to recognize it in another match
- A responsive English or Simplified Chinese interface
- A direct local preview that works beside Codex without Lavish or a browser extension

## Evidence and video policy

If the user supplies a highlight URL, the skill verifies that it is the correct match and is playable in the user's region.

Otherwise, it searches YouTube first and prioritizes:

1. Official competition or federation channels
2. Official team channels
3. Official broadcasters or rights holders

If YouTube is unavailable in the user's region, it looks for another official highlight hosted by the competition, federation, team, broadcaster, or rights holder. Articles support the analysis but do not replace the video as the primary match surface.

Every match-specific claim must have a source and an evidence classification. Unsupported formations, locations, intentions, timestamps, and causal explanations are omitted.

## How it works

1. Determines the match, learning intent, and preferred language.
2. Finds and verifies a region-available official highlight video.
3. Registers official match records, reliable reporting, attributed tactical analysis, and official laws when relevant.
4. Reviews the available video as a whole and selects every distinct, evidence-backed moment that adds tactical understanding.
5. Builds three teaching phases with stable player identities for each play.
6. Populates the preserved Match Room interface.
7. Validates sources, localization, tactical phases, motion, and layout.
8. Builds and opens the direct local preview beside Codex.

The number of key plays is not fixed. It grows or shrinks with the tactical value and evidence available in the selected video, with a minimum evidence threshold of five plays and no arbitrary maximum.

## Match Room design contract

Generated rooms retain the included interface rather than redesigning it for each match:

- Dark broadcast-analysis-room aesthetic
- Compact timeline, dominant striped pitch, and restrained match header
- Numbered and named players, defenders, support, cover, goalkeepers, movement arrows, defensive lines, and highlighted space
- Solid event actors and faded contextual players
- Three replay phases with continuous interpolation instead of slide-like cuts
- Permanently expanded tactical-learning card
- One-viewport desktop layout with internal scrolling and responsive mobile adaptation

Content may change for each match; the visual hierarchy, pitch grammar, motion behavior, and interaction model should not.

## Repository structure

```text
decode-football-match/
├── SKILL.md                         # Codex workflow and completion rules
├── agents/openai.yaml               # Skill display metadata and default prompt
├── references/                      # Evidence, content, and UI contracts
├── assets/match-room-template/      # Preserved React/Vite Match Room
├── assets/visual-baselines/         # Desktop and mobile regression references
└── scripts/                         # Scaffolding and match-data validation
```

`SKILL.md` is the operational instruction file used by Codex. This README is a human-facing overview for installation, invocation, and repository navigation.

## Validate the skill

Validate a generated match-data file with:

```bash
node scripts/validate_match_data.mjs path/to/match-data.json
```

Scaffold the bundled template for local inspection with:

```bash
python3 scripts/scaffold_match_room.py /tmp/football-companion-demo --locale en
cd /tmp/football-companion-demo
npm install
npm run build
```
