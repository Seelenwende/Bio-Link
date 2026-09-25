// Reel-Renderer: baut aus dem Drehbuch Szenenbilder (SVG → PNG) und setzt sie
// mit ffmpeg zu einem Instagram-tauglichen MP4 (1080×1920, H.264/AAC) inkl. Musik zusammen.

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { Resvg } from "@resvg/resvg-js";
import { writeMusic } from "./music.js";

const REEL_W = 1080;
const REEL_H = 1920;
export const FEED_W = 1080;
export const FEED_H = 1350; // 4:5 – bestes Format für Instagram- und Facebook-Feed
const FPS = 30;
const TRANSITION = 0.5; // Sekunden Überblendung zwischen Szenen

const FONT_DIR = fileURLToPath(new URL("../assets/fonts/", import.meta.url));
const FONT_FILES = ["PlayfairDisplay.ttf", "PlayfairDisplay-Italic.ttf", "Jost.ttf"].map((f) => path.join(FONT_DIR, f));

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

// Emojis & Steuerzeichen entfernen – die eingebetteten Schriften haben dafür keine Glyphen
const cleanText = (s) =>
  String(s)
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/** Bricht Text anhand einer geschätzten Zeichenbreite in Zeilen um. */
export function wrapText(text, fontSize, maxWidth, charWidth = 0.5) {
  const maxChars = Math.max(6, Math.floor(maxWidth / (fontSize * charWidth)));
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(text, baseSize, maxWidth, maxLines, charWidth) {
  let size = baseSize;
  let lines = wrapText(text, size, maxWidth, charWidth);
  while ((lines.length > maxLines || lines.some((l) => l.length * size * charWidth > maxWidth * 1.08)) && size > 40) {
    size -= 4;
    lines = wrapText(text, size, maxWidth, charWidth);
  }
  return { size, lines };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const BUTTERFLY = (color, x, y, scale) => `
  <g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round">
    <ellipse cx="38" cy="40" rx="13" ry="18" transform="rotate(-35 38 40)"/>
    <ellipse cx="62" cy="40" rx="13" ry="18" transform="rotate(35 62 40)"/>
    <ellipse cx="41" cy="61" rx="9" ry="13" transform="rotate(-20 41 61)"/>
    <ellipse cx="59" cy="61" rx="9" ry="13" transform="rotate(20 59 61)"/>
    <ellipse cx="50" cy="50" rx="1.5" ry="16" fill="${color}" stroke="none"/>
    <path d="M50 36 C47 30 45 27 43 24"/><path d="M50 36 C53 30 55 27 57 24"/>
    <circle cx="43" cy="23.5" r="1.5" fill="${color}" stroke="none"/>
    <circle cx="57" cy="23.5" r="1.5" fill="${color}" stroke="none"/>
  </g>`;

/** Hintergrund einer Szene: Farbverlauf mit weichen Formen oder ein Foto mit Farbschleier. */
export function backgroundSvg(plan, index, image, { W = REEL_W, H = REEL_H } = {}) {
  const { palette } = plan;
  if (image) {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">
      <rect width="100%" height="100%" fill="${palette.text}"/>
      <image href="${image}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
      <rect width="100%" height="100%" fill="${palette.text}" opacity="0.42"/>
      <defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
    </svg>`;
  }
  // Formen wandern von Szene zu Szene, damit jede Szene eigenständig wirkt
  const a = (index * 137.5 * Math.PI) / 180;
  const cx1 = W / 2 + Math.cos(a) * 380;
  const cy1 = H * 0.3 + Math.sin(a) * 260;
  const cx2 = W / 2 - Math.cos(a) * 320;
  const cy2 = H * 0.75 - Math.sin(a) * 200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="${index % 2 ? 1 : 0.3}" y2="1">
        <stop offset="0" stop-color="${palette.background}"/>
        <stop offset="1" stop-color="${palette.backgroundAlt}"/>
      </linearGradient>
      <radialGradient id="blob"><stop offset="0" stop-color="${palette.accent}" stop-opacity="0.38"/>
        <stop offset="1" stop-color="${palette.accent}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="${cx1.toFixed(1)}" cy="${cy1.toFixed(1)}" r="520" fill="url(#blob)"/>
    <circle cx="${cx2.toFixed(1)}" cy="${cy2.toFixed(1)}" r="440" fill="url(#blob)" opacity="0.8"/>
    <rect x="60" y="60" width="${W - 120}" height="${H - 120}" rx="36" fill="none" stroke="${palette.accent}" stroke-opacity="0.35" stroke-width="2"/>
  </svg>`;
}

/** Textebene einer Szene (transparent), wird im Video eingeblendet. */
export function textSvg(plan, index, { onImage = false, handle = "", W = REEL_W, H = REEL_H, feed = false, slideLabel = "", swipeHint = false } = {}) {
  const scene = plan.scenes[index];
  const { palette } = plan;
  const light = onImage || luminance(palette.background) < 0.25;
  const color = onImage ? "#FFFFFF" : palette.text;
  const accent = onImage ? "#FFFFFF" : palette.accent;

  const text = cleanText(scene.text);
  const sub = cleanText(scene.subtext || "");
  const isHook = scene.role === "hook";
  const isCta = scene.role === "cta";
  const base = feed ? (isHook ? 92 : isCta ? 74 : 76) : isHook ? 104 : isCta ? 84 : 88;
  const { size, lines } = fitText(text, base, W - 220, feed ? 4 : isHook ? 5 : 6, 0.5);
  const lineH = size * 1.22;
  const subFit = sub ? fitText(sub, feed ? 42 : 46, W - 260, feed ? 8 : 3, 0.52) : { size: 0, lines: [] };
  const subLineH = subFit.size * 1.45;

  const subGap = size * 0.45 + subFit.size * 1.2;
  const blockH = lines.length * lineH + (sub ? subGap + (subFit.lines.length - 1) * subLineH : 0);
  let y = H / 2 - blockH / 2 + size * 0.85;
  const shadow = onImage || light ? 'filter="url(#shadow)"' : "";

  const mainLines = lines
    .map((l, i) => `<text x="${W / 2}" y="${(y + i * lineH).toFixed(1)}" text-anchor="middle" font-family="Playfair Display"
        font-size="${size}" font-weight="500" ${isHook ? 'font-style="italic"' : ""} fill="${color}" ${shadow}>${esc(l)}</text>`)
    .join("\n");
  y += (lines.length - 1) * lineH;
  const subLines = subFit.lines
    .map((l, i) => `<text x="${W / 2}" y="${(y + subGap + i * subLineH).toFixed(1)}" text-anchor="middle" font-family="Jost"
        font-size="${subFit.size}" font-weight="300" fill="${color}" fill-opacity="0.85" ${shadow}>${esc(l)}</text>`)
    .join("\n");

  const topY = H / 2 - blockH / 2 - (feed ? 170 : 190);
  const minTop = feed ? 70 : 240;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/></filter></defs>
    ${BUTTERFLY(accent, W / 2 - 65, Math.max(minTop, topY - 40), feed ? 1.1 : 1.3)}
    <line x1="${W / 2 - 50}" y1="${Math.max(minTop + 140, topY + 110)}" x2="${W / 2 + 50}" y2="${Math.max(minTop + 140, topY + 110)}" stroke="${accent}" stroke-width="2" stroke-opacity="0.7"/>
    ${mainLines}
    ${subLines}
    ${slideLabel ? `<text x="${W - 80}" y="110" text-anchor="end" font-family="Jost" font-size="30" fill="${accent}" ${shadow}>${esc(slideLabel)}</text>` : ""}
    ${swipeHint ? `<text x="${W - 80}" y="${H - 100}" text-anchor="end" font-family="Jost" font-size="30" fill="${accent}" ${shadow}>Wischen →</text>` : ""}
    ${handle ? `<text x="${W / 2}" y="${feed ? H - 100 : H - 440}" text-anchor="middle" font-family="Playfair Display" font-size="30"
        letter-spacing="10" fill="${accent}" ${shadow}>${esc(handle.toUpperCase())}</text>` : ""}
  </svg>`;
}

export function svgToPng(svg) {
  const resvg = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: "Jost" },
  });
  return resvg.render().asPng();
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg fehlgeschlagen (Code ${code}): ${stderr.slice(-1500)}`)),
    );
  });
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function imageToDataUrl(file) {
  const ext = path.extname(file).toLowerCase();
  let buf = await readFile(file);
  let mime = MIME[ext];
  if (!mime || ext === ".webp" || buf.length > 6_000_000) {
    // In JPEG konvertieren und verkleinern, damit resvg es sicher lesen kann
    const out = `${file}.conv.jpg`;
    await runFfmpeg(["-i", file, "-vf", `scale='min(1440,iw)':-2`, "-q:v", "3", "-frames:v", "1", out]);
    buf = await readFile(out);
    mime = "image/jpeg";
  }
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export const totalDuration = (plan) =>
  plan.scenes.reduce((sum, s) => sum + s.duration, 0) - TRANSITION * (plan.scenes.length - 1);

/**
 * Rendert das komplette Reel.
 * @param {object} plan       normalisiertes Drehbuch
 * @param {object} opts
 * @param {string} opts.outFile   Ziel-MP4
 * @param {string} opts.workDir   Arbeitsverzeichnis für Zwischendateien
 * @param {string[]} [opts.images]  Pfade zu Hintergrundbildern (werden reihum verteilt)
 * @param {string} [opts.musicFile] eigene Musikdatei statt generierter Musik
 * @param {string} [opts.handle]    Instagram-Handle für die Einblendung
 */
export async function renderReel(plan, { outFile, workDir, images = [], musicFile, handle = "" }) {
  const W = REEL_W;
  const H = REEL_H;
  await mkdir(workDir, { recursive: true });
  const n = plan.scenes.length;
  const duration = totalDuration(plan);

  const dataUrls = await Promise.all(images.map(imageToDataUrl));

  const inputs = [];
  for (let i = 0; i < n; i++) {
    const img = dataUrls.length ? dataUrls[i % dataUrls.length] : null;
    const bg = path.join(workDir, `bg_${i}.png`);
    const txt = path.join(workDir, `txt_${i}.png`);
    await writeFile(bg, svgToPng(backgroundSvg(plan, i, img)));
    await writeFile(txt, svgToPng(textSvg(plan, i, { onImage: Boolean(img), handle })));
    inputs.push({ bg, txt, duration: plan.scenes[i].duration });
  }

  let audio = musicFile;
  if (!audio) {
    audio = path.join(workDir, "music.wav");
    const seed = [...plan.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    await writeMusic(audio, { duration, mood: plan.music.mood, bpm: plan.music.bpm, key: plan.music.key, seed });
  }

  const args = [];
  for (const { bg, txt, duration: d } of inputs) {
    args.push("-loop", "1", "-framerate", String(FPS), "-t", d.toFixed(3), "-i", bg);
    args.push("-loop", "1", "-framerate", String(FPS), "-t", d.toFixed(3), "-i", txt);
  }
  args.push("-i", audio);

  const filters = [];
  inputs.forEach(({ duration: d }, i) => {
    const frames = Math.round(d * FPS);
    const zoomDir = i % 2 === 0 ? `1+0.07*on/${frames}` : `1.07-0.07*on/${frames}`;
    // Hintergrund: langsamer Ken-Burns-Zoom (2× hochskaliert gegen Ruckeln)
    filters.push(
      `[${i * 2}:v]scale=${W * 2}:${H * 2},zoompan=z='${zoomDir}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS},setsar=1[bg${i}]`,
    );
    // Text: sanft einblenden, leicht nach oben gleiten
    filters.push(`[${i * 2 + 1}:v]format=rgba,fade=t=in:st=0.15:d=0.6:alpha=1[tx${i}]`);
    filters.push(
      `[bg${i}][tx${i}]overlay=x=0:y='max(0,24-24*t/0.75)':format=auto,format=yuv420p,trim=duration=${d.toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS},settb=AVTB[v${i}]`,
    );
  });

  let last = "v0";
  let offset = 0;
  for (let i = 1; i < n; i++) {
    offset += inputs[i - 1].duration - TRANSITION;
    const outLabel = i === n - 1 ? "vout" : `x${i}`;
    filters.push(`[${last}][v${i}]xfade=transition=fade:duration=${TRANSITION}:offset=${offset.toFixed(3)}[${outLabel}]`);
    last = outLabel;
  }
  if (n === 1) filters.push(`[v0]null[vout]`);

  const fadeOutStart = Math.max(0, duration - 1.5);
  filters.push(
    `[${n * 2}:a]apad,atrim=0:${duration.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.5,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=1.5,aformat=sample_rates=44100:channel_layouts=stereo[aout]`,
  );

  args.push(
    "-filter_complex", filters.join(";"),
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
    "-preset", "fast", "-crf", "20", "-r", String(FPS), "-g", String(FPS * 2),
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    "-t", duration.toFixed(3),
    "-movflags", "+faststart",
    outFile,
  );

  await runFfmpeg(args);
  // Vorschaubild (erste Szene nach dem Einblenden) für die Oberfläche
  await runFfmpeg(["-ss", "1", "-i", outFile, "-frames:v", "1", "-q:v", "3", outFile.replace(/\.mp4$/, ".jpg")]);
  await rm(workDir, { recursive: true, force: true });
  return { file: outFile, duration };
}

/**
 * Rendert Bildbeitrag (1 Folie) oder Karussell (mehrere Folien) als JPEG im 4:5-Format.
 * @returns {Promise<string[]>} Dateinamen der Folien (relativ zu outDir)
 */
export async function renderSlides(plan, { outDir, images = [], handle = "" }) {
  const W = FEED_W;
  const H = FEED_H;
  await mkdir(outDir, { recursive: true });
  const dataUrls = await Promise.all(images.map(imageToDataUrl));
  const n = plan.scenes.length;
  const files = [];
  for (let i = 0; i < n; i++) {
    const img = dataUrls.length ? dataUrls[i % dataUrls.length] : null;
    const bg = backgroundSvg(plan, i, img, { W, H });
    const txt = textSvg(plan, i, {
      onImage: Boolean(img),
      handle,
      W,
      H,
      feed: true,
      slideLabel: n > 1 ? `${i + 1}/${n}` : "",
      swipeHint: n > 1 && i === 0,
    });
    // Hintergrund und Text als verschachtelte SVGs zu einem Bild zusammensetzen
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${bg}${txt}</svg>`;
    const png = path.join(outDir, `slide_${i + 1}.png`);
    const jpg = `slide_${i + 1}.jpg`;
    await writeFile(png, svgToPng(svg));
    // Instagram akzeptiert für Bildbeiträge nur JPEG
    await runFfmpeg(["-i", png, "-q:v", "2", path.join(outDir, jpg)]);
    await rm(png, { force: true });
    files.push(jpg);
  }
  return files;
}
