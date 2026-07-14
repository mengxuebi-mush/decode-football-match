import { useEffect, useMemo, useRef, useState } from "react";
import matchData from "./match-data.json";
import { getDictionary } from "./i18n.js";

const PHASE_MS = 1450;
const TWEEN_MS = 850;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => a + (b - a) * t;
const shouldAutoplay = (moment) => moment.group === "play" && moment.phases.length === 3;

function resolveInitialState(moments) {
  const params = new URLSearchParams(window.location.search);
  const momentIndex = Math.max(0, moments.findIndex((item) => item.id === params.get("moment")));
  const moment = moments[momentIndex] ?? moments[0];
  const phaseIndex = Math.max(0, moment.phases.findIndex((item) => item.id === params.get("phase")));
  return { momentIndex, phaseIndex, hasExplicitPhase: params.has("phase") };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function lerpPlayers(from = [], to = [], progress) {
  const previous = new Map(from.map((player) => [player.id, player]));
  return to.map((player) => {
    const start = previous.get(player.id) ?? player;
    return { ...player, x: mix(start.x, player.x, progress), y: mix(start.y, player.y, progress) };
  });
}

function Pitch({ moment, phaseIndex, transition, copy }) {
  const canvasRef = useRef(null);
  const phase = moment.phases[phaseIndex];
  const prior = moment.phases[Math.max(0, phaseIndex - 1)] ?? phase;
  const players = lerpPlayers(prior.players, phase.players, transition);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = canvas.parentElement;
    const ratio = window.devicePixelRatio || 1;
    const resize = () => {
      const { width, height } = frame.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      draw(canvas, ratio, players, phase);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [players, phase]);

  return (
    <div className="pitch-frame">
      <div className="legend" aria-label={moment.legendSummary}>
        <span><i className="england" />{matchData.match.homeTeam}</span>
        <span><i className="norway" />{matchData.match.awayTeam}</span>
        <span>{copy.actors}</span>
        <span>{copy.contextPlayers}</span>
        <span className="player-key">{moment.legendSummary}</span>
      </div>
      <canvas className="pitch" ref={canvasRef} aria-label={`${moment.title}: ${phase.label}`} />
      <div className="pitch-caption">
        <span>{phase.label}</span>
        <p>{phase.note}</p>
      </div>
      <small className="teaching-label">{copy.reconstruction}</small>
    </div>
  );
}

function draw(canvas, ratio, players, phase) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const pad = clamp(Math.min(width, height) * 0.045, 18, 34);
  const left = pad;
  const top = pad;
  const fieldW = width - pad * 2;
  const fieldH = height - pad * 2;
  const px = (x) => left + fieldW * x / 100;
  const py = (y) => top + fieldH * y / 100;

  ctx.fillStyle = "#0b1a10";
  ctx.fillRect(left, top, fieldW, fieldH);
  for (let index = 0; index < 10; index += 1) {
    ctx.fillStyle = index % 2 ? "rgba(34,74,43,.20)" : "rgba(13,39,23,.18)";
    ctx.fillRect(left + fieldW * index / 10, top, fieldW / 10, fieldH);
  }
  ctx.strokeStyle = "rgba(200,218,191,.32)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(left, top, fieldW, fieldH);
  ctx.beginPath(); ctx.moveTo(px(50), top); ctx.lineTo(px(50), top + fieldH); ctx.stroke();
  ctx.beginPath(); ctx.arc(px(50), py(50), Math.min(fieldW, fieldH) * .12, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(px(50), py(50), 2, 0, Math.PI * 2); ctx.fillStyle = "rgba(200,218,191,.45)"; ctx.fill();
  drawBox(ctx, px, py, 0, false); drawBox(ctx, px, py, 100, true);

  (phase.zones ?? []).forEach((zone) => {
    ctx.beginPath(); ctx.arc(px(zone.x), py(zone.y), fieldW * zone.radius / 100, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(166,204,112,.12)"; ctx.fill();
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(166,204,112,.48)"; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(182,205,159,.82)"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(zone.label, px(zone.x), py(zone.y) + fieldW * zone.radius / 100 + 15);
  });
  (phase.lines ?? []).forEach((line) => {
    ctx.beginPath(); ctx.moveTo(px(line.from[0]), py(line.from[1])); ctx.lineTo(px(line.to[0]), py(line.to[1]));
    ctx.setLineDash([4, 5]); ctx.strokeStyle = line.team === "home" ? "rgba(235,236,226,.42)" : "rgba(232,94,79,.48)"; ctx.stroke(); ctx.setLineDash([]);
  });
  (phase.arrows ?? []).forEach((arrow) => drawArrow(ctx, px(arrow.from[0]), py(arrow.from[1]), px(arrow.to[0]), py(arrow.to[1]), arrow.type));
  players.forEach((player) => drawPlayer(ctx, px(player.x), py(player.y), player));
}

function drawBox(ctx, px, py, edge, mirror) {
  const outer = mirror ? [82, 100] : [0, 18];
  const inner = mirror ? [94, 100] : [0, 6];
  ctx.strokeRect(px(outer[0]), py(24), px(outer[1]) - px(outer[0]), py(76) - py(24));
  ctx.strokeRect(px(inner[0]), py(39), px(inner[1]) - px(inner[0]), py(61) - py(39));
}

function drawArrow(ctx, x1, y1, x2, y2, type) {
  const color = ["pass", "option"].includes(type) ? "#e5dfc6" : type === "recover" || type === "press" ? "#e85e4f" : "#d7b768";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.setLineDash(type === "run" || type === "recover" ? [6, 5] : []); ctx.stroke(); ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1); const size = 8;
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - size * Math.cos(angle - .55), y2 - size * Math.sin(angle - .55)); ctx.lineTo(x2 - size * Math.cos(angle + .55), y2 - size * Math.sin(angle + .55)); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

function drawPlayer(ctx, x, y, player) {
  const context = player.role === "context";
  ctx.save(); ctx.globalAlpha = context ? .48 : 1;
  ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fillStyle = player.team === "home" ? "#eeece3" : "#b84138"; ctx.fill();
  ctx.strokeStyle = player.team === "home" ? "#b8bcb4" : "#ef8b80"; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.fillStyle = player.team === "home" ? "#172017" : "#fff3eb"; ctx.font = "600 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(player.number, x, y);
  ctx.fillStyle = "#e8e7df"; ctx.font = "10px sans-serif"; ctx.textBaseline = "top"; ctx.fillText(player.name, x, y + 17); ctx.restore();
}

export function App() {
  const copy = getDictionary(matchData.locale);
  const initial = useMemo(() => resolveInitialState(matchData.moments), []);
  const [momentIndex, setMomentIndex] = useState(initial.momentIndex);
  const [phaseIndex, setPhaseIndex] = useState(initial.phaseIndex);
  const [transition, setTransition] = useState(1);
  const [playing, setPlaying] = useState(() => {
    const initialMoment = matchData.moments[initial.momentIndex];
    return !initial.hasExplicitPhase && shouldAutoplay(initialMoment);
  });
  const reducedMotion = useReducedMotion();
  const moment = matchData.moments[momentIndex];
  const sourceMap = useMemo(() => new Map(matchData.sources.map((source) => [source.id, source])), []);
  const groups = ["context", "play"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("moment", moment.id); params.set("phase", moment.phases[phaseIndex].id);
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [moment, phaseIndex]);

  useEffect(() => {
    if (!playing) return undefined;
    if (phaseIndex >= moment.phases.length - 1) return undefined;
    const timer = window.setTimeout(() => {
      setPhaseIndex((value) => Math.min(value + 1, moment.phases.length - 1));
      setTransition(reducedMotion ? 1 : 0);
    }, PHASE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, phaseIndex, moment, reducedMotion]);

  useEffect(() => {
    if (transition >= 1 || reducedMotion) { if (reducedMotion) setTransition(1); return undefined; }
    const start = performance.now(); let frame;
    const animate = (now) => { const next = clamp((now - start) / TWEEN_MS, 0, 1); setTransition(ease(next)); if (next < 1) frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [phaseIndex, reducedMotion]);

  useEffect(() => {
    if (playing && phaseIndex === moment.phases.length - 1 && transition >= 1) setPlaying(false);
  }, [playing, phaseIndex, transition, moment]);

  const chooseMoment = (index) => {
    const nextMoment = matchData.moments[index];
    setMomentIndex(index);
    setPhaseIndex(0);
    setTransition(1);
    setPlaying(shouldAutoplay(nextMoment));
  };
  const choosePhase = (index) => { setPlaying(false); setPhaseIndex(index); setTransition(reducedMotion ? 1 : 0); };
  const replay = () => { setPhaseIndex(0); setTransition(1); setPlaying(moment.phases.length > 1); };

  return (
    <main className="app-shell">
      <header className="match-header">
        <div><p className="eyebrow">{copy.brand}</p><div className="scoreline"><strong>{matchData.match.homeTeam}</strong><span>{matchData.match.score}</span><strong>{matchData.match.awayTeam}</strong></div><p className="competition">{matchData.match.competition} · {matchData.match.subtitle}</p></div>
        {matchData.match.highlightUrl ? <a className="source-link" href={matchData.match.highlightUrl} target="_blank" rel="noreferrer">{copy.highlights}</a> : <span className="source-link">{copy.noHighlight}</span>}
      </header>
      <div className="room-grid">
        <nav className="timeline" aria-label={`${copy.context}, ${copy.plays}`}>
          {groups.map((group) => { const items = matchData.moments.map((item, index) => ({ item, index })).filter(({ item }) => item.group === group); return (
            <section className={`timeline-group ${group}`} key={group}>
              <div className="timeline-group-head"><p className="section-label">{group === "context" ? copy.context : copy.plays}</p><span>{items.length}</span></div>
              <div className="timeline-items">{items.map(({ item, index }) => <button className={`moment-card ${index === momentIndex ? "active" : ""}`} key={item.id} onClick={() => chooseMoment(index)}><i className="moment-dot" /><span className="moment-time">{item.time}</span><strong>{item.short}</strong>{item.concept && <span className="tactic-chip">{item.concept.name}</span>}<span className="evidence-chip">{item.evidenceLabel}</span></button>)}</div>
            </section>
          ); })}
        </nav>
        <section className="analysis-panel">
          <div className="analysis-head"><div><p className="section-label">{moment.evidenceLabel} · {moment.time}</p><h1>{moment.title}</h1><div className="evidence-links">{moment.sourceIds.map((id) => { const source = sourceMap.get(id); return source && <a href={source.url} target="_blank" rel="noreferrer" key={id}>{source.name} ↗</a>; })}</div></div><div className="phase-controls"><div className="phase-tabs" role="tablist" aria-busy={playing}>{moment.phases.map((phase, index) => <button role="tab" aria-selected={phaseIndex === index} key={phase.id} onClick={() => choosePhase(index)}>{phase.label}</button>)}</div>{moment.phases.length > 1 && <button className={`replay-button ${playing ? "playing" : ""}`} onClick={replay}>{playing ? copy.replaying : copy.replay}</button>}</div></div>
          <Pitch moment={moment} phaseIndex={phaseIndex} transition={transition} copy={copy} />
          {moment.concept && <section className="concept open" aria-label={moment.concept.name}><div className="concept-summary"><span className="concept-mark">↗</span><div className="concept-copy"><div className="concept-title"><strong>{moment.concept.name}</strong><em>{moment.concept.canonicalTerm}</em></div><span>{moment.concept.definition}</span><span className="concept-cue"><b>{copy.watch}</b>{moment.concept.watchCue}</span></div></div><div className="concept-details"><div className="learning-guide"><section><span>{copy.watch}</span><p>{moment.concept.watchCue}</p></section><section><span>{copy.dilemma}</span><p>{moment.concept.dilemma}</p></section><section><span>{copy.transfer}</span><p>{moment.concept.transferCue}</p></section></div></div></section>}
        </section>
      </div>
    </main>
  );
}
