import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { preview } from "vite";

const ROOT = process.cwd();
const RESULTS = join(ROOT, "test-results");
const MIN_FONT_PX = 14;
const MIN_TARGET_PX = 44;
const scenarios = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "short-laptop", width: 1440, height: 800, requireConceptPeek: true },
  { name: "narrow-desktop", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
  { name: "compact-mobile", width: 320, height: 844 },
  { name: "desktop-200-percent", width: 1440, height: 900, zoom: 2 }
];

function browserCandidates() {
  return [
    process.env.MATCH_ROOM_BROWSER,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium"
  ].filter(Boolean);
}

async function launchBrowser() {
  for (const executablePath of browserCandidates()) {
    if (!existsSync(executablePath)) continue;
    try {
      return await chromium.launch({ headless: true, executablePath });
    } catch {
      // Continue to the bundled browser fallback.
    }
  }
  return chromium.launch({ headless: true });
}

function staticCanvasChecks() {
  const source = readFileSync(join(ROOT, "src", "App.jsx"), "utf8");
  const failures = [];
  for (const match of source.matchAll(/font\s*=\s*['"`]([^'"`]*?)(\d+(?:\.\d+)?)px/gu)) {
    const size = Number(match[2]);
    if (size < MIN_FONT_PX) failures.push(`canvas font is ${size}px in: ${match[0]}`);
  }
  return failures;
}

async function auditPage(page) {
  return page.evaluate(({ minFont, minTarget }) => {
    const failures = [];
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const hasDirectText = (element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const selector = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = [...element.classList].slice(0, 2).map((name) => `.${name}`).join("");
      return `${element.tagName.toLowerCase()}${classes}`;
    };
    const rgba = (value) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((part, index) => index === 3 ? part / 255 : part);
    };
    const composite = (front, back) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [0, 1, 2].map((index) => (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha).concat(alpha);
    };
    const renderedBackground = (element) => {
      const layers = [];
      for (let node = element; node; node = node.parentElement) layers.push(rgba(getComputedStyle(node).backgroundColor));
      return layers.reverse().reduce((back, front) => composite(front, back), [255, 255, 255, 1]);
    };
    const luminance = (color) => {
      const channels = color.slice(0, 3).map((part) => {
        const value = part / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (a, b) => {
      const high = Math.max(luminance(a), luminance(b));
      const low = Math.min(luminance(a), luminance(b));
      return (high + 0.05) / (low + 0.05);
    };

    const textElements = [...document.querySelectorAll("body *")].filter((element) => visible(element) && hasDirectText(element) && !element.closest(".sr-only"));
    for (const element of textElements) {
      const style = getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize);
      if (fontSize + 0.01 < minFont) failures.push(`${selector(element)} text is ${fontSize.toFixed(1)}px`);
      const foreground = composite(rgba(style.color), renderedBackground(element));
      const background = renderedBackground(element);
      const ratio = contrast(foreground, background);
      const large = fontSize >= 24 || (fontSize >= 18.66 && Number(style.fontWeight) >= 700);
      const required = large ? 3 : 4.5;
      if (ratio + 0.05 < required) failures.push(`${selector(element)} contrast is ${ratio.toFixed(2)}:1 (needs ${required}:1)`);
    }

    for (const card of document.querySelectorAll(".moment-card")) {
      if (!visible(card)) continue;
      if (card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1) failures.push(`${selector(card)} clips its content`);
      const children = [...card.children].filter((child) => visible(child) && !child.classList.contains("moment-dot"));
      for (let first = 0; first < children.length; first += 1) {
        const a = children[first].getBoundingClientRect();
        for (let second = first + 1; second < children.length; second += 1) {
          const b = children[second].getBoundingClientRect();
          const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (overlapX > 1 && overlapY > 1) failures.push(`${selector(card)} has overlapping text rows`);
        }
      }
    }

    const controls = document.querySelectorAll(".moment-card, .phase-tabs button, .replay-button, .source-link, .evidence-menu summary, .evidence-menu-list a, .formation-guide-card a");
    for (const control of controls) {
      if (!visible(control)) continue;
      const rect = control.getBoundingClientRect();
      if (rect.width + 0.01 < minTarget || rect.height + 0.01 < minTarget) failures.push(`${selector(control)} target is ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    }

    const pitchFrame = document.querySelector(".pitch-frame");
    if (document.querySelector(".teaching-label")) failures.push("pitch contains the removed persistent teaching-reconstruction label");
    const pitchShell = document.querySelector(".pitch-shell");
    if (pitchShell && visible(pitchShell)) {
      const shellStyle = getComputedStyle(pitchShell);
      const shellBorders = [shellStyle.borderTopWidth, shellStyle.borderRightWidth, shellStyle.borderBottomWidth, shellStyle.borderLeftWidth].map(Number.parseFloat);
      if (shellBorders.some((width) => width > 0.01)) failures.push("pitch shell adds a redundant outer divider around the legend and pitch");
    }
    if (pitchFrame && visible(pitchFrame)) {
      const rect = pitchFrame.getBoundingClientRect();
      const ratio = rect.width / rect.height;
      if (ratio < 1.45 || ratio > 1.85) failures.push(`pitch aspect ratio is ${ratio.toFixed(2)} (${Math.round(rect.width)}x${Math.round(rect.height)}px); expected a readable landscape pitch`);
    }

    const analysisPanel = document.querySelector(".analysis-panel");
    const concept = document.querySelector(".concept");
    const evidenceMenu = document.querySelector(".evidence-menu");
    const evidenceLinks = evidenceMenu?.querySelectorAll(".evidence-menu-list a") ?? [];
    if (!evidenceMenu) failures.push("resources dropdown is missing");
    if (evidenceLinks.length === 0) failures.push("resources dropdown contains no source links");
    if (evidenceMenu) {
      evidenceMenu.open = true;
      const list = evidenceMenu.querySelector(".evidence-menu-list");
      const listRect = list?.getBoundingClientRect();
      if (!listRect || listRect.width <= 0 || listRect.height <= 0) failures.push("resources dropdown does not reveal its source links");
      if (listRect && (listRect.left < 0 || listRect.right > innerWidth + 1)) failures.push("resources dropdown overflows the viewport");
      for (const link of evidenceLinks) {
        const rect = link.getBoundingClientRect();
        if (rect.width + 0.01 < minTarget || rect.height + 0.01 < minTarget) failures.push(`${selector(link)} target is ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
      }
      evidenceMenu.open = false;
    }
    if (analysisPanel && concept) {
      const panelStyle = getComputedStyle(analysisPanel);
      const needsScroll = analysisPanel.scrollHeight > analysisPanel.clientHeight + 1;
      if (needsScroll && !["auto", "scroll"].includes(panelStyle.overflowY)) {
        failures.push("analysis panel clips the pitch or learning card instead of scrolling internally");
      } else if (needsScroll) {
        const originalScrollTop = analysisPanel.scrollTop;
        analysisPanel.scrollTop = analysisPanel.scrollHeight;
        const panelRect = analysisPanel.getBoundingClientRect();
        const conceptRect = concept.getBoundingClientRect();
        const conceptReachable = conceptRect.bottom > panelRect.top && conceptRect.top < panelRect.bottom;
        analysisPanel.scrollTop = originalScrollTop;
        if (!conceptReachable) failures.push("expanded learning card is not reachable inside the analysis panel");
      }
    }

    const rootFontPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const zoomed = rootFontPx > 24;
    const titleElement = document.querySelector(".analysis-head h1");
    const phaseControls = document.querySelector(".phase-controls");
    if (titleElement && phaseControls && visible(titleElement) && visible(phaseControls)) {
      const a = titleElement.getBoundingClientRect();
      const b = phaseControls.getBoundingClientRect();
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapX > 1 && overlapY > 1) failures.push("moment title collides with the phase controls");
    }
    if (document.querySelector(".concept-cue")) failures.push("concept summary duplicates guide content; cues belong only in the learning guide");
    for (const guideText of document.querySelectorAll(".learning-guide p")) {
      if (visible(guideText) && Number.parseFloat(getComputedStyle(guideText).fontSize) + 0.01 < rootFontPx) failures.push("learning-guide text is below the 16px body size");
    }
    const legend = document.querySelector(".legend");
    const sourcesSummary = document.querySelector(".evidence-menu summary");
    if (!zoomed && innerWidth >= 1024 && legend && sourcesSummary && visible(legend) && visible(sourcesSummary)) {
      const lr = legend.getBoundingClientRect();
      const sr = sourcesSummary.getBoundingClientRect();
      if (lr.top >= sr.bottom || sr.top >= lr.bottom) failures.push("pitch legend does not share the sources row on desktop");
    }

    if (document.documentElement.scrollWidth > innerWidth + 1) failures.push(`document width ${document.documentElement.scrollWidth}px exceeds viewport ${innerWidth}px`);
    return [...new Set(failures)];
  }, { minFont: MIN_FONT_PX, minTarget: MIN_TARGET_PX });
}

mkdirSync(RESULTS, { recursive: true });
const staticFailures = staticCanvasChecks();
const server = await preview({ root: ROOT, preview: { host: "127.0.0.1", port: 0, strictPort: false } });
const address = server.httpServer.address();
const port = typeof address === "object" && address ? address.port : 4173;
const browser = await launchBrowser();
const allFailures = staticFailures.map((failure) => `source: ${failure}`);

try {
  for (const scenario of scenarios) {
    const page = await browser.newPage({ viewport: { width: scenario.width, height: scenario.height }, reducedMotion: "no-preference" });
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: "networkidle" });
    if (scenario.zoom) {
      await page.evaluate((zoom) => { document.documentElement.style.fontSize = `${zoom * 100}%`; }, scenario.zoom);
      await page.waitForTimeout(150);
    }
    await page.screenshot({ path: join(RESULTS, `${scenario.name}.png`), fullPage: false });
    const cards = page.locator(".moment-card");
    const cardCount = await cards.count();
    for (let index = 0; index < cardCount; index += 1) {
      await cards.nth(index).click();
      await page.waitForTimeout(75);
      const momentId = await cards.nth(index).getAttribute("data-moment-id");
      const failures = await auditPage(page);
      if (scenario.requireConceptPeek) {
        const peek = await page.evaluate(() => {
          const panel = document.querySelector(".analysis-panel");
          const concept = document.querySelector(".concept");
          if (!panel || !concept) return null;
          const panelRect = panel.getBoundingClientRect();
          const conceptRect = concept.getBoundingClientRect();
          return Math.max(0, Math.min(panelRect.bottom, conceptRect.bottom) - Math.max(panelRect.top, conceptRect.top));
        });
        if (peek !== null && peek < 64) failures.push(`learning card preview is only ${Math.round(peek)}px tall on a short laptop; expected at least 64px`);
      }
      failures.forEach((failure) => allFailures.push(`${scenario.name}/${momentId}: ${failure}`));
    }
    await page.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}

if (allFailures.length) {
  console.error(`UI validation failed with ${allFailures.length} issue(s):`);
  allFailures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`UI validation passed across ${scenarios.length} viewport and zoom scenarios.`);
