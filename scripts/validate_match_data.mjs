#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const SUPPORTED_LOCALES = new Set(["en", "zh-CN"]);
const GROUPS = new Set(["context", "play"]);
const EVIDENCE = new Set(["official-fact", "reported-fact", "attributed-analysis", "official-law", "general-knowledge", "teaching-reconstruction"]);
const TEAMS = new Set(["home", "away"]);
const ROLES = new Set(["actor", "context"]);
const ARROWS = new Set(["run", "pass", "shot", "recover", "option", "press", "carry"]);
const VIDEO_PLATFORMS = new Set(["youtube", "official-site"]);
const VIDEO_DISCOVERY = new Set(["provided", "youtube-search", "official-fallback"]);

const errors = [];
const fail = (pathName, message) => errors.push(`${pathName}: ${message}`);
const requiredString = (value, pathName) => {
  if (typeof value !== "string" || !value.trim()) fail(pathName, "must be a non-empty string");
};
const validUrl = (value) => {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
};

function validateI18n(root) {
  return import(pathToFileURL(path.join(root, "assets/match-room-template/src/i18n.js"))).then(({ dictionaries }) => {
    const englishKeys = Object.keys(dictionaries.en).sort();
    for (const locale of SUPPORTED_LOCALES) {
      const dictionary = dictionaries[locale];
      if (!dictionary) { fail(`i18n.${locale}`, "dictionary is missing"); continue; }
      const keys = Object.keys(dictionary).sort();
      if (keys.join("|") !== englishKeys.join("|")) fail(`i18n.${locale}`, "keys must exactly match the English dictionary");
      keys.forEach((key) => requiredString(dictionary[key], `i18n.${locale}.${key}`));
    }
    for (const [key, value] of Object.entries(dictionaries.en)) {
      if (/\p{Script=Han}/u.test(value)) fail(`i18n.en.${key}`, "contains an untranslated Han character");
    }
  });
}

function validatePlayer(player, at) {
  requiredString(player.id, `${at}.id`);
  requiredString(player.number, `${at}.number`);
  requiredString(player.name, `${at}.name`);
  if (!TEAMS.has(player.team)) fail(`${at}.team`, "must be home or away");
  if (!ROLES.has(player.role)) fail(`${at}.role`, "must be actor or context");
  for (const coordinate of ["x", "y"]) {
    if (typeof player[coordinate] !== "number" || player[coordinate] < 0 || player[coordinate] > 100) fail(`${at}.${coordinate}`, "must be a number from 0 to 100");
  }
}

function spatialDifference(a, b) {
  const before = new Map(a.players.map((player) => [player.id, player]));
  let shared = 0;
  let maxDistance = 0;
  for (const player of b.players) {
    const prior = before.get(player.id);
    if (!prior) continue;
    shared += 1;
    maxDistance = Math.max(maxDistance, Math.hypot(player.x - prior.x, player.y - prior.y));
  }
  const structureChanged = JSON.stringify(a.arrows ?? []) !== JSON.stringify(b.arrows ?? []) || JSON.stringify(a.zones ?? []) !== JSON.stringify(b.zones ?? []) || JSON.stringify(a.lines ?? []) !== JSON.stringify(b.lines ?? []);
  return { shared, meaningful: maxDistance >= 3 || structureChanged };
}

function validatePhase(phase, at) {
  requiredString(phase.id, `${at}.id`);
  requiredString(phase.label, `${at}.label`);
  requiredString(phase.note, `${at}.note`);
  if (!Array.isArray(phase.players) || !phase.players.length) fail(`${at}.players`, "must contain players");
  else {
    const ids = new Set();
    phase.players.forEach((player, index) => { validatePlayer(player, `${at}.players[${index}]`); if (ids.has(player.id)) fail(`${at}.players[${index}].id`, "duplicates another player in this phase"); ids.add(player.id); });
  }
  (phase.arrows ?? []).forEach((arrow, index) => {
    const arrowAt = `${at}.arrows[${index}]`;
    if (!ARROWS.has(arrow.type)) fail(`${arrowAt}.type`, "unsupported arrow type");
    for (const key of ["from", "to"]) if (!Array.isArray(arrow[key]) || arrow[key].length !== 2 || arrow[key].some((value) => typeof value !== "number" || value < 0 || value > 100)) fail(`${arrowAt}.${key}`, "must be [x,y] values from 0 to 100");
  });
}

function validate(data) {
  if (data.schemaVersion !== 1) fail("schemaVersion", "must equal 1");
  if (!SUPPORTED_LOCALES.has(data.locale)) fail("locale", "must be en or zh-CN");
  for (const key of ["id", "homeTeam", "awayTeam", "score", "competition", "subtitle", "sourceDisclosure"]) requiredString(data.match?.[key], `match.${key}`);
  if (data.match?.highlightUrl && !validUrl(data.match.highlightUrl)) fail("match.highlightUrl", "must be an http(s) URL or empty");

  const video = data.videoSelection;
  if (!video || typeof video !== "object") fail("videoSelection", "is required");
  else {
    for (const key of ["sourceId", "sourceName", "language", "availability"]) requiredString(video[key], `videoSelection.${key}`);
    if (!validUrl(video.url)) fail("videoSelection.url", "must be a direct http(s) video URL");
    if (!VIDEO_PLATFORMS.has(video.platform)) fail("videoSelection.platform", "must be youtube or official-site");
    if (!VIDEO_DISCOVERY.has(video.discovery)) fail("videoSelection.discovery", "must be provided, youtube-search, or official-fallback");
    if (typeof video.official !== "boolean") fail("videoSelection.official", "must be boolean");
    if (video.availability !== "available") fail("videoSelection.availability", "must equal available after regional playback verification");
    if (video.url !== data.match?.highlightUrl) fail("videoSelection.url", "must equal match.highlightUrl");
    if (video.discovery === "youtube-search" && video.platform !== "youtube") fail("videoSelection.platform", "must be youtube for youtube-search");
    if (video.discovery === "youtube-search" && video.official !== true) fail("videoSelection.official", "must be true for a search-selected YouTube video");
    if (video.discovery === "official-fallback") {
      if (video.platform !== "official-site") fail("videoSelection.platform", "must be official-site for official-fallback");
      if (video.official !== true) fail("videoSelection.official", "must be true for official-fallback");
      requiredString(video.fallbackReason, "videoSelection.fallbackReason");
    }
  }

  const selection = data.keyPlaySelection;
  if (!selection || typeof selection !== "object") fail("keyPlaySelection", "is required");
  else {
    if (selection.minimum !== 5) fail("keyPlaySelection.minimum", "must equal 5");
    if (!Number.isInteger(selection.included) || selection.included < 5) fail("keyPlaySelection.included", "must be an integer of at least 5");
    if (!new Set(["auto", "explicit"]).has(selection.strategy)) fail("keyPlaySelection.strategy", "must be auto or explicit");
    requiredString(selection.selectionRationale, "keyPlaySelection.selectionRationale");
    if (Object.hasOwn(selection, "target")) fail("keyPlaySelection.target", "is obsolete; organic selection has no target or maximum");
    if (selection.strategy === "auto" && Object.hasOwn(selection, "requested")) fail("keyPlaySelection.requested", "must be omitted for organic auto selection");
    if (selection.strategy === "explicit") {
      if (!Number.isInteger(selection.requested) || selection.requested < 5) fail("keyPlaySelection.requested", "must be an integer of at least 5 for explicit selection");
      if (Number.isInteger(selection.requested) && Number.isInteger(selection.included) && selection.included !== selection.requested) fail("keyPlaySelection.included", "must equal requested for explicit selection");
    }
  }

  if (!Array.isArray(data.sources) || !data.sources.length) fail("sources", "must contain at least one source");
  const sourceIds = new Set();
  for (const [index, source] of (data.sources ?? []).entries()) {
    const at = `sources[${index}]`;
    for (const key of ["id", "name", "language", "supports"]) requiredString(source[key], `${at}.${key}`);
    if (sourceIds.has(source.id)) fail(`${at}.id`, "must be unique");
    sourceIds.add(source.id);
    if (!validUrl(source.url)) fail(`${at}.url`, "must be a direct http(s) URL");
    if (!EVIDENCE.has(source.classification)) fail(`${at}.classification`, "unsupported evidence class");
  }
  if (video && typeof video === "object") {
    if (!sourceIds.has(video.sourceId)) fail("videoSelection.sourceId", "must reference a registered source");
    else {
      const registeredVideo = data.sources.find((source) => source.id === video.sourceId);
      if (registeredVideo?.url !== video.url) fail("videoSelection.sourceId", "registered source URL must match videoSelection.url");
    }
  }

  if (!Array.isArray(data.moments) || !data.moments.length) fail("moments", "must contain moments");
  const momentIds = new Set();
  let seenPlay = false;
  let playCount = 0;
  for (const [index, moment] of (data.moments ?? []).entries()) {
    const at = `moments[${index}]`;
    for (const key of ["id", "time", "short", "title", "evidenceLabel", "legendSummary"]) requiredString(moment[key], `${at}.${key}`);
    if (momentIds.has(moment.id)) fail(`${at}.id`, "must be unique");
    momentIds.add(moment.id);
    if (!GROUPS.has(moment.group)) fail(`${at}.group`, "must be context or play");
    if (moment.group === "play") { seenPlay = true; playCount += 1; }
    if (moment.group === "context" && seenPlay) fail(`${at}.group`, "context moments must precede tactical plays");
    if (!Array.isArray(moment.sourceIds) || !moment.sourceIds.length) fail(`${at}.sourceIds`, "every match-specific moment requires a source");
    else moment.sourceIds.forEach((id, sourceIndex) => { if (!sourceIds.has(id)) fail(`${at}.sourceIds[${sourceIndex}]`, "does not reference a registered source"); });
    if (!Array.isArray(moment.phases) || !moment.phases.length) fail(`${at}.phases`, "must contain phases");
    else {
      if (moment.group === "play" && moment.phases.length !== 3) fail(`${at}.phases`, "tactical plays require exactly three phases");
      const phaseIds = new Set();
      moment.phases.forEach((phase, phaseIndex) => { validatePhase(phase, `${at}.phases[${phaseIndex}]`); if (phaseIds.has(phase.id)) fail(`${at}.phases[${phaseIndex}].id`, "must be unique within the moment"); phaseIds.add(phase.id); });
      if (moment.group === "play") for (let phaseIndex = 1; phaseIndex < moment.phases.length; phaseIndex += 1) {
        const difference = spatialDifference(moment.phases[phaseIndex - 1], moment.phases[phaseIndex]);
        if (difference.shared < 2) fail(`${at}.phases[${phaseIndex}]`, "must retain at least two stable player identities from the prior phase");
        if (!difference.meaningful) fail(`${at}.phases[${phaseIndex}]`, "must differ meaningfully from the prior phase");
      }
    }
    if (moment.group === "play") {
      if (!moment.concept) fail(`${at}.concept`, "is required for tactical plays");
      else for (const key of ["name", "canonicalTerm", "definition", "watchCue", "dilemma", "transferCue"]) requiredString(moment.concept[key], `${at}.concept.${key}`);
    }
  }
  if (selection && Number.isInteger(selection.included) && playCount !== selection.included) fail("keyPlaySelection.included", `declares ${selection.included}, but moments contains ${playCount} tactical plays`);
}

const input = process.argv[2];
if (!input) {
  console.error("Usage: node validate_match_data.mjs path/to/match-data.json");
  process.exit(2);
}

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let data;
try { data = JSON.parse(fs.readFileSync(path.resolve(input), "utf8")); } catch (error) { console.error(`Could not read ${input}: ${error.message}`); process.exit(2); }

validate(data);
await validateI18n(skillRoot);
if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Validated ${data.match.homeTeam} ${data.match.score} ${data.match.awayTeam} (${data.locale}); ${data.keyPlaySelection.included} key plays (${data.keyPlaySelection.strategy}), ${data.sources.length} sources.`);
