// Niticore for healthcare V2 (India): a 64-second sales film. A pure function of time: window.seek(t) paints frame t.
// Built on V1 (video/niticore-healthcare) and the launch film's engine: GPU particles, a DNA double helix (glossy bases
// and capsules), the design-system components drawn as 3D boards, HDR bloom. The launch film's opening; the helix as
// healthcare AI; the real risks pinned on it, with the regulatory clock; the bigger risk (losing business: the
// hospital buyers and the tender list); Niticore's AI register; three screens (risk assessed, people in the loop,
// evidence ready); the three side by side; the launch film's end card. 16x9. Storyboard: video/healthcare-v2-storyboard.md.
import * as M from './lib/motion.js';

const { W, H, FORMAT, E, prog, lerp, clamp, noise1 } = M;
const P = FORMAT.portrait, S = FORMAT.safe;
const DISPLAY = 'Display', UI = 'UI', MONO = 'Mono';
const QS = new URLSearchParams(location.search);
const FPS = Number(QS.get('fps') || 60), SHUTTER = 0.5;
const MB = QS.get('render') === '1' && QS.get('blur') !== '0' ? 3 : 1;   // GPU motion-blur sub-frames
const N = 1 << 17, TW = 512, RL = N / TW, NEL = 12;
const D0 = 14.84, FOV = (2 * Math.atan(H / 200 / D0)) / (Math.PI / 180);   // at D0 one world unit is 100 px, in every format
const DEG = Math.PI / 180, TAU = Math.PI * 2;

// ---------------------------------------------------------------- design tokens (src/app/globals.css)
const T = {
  canvas: '#06011f', surface: '#0c062b', raised: '#140d3d', fg: '#f2f0fb', muted: '#cbc6e4', subtle: '#a6a1c4',
  accent: '#4ae057', ink: '#06011f', tertiary: '#a98bff', soft: '#c9b8ff',
  line: 'rgba(255,255,255,0.08)', lineStrong: 'rgba(255,255,255,0.16)', warn: '#f5b544', risk: '#ff6b7a',
  blue: ['#1a1260', '#2f2a8c'], violet: ['#4a33b8', '#7654e0'], green: ['#0f4a1d', '#1f8a31'],
  close: '#ff5f57', minimize: '#febc2e', zoom: '#28c840',
};
const hex3 = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const [r, g, b] = hex3(h); return `rgba(${r},${g},${b},${a})`; };
const mixc = (a, b, t) => { const x = hex3(a), y = hex3(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], clamp(t)))).join(',')})`; };
const fgA = (a) => `rgba(242,240,251,${a})`;
const ease = (u, a, b, fn = E.inOutCubic) => fn(prog(u, a, b));
const eo = (u, a, b) => E.outCubic(prog(u, a, b));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const springB = (u, u0, cfg = { stiffness: 260, damping: 14 }) => (u < u0 ? 0 : M.spring((u - u0) * M.GRID.period, cfg));
// v2.1 timeline: the loop gained 8 beats (at old beat 61) and the frameworks 12 more (at old beat 96).
// Components authored on the old grid are drawn at unsh(u); lists of old beats are mapped with sh().
const sh = (b) => b + (b >= 61 ? 8 : 0) + (b >= 96 ? 12 : 0);
const unsh = (u) => (u < 61 ? u : u < 69 ? 60.999 : u < 104 ? u - 8 : u < 116 ? 95.999 : u - 20);

// ---------------------------------------------------------------- the wordmark (public/logo/niticore.svg)
const LOGO = {
  w: 156, h: 38,
  sparkles: [
    'M27.1264 4.58673C27.3281 3.52776 28.8318 3.49353 29.0815 4.54222L29.2846 5.39508C29.3727 5.76547 29.6636 6.05365 30.0348 6.13838L31.252 6.41621C32.3121 6.65819 32.2788 8.17953 31.2091 8.37487L30.0782 8.58138C29.6842 8.65333 29.3711 8.95339 29.2826 9.34397L29.0842 10.219C28.8434 11.2808 27.3193 11.2476 27.125 10.1763L26.9817 9.3863C26.9069 8.97397 26.5829 8.652 26.1701 8.57977L25.0056 8.37599C23.9255 8.18697 23.8931 6.64838 24.9643 6.41406L26.2121 6.14111C26.6033 6.05553 26.9058 5.74476 26.9807 5.35132L27.1264 4.58673Z',
    'M55.087 4.58673C55.2888 3.52776 56.7925 3.49353 57.0422 4.54222L57.2453 5.39508C57.3334 5.76547 57.6243 6.05365 57.9955 6.13838L59.2127 6.41621C60.2728 6.65819 60.2395 8.17953 59.1698 8.37487L58.0389 8.58138C57.6449 8.65333 57.3318 8.95339 57.2433 9.34397L57.0448 10.219C56.8041 11.2808 55.28 11.2476 55.0857 10.1763L54.9423 9.3863C54.8675 8.97397 54.5436 8.652 54.1308 8.57977L52.9663 8.37599C51.8862 8.18697 51.8538 6.64838 52.925 6.41406L54.1728 6.14111C54.564 6.05553 54.8665 5.74476 54.9414 5.35132L55.087 4.58673Z',
  ],
  letters: [
    'M0 37.14V14.208H5.88V18.744L5.544 17.736C6.076 16.364 6.93 15.356 8.106 14.712C9.31 14.04 10.71 13.704 12.306 13.704C14.042 13.704 15.554 14.068 16.842 14.796C18.158 15.524 19.18 16.546 19.908 17.862C20.636 19.15 21 20.662 21 22.398V37.14H14.7V23.742C14.7 22.846 14.518 22.076 14.154 21.432C13.818 20.788 13.328 20.284 12.684 19.92C12.068 19.556 11.34 19.374 10.5 19.374C9.688 19.374 8.96 19.556 8.316 19.92C7.672 20.284 7.168 20.788 6.804 21.432C6.468 22.076 6.3 22.846 6.3 23.742V37.14H0Z',
    'M25.1426 37.14V14.208H31.4426V37.14H25.1426Z',
    'M47.0987 37.392C44.3267 37.392 42.1707 36.65 40.6307 35.166C39.1187 33.654 38.3627 31.554 38.3627 28.866V19.668H34.4987V14.208H34.7087C35.8847 14.208 36.7807 13.914 37.3967 13.326C38.0407 12.738 38.3627 11.856 38.3627 10.68V9H44.6627V14.208H50.0387V19.668H44.6627V28.446C44.6627 29.23 44.8027 29.888 45.0827 30.42C45.3627 30.924 45.7967 31.302 46.3847 31.554C46.9727 31.806 47.7007 31.932 48.5687 31.932C48.7647 31.932 48.9887 31.918 49.2407 31.89C49.4927 31.862 49.7587 31.834 50.0387 31.806V37.14C49.6187 37.196 49.1427 37.252 48.6107 37.308C48.0787 37.364 47.5747 37.392 47.0987 37.392Z',
    'M53.7305 37.14V14.208H60.0305V37.14H53.7305Z',
    'M75.8966 37.644C73.6006 37.644 71.5286 37.126 69.6806 36.09C67.8606 35.026 66.4046 33.584 65.3126 31.764C64.2486 29.944 63.7166 27.9 63.7166 25.632C63.7166 23.364 64.2486 21.334 65.3126 19.542C66.3766 17.722 67.8326 16.294 69.6806 15.258C71.5286 14.222 73.6006 13.704 75.8966 13.704C77.6046 13.704 79.1866 13.998 80.6426 14.586C82.0986 15.174 83.3446 16 84.3806 17.064C85.4166 18.1 86.1586 19.332 86.6066 20.76L81.1466 23.112C80.7546 21.964 80.0826 21.054 79.1306 20.382C78.2066 19.71 77.1286 19.374 75.8966 19.374C74.8046 19.374 73.8246 19.64 72.9566 20.172C72.1166 20.704 71.4446 21.446 70.9406 22.398C70.4646 23.35 70.2266 24.442 70.2266 25.674C70.2266 26.906 70.4646 27.998 70.9406 28.95C71.4446 29.902 72.1166 30.644 72.9566 31.176C73.8246 31.708 74.8046 31.974 75.8966 31.974C77.1566 31.974 78.2486 31.638 79.1726 30.966C80.0966 30.294 80.7546 29.384 81.1466 28.236L86.6066 30.63C86.1866 31.974 85.4586 33.178 84.4226 34.242C83.3866 35.306 82.1406 36.146 80.6846 36.762C79.2286 37.35 77.6326 37.644 75.8966 37.644Z',
    'M101.698 37.644C99.4304 37.644 97.3584 37.126 95.4824 36.09C93.6344 35.054 92.1504 33.64 91.0304 31.848C89.9384 30.028 89.3924 27.97 89.3924 25.674C89.3924 23.35 89.9384 21.292 91.0304 19.5C92.1504 17.708 93.6344 16.294 95.4824 15.258C97.3584 14.222 99.4304 13.704 101.698 13.704C103.966 13.704 106.024 14.222 107.872 15.258C109.72 16.294 111.19 17.708 112.282 19.5C113.402 21.292 113.962 23.35 113.962 25.674C113.962 27.97 113.402 30.028 112.282 31.848C111.19 33.64 109.72 35.054 107.872 36.09C106.024 37.126 103.966 37.644 101.698 37.644ZM101.698 31.974C102.846 31.974 103.84 31.708 104.68 31.176C105.548 30.644 106.22 29.902 106.696 28.95C107.2 27.998 107.452 26.906 107.452 25.674C107.452 24.442 107.2 23.364 106.696 22.44C106.22 21.488 105.548 20.746 104.68 20.214C103.84 19.654 102.846 19.374 101.698 19.374C100.55 19.374 99.5424 19.654 98.6744 20.214C97.8064 20.746 97.1204 21.488 96.6164 22.44C96.1404 23.364 95.9024 24.442 95.9024 25.674C95.9024 26.906 96.1404 27.998 96.6164 28.95C97.1204 29.902 97.8064 30.644 98.6744 31.176C99.5424 31.708 100.55 31.974 101.698 31.974Z',
    'M117.674 37.14V14.208H123.554V19.71L123.134 18.912C123.638 16.98 124.464 15.678 125.612 15.006C126.788 14.306 128.174 13.956 129.77 13.956H131.114V19.416H129.14C127.6 19.416 126.354 19.892 125.402 20.844C124.45 21.768 123.974 23.084 123.974 24.792V37.14H117.674Z',
    'M144.921 37.644C142.485 37.644 140.371 37.112 138.579 36.048C136.787 34.956 135.401 33.5 134.421 31.68C133.441 29.86 132.951 27.844 132.951 25.632C132.951 23.336 133.455 21.292 134.463 19.5C135.499 17.708 136.885 16.294 138.621 15.258C140.357 14.222 142.317 13.704 144.501 13.704C146.321 13.704 147.931 13.998 149.331 14.586C150.731 15.146 151.907 15.944 152.859 16.98C153.839 18.016 154.581 19.22 155.085 20.592C155.589 21.936 155.841 23.406 155.841 25.002C155.841 25.45 155.813 25.898 155.757 26.346C155.729 26.766 155.659 27.13 155.547 27.438H138.369V22.818H151.977L148.995 25.002C149.275 23.798 149.261 22.734 148.953 21.81C148.645 20.858 148.099 20.116 147.315 19.584C146.559 19.024 145.621 18.744 144.501 18.744C143.409 18.744 142.471 19.01 141.687 19.542C140.903 20.074 140.315 20.858 139.923 21.894C139.531 22.93 139.377 24.19 139.461 25.674C139.349 26.962 139.503 28.096 139.923 29.076C140.343 30.056 140.987 30.826 141.855 31.386C142.723 31.918 143.773 32.184 145.005 32.184C146.125 32.184 147.077 31.96 147.861 31.512C148.673 31.064 149.303 30.448 149.751 29.664L154.791 32.058C154.343 33.178 153.629 34.158 152.649 34.998C151.697 35.838 150.563 36.496 149.247 36.972C147.931 37.42 146.489 37.644 144.921 37.644Z',
  ],
};


// the timeline's ends (beats, 96 bpm)
const V = { end: 93.2, tag: 96.1, url: 100.4, dur: 103, hold: 89.2, bridge: 29.5 };   // V2 · hold: the pause on the three screens, before the outro; bridge: "But governance hasn't kept pace."

// ---------------------------------------------------------------- canvas helpers
let ICONS = {}, IMGS = {};
const p2 = new Map();
const path2 = (d) => { let p = p2.get(d); if (!p) { p = new Path2D(d); p2.set(d, p); } return p; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
function setFont(g, size, weight, family, ls = 0) { g.font = `${weight} ${size}px ${family}`; g.letterSpacing = `${ls}px`; }
function tx(g, s, x, y, size, weight, family, color, align = 'left', ls = 0) {
  setFont(g, size, weight, family, ls); g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(s, x, y);
}
function tw(g, s, size, weight, family, ls = 0) { setFont(g, size, weight, family, ls); return g.measureText(s).width; }
function wrap(g, s, maxW, size, weight, family, ls = 0) {
  setFont(g, size, weight, family, ls);
  const lines = []; let cur = '';
  for (const w of s.split(' ')) { const t = cur ? `${cur} ${w}` : w; if (cur && g.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function icon(g, name, x, y, size, color, weight = 'regular') {
  const ds = ICONS[name]?.[weight] || [];
  g.save(); g.translate(x, y); g.scale(size / 256, size / 256); g.fillStyle = color; ds.forEach((d) => g.fill(path2(d))); g.restore();
}

// ---------------------------------------------------------------- design-system components, drawn in CSS px
// rounded-panel surface with a line-strong hairline and shadow-panel's inset top highlight
function panel(g, x, y, w, h, { fill = T.surface, border = T.lineStrong, r = 20, grad = null } = {}) {
  rr(g, x, y, w, h, r);
  if (grad) { const lg = g.createLinearGradient(x, y, x + w, y + h); lg.addColorStop(0, grad[0]); lg.addColorStop(1, grad[1]); g.fillStyle = lg; } else g.fillStyle = fill;
  g.fill();
  g.save(); rr(g, x, y, w, h, r); g.clip(); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x, y, w, 1); g.restore();
  g.lineWidth = 1; g.strokeStyle = border; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r); g.stroke();
}
// bezel: the machined shell around a feature panel (radius = panel + padding)
function bezel(g, x, y, w, h) {
  rr(g, x, y, w, h, 28); g.fillStyle = 'rgba(255,255,255,0.03)'; g.fill();
  g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.1)'; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, 28); g.stroke();
}
// rounded-field row (12px) in raised/60 with a line hairline
function field(g, x, y, w, h, { fill = 'rgba(20,13,61,0.6)', border = T.line } = {}) {
  rr(g, x, y, w, h, 12); g.fillStyle = fill; g.fill(); g.lineWidth = 1; g.strokeStyle = border; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, 12); g.stroke();
}
// ScoreRing: line track, status-coloured arc from 12 o'clock, the number counts up with the sweep
function scoreRing(g, cx, cy, size, value, label, k) {
  const r = size * 0.44, sw = size * 0.06, v = value * k;
  g.lineWidth = sw; g.strokeStyle = T.line; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  if (v > 0.3) {
    g.strokeStyle = value >= 75 ? T.accent : value >= 50 ? T.warn : T.risk; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (v / 100) * Math.PI * 2); g.stroke(); g.lineCap = 'butt';
  }
  const ns = size * 0.3, ls = Math.max(11, size * 0.075), lh = ls * 1.25;
  const lines = wrap(g, label, size * 0.7, ls, 500, UI);
  const total = ns + 4 + lines.length * lh, top = cy - total / 2;
  tx(g, String(Math.round(v)), cx, top + ns * 0.86, ns, 600, DISPLAY, T.fg, 'center', -ns * 0.04);
  lines.forEach((ln, i) => tx(g, ln, cx, top + ns + 4 + ls * 0.98 + i * lh, ls, 500, UI, T.subtle, 'center'));
}
// BarMeter row: label + green count-up, 8px pill track with a green fill
function barRow(g, x, y, w, label, value, k) {
  tx(g, label, x, y + 15, 14, 600, UI, T.fg);
  tx(g, `${Math.round(value * k)}%`, x + w, y + 15, 14, 700, UI, T.accent, 'right');
  rr(g, x, y + 26, w, 8, 4); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
  if (k > 0.01) { rr(g, x, y + 26, (w * value * k) / 100, 8, 4); g.fillStyle = T.accent; g.fill(); }
}
// outline pill (rounded-control): badge-style label
function pill(g, x, y, label, { h = 28, size = 13, color = T.muted, align = 'left', ico = null, icoColor = null } = {}) {
  const iw = ico ? size + 6 : 0, w = tw(g, label, size, 600, UI) + 24 + iw, x0 = align === 'right' ? x - w : x;
  rr(g, x0, y, w, h, h / 2); g.fillStyle = 'rgba(255,255,255,0.04)'; g.fill();
  g.lineWidth = 1; g.strokeStyle = T.lineStrong; rr(g, x0 + 0.5, y + 0.5, w - 1, h - 1, h / 2); g.stroke();
  if (ico) icon(g, ico, x0 + 12, y + (h - size) / 2, size, icoColor || color, 'bold');
  tx(g, label, x0 + 12 + iw, y + h / 2 + size * 0.36, size, 600, UI, color);
  return w;
}
// CheckPill: off = raised fill, empty ring; on = solid green with an ink check
function checkPill(g, x, y, label, k, { align = 'left' } = {}) {
  const w = tw(g, label, 14, 600, UI) + 16 + 16 + 8 + 14, h = 40, x0 = align === 'right' ? x - w : x;
  rr(g, x0, y, w, h, 20); g.fillStyle = mixc(T.raised, T.accent, k); g.fill();
  g.lineWidth = 1; g.strokeStyle = k > 0.5 ? T.accent : T.lineStrong; rr(g, x0 + 0.5, y + 0.5, w - 1, h - 1, 20); g.stroke();
  const ink = mixc(T.muted, T.ink, k), cx = x0 + 14 + 8, cy = y + h / 2;
  if (k < 0.5) { g.globalAlpha *= 0.6; g.lineWidth = 1.5; g.strokeStyle = ink; g.beginPath(); g.arc(cx, cy, 6.25, 0, Math.PI * 2); g.stroke(); g.globalAlpha /= 0.6; }
  else {
    const s = 0.7 + 0.3 * E.outBack(clamp((k - 0.5) * 2));
    g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-8, -8);
    g.lineWidth = 2.4; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink;
    g.beginPath(); g.moveTo(3, 8.5); g.lineTo(6.2, 11.5); g.lineTo(13, 4.5); g.stroke(); g.restore();
  }
  tx(g, label, x0 + 14 + 16 + 8, cy + 5, 14, 600, UI, ink);
  return w;
}
// TickList item: rounded-panel row; the check fills green with a little overshoot
function tickRow(g, x, y, w, h, label, k) {
  panel(g, x, y, w, h, { border: T.line });
  const cx = x + 16 + 18, cy = y + h / 2;
  const s = k > 0 ? 0.6 + 0.4 * E.outBack(clamp(k), 2.4) : 1;
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.beginPath(); g.arc(0, 0, 17, 0, Math.PI * 2);
  if (k > 0) { g.fillStyle = T.accent; g.fill(); }
  g.lineWidth = 2; g.strokeStyle = k > 0 ? T.accent : T.lineStrong; g.stroke();
  if (k > 0) { g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = T.ink; g.beginPath(); g.moveTo(-6, 0.5); g.lineTo(-2, 4.5); g.lineTo(6.5, -4); g.stroke(); }
  g.restore();
  tx(g, label, x + 16 + 36 + 16, cy + 6, 16, 500, UI, T.fg);
}
// Switch: 48 x 28 pill; raised + subtle thumb when off, green + ink thumb when on
function switchCtl(g, x, y, k) {
  rr(g, x, y, 48, 28, 14); g.fillStyle = mixc(T.raised, T.accent, k); g.fill();
  g.lineWidth = 1; g.strokeStyle = k > 0.5 ? T.accent : T.lineStrong; rr(g, x + 0.5, y + 0.5, 47, 27, 14); g.stroke();
  const cx = x + 3 + 10 + 23 * E.outCubic(clamp(k));
  g.save(); g.shadowColor = 'rgba(2,0,14,0.45)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  g.beginPath(); g.arc(cx, y + 14, 10, 0, Math.PI * 2); g.fillStyle = mixc(T.subtle, T.ink, k); g.fill(); g.restore();
}
// Button (rounded-control): primary = green with ink text; secondary = glass outline
function button(g, x, y, label, variant, { h = 40, size = 14, press = 0, align = 'left' } = {}) {
  const w = tw(g, label, size, 600, UI) + 36, x0 = align === 'right' ? x - w : x;
  g.save(); const s = 1 - 0.03 * press; g.translate(x0 + w / 2, y + h / 2); g.scale(s, s); g.translate(-(x0 + w / 2), -(y + h / 2));
  if (variant === 'primary') {
    g.save(); g.shadowColor = 'rgba(74,224,87,0.28)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    rr(g, x0, y, w, h, h / 2); g.fillStyle = mixc(T.accent, '#8df09a', press * 0.6); g.fill(); g.restore();
    g.save(); rr(g, x0, y, w, h, h / 2); g.clip(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x0, y, w, 1); g.restore();
    tx(g, label, x0 + w / 2, y + h / 2 + size * 0.36, size, 600, UI, T.ink, 'center');
  } else {
    rr(g, x0, y, w, h, h / 2); g.fillStyle = 'rgba(255,255,255,0.04)'; g.fill();
    g.lineWidth = 1; g.strokeStyle = T.lineStrong; rr(g, x0 + 0.5, y + 0.5, w - 1, h - 1, h / 2); g.stroke();
    tx(g, label, x0 + w / 2, y + h / 2 + size * 0.36, size, 600, UI, T.fg, 'center');
  }
  g.restore();
  return w;
}
// icon tile: violet illustration tint on surfaces, white/15 with a ring on solid cards
function tile(g, x, y, s, name, { fill = 'rgba(169,139,255,0.13)', color = T.tertiary, weight = 'regular', ring = null, r = 12 } = {}) {
  rr(g, x, y, s, s, r); g.fillStyle = fill; g.fill();
  if (ring) { g.lineWidth = 1; g.strokeStyle = ring; rr(g, x + 0.5, y + 0.5, s - 1, s - 1, r); g.stroke(); }
  icon(g, name, x + s * 0.24, y + s * 0.24, s * 0.52, color, weight);
}
// FrameworkCard: card-violet / card-blue, mark + name, the headline figure and its note
function frameworkCard(g, x, y, w, h, grad, img, name, stat, note) {
  panel(g, x, y, w, h, { grad, border: 'rgba(255,255,255,0.1)' });
  if (img) { g.save(); g.shadowColor = 'rgba(255,255,255,0.6)'; g.shadowBlur = 1; const k = Math.min(48 / img.width, 48 / img.height); g.drawImage(img, x + 24 + (48 - img.width * k) / 2, y + 24 + (48 - img.height * k) / 2, img.width * k, img.height * k); g.restore(); }
  tx(g, name, x + 24 + 48 + 12, y + 24 + 30, 18, 600, DISPLAY, T.fg, 'left', -0.27);
  const lines = wrap(g, note, w - 48, 14, 500, UI);
  const ny = y + h - 24 - (lines.length - 1) * 19;
  lines.forEach((ln, i) => tx(g, ln, x + 24, ny + i * 19, 14, 500, UI, fgA(0.9)));
  tx(g, stat, x + 24, ny - 28, 32, 600, DISPLAY, T.fg, 'left', -1.28);
}
// RadarChart: rings + axes in line-strong, the violet shape grows from the centre
function radar(g, cx, cy, R, axes, vals, k, ka) {
  const n = axes.length, pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  g.save(); g.globalAlpha *= ka; g.lineWidth = 1; g.strokeStyle = T.lineStrong;
  [25, 50, 75, 100].forEach((r) => { g.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = pt(i % n, r); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
  for (let i = 0; i < n; i++) { const [x, y] = pt(i, 100); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); }
  axes.forEach((a, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n, lx = cx + Math.cos(ang) * (R + 20), ly = cy + Math.sin(ang) * (R + 20) + 5;
    tx(g, a, lx, ly + (Math.sin(ang) < -0.9 ? -4 : Math.sin(ang) > 0.9 ? 8 : 0), 13, 600, UI, T.muted, Math.cos(ang) > 0.3 ? 'left' : Math.cos(ang) < -0.3 ? 'right' : 'center');
  });
  g.restore();
  if (k <= 0) return;
  g.beginPath(); vals.forEach((v, i) => { const [x, y] = pt(i, v * k); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
  g.fillStyle = rgba(T.tertiary, 0.22); g.fill(); g.lineWidth = 2; g.lineJoin = 'round'; g.strokeStyle = T.tertiary; g.stroke();
  vals.forEach((v, i) => { const [x, y] = pt(i, v * k); g.beginPath(); g.arc(x, y, 3.6, 0, Math.PI * 2); g.fillStyle = T.tertiary; g.fill(); });
}
// LogStream: macOS terminal, JetBrains Mono, level column in lowercase
function terminal(g, x, y, w, h, u, { title, cwd, command, t0, lines, size = 14 }) {
  rr(g, x, y, w, h, 12); g.fillStyle = T.canvas; g.fill();
  g.save(); rr(g, x, y, w, h, 12); g.clip();
  g.fillStyle = T.surface; g.fillRect(x, y, w, 40);
  [T.close, T.minimize, T.zoom].forEach((c, i) => { g.beginPath(); g.arc(x + 16 + 6 + i * 20, y + 20, 6, 0, Math.PI * 2); g.fillStyle = c; g.fill(); });
  tx(g, title, x + w / 2, y + 25, 13, 600, UI, T.subtle, 'center');
  const lh = size * 1.75, cw = tw(g, 'M', size, 400, MONO), bx = x + 20;
  let by = y + 40 + 20 + size;
  const prompt = (yy) => {
    tx(g, cwd, bx, yy, size, 400, MONO, T.tertiary);
    const px = bx + tw(g, `${cwd} `, size, 400, MONO);
    g.lineWidth = 1.8; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = T.accent;
    g.beginPath(); g.moveTo(px + 1, yy - size * 0.7); g.lineTo(px + cw * 0.62, yy - size * 0.36); g.lineTo(px + 1, yy - size * 0.02); g.stroke();
    return px + cw * 2;
  };
  const blink = (Math.floor((u * M.GRID.period) / 0.525) % 2) === 0;
  const typed = Math.round(clamp((u - t0) / 0.8) * command.length);
  let cx = prompt(by);
  tx(g, command.slice(0, typed), cx, by, size, 400, MONO, T.fg);
  const shown = lines.filter((l) => u >= l[0]);
  if (u < t0 + 1.1 && ((u >= t0 && u <= t0 + 0.8) || blink)) { g.fillStyle = T.fg; g.fillRect(cx + typed * cw, by - size * 0.92, cw * 0.6, size * 1.15); }
  shown.forEach((l) => {
    by += lh;
    tx(g, l[1], bx, by, size, 700, MONO, LEVEL[l[1]]);
    tx(g, l[2], bx + cw * 7, by, size, 400, MONO, T.muted);
  });
  if (shown.length === lines.length) {
    by += lh; const ex = prompt(by);
    if (blink) { g.fillStyle = T.fg; g.fillRect(ex, by - size * 0.92, cw * 0.6, size * 1.15); }
  }
  g.restore();
  g.lineWidth = 1; g.strokeStyle = T.lineStrong; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, 12); g.stroke();
}
// a reveal helper: alpha + rise, the site's Reveal (DIST 28px, out-expo-ish)
function rise(g, k, dist = 18) { g.globalAlpha *= k; g.translate(0, (1 - k) * dist); }
// FrameworkCard (production): card tone, the mark (round seals in a 48 box, wide wordmarks in a 64 x 36
// box), the name, the headline figure and its note
function frameworkCard2(g, x, y, w, h, grad, img, name, stat, note) {
  panel(g, x, y, w, h, { grad, border: 'rgba(255,255,255,0.1)' });
  let mw = 48;
  if (img) {
    const wide = img.width / img.height > 1.6, bw = wide ? 64 : 48, bh = wide ? 34 : 48;
    const k = Math.min(bw / img.width, bh / img.height), iw = img.width * k, ih = img.height * k;
    g.save(); g.shadowColor = 'rgba(255,255,255,0.6)'; g.shadowBlur = 1;
    g.drawImage(img, x + 24 + (bw - iw) / 2, y + 24 + 24 - ih / 2, iw, ih); g.restore();
    mw = bw;
  }
  tx(g, name, x + 24 + mw + 12, y + 24 + 30, 18, 600, DISPLAY, T.fg, 'left', -0.27);
  const lines = wrap(g, note, w - 48, 14, 500, UI);
  const ny = y + h - 24 - (lines.length - 1) * 19;
  lines.forEach((ln, i) => tx(g, ln, x + 24, ny + i * 19, 14, 500, UI, fgA(0.9)));
  tx(g, stat, x + 24, ny - 28, 32, 600, DISPLAY, T.fg, 'left', -1.28);
}
// the card's tag (production: a roomy white/15 pill with a filled icon; sentence case here)
function tagPill(g, x, y, ico, label) {
  const w = tw(g, label, 14, 700, UI) + 12 + 16 + 8 + 16, h = 36;
  rr(g, x, y, w, h, h / 2); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fill();
  icon(g, ico, x + 12, y + 10, 16, T.fg, 'fill');
  tx(g, label, x + 12 + 16 + 8, y + 23, 14, 700, UI, T.fg);
}
// a hash, drawn as a fingerprint of bars rather than invented hex
function hashGlyph(g, x, y, seed, col) {
  const rnd = M.mulberry32(seed);
  let xx = x;
  for (let i = 0; i < 14; i++) { const w = 1 + Math.floor(rnd() * 3); g.fillStyle = col; g.fillRect(xx, y, w, 14); xx += w + 1 + Math.floor(rnd() * 2); }
  return xx - x;
}
function checkMark(g, cx, cy, r, k, fill = T.accent, ink = T.ink) {
  const s = 0.6 + 0.4 * E.outBack(clamp(k), 2.4);
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = fill; g.fill();
  g.lineWidth = r * 0.15; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = ink;
  g.beginPath(); g.moveTo(-r * 0.33, r * 0.03); g.lineTo(-r * 0.1, r * 0.26); g.lineTo(r * 0.36, -r * 0.22); g.stroke(); g.restore();
}
// a status word for alerts and verdicts (status colours are for alert text only)
function verdict(g, x, y, label, col, ico, k = 1, align = 'right') {
  if (k <= 0) return;
  const w = tw(g, label, 13, 700, UI) + 24 + 19, h = 30, x0 = align === 'right' ? x - w : x;
  g.save(); g.globalAlpha *= clamp(k); g.translate(x0 + w / 2, y + h / 2); g.scale(0.85 + 0.15 * Math.min(1, k), 0.85 + 0.15 * Math.min(1, k)); g.translate(-(x0 + w / 2), -(y + h / 2));
  rr(g, x0, y, w, h, h / 2); g.fillStyle = 'rgba(255,255,255,0.04)'; g.fill();
  g.lineWidth = 1; g.strokeStyle = T.lineStrong; rr(g, x0 + 0.5, y + 0.5, w - 1, h - 1, h / 2); g.stroke();
  icon(g, ico, x0 + 12, y + 7, 16, col, 'bold');
  tx(g, label, x0 + 12 + 19, y + 20, 13, 700, UI, col);
  g.restore();
}

// ---------------------------------------------------------------- boards: each component is a canvas on a plane
const BOARDS = {};
function board(name, cfg) {
  const fm = P && cfg.p ? { ...cfg, ...cfg.p } : cfg;
  const b = { name, ...fm };
  b.wpx = b.css[0] * b.s; b.hpx = b.css[1] * b.s;
  b.ts = Math.min(2, 2048 / Math.max(b.wpx, b.hpx));
  const y = b.pose.yaw * DEG;
  b.C = b.pose.C; b.R = [Math.cos(y), 0, -Math.sin(y)]; b.N = [Math.sin(y), 0, Math.cos(y)];
  b.X = b.R.map((v) => (v * b.wpx) / 200); b.Y = [0, b.hpx / 200, 0];
  b.anim = b.anim || [[-1, 1000]];
  BOARDS[name] = b;
  return b;
}
const at = (b, x, y) => [0, 1, 2].map((i) => b.C[i] + b.X[i] * ((x / b.css[0]) * 2 - 1) + b.Y[i] * (1 - (2 * y) / b.css[1]));
const vsub = (a, b) => a.map((v, i) => v - b[i]), vadd = (a, b) => a.map((v, i) => v + b[i]), vsc = (a, k) => a.map((v) => v * k);
const vnorm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function poseFor(b, C, yaw) { const y = yaw * DEG, R = [Math.cos(y), 0, -Math.sin(y)]; return { C, yaw, R, N: [Math.sin(y), 0, Math.cos(y)], X: R.map((v) => (v * b.wpx) / 200), Y: [0, b.hpx / 200, 0] }; }
let CPOSE = {};
const poseOf = (b) => b;

// ---- the wordmark: each letter rises out of its particles with a white flash, a light sweep
// crosses it, the two sparkles spin in. Nothing behind it.
const LOGO_ELS = [[0, 13, 22, 25], [24, 13, 8, 25], [34, 8, 17, 30], [53, 13, 8, 25], [63, 13, 24, 25], [89, 13, 25, 25], [117, 13, 15, 25], [132, 13, 24, 25], [23, 2, 38, 10]];
function letterIn(g, u, t, d, col) {
  const k = eo(u, t, t + 0.5); if (k <= 0) return;
  const fl = 1 - eo(u, t + 0.1, t + 1.0);
  g.save(); g.globalAlpha = k; g.translate(0, (1 - k) * 5); g.fillStyle = mixc(col, '#ffffff', fl * 0.85); g.fill(path2(d)); g.restore();
}
function sweep(g, u, t0, w, h) {
  const k = prog(u, t0, t0 + 0.9); if (k <= 0 || k >= 1) return;
  g.save(); g.globalCompositeOperation = 'source-atop';
  const x = lerp(-0.25 * w, 1.25 * w, E.inOutCubic(k)), b = w * 0.12;
  const lg = g.createLinearGradient(x - b, 0, x + b, h * 0.4);
  lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.8)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = lg; g.fillRect(0, 0, w, h); g.restore();
}
function drawLogo(g, u, t0) {
  LOGO.letters.forEach((d, i) => letterIn(g, u, t0 + i * 0.07, d, T.accent));
  sweep(g, u, t0 + 0.8, 156, 38);
  LOGO.sparkles.forEach((d, i) => {
    const sk = springB(u, t0 + 0.95 + i * 0.25);
    if (sk <= 0) return;
    const cx = i ? 56.06 : 28.1, cy = 7.38;
    g.save(); g.translate(cx, cy); g.rotate((1 - sk) * 2.2); g.scale(sk, sk); g.translate(-cx, -cy); g.fillStyle = '#FFFFFF'; g.fill(path2(d)); g.restore();
  });
}
// ================================================================ v3 boards
// a duotone Phosphor icon (the site's weight on feature tiles): the soft fill, then the line
function iconDuo(g, name, x, y, size, color) {
  const ds = ICONS[name]?.duo || [];
  g.save(); g.translate(x, y); g.scale(size / 256, size / 256); g.fillStyle = color;
  ds.forEach(([d, op]) => { g.globalAlpha *= op; g.fill(path2(d)); g.globalAlpha /= op; }); g.restore();
}

// ---- the end card: the niticore-sub wordmark (public/logo/niticore-sub.svg), parsed at init
let SUB = null;
async function loadSub() {
  const src = await fetch('assets/logos/niticore-sub.svg').then((r) => r.text());
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const c = document.createElement('canvas'); c.width = 500; c.height = 500;
  const g = c.getContext('2d', { willReadFrequently: true });
  const paths = [...doc.querySelectorAll('path')].map((el) => {
    const d = el.getAttribute('d'), fill = el.getAttribute('fill');
    g.clearRect(0, 0, 500, 500); g.fillStyle = '#fff'; g.fill(new Path2D(d));
    const px = g.getImageData(0, 0, 500, 500).data;
    let x0 = 500, y0 = 500, x1 = 0, y1 = 0;
    for (let y = 0; y < 500; y++) for (let x = 0; x < 500; x++) if (px[(y * 500 + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { d, fill: fill === 'white' ? '#FFFFFF' : fill, box: [x0, y0, x1 + 1, y1 + 1] };
  });
  const big = paths.filter((p) => p.box[3] - p.box[1] > 30);
  const bottom = Math.max(...big.map((p) => p.box[3]));
  const letters = big.sort((a, b) => a.box[0] - b.box[0]);
  const sub = paths.filter((p) => p.box[1] > bottom - 2).sort((a, b) => a.box[0] - b.box[0]);
  const sparkles = paths.filter((p) => !letters.includes(p) && !sub.includes(p)).sort((a, b) => a.box[0] - b.box[0]);
  const all = paths.map((p) => p.box), pad = 4;
  const bx = Math.min(...all.map((b) => b[0])) - pad, by = Math.min(...all.map((b) => b[1])) - pad;
  const bw = Math.max(...all.map((b) => b[2])) + pad - bx, bh = Math.max(...all.map((b) => b[3])) + pad - by;
  SUB = { letters, sub, sparkles, bx, by, bw, bh };
}
const END_T0 = V.end;   // the end card's letters land here
function drawSub(g, u) {
  g.save(); g.translate(-SUB.bx, -SUB.by);
  SUB.letters.forEach((p, i) => letterIn(g, u, END_T0 + i * 0.07, p.d, p.fill));
  SUB.sub.forEach((p, i) => {   // the subtitle types on with the voice
    const t = V.tag - 0.05 + (i / SUB.sub.length) * 2.1, k = eo(u, t, t + 0.25);
    if (k <= 0) return;
    g.save(); g.globalAlpha = k; g.fillStyle = p.fill; g.fill(path2(p.d)); g.restore();
  });
  g.restore();
  sweep(g, u, END_T0 + 0.85, SUB.bw, SUB.bh);
  sweep(g, u, V.tag + 3.1, SUB.bw, SUB.bh);
  g.save(); g.translate(-SUB.bx, -SUB.by);
  SUB.sparkles.forEach((p, i) => {
    const sk = springB(u, END_T0 + 0.95 + i * 0.25);
    if (sk <= 0) return;
    const cx = (p.box[0] + p.box[2]) / 2, cy = (p.box[1] + p.box[3]) / 2;
    g.save(); g.translate(cx, cy); g.rotate((1 - sk) * 2.2); g.scale(sk, sk); g.translate(-cx, -cy); g.fillStyle = p.fill; g.fill(path2(p.d)); g.restore();
  });
  g.restore();
}
function defineEndBoard() {
  const s = pick({ '16x9': 760, '9x16': 760, '4x5': 680, '1x1': 600 }) / SUB.bw, el = (p) => [p.box[0] - SUB.bx, p.box[1] - SUB.by, p.box[2] - p.box[0], p.box[3] - p.box[1]];
  const box = (ps) => { const b = ps.map(el); const x0 = Math.min(...b.map((r) => r[0])), y0 = Math.min(...b.map((r) => r[1])); return [x0, y0, Math.max(...b.map((r) => r[0] + r[2])) - x0, Math.max(...b.map((r) => r[1] + r[3])) - y0]; };
  board('logoEnd', {
    css: [SUB.bw, SUB.bh], s, pose: { C: [0, 0, -200], yaw: 0 }, center: true, occ: false, sampleScale: 4,
    els: [...SUB.letters.slice(0, NEL - 2).map(el), box(SUB.sparkles), box(SUB.sub)], anim: [[V.end - 0.4, V.tag + 4.1]],
    draw(g, u) { drawSub(g, u); },
  });
}

function look(b, { yaw = 0, d = 1, dx = 0, dy = 0, lift = 0 } = {}) {
  let ox = 0, oy = 0;
  if (b.frame) { ox = b.frame.ox; oy = b.frame.oy; }
  else if (!b.center) { if (P) { ox = -40; oy = 95; } else { ox = 960 - 96 - b.wpx / 2 - 16; oy = 10; } }
  ox += dx; oy += dy;
  const yr = (b.pose.yaw + yaw) * DEG, v = [Math.sin(yr), lift, Math.cos(yr)], vl = Math.hypot(...v), cr = [Math.cos(yr), 0, -Math.sin(yr)];
  const tgt = [b.C[0] - (cr[0] * ox * d) / 100, b.C[1] + (oy * d) / 100, b.C[2] - (cr[2] * ox * d) / 100];
  return [...tgt.map((t, i) => t + (v[i] / vl) * D0 * d), ...tgt, FOV];
}
// ---------------------------------------------------------------- camera maths
function slopeAt(keys, i, c) {
  if (i === 0 || i === keys.length - 1) return 0;
  const h0 = keys[i][0] - keys[i - 1][0], h1 = keys[i + 1][0] - keys[i][0];
  const d0 = (keys[i][1][c] - keys[i - 1][1][c]) / h0, d1 = (keys[i + 1][1][c] - keys[i][1][c]) / h1;
  if (d0 * d1 <= 0) return 0;
  const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
  return (w1 + w2) / (w1 / d0 + w2 / d1);
}
// monotone cubic (PCHIP) through the keys: continuous velocity, never overshoots a framing
function pchip(keys, u) {
  const n = keys.length;
  if (u <= keys[0][0]) return keys[0][1].slice();
  if (u >= keys[n - 1][0]) return keys[n - 1][1].slice();
  let i = 0; while (keys[i + 1][0] < u) i++;
  const t0 = keys[i][0], h = keys[i + 1][0] - t0, s = (u - t0) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return keys[i][1].map((p0, c) => h00 * p0 + h10 * h * slopeAt(keys, i, c) + h01 * keys[i + 1][1][c] + h11 * h * slopeAt(keys, i + 1, c));
}
function camera(u) {
  const c = pchip(CAM, u);
  const d = [0.04 * noise1(u * 0.21, 3), 0.03 * noise1(u * 0.19, 7), 0.03 * noise1(u * 0.17, 11)];
  return { eye: [c[0] + d[0], c[1] + d[1], c[2] + d[2]], tgt: [c[3], c[4], c[5]], fov: c[6] };
}
function perspective(fovDeg, aspect, near, far) {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function lookAt(e, t, up = [0, 1, 0]) {
  let z = [e[0] - t[0], e[1] - t[1], e[2] - t[2]]; const zl = Math.hypot(...z); z = z.map((v) => v / zl);
  let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(...x); x = x.map((v) => v / xl);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
}
const mulv = (m, v) => [0, 1, 2, 3].map((r) => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);
function projector(cam) {
  const view = lookAt(cam.eye, cam.tgt), proj = perspective(cam.fov, W / H, 0.1, 400);
  return {
    view, proj, eye: cam.eye, cam,
    to(p) { const v = mulv(view, [p[0], p[1], p[2], 1]), c = mulv(proj, v); return { x: ((c[0] / c[3]) * 0.5 + 0.5) * W, y: (1 - ((c[1] / c[3]) * 0.5 + 0.5)) * H, d: -v[2], ok: -v[2] > 0.25 }; },
  };
}

// ---------------------------------------------------------------- GLSL
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;} vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){ const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
 vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx); vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i);
 vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
 float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
 vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0)); vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
 vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
 return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }`;
const VS_P = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
in float aId;
uniform sampler2D uData;
uniform mat4 uProj, uView; uniform vec3 uEye;
uniform float uU, uFocus, uAper, uGain;
uniform int uLay[2]; uniform float uCnt[2]; uniform int uRest[2];
uniform vec3 uC[2]; uniform vec3 uX[2]; uniform vec3 uY[2];
uniform float uElT[${2 * NEL}]; uniform float uElG[${2 * NEL}]; uniform float uResK[2];
uniform float uK0, uKd, uKs, uKr, uKc, uArc, uSq; uniform vec4 uKw; uniform vec3 uCA, uCB;
float gHide;
uniform vec3 uPath[12];
uniform float uPt, uRibPhase, uRibY, uRibYaw, uRibK; uniform vec3 uRibO;
uniform vec3 uBlobC; uniform float uBlobR, uBlobP;
uniform vec3 uLpC, uLpX, uLpY; uniform float uLpR, uLpA, uLpK;
uniform vec3 uWvO, uWvR, uWvF; uniform float uWvK, uWvX, uWvB;
uniform vec4 uOcc[12]; uniform int uOccN;
out vec3 vCol; out float vA; out float vSz;
${NOISE}
uint pcg(uint v){ uint s=v*747796405u+2891336453u; uint w=((s>>((s>>28u)+4u))^s)*277803737u; return (w>>22u)^w; }
float R(float k){ return float(pcg(uint(aId)*128u+uint(k)))*(1.0/4294967295.0); }
vec3 sdir(float a,float b){ float z=a*2.-1.; float t=b*6.2831853; float r=sqrt(max(0.,1.-z*z)); return vec3(r*cos(t),z,r*sin(t)); }
vec3 unpack(float c){ float r=floor(c/65536.); float g=floor((c-r*65536.)/256.); float b=c-r*65536.-g*256.; return vec3(r,g,b)/255.; }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
const vec3 VIO=vec3(0.663,0.545,1.0), VIO2=vec3(0.545,0.408,0.961), LAV=vec3(0.788,0.722,1.0), WHT=vec3(0.949,0.941,0.984);
const vec3 GRN=vec3(0.29,0.878,0.341);
vec3 pathAt(float s){ float f=clamp(s,0.,0.9999)*11.; int i=int(f); return mix(uPath[i],uPath[i+1],f-float(i)); }
vec3 nebula(out vec3 col,out float al,out vec2 uv){
  vec3 c=pathAt(R(10.)); vec3 d=sdir(R(11.),R(12.));
  float rad=2.5+15.0*pow(R(13.),0.75);
  vec3 p=c+d*rad*vec3(1.25,0.6,1.1);
  float t=uU*0.05+R(14.)*6.2831;
  p+=vec3(sin(t+p.y*0.3),cos(t*0.8+p.x*0.2),sin(t*0.6+p.z*0.25))*0.6;
  float m=R(15.);
  col= m<0.55 ? mix(VIO,WHT,R(16.)*0.6) : (m<0.9 ? VIO2 : LAV);
  al=0.11+0.16*R(17.); if(R(18.)>0.975) al*=3.5;
  al*=0.65+0.35*sin(uU*1.3+R(19.)*40.);
  uv=vec2(R(10.),R(11.));
  return p;
}
uniform vec3 uSpC;
vec3 spark(out vec3 col,out float al,out vec2 uv){ col=WHT; al=uPt; uv=vec2(0.5); return uSpC+sdir(R(20.),R(21.))*0.03*R(22.); }
// three ribbons of light; their flow phase speeds up on "accelerating"
vec3 ribbon(out vec3 col,out float al,out vec2 uv){
  float k=floor(R(23.)*3.); float s=fract(R(24.)+uRibPhase);
  float x=mix(-14.,14.,s); float ph=uU*0.2+k*2.094;
  float y=0.8*sin(x*0.26+ph)+0.28*sin(x*0.67-ph*1.3+k)+(k-1.)*0.6+uRibY;
  float z=1.2*sin(x*0.17+ph*0.7+k*1.7)-0.6;
  float th=0.16+0.1*sin(x*0.45+k*2.+uU*0.3);
  vec2 o=vec2(R(25.)-0.5,(R(26.)-0.5)*0.8)*th*2.0; o=rot(x*0.3+uU*0.12+k)*o;
  vec3 p=vec3(x,y+o.x,z+o.y);
  p.xz=rot(uRibYaw)*p.xz; p+=uRibO;
  col= k<0.5 ? LAV : (k<1.5 ? WHT : VIO2);
  float edge=smoothstep(0.,0.1,s)*smoothstep(1.,0.9,s);
  al=(0.4+0.45*R(27.))*edge*uRibK; if(R(28.)>0.97) al*=2.6;
  uv=vec2(s,k/3.);
  return p;
}
// the avatar's surface: where the wordmark pours in, and what the avatar dissolves into
vec3 blobsurf(out vec3 col,out float al,out vec2 uv){
  if(R(100.)<0.45) return nebula(col,al,uv);
  vec3 d=sdir(R(101.),R(102.));
  float n=0.08*snoise(d*1.3+vec3(0.,uU*0.1,0.));
  vec3 p=uBlobC+d*uBlobR*(1.0+n)*(1.0+0.025*R(103.));
  col=mix(VIO,WHT,0.25+0.5*R(104.)); al=uBlobP*(0.35+0.6*R(105.));
  uv=vec2(atan(d.z,d.x)/6.2831+0.5,d.y*0.5+0.5);
  return p;
}
// the governance loop: light running round the OrbitSteps ring, brightest at the comet
vec3 loopring(out vec3 col,out float al,out vec2 uv){
  if(R(110.)<0.55) return nebula(col,al,uv);
  float a=R(111.)*6.2831853+uU*0.12;
  float rr=uLpR*(1.0+(R(112.)-0.5)*0.035);
  vec3 p=uLpC+normalize(uLpX)*cos(a)*rr+normalize(uLpY)*sin(a)*rr+normalize(cross(uLpX,uLpY))*(0.05+(R(113.)-0.5)*0.1);
  float dA=abs(mod(a-uLpA+3.14159265,6.2831853)-3.14159265);
  col=mix(VIO,GRN,exp(-dA*dA*30.)); al=uLpK*(0.12+0.5*R(114.)+1.6*exp(-dA*dA*18.));
  uv=vec2(R(111.),0.5);
  return p;
}
// v3 · the regulatory wave: a sea of light that rises toward 2027, rolling forward; the crest sits just behind
// the timeline (depth 0) and the comet lights it green as it passes (same envelope as wenv() in JS)
float wenv(float a){ return pow(clamp((a+40.)/40.,0.,1.),1.3)*(1.-0.55*smoothstep(2.,16.,a)); }
vec3 wave(out vec3 col,out float al,out vec2 uv){
  float s=R(120.), q=R(121.);
  float a=mix(-54.,18.,s);
  float foam=step(R(125.),0.16);   // a share of the light rides the crest itself, as foam
  float c=mix(-2.0+36.0*pow(q,2.2),2.2+(q-0.5)*1.6,foam);
  float prof=exp(-pow((c-2.2)/5.5,2.))*0.85+0.15;
  float t=uU*0.625;
  float roll=0.8+0.2*sin(a*0.55-t*1.6+c*0.35);
  float rip=0.22*sin(a*0.9+c*0.6-t*2.1)*(0.4+prof)+0.14*snoise(vec3(a*0.18,c*0.18,t*0.25));
  float h=uWvB+uWvK*(4.2*wenv(a)*prof*roll+rip);
  vec3 p=uWvO+uWvR*a+vec3(0.,h,0.)+uWvF*c;
  float hi=clamp((h-uWvB)/4.4,0.,1.);
  float m=R(122.);
  col= m<0.5 ? mix(VIO2,LAV,hi) : (m<0.85 ? mix(VIO,WHT,hi*0.7) : LAV);
  col=mix(col,mix(LAV,WHT,0.6),foam*hi);
  float cm=exp(-pow((a-uWvX)/3.4,2.))*prof;
  col=mix(col,GRN,clamp(cm*1.1,0.,0.8));
  al=(0.16+0.42*R(123.))*(0.22+1.15*prof*prof)*(0.5+0.8*hi)*(1.+2.0*cm)*(1.+1.4*foam*hi);
  if(R(124.)>0.985) al*=3.;
  al*=smoothstep(-54.,-42.,a)*(1.-smoothstep(10.,18.,a))*(1.-smoothstep(24.,35.,c));
  uv=vec2(s,q);
  return p;
}
// v3 · the six worlds as 3D particle sculptures (and the globe they come from), morphing one into the next
uniform vec3 uScC, uScX, uScY, uScZ; uniform float uScA, uScB, uScK, uScYaw, uScS, uScVis;
float Q(float k){ return float(pcg(uint(aId)*7919u+uint(k)*104729u+1013904223u))*(1.0/4294967295.0); }
vec3 boxS(vec3 c, vec3 h, float a, float b, float d, float e){
  vec3 p;
  if(d<e){
    float k=floor(a*12.); float t=b*2.-1.; float ax=mod(k,3.); float s1=mod(floor(k/3.),2.)*2.-1.; float s2=floor(k/6.)*2.-1.;
    if(ax<0.5) p=vec3(t*h.x,s1*h.y,s2*h.z); else if(ax<1.5) p=vec3(s1*h.x,t*h.y,s2*h.z); else p=vec3(s1*h.x,s2*h.y,t*h.z);
  } else {
    float f=floor(a*6.); vec2 q=vec2(fract(a*6.)*2.-1.,b*2.-1.);
    if(f<0.5) p=vec3(h.x,q.x*h.y,q.y*h.z); else if(f<1.5) p=vec3(-h.x,q.x*h.y,q.y*h.z);
    else if(f<2.5) p=vec3(q.x*h.x,h.y,q.y*h.z); else if(f<3.5) p=vec3(q.x*h.x,-h.y,q.y*h.z);
    else if(f<4.5) p=vec3(q.x*h.x,q.y*h.y,h.z); else p=vec3(q.x*h.x,q.y*h.y,-h.z);
  }
  return c+p;
}
vec3 cylS(vec3 c,float r,float hh,float a,float b){ float t=a*6.2831853; return c+vec3(cos(t)*r,(b*2.-1.)*hh,sin(t)*r); }
vec3 qbez(vec3 p0,vec3 p1,vec3 p2,float t){ float s=1.-t; return s*s*p0+2.*s*t*p1+t*t*p2; }
vec3 jit(float r){ return (vec3(Q(31.),Q(32.),Q(33.))-0.5)*r; }
float ecgf(float p){ if(p<0.3) return 0.; if(p<0.36) return 0.12*sin((p-0.3)/0.06*3.14159); if(p<0.42) return 0.; if(p<0.46) return mix(0.,1.,(p-0.42)/0.04); if(p<0.51) return mix(1.,-0.6,(p-0.46)/0.05); if(p<0.55) return mix(-0.6,0.,(p-0.51)/0.04); if(p<0.66) return 0.; if(p<0.78) return 0.2*sin((p-0.66)/0.12*3.14159); return 0.; }
// 0 · a globe of light: latitude rings, meridians, a dusting over the surface
vec3 scGlobe(out float br){
  float a=Q(1.),b=Q(2.),m=Q(3.);
  if(m<0.4){ float lat=((floor(b*9.)+0.5)/9.)*3.14159-1.5708; float t=a*6.2832; br=0.9; return vec3(cos(lat)*cos(t),sin(lat),cos(lat)*sin(t))*2.3; }
  if(m<0.78){ float lon=floor(a*14.)/14.*6.2832; float la=(b*2.-1.)*1.5708; br=0.9; return vec3(cos(la)*cos(lon),sin(la),cos(la)*sin(lon))*2.3; }
  br=0.35; return sdir(a,b)*2.3*(0.97+0.06*Q(4.));
}
// 1 · finance: a city of towers, a market line rising over it to an arrow
vec3 scFinance(out float br){
  float m=Q(1.),a=Q(2.),b=Q(3.),d=Q(4.);
  if(m<0.7){
    float i=floor(Q(5.)*9.); float gx=mod(i,3.)-1.; float gz=floor(i/3.)-1.;
    float h=1.2+2.6*fract(sin(i*12.9898+4.1)*43758.5453);
    vec3 hs=vec3(0.4,h*0.5,0.4); vec3 p=boxS(vec3(gx*1.2,-2.1+hs.y,gz*1.05),hs,a,b,d,0.42);
    br= d<0.42 ? 1.0 : (fract(p.y*3.4+i*0.3)<0.28 ? 0.85 : 0.28);
    return p;
  }
  if(m<0.95){
    float t=a*5.; float i=floor(t); float f=fract(t);
    vec3 p0,p1;
    if(i<0.5){p0=vec3(-3.,-0.7,1.5);p1=vec3(-1.8,0.1,1.5);} else if(i<1.5){p0=vec3(-1.8,0.1,1.5);p1=vec3(-0.8,-0.25,1.5);}
    else if(i<2.5){p0=vec3(-0.8,-0.25,1.5);p1=vec3(0.4,0.95,1.5);} else if(i<3.5){p0=vec3(0.4,0.95,1.5);p1=vec3(1.4,0.6,1.5);} else {p0=vec3(1.4,0.6,1.5);p1=vec3(2.9,2.5,1.5);}
    br=1.25; return mix(p0,p1,f)+jit(0.07);
  }
  vec3 tip=vec3(2.9,2.5,1.5); br=1.3; return (b<0.5 ? mix(tip,tip+vec3(-0.55,-0.05,0.),a) : mix(tip,tip+vec3(-0.12,-0.55,0.),a))+jit(0.06);
}
// 2 · healthcare: a puffy heart, an ECG trace in front of it, a cross floating beside
vec3 scHealth(out float br){
  float m=Q(1.),a=Q(2.),b=Q(3.),d=Q(4.);
  if(m<0.62){
    float t=a*6.2832; vec2 hp=vec2(16.*pow(sin(t),3.),13.*cos(t)-5.*cos(2.*t)-2.*cos(3.*t)-cos(4.*t))*0.09;
    if(d<0.32){ br=1.0; return vec3(hp.x-0.5,hp.y+0.35,(Q(6.)*2.-1.)*0.22); }
    float u=sqrt(b); float side=d<0.66?1.:-1.;
    br=0.35+0.45*u; return vec3(hp.x*u-0.5,hp.y*u+0.35,side*0.9*sqrt(max(0.,1.-u*u)));
  }
  if(m<0.86){
    float x=mix(-3.2,3.2,a); float p=fract((x+3.2)/3.2); float pulse=exp(-pow(x-(-3.6+mod(uU*2.2,7.4)),2.)*2.);
    br=0.55+1.2*pulse; return vec3(x,ecgf(p)*1.0-1.15,1.45)+jit(0.05);
  }
  vec3 c=vec3(2.35,1.75,0.); br=0.95;
  return a<0.5 ? boxS(c,vec3(0.62,0.2,0.2),b,d,Q(7.),0.45) : boxS(c,vec3(0.2,0.62,0.2),b,d,Q(7.),0.45);
}
vec3 wHead(float j){ float s=j==2.?1.2:(abs(j-2.)<1.5?1.0:0.85); return vec3((j-2.)*1.3,-0.95+1.1*s,-0.7*(1.-pow((j-2.)/2.,2.))); }
// 3 · workforce: five people, joined by arcs that carry pulses
vec3 scWork(out float br){
  float m=Q(1.),a=Q(2.),b=Q(3.),d=Q(4.);
  if(m<0.8){
    float j=floor(Q(5.)*5.); float s=j==2.?1.2:(abs(j-2.)<1.5?1.0:0.85); vec3 h=wHead(j);
    if(d<0.42){ br=0.85; return h+sdir(a,b)*0.4*s; }
    vec3 dd=sdir(a,b); dd.y=abs(dd.y); br=0.5; return vec3(h.x,h.y-1.42*s,h.z)+vec3(dd.x*0.8,dd.y*1.0,dd.z*0.5)*s;
  }
  float e=floor(Q(8.)*4.); vec3 h0=wHead(e),h1=wHead(e+1.); vec3 mid=(h0+h1)*0.5+vec3(0.,1.1,0.);
  float pulse=exp(-pow(a-fract(uU*0.45+e*0.25),2.)*120.);
  br=0.6+1.3*pulse; return qbez(h0+vec3(0.,0.45,0.),mid,h1+vec3(0.,0.45,0.),a)+jit(0.04);
}
// 4 · government: a capitol: steps, columns, entablature, pediment, drum and dome, a flag
vec3 scGov(out float br){
  float m=Q(1.),a=Q(2.),b=Q(3.),d=Q(4.);
  if(m<0.16){ float s=floor(Q(5.)*3.); br=0.6; return boxS(vec3(0.,-2.2+s*0.18,0.35-s*0.15),vec3(2.7-s*0.25,0.09,1.35-s*0.15),a,b,d,0.5); }
  if(m<0.48){ float j=floor(Q(5.)*6.); br=0.85; return cylS(vec3(-1.75+j*0.7,-0.85,0.95),0.15,0.95,a,b); }
  if(m<0.58){ br=0.8; return boxS(vec3(0.,0.22,0.55),vec3(2.3,0.12,0.62),a,b,d,0.5); }
  if(m<0.7){ float u=a,v=b; if(u+v>1.){u=1.-u;v=1.-v;} vec2 A=vec2(-2.35,0.34),B=vec2(2.35,0.34),C=vec2(0.,1.1); vec2 q=A+u*(B-A)+v*(C-A); br= d<0.4 ? 0.9 : 0.5; return vec3(q,d<0.4?1.15:mix(1.15,-0.05,Q(6.))); }
  if(m<0.86){ if(d<0.35){ br=0.7; return cylS(vec3(0.,1.32,0.3),0.82,0.18,a,b); } vec3 dd=sdir(a,b); dd.y=abs(dd.y); br=0.85; return vec3(0.,1.5,0.3)+dd*vec3(0.82,0.85,0.82); }
  if(m<0.92){ br=1.0; return vec3(0.,2.35+a*0.95,0.3)+jit(0.04); }
  float fx=a*0.85,fy=b*0.48; br=1.05; return vec3(fx,2.82+fy+0.09*sin(fx*6.-uU*3.),0.3+0.12*sin(fx*5.-uU*2.5));
}
// 5 · retail and consumer: a shopping bag and a cart, a price tag swinging from the handle
const vec3 CART[32]=vec3[32](
  vec3(0.2,-0.15,-0.6),vec3(2.7,-0.15,-0.6), vec3(0.2,-0.15,0.6),vec3(2.7,-0.15,0.6), vec3(0.2,-0.15,-0.6),vec3(0.2,-0.15,0.6), vec3(2.7,-0.15,-0.6),vec3(2.7,-0.15,0.6),
  vec3(0.55,-1.3,-0.5),vec3(2.45,-1.3,-0.5), vec3(0.55,-1.3,0.5),vec3(2.45,-1.3,0.5), vec3(0.55,-1.3,-0.5),vec3(0.55,-1.3,0.5), vec3(2.45,-1.3,-0.5),vec3(2.45,-1.3,0.5),
  vec3(0.2,-0.15,0.6),vec3(0.55,-1.3,0.5), vec3(2.7,-0.15,0.6),vec3(2.45,-1.3,0.5), vec3(0.2,-0.15,-0.6),vec3(0.55,-1.3,-0.5), vec3(2.7,-0.15,-0.6),vec3(2.45,-1.3,-0.5),
  vec3(1.03,-0.15,0.6),vec3(1.1,-1.3,0.5), vec3(1.87,-0.15,0.6),vec3(1.9,-1.3,0.5), vec3(0.2,-0.15,0.6),vec3(-0.25,0.45,0.6), vec3(0.2,-0.15,-0.6),vec3(-0.25,0.45,-0.6));
vec3 scRetail(out float br){
  float m=Q(1.),a=Q(2.),b=Q(3.),d=Q(4.);
  if(m<0.4){
    if(d<0.84){ br=0.65; return boxS(vec3(-1.55,-1.05,0.),vec3(0.85,0.95,0.4),a,b,Q(9.),0.34); }
    float t=a*3.14159; br=1.05; return vec3(-1.55+cos(t)*0.45,-0.1+sin(t)*0.55,(b-0.5)*0.12);
  }
  if(m<0.82){
    if(d<0.78){ int e=int(floor(a*16.)); br=0.95; return mix(CART[e*2],CART[e*2+1],b)+jit(0.05); }
    if(d<0.86){ br=1.0; return mix(vec3(-0.25,0.45,-0.6),vec3(-0.25,0.45,0.6),b)+jit(0.04); }
    float w=floor(Q(10.)*4.); vec3 c=vec3(w<2.?0.75:2.25,-1.62,mod(w,2.)<1.?-0.48:0.48); float t=a*6.2832; br=0.9; return c+vec3(cos(t)*0.22,sin(t)*0.22,0.);
  }
  float sw=0.35*sin(uU*1.3); vec2 q=vec2((a-0.5)*0.42,-b*0.55); vec2 r=vec2(cos(sw)*q.x-sin(sw)*q.y,sin(sw)*q.x+cos(sw)*q.y);
  br= (abs(q.x)>0.17||b>0.92) ? 1.0 : 0.45; return vec3(-0.25+r.x,0.25+r.y,0.62);
}
// 6 · infrastructure and mobility: a suspension bridge, a train crossing it, water rippling below
vec3 scInfra(out float br){
  float m=Q(1.),a=Q(2.),b=Q(3.),d=Q(4.);
  if(m<0.13){ br=0.75; return boxS(vec3(0.,-0.75,0.),vec3(3.5,0.08,0.45),a,b,d,0.6); }
  if(m<0.33){ float j=floor(Q(5.)*4.); float tx=j<2.?-1.75:1.75; float tz=mod(j,2.)<1.?-0.42:0.42; br=0.9; return boxS(vec3(tx,0.05,tz),vec3(0.09,2.05,0.09),a,b,d,0.55); }
  if(m<0.58){
    float side=d<0.5?-0.42:0.42; float s3=floor(Q(5.)*3.); vec3 p;
    if(s3<0.5) p=qbez(vec3(-1.75,2.05,side),vec3(0.,-0.55,side),vec3(1.75,2.05,side),a);
    else if(s3<1.5) p=qbez(vec3(-3.5,-0.68,side),vec3(-2.7,0.55,side),vec3(-1.75,2.05,side),a);
    else p=qbez(vec3(1.75,2.05,side),vec3(2.7,0.55,side),vec3(3.5,-0.68,side),a);
    br=1.05; return p+jit(0.04);
  }
  if(m<0.72){ float hx=-1.55+floor(a*15.)/14.*3.1; float t=(hx+1.75)/3.5; vec3 top=qbez(vec3(-1.75,2.05,0.),vec3(0.,-0.55,0.),vec3(1.75,2.05,0.),t); br=0.5; return vec3(hx,mix(-0.68,top.y,b),d<0.5?-0.42:0.42); }
  if(m<0.84){ float tx=-4.2+mod(uU*0.9,8.4); br=1.1*(1.-smoothstep(3.2,3.9,abs(tx))); return boxS(vec3(tx,-0.47,0.),vec3(0.75,0.18,0.22),a,b,d,0.5); }
  float wx=(a*2.-1.)*3.9,wz=(b*2.-1.)*1.7; br=0.28; return vec3(wx,-1.95+0.09*sin(wx*2.+uU*1.5)+0.06*sin(wz*3.+uU),wz);
}
vec3 sculpt(float k,out float br){
  if(k<0.5) return scGlobe(br); if(k<1.5) return scFinance(br); if(k<2.5) return scHealth(br); if(k<3.5) return scWork(br);
  if(k<4.5) return scGov(br); if(k<5.5) return scRetail(br); return scInfra(br);
}
vec3 sculptPos(out vec3 col,out float al,out vec2 uv){
  if(R(127.)<0.16) return nebula(col,al,uv);
  float bA,bB; vec3 pA=sculpt(uScA,bA),pB=sculpt(uScB,bB);
  float st=Q(20.)*0.45; float k=smoothstep(st,st+0.55,uScK);
  vec3 p=mix(pA,pB,k);
  float arc=sin(3.14159*k);
  if(arc>0.001) p+=arc*1.1*vec3(snoise(p*0.5+vec3(0.,uU*0.1,0.)),snoise(p*0.5+vec3(5.,0.,uU*0.1)),snoise(p*0.5+vec3(0.,9.,uU*0.1)));
  float br=mix(bA,bB,k);
  float cy=cos(uScYaw),sy=sin(uScYaw); p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
  vec3 w=uScC+(uScX*p.x+uScY*p.y+uScZ*p.z)*uScS;
  float mm=Q(24.);
  col= mm<0.55 ? mix(VIO,WHT,clamp(0.3+0.45*br,0.,1.)) : (mm<0.85 ? LAV : WHT);
  al=(0.07+0.16*Q(25.))*br*uScVis*(1.+0.6*arc);
  uv=vec2(Q(20.),Q(2.));
  return w;
}
// two lanes of light (the two markets): particles stream along two parallel tracks; uLnSep 0 merges them into one line,
// uLnDraw draws the line out from the centre. A share runs faster, like comets along the track.
uniform vec3 uLnO, uLnR, uLnU; uniform float uLnSep, uLnK, uLnPh, uLnW, uLnDraw;
vec3 lanes(out vec3 col,out float al,out vec2 uv){
  if(R(40.)<0.2) return nebula(col,al,uv);
  float k=R(41.)<0.5 ? -1. : 1.;
  float fast=step(0.88,R(42.));
  float s=fract(R(43.)+uLnPh*(1.+1.7*fast)+k*0.17);
  float x=mix(-uLnW,uLnW,s);
  float th=0.06+0.04*sin(x*0.5+uU*0.4+k*2.);
  vec2 o=vec2(R(44.)-0.5,R(45.)-0.5)*th*2.;
  float y=k*uLnSep+0.05*sin(x*0.33+uU*0.25+k)+o.x;
  vec3 f=normalize(cross(uLnR,uLnU));
  vec3 p=uLnO+uLnR*x+uLnU*y+f*o.y*1.6;
  col= fast>0.5 ? mix(LAV,WHT,0.7) : (R(46.)<0.6 ? mix(VIO,LAV,R(47.)) : VIO2);
  float edge=smoothstep(0.,0.1,s)*smoothstep(1.,0.9,s);
  float draw=1.-smoothstep(uLnDraw*uLnW-0.8,uLnDraw*uLnW+0.1,abs(x));
  al=(0.2+0.38*R(48.))*(1.+1.6*fast)*edge*draw*uLnK; if(R(49.)>0.97) al*=2.4;
  uv=vec2(s,k*0.5+0.5);
  return p;
}
// the healthcare film · a DNA double helix of light: two strands, rungs between the bases; it can unravel
uniform vec3 uHxC, uHxTint; uniform float uHxH, uHxR, uHxTurns, uHxSpin, uHxTilt, uHxN, uHxK, uHxRev, uHxUnr, uHxTintK;
vec3 hxPt(float s,float t){
  float a=t*uHxTurns*6.2831853+uHxSpin+s*3.14159265;
  vec3 p=vec3(uHxR*cos(a),(t-0.5)*uHxH,uHxR*sin(a));
  float c=cos(uHxTilt),sn=sin(uHxTilt);
  return uHxC+vec3(c*p.x-sn*p.y,sn*p.x+c*p.y,p.z);
}
vec3 helix(out vec3 col,out float al,out vec2 uv){
  if(R(50.)<0.16) return nebula(col,al,uv);
  float m=R(51.), t=R(52.), s=step(0.5,R(53.)), br;
  vec3 p;
  if(m<0.58){ p=hxPt(s,t)+(vec3(R(54.),R(55.),R(56.))-0.5)*0.17; br=0.95; col=mix(VIO,LAV,R(57.)); }
  else { t=(floor(t*uHxN)+0.5)/uHxN; float f=R(58.); p=mix(hxPt(0.,t),hxPt(1.,t),f)+(vec3(R(54.),R(55.),R(56.))-0.5)*0.05; br=0.55+0.5*(1.-abs(f*2.-1.)); col=mix(VIO2,WHT,0.35); }
  float un=uHxUnr;
  if(un>0.001) p+=un*0.6*vec3(snoise(p*0.6+vec3(uU*0.25,0.,0.)),snoise(p*0.6+vec3(0.,uU*0.25,4.)),snoise(p*0.6+vec3(7.,0.,uU*0.25)));
  col=mix(col,uHxTint,uHxTintK);
  float rv=smoothstep(t-0.06,t+0.02,uHxRev*1.08-0.02);
  al=(0.16+0.38*R(59.))*br*uHxK*rv; if(R(60.)>0.97) al*=2.5;
  uv=vec2(t,s); return p;
}
// the event cut · a floor of light under the stand: grid lines of particles, fading at the edges
uniform vec3 uFlC, uFlX, uFlZ; uniform float uFlW, uFlD, uFlK;
vec3 floorGrid(out vec3 col,out float al,out vec2 uv){
  if(R(127.)<0.22) return nebula(col,al,uv);
  float a=Q(1.),b=Q(2.),m=Q(3.); float gx,gz;
  if(m<0.5){ gx=(floor(a*25.)/24.)*2.-1.; gz=b*2.-1.; } else { gx=a*2.-1.; gz=(floor(b*15.)/14.)*2.-1.; }
  vec3 p=uFlC+uFlX*gx*uFlW+uFlZ*gz*uFlD;
  float e=(1.-smoothstep(0.55,1.,abs(gx)))*(1.-smoothstep(0.45,1.,abs(gz)));
  col=mix(VIO,LAV,Q(4.)); al=(0.12+0.24*Q(5.))*e*uFlK;
  uv=vec2(a,b); return p;
}
vec3 primary(int s,out vec3 col,out float al,out vec2 uv){
  int id=int(aId);
  vec4 d=texelFetch(uData,ivec2(id%512,uLay[s]*${RL}+id/512),0);
  uv=d.xy;
  vec3 X=uX[s], Y=uY[s]; vec3 nrm=normalize(cross(X,Y));
  vec3 p=uC[s]+X*(d.x*2.-1.)+Y*(1.-2.*d.y)+nrm*(0.04+0.05*R(80.));
  float el=floor(d.w), bri=fract(d.w);
  col=unpack(d.z);
  int ei=s*${NEL}+int(el);
  float te=uElT[ei], gh=uElG[ei];
  float x=uU-te;
  gHide=(gh<0.001 && x<0.) ? 1. : 0.;
  float flare=smoothstep(-0.12,0.1,x)*exp(-max(x,0.)*2.0);
  al=mix(gh,(0.022+0.018*sin(uU*2.+R(81.)*30.))*uResK[s],smoothstep(0.,0.3,x))+1.5*flare;
  al*=0.35+0.9*bri;
  return p;
}
vec3 statePos(int s,out vec3 col,out float al,out vec2 uv){
  if(uLay[s]>=0 && aId<uCnt[s]) return primary(s,col,al,uv);
  int r=uRest[s];
  if(r==1) return spark(col,al,uv);
  if(r==2) return ribbon(col,al,uv);
  if(r==3) return blobsurf(col,al,uv);
  if(r==4) return loopring(col,al,uv);
  if(r==5) return wave(col,al,uv);
  if(r==6) return sculptPos(col,al,uv);
  if(r==7) return floorGrid(col,al,uv);
  if(r==8) return lanes(col,al,uv);
  if(r==9) return helix(col,al,uv);
  return nebula(col,al,uv);
}
void main(){
  vec3 cA,cB,col,p; float aA,aB,al; vec2 uvA,uvB; gHide=0.;
  float rnd=R(90.);
  if(uU>=uK0+uKs+uKd){ p=statePos(1,cB,aB,uvB); col=cB; al=aB; }
  else if(uU<=uK0){ p=statePos(0,cA,aA,uvA); col=cA; al=aA; }
  else {
    vec3 pA=statePos(0,cA,aA,uvA); vec3 pB=statePos(1,cB,aB,uvB);
    float st=uKs*clamp(uKw.x*uvA.x+uKw.y*uvA.y+uKw.z*uvB.x+uKw.w*uvB.y+uKc*abs(uvB.x-0.5)*2.+uKr*rnd,0.,1.);
    float k=clamp((uU-uK0-st)/uKd,0.,1.);
    float e=k*k*k*(k*(k*6.-15.)+10.);
    p=mix(pA,pB,e);
    float mv=smoothstep(0.05,0.6,distance(pA,pB));
    float arc=sin(3.14159*e)*mv;
    bool prim=(uLay[0]>=0 && aId<uCnt[0]) || (uLay[1]>=0 && aId<uCnt[1]);
    if(prim && uSq>0.){
      vec3 dir=normalize(uCB-uCA); vec3 n1=normalize(cross(dir,vec3(0.,1.,0.))+vec3(0.,0.,1e-4)); vec3 n2=cross(dir,n1);
      float ang=rnd*6.2831+e*9.0; float rad=(0.2+0.95*R(93.))*(1.1+0.6*sin(e*6.2831+rnd*3.));
      vec3 tube=mix(uCA,uCB,e)+(n1*cos(ang)+n2*sin(ang))*rad;
      p=mix(p,tube,sin(3.14159*e)*uSq);
      arc*=1.-0.75*uSq;
    }
    if(arc>0.001) p+=arc*uArc*vec3(snoise(p*0.11+vec3(rnd*7.,0.,uU*0.04)),snoise(p*0.11+vec3(0.,rnd*7.+3.,uU*0.04)),snoise(p*0.11+vec3(5.,0.,rnd*7.+uU*0.04)));
    float trav=(0.6+0.5*R(91.))*(1.-0.88*gHide)*(prim?1.:0.3);
    float base=mix(aA,aB,smoothstep(0.6,1.,k));
    float tr=mix(mix(aA,trav,smoothstep(0.,0.15,k)),aB,smoothstep(0.82,1.,k));
    al=mix(base,tr,mv);
    col=mix(cA,cB,smoothstep(0.25,0.8,k));
  }
  for(int b=0;b<4;b++){
    if(b>=uOccN) break;
    vec4 c0=uOcc[b*3]; vec3 X=uOcc[b*3+1].xyz, Y=uOcc[b*3+2].xyz; vec3 n=cross(X,Y); vec3 dv=p-uEye; float den=dot(dv,n);
    if(abs(den)<1e-6) continue;
    float t=dot(c0.xyz-uEye,n)/den;
    if(t>0. && t<0.999){ vec3 h=uEye+dv*t-c0.xyz; float lx=dot(h,X)/dot(X,X), ly=dot(h,Y)/dot(Y,Y); if(abs(lx)<0.985 && abs(ly)<0.985) al*=1.-c0.w*0.94; }
  }
  vec4 vp=uView*vec4(p,1.); float depth=-vp.z; gl_Position=uProj*vp;
  float sz=(1.25+1.5*R(92.))*(14.84/max(depth,0.1));
  float coc=uAper*abs(depth-uFocus)/max(depth,0.1)*40.;
  float ps=max(sz+coc,1.0);
  al*=clamp((sz*sz+0.6)/(ps*ps+0.6),0.02,1.)*smoothstep(2.0,7.5,depth);
  gl_PointSize=min(ps,40.);
  vCol=pow(col,vec3(2.2)); vA=al*uGain; vSz=ps;
}`;
// the avatar: an icosphere displaced by noise (and by the voice), glossy studio shading, painted eyes
const VS_BLOB = `#version 300 es
precision highp float;
in vec3 aP;
uniform mat4 uProj, uView; uniform vec3 uC; uniform float uR, uT, uAmp, uVoice, uSpike, uSeed, uCapL; uniform mat3 uRot;
uniform vec4 uBud[8]; uniform float uBudK[8]; uniform int uBudN;
out vec3 vN; out vec3 vW; out vec3 vD;
${NOISE}
float disp(vec3 d){
  float r=1.0 + 0.07*uAmp*snoise(d*1.15+vec3(uSeed,uT*0.2,0.))
    + 0.016*snoise(d*2.4+vec3(0.,uSeed,uT*0.6))*(0.5+3.0*uVoice)
    + uSpike*0.34*pow(max(0.,snoise(d*4.6+vec3(uT*0.35,uSeed,0.))),1.6);
  for(int k=0;k<8;k++){ if(k>=uBudN) break; r+=uBud[k].w*exp((dot(d,uBud[k].xyz)-1.0)*uBudK[k]); }
  return r;
}
void main(){
  vec3 d=normalize(aP);
  vec3 t1=normalize(cross(d,abs(d.y)<0.99?vec3(0.,1.,0.):vec3(1.,0.,0.))); vec3 t2=cross(d,t1);
  float e=0.02;
  vec3 q1=normalize(d+t1*e), q2=normalize(d+t2*e);
  vec3 p0=uRot*(d*disp(d)+vec3(0.,uCapL*tanh(d.y*12.),0.)), p1=uRot*(q1*disp(q1)+vec3(0.,uCapL*tanh(q1.y*12.),0.)), p2=uRot*(q2*disp(q2)+vec3(0.,uCapL*tanh(q2.y*12.),0.));
  vec3 n=normalize(cross(p1-p0,p2-p0)); if(dot(n,p0)<0.) n=-n;
  vec3 w=uC+p0*uR;
  vN=n; vW=w; vD=d;
  gl_Position=uProj*uView*vec4(w,1.);
}`;
const FS_BLOB = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; in vec3 vD;
uniform vec3 uEye, uTint, uLook, uTint2; uniform float uGlow, uBlink, uMood, uFlick, uRev, uSeed, uT, uEyes, uTwo;
out vec4 o;
${NOISE}
void main(){
  float nz=snoise(vD*2.3+vec3(uSeed*3.1,1.7,0.))*0.5+0.5, th=uRev*1.2-0.1;
  if(nz>th) discard;
  vec3 N=normalize(vN), V=normalize(uEye-vW);
  float ndv=clamp(dot(N,V),0.,1.), F=pow(1.-ndv,3.);
  vec3 L1=normalize(vec3(-0.5,0.75,0.55));
  vec3 base=mix(uTint,uTint2,uTwo*smoothstep(-0.03,0.03,vD.y))*(1.0-0.16*uFlick*(0.5+0.5*sin(uT*13.0)));
  float dif=0.22+0.78*max(dot(N,L1),0.);
  vec3 Hh=normalize(L1+V); float spec=pow(max(dot(N,Hh),0.),90.)*2.4;
  vec3 R=reflect(-V,N);
  vec3 env=mix(vec3(0.05,0.03,0.14),vec3(0.55,0.45,1.0)*0.45,smoothstep(-0.5,0.9,R.y));
  env+=vec3(1.)*smoothstep(0.86,0.995,dot(R,normalize(vec3(-0.6,0.7,0.4))))*0.9;
  env+=vec3(0.75,0.85,1.)*smoothstep(0.9,0.995,dot(R,normalize(vec3(0.8,0.3,0.5))))*0.4;
  vec3 irid=0.5+0.5*cos(6.2831*(vec3(0.0,0.33,0.67)+(1.-ndv)*1.2+0.55));
  float warm=clamp((base.r-base.b)*1.5,0.,1.);   // amber and coral: less of the violet studio light, so the colour holds
  vec3 col=base*dif*0.85+env*(0.04+0.5*F)*(1.0-0.6*warm)+spec*(1.0-0.4*warm)+irid*F*0.3*vec3(0.6,0.7,1.0)*(1.0-warm)+base*uGlow*(0.4+0.6*(1.-F));
  // two eyes painted on the surface, facing uLook; they blink, and narrow when worried
  vec3 f=normalize(uLook), r=normalize(cross(vec3(0.,1.,0.),f)), u=cross(f,r);
  float eye=0., sock=0.;
  for(int i=0;i<2;i++){
    float sx=i==0?-1.:1.;
    float x=dot(vD,r)-sx*0.26, y=dot(vD,u)-0.07+uMood*sx*x*0.35;
    float h=0.16*max(uBlink,0.06)*(1.-0.45*uMood);
    float q=(x*x)/(0.095*0.095)+(y*y)/(h*h);
    float front=step(0.55,dot(vD,f));
    eye=max(eye,(1.-smoothstep(0.82,1.0,q))*front); sock=max(sock,(1.-smoothstep(1.0,2.6,q))*front);
  }
  eye*=uEyes; sock*=uEyes;
  col=mix(col,col*0.4,(sock-eye)*0.8);
  col=mix(col,vec3(2.0,2.0,2.3),eye);
  col+=vec3(0.75,0.62,1.0)*3.0*(1.0-smoothstep(0.0,0.07,th-nz))*(1.0-step(0.999,uRev));   // the glowing edge as the skin fills in or peels
  o=vec4(col*0.8,1.);
}`;

const FS_P = `#version 300 es
precision highp float; in vec3 vCol; in float vA; in float vSz; out vec4 o;
void main(){ vec2 q=gl_PointCoord*2.0-1.0; float d2=dot(q,q); if(d2>1.0) discard;
 float g=exp(-d2*3.2); float disc=1.0-smoothstep(0.75,1.0,sqrt(d2)); float k=smoothstep(4.0,12.0,vSz);
 o=vec4(vCol*vA*mix(g,disc*0.55+g*0.2,k),1.0); }`;
const VS_B = `#version 300 es
in vec2 aP; uniform mat4 uProj, uView; uniform vec3 uC, uX, uY; out vec2 vUv;
void main(){ vUv=vec2(aP.x*0.5+0.5,0.5-aP.y*0.5); gl_Position=uProj*uView*vec4(uC+uX*aP.x+uY*aP.y,1.0); }`;
const FS_B = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uT; uniform float uA, uU, uK0, uKd, uKs, uKr; uniform vec2 uKw; uniform int uLeave; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){ vec4 c=texture(uT,vUv); float a=uA;
 if(uLeave==1){ float rnd=h(floor(vUv*vec2(260.0,180.0))); float st=uKs*clamp(uKw.x*vUv.x+uKw.y*vUv.y+uKr*rnd,0.0,1.0); float k=(uU-uK0-st)/uKd; a*=1.0-smoothstep(0.0,0.14,k); }
 o=c*a; }`;
const VS_QUAD = `#version 300 es
in vec2 aP; out vec2 vUv; void main(){ vUv=aP*0.5+0.5; gl_Position=vec4(aP,0.,1.); }`;
const FS_COPY = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uT; uniform float uGain; out vec4 o;
void main(){ o=vec4(texture(uT,vUv).rgb*uGain,1.0); }`;
const FS_BRIGHT = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uT; uniform vec2 uPx; uniform float uThr; out vec4 o;
void main(){ vec3 c=(texture(uT,vUv+uPx*vec2(-.5,-.5)).rgb+texture(uT,vUv+uPx*vec2(.5,-.5)).rgb+texture(uT,vUv+uPx*vec2(-.5,.5)).rgb+texture(uT,vUv+uPx*vec2(.5,.5)).rgb)*0.25;
 float l=max(c.r,max(c.g,c.b)); o=vec4(c*max(l-uThr,0.)/max(l,1e-4),1.0); }`;
const FS_BLUR = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uT; uniform vec2 uDir; out vec4 o;
void main(){ vec3 c=texture(uT,vUv).rgb*0.2270270;
 c+=texture(uT,vUv+uDir*1.3846153).rgb*0.3162162; c+=texture(uT,vUv-uDir*1.3846153).rgb*0.3162162;
 c+=texture(uT,vUv+uDir*3.2307692).rgb*0.0702702; c+=texture(uT,vUv-uDir*3.2307692).rgb*0.0702702; o=vec4(c,1.0); }`;
const FS_COMP = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uScene, uB1, uB2, uB3, uSt, uCards; uniform vec2 uRes; uniform float uT, uExp, uGrain;
uniform vec3 uBg0, uBg1; out vec4 o;
void main(){ vec2 cc=vUv-0.5; float r=length(cc*vec2(uRes.x/uRes.y,1.)); vec2 off=cc*0.0018;
 vec3 sc=vec3(texture(uScene,vUv+off).r,texture(uScene,vUv).g,texture(uScene,vUv-off).b);
 vec3 bl=texture(uB1,vUv).rgb*0.4+texture(uB2,vUv).rgb*0.55+texture(uB3,vUv).rgb*0.75+texture(uSt,vUv).rgb*vec3(0.55,0.45,1.0)*0.35;
 vec3 L=(sc+bl)*uExp; L=(L*(2.51*L+0.03))/(L*(2.43*L+0.59)+0.14); L=pow(clamp(L,0.,1.),vec3(1.0/2.2));
 vec3 bg=mix(uBg0,uBg1,smoothstep(0.0,1.1,r));
 vec4 cd=texture(uCards,vUv);
 vec3 base=bg*(1.0-cd.a)+cd.rgb;
 vec3 c=1.0-(1.0-base)*(1.0-L);
 c*=mix(1.0,smoothstep(1.35,0.35,r),0.45);
 float n=fract(sin(dot(gl_FragCoord.xy+fract(uT*7.13)*vec2(91.3,47.1),vec2(12.9898,78.233)))*43758.5453);
 c+=(n-0.5)*uGrain; o=vec4(c,1.0); }`;


// ---------------------------------------------------------------- GL plumbing
let G = null;
function setupGL() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const gl = cv.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');
  gl.getExtension('EXT_color_buffer_float');
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const mk = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  const progs = { parts: mk(VS_P, FS_P), blob: mk(VS_BLOB, FS_BLOB), board: mk(VS_B, FS_B), copy: mk(VS_QUAD, FS_COPY), bright: mk(VS_QUAD, FS_BRIGHT), blur: mk(VS_QUAD, FS_BLUR), comp: mk(VS_QUAD, FS_COMP) };
  const ids = new Float32Array(N); for (let i = 0; i < N; i++) ids[i] = i;
  const vaoP = gl.createVertexArray(); gl.bindVertexArray(vaoP);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, ids, gl.STATIC_DRAW);
  const la = gl.getAttribLocation(progs.parts, 'aId'); gl.enableVertexAttribArray(la); gl.vertexAttribPointer(la, 1, gl.FLOAT, false, 0, 0);
  const mesh = (m) => {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, m.pos, gl.STATIC_DRAW);
    const l = gl.getAttribLocation(progs.blob, 'aP'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
    return { vao, n: m.n };
  };
  const meshHi = mesh(icosphere(5)), meshLo = mesh(icosphere(4));
  const vaoQ = gl.createVertexArray(); gl.bindVertexArray(vaoQ);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  for (const p of [progs.board, progs.copy, progs.bright, progs.blur, progs.comp]) { const l = gl.getAttribLocation(p, 'aP'); if (l >= 0) { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); } }
  const fbo = (w, h, fmt = 'f16', depth = false) => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    if (fmt === 'f16') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let rb = null;   // depth: true makes a buffer, or pass another target's buffer to share it
    if (depth) { rb = depth === true ? gl.createRenderbuffer() : depth; if (depth === true) { gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); } gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); }
    return { f, tex, w, h, rb };
  };
  const texOf = (mip) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    if (mip && aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    return t;
  };
  const glowCv = document.createElement('canvas'); glowCv.width = W; glowCv.height = H;
  const cache = new Map();
  const ul = {}; for (const [k, p] of Object.entries(progs)) ul[k] = (n) => { const key = `${k}:${n}`; if (!cache.has(key)) cache.set(key, gl.getUniformLocation(p, n)); return cache.get(key); };
  const scene = fbo(W, H, 'f16', true);
  G = {
    gl, cv, progs, ul, vaoP, vaoQ, meshHi, meshLo, texOf, scene, mesh: fbo(W, H, 'f16', scene.rb), cards: fbo(W, H, 'rgba8'),
    lv: [2, 4, 8].map((d) => [fbo(Math.ceil(W / d), Math.ceil(H / d)), fbo(Math.ceil(W / d), Math.ceil(H / d))]),
    streak: [fbo(Math.ceil(W / 4), Math.ceil(H / 8)), fbo(Math.ceil(W / 4), Math.ceil(H / 8))],
    glowTex: texOf(false), glowCv, glow: glowCv.getContext('2d'),
  };
  // static uniforms: the nebula's path through the film
  gl.useProgram(progs.parts);
  const L = ul.parts;
  gl.uniform1i(L('uData'), 0);
  const B = BOARDS, mid = (b) => b.C.map((v, i) => v + b.N[i] * 7);
  const path = nebulaPath(B, mid);   // 12 points through the film, defined with the story
  gl.uniform3fv(L('uPath'), path.flat());
}

function quad(prog, target, setup) {
  const { gl } = G;
  gl.useProgram(prog); gl.bindVertexArray(G.vaoQ);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null);
  gl.viewport(0, 0, target ? target.w : W, target ? target.h : H);
  setup();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function tex(unit, t) { const { gl } = G; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); }
function upload(t, canvas, mip, flip) {
  const { gl } = G;
  tex(0, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!flip); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  if (mip) gl.generateMipmap(gl.TEXTURE_2D);
}

// ---------------------------------------------------------------- particle data: every component sampled into points

// ---------------------------------------------------------------- particle data: every component sampled into points
function sampleLayers() {
  const { gl } = G;
  const data = new Float32Array(TW * RL * LAYERS.length * 4);
  LAYERS.forEach((name, li) => {
    const b = BOARDS[name], sc = b.sampleScale || 1, cw = Math.round(b.css[0] * sc), ch = Math.round(b.css[1] * sc);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.scale(sc, sc); b.sampling = true; b.draw.call(b, g, LSAMPLE[name], b); b.sampling = false;
    const px = g.getImageData(0, 0, cw, ch).data;
    const lum = new Float32Array(cw * ch);
    for (let i = 0; i < cw * ch; i++) lum[i] = (Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) / 255) * (px[i * 4 + 3] / 255);
    const cum = new Float64Array(cw * ch); let tot = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = y * cw + x, a = px[i * 4 + 3] / 255;
      let w = 0;
      if (a > 0) {
        const gx = x > 0 && x < cw - 1 ? Math.abs(lum[i + 1] - lum[i - 1]) : 0, gy = y > 0 && y < ch - 1 ? Math.abs(lum[i + cw] - lum[i - cw]) : 0;
        w = a * (0.05 + 1.5 * lum[i] ** 1.5) + 1.2 * (gx + gy);
      }
      tot += w; cum[i] = tot;
    }
    // elements: fixed rects, or (headlines) one per word
    const els = b.words ? b.words(g).map((wd) => [wd.x - 6, wd.y - (wd.asc || 110), wd.ww + 12, wd.hh || 140]) : b.els || [[0, 0, b.css[0], b.css[1]]];
    const rnd = M.mulberry32(101 + li * 7), off = li * TW * RL * 4, cnt = LCOUNT[name];
    for (let n = 0; n < cnt; n++) {
      const r = rnd() * tot; let lo = 0, hi = cw * ch - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
      const x = lo % cw, y = Math.floor(lo / cw), q = lo * 4;
      const R0 = px[q], G0 = px[q + 1], B0 = px[q + 2], mx = Math.max(R0, G0, B0, 1), l = mx / 255, t = ss(0.15, 0.55, l);
      const cr = Math.round(lerp(169, (R0 * 255) / mx, t)), cg = Math.round(lerp(139, (G0 * 255) / mx, t)), cb = Math.round(lerp(255, (B0 * 255) / mx, t));
      const bri = 0.25 + 0.74 * ss(0.08, 0.7, l);
      const xc = x / sc, yc = y / sc;
      let el = 0;
      for (let e = els.length - 1; e >= 0; e--) { const [ex, ey, ew, eh] = els[e]; if (xc >= ex && xc <= ex + ew && yc >= ey && yc <= ey + eh) { el = e; break; } }
      const o = off + n * 4;
      data[o] = (x + rnd()) / cw; data[o + 1] = (y + rnd()) / ch; data[o + 2] = cr * 65536 + cg * 256 + cb; data[o + 3] = Math.min(el, NEL - 1) + bri * 0.99;
    }
  });
  G.data = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, G.data);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TW, RL * LAYERS.length, 0, gl.RGBA, gl.FLOAT, data);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
}

function boardTex(b, u, final) {
  // a still board is always drawn at one fixed moment (the end of its last animation), so frames
  // rendered in different chunks can never disagree about it
  const ub = b.old ? unsh(u) : u;
  let key = 'final', ud = 1000;
  if (!final) {
    const live = b.anim.findIndex(([a, c]) => ub >= a && ub <= c);
    if (live >= 0) { key = `u${ub.toFixed(4)}`; ud = ub; }
    else { const n = b.anim.filter(([, c]) => ub > c).length; key = `h${n}`; ud = n > 0 ? b.anim[n - 1][1] : b.anim[0][0] - 0.01; }
  }
  if (!b.cv) { b.cv = document.createElement('canvas'); b.cv.width = Math.ceil(b.wpx * b.ts); b.cv.height = Math.ceil(b.hpx * b.ts); b.g = b.cv.getContext('2d'); b.tex = G.texOf(true); }
  if (b.texKey === key) return b.tex;
  const k = b.cv.width / b.css[0];
  b.g.setTransform(1, 0, 0, 1, 0, 0); b.g.clearRect(0, 0, b.cv.width, b.cv.height); b.g.setTransform(k, 0, 0, k, 0, 0);
  b.draw.call(b, b.g, ud, b);
  upload(b.tex, b.cv, true, false); b.texKey = key;
  return b.tex;
}
function stateUniforms(L, gl, sA, sB) {
  const st = [STATES[sA], STATES[sB]];
  const lay = st.map((s) => (s.lay ? LAYERS.indexOf(s.lay) : -1)), bd = st.map((s) => (s.lay ? BOARDS[s.board || s.lay] : null));
  gl.uniform1iv(L('uLay'), lay); gl.uniform1fv(L('uCnt'), st.map((s) => (s.lay ? LCOUNT[s.lay] : 0))); gl.uniform1iv(L('uRest'), st.map((s) => s.rest));
  gl.uniform3fv(L('uC'), bd.flatMap((b) => (b ? b.C : [0, 0, 0]))); gl.uniform3fv(L('uX'), bd.flatMap((b) => (b ? b.X : [1, 0, 0]))); gl.uniform3fv(L('uY'), bd.flatMap((b) => (b ? b.Y : [0, 1, 0])));
  const et = new Float32Array(2 * NEL).fill(-100), eg = new Float32Array(2 * NEL);
  st.forEach((s, k) => (s.el || []).slice(0, NEL).forEach(([t, gh], e) => { et[k * NEL + e] = t; eg[k * NEL + e] = gh; }));
  gl.uniform1fv(L('uElT'), et); gl.uniform1fv(L('uElG'), eg);
  gl.uniform1fv(L('uResK'), st.map((s) => (s.resK === undefined ? 1 : s.resK)));   // v3: how much of a resolved shape the particles keep
  const cen = (s, b, dflt) => (b ? b.C : s.cen || dflt);
  gl.uniform3fv(L('uCA'), cen(st[0], bd[0], [0, 0, 0])); gl.uniform3fv(L('uCB'), cen(st[1], bd[1], [0, 0, 1]));
}
// ---------------------------------------------------------------- accents that bloom (2D, uploaded into the HDR scene)
function flowDots(g, a, z, bend, u, t0, col, n = 26, speed = 0.9) {
  if (!a.ok || !z.ok) return false;
  const m = { x: (a.x + z.x) / 2 + bend[0], y: (a.y + z.y) / 2 + bend[1] };
  let any = false;
  for (let k = 0; k < n; k++) {
    const f = (u - t0) * speed - k * 0.035; if (f < 0 || f > 1) continue;
    const x = (1 - f) ** 2 * a.x + 2 * (1 - f) * f * m.x + f * f * z.x, y = (1 - f) ** 2 * a.y + 2 * (1 - f) * f * m.y + f * f * z.y;
    g.fillStyle = col((1 - k / n) * 0.9); g.beginPath(); g.arc(x, y, 2.6 - k * 0.06, 0, TAU); g.fill(); any = true;
  }
  return any;
}
function layoutWords(ctx, parts, size, maxW) {
  const toks = [];
  parts.forEach(([s, hi]) => s.split(/(\s+)/).forEach((w) => { if (w) toks.push({ w, hi: !!hi, sp: /^\s+$/.test(w) }); }));
  setFont(ctx, size, 600, DISPLAY, -size * 0.035);
  const lines = [[]]; let x = 0;
  toks.forEach((tk) => {
    const w = ctx.measureText(tk.w).width;
    if (!tk.sp && x + w > maxW && x > 0) { lines.push([]); x = 0; }
    if (tk.sp && x === 0) return;
    lines[lines.length - 1].push({ ...tk, x, wd: w }); x += w;
  });
  return lines;
}
// a caption rolls in word by word from under its line, and rolls out upward as the next arrives
function caption(ctx, u, [t0, t1, parts, lead, top], cfg = top ? CAP_TOP : CAP) {
  if (u < t0 - 0.05 || u > t1 + 1.4) return;
  const { x: X, top: Y, size, maxW } = cfg, lh = size * 1.12;
  const lines = layoutWords(ctx, parts, size, maxW);
  let wi = 0;
  lines.forEach((ln, li) => {
    const base = Y + li * lh + size * 0.9;
    ctx.save(); ctx.beginPath(); ctx.rect(X - 40, base - size * 1.02, maxW + 200, lh + size * 0.12); ctx.clip();
    ln.forEach((tk) => {
      if (tk.sp) return;
      const kin = E.outCubic(prog(u, t0 + wi * 0.06, t0 + wi * 0.06 + 0.8)), kout = E.inCubic(prog(u, t1 + wi * 0.03, t1 + wi * 0.03 + 0.62));
      wi++;
      if (kin <= 0 || kout >= 1) return;
      ctx.globalAlpha = kin * (1 - kout);
      tx(ctx, tk.w, X + tk.x, base + (1 - kin) * lh * 0.9 - kout * lh * 0.9, size, 600, DISPLAY, tk.hi ? T.accent : T.fg, 'left', -size * 0.035);
    });
    ctx.restore();
  });
  if (lead) {
    const kin = eo(u, t0 + 0.45, t0 + 1.2), kout = E.inCubic(prog(u, t1 + 0.05, t1 + 0.55));
    if (kin > 0 && kout < 1) {
      const ly = Y + lines.length * lh + 26 + cfg.lead;
      ctx.save(); ctx.globalAlpha = kin * (1 - kout);
      wrap(ctx, lead, maxW, cfg.lead, 500, UI).forEach((s, i) => tx(ctx, s, X, ly + i * cfg.lead * 1.5 + (1 - kin) * 14 - kout * 14, cfg.lead, 500, UI, T.muted));
      ctx.restore();
    }
  }
}

// ================================================================ Niticore for healthcare
// A reusable sales film for healthcare, pharma and medical-device makers (no customer named). The launch film's
// opening (niticore-flow, b0-19, word for word and frame for frame); the AI-agent avatar becomes healthcare AI: it
// buds five agents, then acts out the industry's problem (models no one validated, agents acting on their own,
// patient data at risk) and hears what regulators and hospitals now ask for; Niticore takes it all into one AI
// register, where three columns tick (risk assessed, people in the loop, evidence ready); the launch film's end
// card. Copy: niticore-website-v2 src/content/solutions.json (Healthcare) and the launch film; the tender asks
// come from the TIME Medical brief, unnamed. 96 bpm. Sentence case.
const FM = FORMAT.name;
const pick = (o) => (FM in o ? o[FM] : o['16x9']);
const CAP = { x: 110, top: 404, size: 62, maxW: 790, lead: 26 };
const CAP_TOP = { x: 110, top: 92, size: 58, maxW: 1700, lead: 26 };
const CAP_SUB = { x: 110, top: 168, size: 34, maxW: 1700, lead: 22 };   // a second, quieter line under a top caption
const green = (a) => `rgba(74,224,87,${a})`, lilac = (a) => `rgba(201,184,255,${a})`;
const mixv = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// ---------------------------------------------------------------- 1 · the launch film's opening (unchanged)
function headline(cfg) {
  return {
    css: cfg.css, s: 1, pose: { C: [0, 0, 0], yaw: 0 }, center: true, occ: false, sampleScale: 1, anim: cfg.anim,
    words(g) {   // per-word boxes in css px, for the reveal and for the particles' elements
      const out = [];
      cfg.lines.forEach((ws, li) => {
        const full = ws.join(' '), W0 = tw(g, full, cfg.size, 600, DISPLAY, -cfg.size * 0.035);
        let x = cfg.css[0] / 2 - W0 / 2;
        ws.forEach((w) => {
          const ww = tw(g, w, cfg.size, 600, DISPLAY, -cfg.size * 0.035);
          out.push({ w, x, y: cfg.y[li], ww });
          x += tw(g, `${w} `, cfg.size, 600, DISPLAY, -cfg.size * 0.035);
        });
      });
      return out;
    },
    draw(g, u) {
      this.words(g).forEach((wd, i) => {
        const t = cfg.t[i], k = eo(u, t, t + 0.75);
        if (k <= 0) return;
        g.save(); g.beginPath(); g.rect(wd.x - 20, wd.y - cfg.size * 1.02, wd.ww + 40, cfg.size * 1.32); g.clip();
        g.globalAlpha = k;
        tx(g, wd.w, wd.x, wd.y + (1 - k) * cfg.size * 0.6, cfg.size, 600, DISPLAY, wd.w.startsWith(cfg.key) ? T.accent : T.fg, 'left', -cfg.size * 0.035);
        g.restore();
      });
    },
  };
}
board('claimA', headline(P
  ? { css: [960, 400], lines: [['The', 'world', 'is'], ['accelerating'], ['with', 'AI.']], size: 104, y: [112, 226, 340], t: [1.85, 2.05, 2.4, 2.8, 3.35, 4.1], key: 'accelerating', anim: [[1.5, 5.2]] }
  : { css: [1720, 200], lines: [['The', 'world', 'is', 'accelerating', 'with', 'AI.']], size: 92, y: [130], t: [1.85, 2.05, 2.4, 2.8, 3.35, 4.1], key: 'accelerating', anim: [[1.5, 5.2]] }));
board('claimB', headline(P
  ? { css: [960, 400], lines: [['Now,', 'AI', 'needs'], ['governance', 'built'], ['for', "what's", 'next.']], size: 88, y: [104, 210, 316], t: [6.85, 7.68, 8.0, 8.64, 9.22, 9.85, 10.2, 10.65], key: 'governance', anim: [[6.4, 11.6]] }
  : { css: [1640, 270], lines: [['Now,', 'AI', 'needs', 'governance'], ['built', 'for', "what's", 'next.']], size: 88, y: [104, 214], t: [6.85, 7.68, 8.0, 8.64, 9.22, 9.85, 10.2, 10.65], key: 'governance', anim: [[6.4, 11.6]] }));
board('logoA', { css: [156, 38], s: 6.4, p: { s: 4.6 }, pose: { C: [0, 0, 0], yaw: 0 }, center: true, occ: false, sampleScale: 9, els: LOGO_ELS, anim: [[15.4, 19.4]], draw(g, u) { drawLogo(g, u, 15.9); } });

// ---------------------------------------------------------------- 2 · healthcare AI: a double helix of light
// A DNA double helix turns slowly: glossy bases on two strands of light, rungs of light between them (the
// particles' rest shape 9, built from the wordmark's light). Five glossy two-tone capsules, the healthcare AI
// systems (the site's healthcare use cases), bud from its bases and orbit it, each labelled. Then it acts out the
// problem: it turns amber and flickers ("models no one validated"); one capsule leaves its orbit and drifts off
// ("agents acting on their own"); it turns coral and starts to unravel ("patient data at risk"); the asks float in
// around it. It calms, coils back, takes the capsules home and pours into the AI register.
const CLONES = [['Clinical decision support', 'Stethoscope', 'Model'], ['Triage agent', 'Robot', 'Agent'], ['Diagnostic imaging', 'Scan', 'Model'],
  ['Drug discovery', 'Dna', 'Model'], ['Patient records', 'Database', 'Dataset']].map((kind) => ({ kind }));
const NCL = CLONES.length, RUN = 1, DATA = 4;   // the capsule that runs off (the agent), and the patient records
const AV = {
  form: [19.3, 21.9], nodes: 20.0, bud: 22.4, chip: 23.4,
  hush: [29.3, 30.3, 32.2, 32.9], amber: [32.5, 33.5], flick: [35.0, 35.7], tear: [35.75, 36.6],
  coral: [39.0, 40.0], unravel: [39.05, 40.4], recoil: [300, 301],   // V2: no calming; the risks hold until the helix pours into the bigger risk
  calm: [300, 301], home: [46.8, 47.6], peel: [47.2, 48.1], end: 48.4, out: 47.2,
};
const HX = { C: [0, 0.3, -24], H: 6.1, R: 1.22, turns: 1.7, tilt: -15 * DEG, N: 15 };
const BLOB_C = HX.C, BLOB_R = 1.55, ORBIT = P ? 3.0 : 3.75;
const BLOBF = { C: BLOB_C, pose: { C: BLOB_C, yaw: 0 }, wpx: P ? 700 : 900, hpx: 700 };
let VOENV = null, PHI = null;
const voiceAt = (t) => { if (!VOENV) return 0; const f = t * VOENV.rate, i = Math.floor(f); const a = VOENV.env[i] || 0, b = VOENV.env[i + 1] || 0; return lerp(a, b, f - i); };
// the helix's turn and the capsules' orbit share one clock: radians per beat, with a surge on "already"
const hushAt = (u) => ease(u, AV.hush[0], AV.hush[1]) * (1 - ease(u, AV.hush[2], AV.hush[3]));   // the bridge line: the helix slows and dims
const omega = (u) => (0.2 + 0.6 * ease(u, 25.0, 26.6) * (1 - ease(u, 27.6, 29.2))) * (1 - 0.65 * hushAt(u)) * (1 - 0.55 * ease(u, 32.4, 33.6));   // V2: slower while the risks ride on the tablets
function buildPhi() { PHI = new Float32Array(8001); for (let i = 1; i <= 8000; i++) PHI[i] = PHI[i - 1] + omega((i - 0.5) / 100) / 100; }
const phiAt = (u) => { const f = clamp(u * 100, 0, 8000), i = Math.floor(f); return lerp(PHI[i], PHI[Math.min(8000, i + 1)], f - i); };
// a point on strand s (0 or 1) at height t (0 bottom, 1 top): the same formula as hxPt() in the shader
function hxPt(s, t, u) {
  const a = t * HX.turns * TAU + phiAt(u) + s * Math.PI;
  const x = HX.R * Math.cos(a), y = (t - 0.5) * HX.H, z = HX.R * Math.sin(a), c = Math.cos(HX.tilt), sn = Math.sin(HX.tilt);
  return [HX.C[0] + c * x - sn * y, HX.C[1] + sn * x + c * y, HX.C[2] + z];
}
const VIOLET = [0.36, 0.22, 0.92], LAVL = [0.55, 0.45, 0.98], AMBER = [0.86, 0.34, 0.03], CORAL = [0.95, 0.09, 0.15], PILL = [0.86, 0.84, 0.97];
function moodAt(u) {
  const amber = ease(u, ...AV.amber), coral = ease(u, ...AV.coral), calm = ease(u, ...AV.calm);
  return {
    col: mixv(mixv(mixv(VIOLET, AMBER, amber), CORAL, coral), VIOLET, calm),
    k: Math.max(amber, coral) * (1 - calm),
    flick: amber * (1 - ease(u, ...AV.flick)),
    unravel: ease(u, ...AV.unravel) * (1 - 0.55 * ease(u, ...AV.recoil)) * (1 - ease(u, AV.calm[0] - 0.2, AV.calm[1])),
  };
}
function orbitPos(i, u) {
  const a = (i * TAU) / NCL + phiAt(u) * 0.8;
  const lx = Math.cos(a) * ORBIT, ly = 0.3 * Math.sin(2 * a + i) + (i - 2) * 0.9, lz = Math.sin(a) * ORBIT * 0.85;   // V2: wider apart, so the labels never stack
  return [BLOB_C[0] + lx, BLOB_C[1] + ly, BLOB_C[2] + lz];
}
const BUD_AT = [[0, 3], [1, 5], [0, 8], [1, 10], [0, 12]];   // each capsule buds from a base: [strand, index]
const nodeT = (i) => (i + 0.5) / HX.N;
const TEAR = vnorm([0.82, 0.32, 0.46]);   // the way the runaway capsule goes
function capsulePos(i, u) {
  const [s, n] = BUD_AT[i], from = hxPt(s, nodeT(n), u);
  const e = clamp(E.outBack(prog(u, AV.bud + i * 0.25, AV.bud + 1.1 + i * 0.25)));
  let p = vadd(from, vsc(vsub(orbitPos(i, u), from), e));
  if (i === RUN) {   // it leaves the orbit and drifts away, then is taken back as everything calms
    const out = E.inOutCubic(prog(u, AV.tear[0], AV.tear[1] + 1.6)) * (1 - ease(u, AV.calm[0] - 0.4, AV.calm[0] + 0.4));
    const wob = [noise1(u * 0.8, 61) * 0.3, noise1(u * 0.9, 62) * 0.25, noise1(u * 0.7, 63) * 0.2].map((v) => v * out);
    p = vadd(p, vadd(vsc(TEAR, 3.0 * out), wob));
  }
  const home = ease(u, ...AV.home, E.inCubic);
  return vadd(vsc(p, 1 - home), vsc(from, home));
}
// a capsule's orientation: a slow tumble (rows of a 3x3 rotation, column-major for GL)
function tumble(i, u) {
  const yw = u * 0.45 + i * 1.3, pt = 0.9 + 0.35 * Math.sin(u * 0.37 + i * 2.1);
  const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt);
  return [cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp];
}
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function blobScene(u, eye) {
  if (u < AV.nodes || u > AV.end) return null;
  const md = moodAt(u), voice = voiceAt(M.TS(u)), blobs = [];
  // the bases: glossy beads on both strands, appearing bottom to top, shaken loose as it unravels
  for (let s = 0; s < 2; s++) for (let n = 0; n < HX.N; n++) {
    const t = nodeT(n), k = ease(u, AV.nodes + t * 1.5, AV.nodes + t * 1.5 + 0.7), ko = 1 - ease(u, AV.peel[0] + t * 0.4, AV.peel[0] + t * 0.4 + 0.5);
    if (k * ko <= 0.01) continue;
    const j = s * HX.N + n, un = md.unravel * 0.6;
    const C = vadd(hxPt(s, t, u), [noise1(u * 0.7 + j * 1.3, 70 + j) * un, noise1(u * 0.7 + j * 1.7, 90 + j) * un, noise1(u * 0.7 + j * 2.1, 110 + j) * un]);
    blobs.push({ C, R: 0.175 * (1 + 0.1 * voice) * clamp(E.outBack(k)) * ko, seed: 2 + j * 0.37, voice: 0, amp: 0.5, spike: 0.25 * md.unravel,
      tint: mixv(s ? LAVL : VIOLET, md.col, md.k), flick: md.flick, glow: (0.1 + 0.12 * md.k) * (1 - 0.6 * hushAt(u)), rev: k * ko, eyes: 0, node: true });
  }
  // the capsules: the healthcare AI systems, budding from the bases and orbiting
  CLONES.forEach((_, i) => {
    const e = prog(u, AV.bud + i * 0.25, AV.bud + 1.1 + i * 0.25); if (e <= 0) return;
    const sc = clamp(E.outBack(e)) * (1 - ease(u, ...AV.home, E.inCubic)); if (sc <= 0.01) return;
    const data = i === DATA ? ease(u, ...AV.coral) * (1 - ease(u, ...AV.calm)) : 0;
    const run = i === RUN ? ease(u, AV.tear[0], AV.tear[1]) * (1 - ease(u, ...AV.calm)) : 0;
    blobs.push({ C: capsulePos(i, u), R: 0.2 * sc, capL: 1.15, rot: tumble(i, u), seed: 3.1 + i * 1.7, voice: 0, amp: 0.15, spike: 0,
      tint: mixv(mixv(VIOLET, AMBER, run), CORAL, data), tint2: PILL, two: 1, flick: data * 0.8, glow: 0.12 + 0.2 * Math.max(run, data), rev: 1, eyes: 0, i });
  });
  return { blobs };
}
// the helix's particle uniforms (shader rest 9), at any moment
function hxUniforms(L, gl, u) {
  const md = moodAt(u), lin = (c) => c.map((v) => Math.pow(v, 1 / 2.2));
  gl.uniform3fv(L('uHxC'), HX.C); gl.uniform1f(L('uHxH'), HX.H); gl.uniform1f(L('uHxR'), HX.R); gl.uniform1f(L('uHxTurns'), HX.turns);
  gl.uniform1f(L('uHxSpin'), phiAt(u)); gl.uniform1f(L('uHxTilt'), HX.tilt); gl.uniform1f(L('uHxN'), HX.N);
  gl.uniform1f(L('uHxK'), (1 + 0.25 * voiceAt(M.TS(u))) * (1 - 0.4 * hushAt(u))); gl.uniform1f(L('uHxRev'), ease(u, ...AV.form)); gl.uniform1f(L('uHxUnr'), md.unravel);
  gl.uniform3fv(L('uHxTint'), lin(md.col)); gl.uniform1f(L('uHxTintK'), md.k * 0.85 * (1 - 0.35 * md.flick * (0.5 + 0.5 * Math.sin(u * 13))));
}
function icosphere(level) {
  const t = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(vnorm);
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let l = 0; l < level; l++) {
    const cache = new Map(), nf = [];
    const mid = (a, b) => { const k = a < b ? `${a}_${b}` : `${b}_${a}`; if (cache.has(k)) return cache.get(k); v.push(vnorm(vadd(v[a], v[b]).map((x) => x / 2))); cache.set(k, v.length - 1); return v.length - 1; };
    f.forEach(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
    f = nf;
  }
  return { pos: new Float32Array(v.flat()), idx: new Uint32Array(f.flat()), n: f.length * 3 };
}


// ---------------------------------------------------------------- V2 · shared pieces (from the TIME Medical film)
// the rupee sign: neither Sora nor Manrope has it, so it is drawn to match the type (cap height, stroke weight)
function rupee(g, x, base, size, color) {
  const s = size, t = s * 0.086, w = s * 0.56, cap = s * 0.72, bowlR = cap * 0.27, bx = s * 0.17;
  g.save(); g.strokeStyle = color; g.lineWidth = t; g.lineCap = 'butt'; g.lineJoin = 'round';
  const y1 = base - cap + t / 2, y2 = base - cap + bowlR * 2 - t * 0.1;
  g.beginPath(); g.moveTo(x, y1); g.lineTo(x + w, y1); g.stroke();
  g.beginPath(); g.moveTo(x, y1 + (y2 - y1) * 0.52); g.lineTo(x + w, y1 + (y2 - y1) * 0.52); g.stroke();
  g.beginPath(); g.moveTo(x + t * 0.2, y1); g.lineTo(x + bx, y1); g.arc(x + bx, (y1 + y2) / 2, (y2 - y1) / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(x + t * 0.2, y2); g.stroke();
  g.lineCap = 'square'; g.beginPath(); g.moveTo(x + s * 0.08, y2 + t * 0.2); g.lineTo(x + w * 0.86, base - t * 0.5); g.stroke();
  g.restore();
  return w + s * 0.07;
}
function txr(g, s, x, y, size, weight, family, color, ls = 0) {   // text that may hold ₹; returns the width
  let xx = x;
  s.split('₹').forEach((part, i) => {
    if (i > 0) xx += rupee(g, xx, y, size, color);
    if (part) { tx(g, part, xx, y, size, weight, family, color, 'left', ls); xx += tw(g, part, size, weight, family, ls); }
  });
  return xx - x;
}
function flag(g, img, x, y, h, r = 5) {
  if (!img) return 0;
  const w = h * 1.5;
  g.save(); rr(g, x, y, w, h, r); g.clip(); g.drawImage(img, x, y, w, h); g.restore();
  g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.18)'; rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r); g.stroke();
  return w;
}
const LEVEL = { info: T.subtle, ok: T.accent, allow: T.accent, warn: T.warn, block: T.risk, escal: T.warn };
// the TickList row at film size, and the tender list built from it
const HOSP = ['AIIMS', 'State health departments', 'Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare', 'Manipal Hospitals'];
const ASKS = ['Model documentation', 'Bias testing', 'Post-market surveillance plans', 'Data-protection assessments'];
function askRow(g, x, y, w, h, label, k, pulse = 0) {
  panel(g, x, y, w, h, { border: pulse > 0.02 ? `rgba(201,184,255,${0.2 + 0.5 * pulse})` : T.line, r: 16 });
  const cx = x + 22 + 20, cy = y + h / 2, s = k > 0 ? 0.6 + 0.4 * E.outBack(clamp(k), 2.4) : 1;
  g.save(); g.translate(cx, cy); g.scale(s, s); g.beginPath(); g.arc(0, 0, 20, 0, TAU);
  if (k > 0) { g.fillStyle = T.accent; g.fill(); }
  g.lineWidth = 2; g.strokeStyle = k > 0 ? T.accent : T.lineStrong; g.stroke();
  if (k > 0) { g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = T.ink; g.beginPath(); g.moveTo(-7, 0.5); g.lineTo(-2.4, 5.2); g.lineTo(7.5, -4.6); g.stroke(); }
  g.restore();
  tx(g, label, x + 22 + 40 + 22, cy + 9, 26, 600, UI, T.fg);
}
function askList(g, u, x, y, w, t0, tickT, still, pulseT = null) {
  panel(g, x, y, w, 520, { r: 24 });
  tx(g, 'What a tender can ask for', x + 36, y + 64, 30, 600, DISPLAY, T.fg, 'left', -0.8);
  ASKS.forEach((a, i) => {
    const k = still ? 1 : eo(u, t0 + i * 0.35, t0 + i * 0.35 + 0.7); if (k <= 0) return;
    const ry = y + 104 + i * 100;
    g.save(); g.globalAlpha *= k; g.translate((1 - k) * 24, 0);
    const tk = tickT == null ? 0 : clamp((u - (tickT + i * 0.35)) / 0.35);
    const pulse = pulseT == null ? 0 : Math.exp(-(((u - (pulseT + i * 0.45)) / 0.45) ** 2));
    askRow(g, x + 28, ry, w - 56, 84, a, tk, pulse);
    g.restore();
  });
}

// ---------------------------------------------------------------- V2 · the timeline after the helix (beats, 96 bpm)
const TB = {
  buyIn: 47.8, hosp: 49.6, ask: 52.6, askPulse: 56.2,
  regIn: 61.2, rows: 62.4,
  riskIn: 67.8, radar: 68.4, tier: 69.4, others: 69.7, fria: 70.6,
  loopIn: 72.0, cmd: 72.2, run: [72.9, 73.2, 73.5, 73.8, 74.1], card: 74.3, press: 75.1, done: 75.3, logged: 75.8,
  evidIn: 77.2, files: 77.6, seal: 79.9, mapped: 80.3, ticks: 80.6,
  trioIn: 83.2,
};

// ---------------------------------------------------------------- 4 · the bigger risk: losing business (the TIME Medical film's screen)
const BUY = { css: [1700, 600], lw: 820, rx: 900 };
board('buyers', {
  css: BUY.css, s: 1.0, pose: { C: [4.5, -0.9, -52], yaw: -9 }, frame: { ox: 0, oy: 114 },
  els: [[0, 0, BUY.lw, 600], [BUY.rx, 0, BUY.css[0] - BUY.rx, 520]], anim: [[TB.buyIn, 60.6]],
  draw(g, u) {
    const hk = eo(u, TB.hosp - 0.4, TB.hosp + 0.3);
    if (hk > 0) { g.save(); g.globalAlpha *= hk; icon(g, 'Hospital', 0, 18, 30, T.tertiary, 'bold'); tx(g, 'Hospital and health-system buyers', 44, 42, 24, 600, UI, T.muted); g.restore(); }
    HOSP.forEach((h, i) => {
      const t = TB.hosp + i * 0.42, k = springB(u, t, { stiffness: 260, damping: 17 }); if (k <= 0) return;
      const col = i % 2, row = Math.floor(i / 2), x = col * 410, y = 80 + row * 108, w = 396, hh = 88;
      g.save(); g.globalAlpha *= clamp(k); g.translate(x + w / 2, y + hh / 2); g.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); g.translate(-(x + w / 2), -(y + hh / 2));
      const lit = Math.exp(-(((u - t - 0.15) / 0.5) ** 2));
      rr(g, x, y, w, hh, hh / 2); g.fillStyle = mixc(T.raised, '#2a1f6e', lit); g.fill();
      g.lineWidth = 1; g.strokeStyle = lit > 0.3 ? 'rgba(201,184,255,0.6)' : T.lineStrong; rr(g, x + 0.5, y + 0.5, w - 1, hh - 1, hh / 2); g.stroke();
      tile(g, x + 14, y + 14, 60, 'Hospital', { r: 30 });
      const size = tw(g, h, 26, 600, UI) > w - 120 ? 22 : 26;
      tx(g, h, x + 90, y + hh / 2 + size * 0.36, size, 600, UI, T.fg);
      g.restore();
    });
    const ak = eo(u, TB.ask - 0.3, TB.ask + 0.5);
    if (ak > 0) { g.save(); g.globalAlpha *= ak; g.translate((1 - ak) * 40, 0); askList(g, u, BUY.rx, 0, BUY.css[0] - BUY.rx, TB.ask, null, false, TB.askPulse); g.restore(); }
  },
});

// ---------------------------------------------------------------- 5 · Niticore: every model and agent, in one place (the AI register)
const REG = { css: [1500, 560], rowY: 150, rowH: 76 };
board('register', {
  css: REG.css, s: 1.0, pose: { C: [-3.5, -0.5, -76], yaw: 8 }, frame: { ox: 0, oy: 84 },
  els: [[0, 0, REG.css[0], 130], ...CLONES.map((_, i) => [0, REG.rowY + i * REG.rowH - 4, REG.css[0], REG.rowH])], anim: [[TB.regIn, 67.2]],
  draw(g, u) {
    const [w, h] = REG.css, k = eo(u, TB.regIn + 0.1, TB.regIn + 0.9);
    if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    bezel(g, 0, 0, w, h); panel(g, 8, 8, w - 16, h - 16);
    g.save(); g.translate(40, 34); g.scale(1.25, 1.25); drawLogo(g, u, TB.regIn + 0.3); g.restore();
    tx(g, 'AI register', 40 + 156 * 1.25 + 24, 76, 24, 600, UI, T.muted);
    tx(g, 'AI system', 40, 134, 22, 600, UI, T.subtle); tx(g, 'Status', w - 40, 134, 22, 600, UI, T.subtle, 'right');
    g.restore();
    CLONES.forEach(({ kind: [name, ic, type] }, i) => {
      const t = TB.rows + i * 0.28, rk = eo(u, t, t + 0.6); if (rk <= 0) return;
      const y = REG.rowY + i * REG.rowH;
      g.save(); g.globalAlpha *= rk; g.translate((1 - rk) * -24, 0);
      field(g, 28, y, w - 56, REG.rowH - 10);
      tile(g, 40, y + 10, 46, ic, { r: 23 });
      tx(g, name, 104, y + 42, 27, 600, UI, T.fg);
      pill(g, 104 + tw(g, name, 27, 600, UI) + 16, y + 17, type, { h: 32, size: 17, color: T.muted });
      const ck = clamp((u - t - 0.5) / 0.35);
      if (ck > 0) { checkMark(g, w - 190, y + (REG.rowH - 10) / 2, 14, ck); tx(g, 'Registered', w - 168, y + 41, 20, 600, UI, T.fg); }
      g.restore();
    });
  },
});

// ---------------------------------------------------------------- 6 · screen 1: risk assessed (the platform's risk card)
const AXES = ['Bias', 'Safety', 'Privacy', 'Hallucination', 'Robustness', 'Drift'], AXV = [78, 52, 66, 84, 58, 62];   // the launch film's risk card (the site's)
const RSK = { css: [1500, 640], lw: 860 };
board('riskS', {
  css: RSK.css, s: 1.0, pose: { C: [3.5, -0.4, -98], yaw: -8 }, frame: { ox: 0, oy: 84 },
  els: [[0, 0, RSK.lw, 130], [140, 150, 600, 380], [0, 540, RSK.lw, 100], [RSK.lw + 40, 0, RSK.css[0] - RSK.lw - 40, 640]], anim: [[TB.riskIn, 71.4]],
  draw(g, u) {
    const lw = RSK.lw, h = RSK.css[1], k = eo(u, TB.riskIn + 0.1, TB.riskIn + 0.9);
    if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    panel(g, 0, 0, lw, h, { r: 24 });
    tile(g, 32, 32, 64, 'Stethoscope');
    tx(g, 'Clinical decision support', 116, 64, 30, 600, DISPLAY, T.fg, 'left', -0.6);
    tx(g, 'Classified under EU AI Act Annex III', 116, 96, 20, 500, UI, T.subtle);
    const hk = springB(u, TB.tier, { stiffness: 300, damping: 16 });
    if (hk > 0) { g.save(); g.globalAlpha *= clamp(hk); g.translate(lw - 32, 50); g.scale(1.45 * hk, 1.45 * hk); pill(g, 0, -14, 'High risk', { align: 'right', color: T.risk, ico: 'Warning' }); g.restore(); }
    g.save(); g.translate(430, 318); g.scale(1.55, 1.55);
    radar(g, 0, 0, 108, AXES, AXV, E.outCubic(prog(u, TB.radar, TB.radar + 1.4)), eo(u, TB.radar - 0.4, TB.radar + 0.2));
    g.restore();
    const fk = eo(u, TB.fria - 0.3, TB.fria + 0.2);
    if (fk > 0) {
      g.save(); g.globalAlpha *= fk;
      tx(g, 'Built-in workflow', 32, h - 44, 20, 500, UI, T.subtle);
      g.save(); g.translate(lw - 32, h - 76); g.scale(1.3, 1.3); checkPill(g, 0, 0, 'Fundamental rights impact assessment', ease(u, TB.fria + 0.3, TB.fria + 0.6), { align: 'right' }); g.restore();
      g.restore();
    }
    g.restore();
    // every system, assessed
    const rx = lw + 40, rw = RSK.css[0] - rx, ok = eo(u, TB.others - 0.6, TB.others);
    if (ok > 0) {
      g.save(); g.globalAlpha *= ok; g.translate((1 - ok) * 30, 0);
      panel(g, rx, 0, rw, h, { r: 24 });
      tx(g, 'Every system, assessed', rx + 32, 64, 28, 600, DISPLAY, T.fg, 'left', -0.6);
      CLONES.forEach(({ kind: [name, ic] }, i) => {
        const y = 110 + i * 100, ck = clamp((u - (TB.others + i * 0.22)) / 0.35);
        field(g, rx + 24, y, rw - 48, 84);
        tile(g, rx + 38, y + 18, 48, ic, { r: 24 });
        tx(g, name, rx + 102, y + 50, 22, 600, UI, T.fg);
        if (ck > 0) checkMark(g, rx + rw - 62, y + 42, 18, ck);
        else { g.lineWidth = 1.5; g.strokeStyle = T.lineStrong; g.beginPath(); g.arc(rx + rw - 62, y + 42, 17, 0, TAU); g.stroke(); }
      });
      g.restore();
    }
  },
});

// ---------------------------------------------------------------- 7 · screen 2: people in the loop (the agent run and its human gate)
const RUNLOG = [[TB.run[0], 'info', 'agent run started · triage agent'], [TB.run[1], 'ok', 'agent identity verified · owner and role on record'],
  [TB.run[2], 'allow', 'tool call · allowed API endpoint'], [TB.run[3], 'warn', 'action exceeds pre-approved authority cap'],
  [TB.run[4], 'escal', 'human confirmation gate · approval required'], [TB.logged, 'ok', 'execution logged for runtime audit']];
const LOOP = { css: [1500, 620], term: [0, 0, 700, 476], ts: 1.3, card: [960, 110, 540, 400] };
board('loopS', {
  css: LOOP.css, s: 1.0, pose: { C: [-3.5, -0.6, -120], yaw: 8 }, frame: { ox: 0, oy: 84 },
  els: [[0, 0, 910, 620], [LOOP.card[0], LOOP.card[1], LOOP.card[2], LOOP.card[3]]], anim: [[TB.loopIn, 76.6]],
  draw(g, u) {
    const k = eo(u, TB.loopIn + 0.1, TB.loopIn + 0.8);
    if (k > 0) {
      g.save(); g.globalAlpha *= k; g.scale(LOOP.ts, LOOP.ts);
      const [x0, y0, w0, h0] = LOOP.term;
      terminal(g, x0, y0, w0, h0, u, { title: 'agents — niticore watch — zsh', cwd: '~/agents', command: 'niticore watch agent', t0: TB.cmd, lines: RUNLOG, size: 15 });
      g.restore();
    }
    const [x2, y2, w2, h2] = LOOP.card, ka = eo(u, TB.card, TB.card + 0.6);
    if (ka <= 0) return;
    g.save(); rise(g, ka, 22); panel(g, x2, y2, w2, h2, { r: 24 });
    const done = ease(u, TB.done, TB.done + 0.4);
    tile(g, x2 + 32, y2 + 32, 64, 'UserCheck');
    if (done < 1) {
      g.save(); g.globalAlpha *= 1 - done;
      tx(g, 'Approval required', x2 + 116, y2 + 76, 30, 600, DISPLAY, T.fg, 'left', -0.6);
      wrap(g, 'Action exceeds pre-approved authority cap', w2 - 64, 24, 500, UI).forEach((ln, i) => tx(g, ln, x2 + 32, y2 + 156 + i * 34, 24, 500, UI, T.muted));
      const press = Math.max(0, 1 - Math.abs(u - TB.press) / 0.18), by = y2 + h2 - 32 - 64;
      g.save(); g.translate(x2 + 32, by); g.scale(1.55, 1.55);
      const dw = button(g, 0, 0, 'Decline', 'secondary');
      button(g, dw + 10, 0, 'Approve', 'primary', { press });
      g.restore(); g.restore();
    }
    if (done > 0) {
      g.save(); g.globalAlpha *= done;
      tx(g, 'Approved', x2 + 116, y2 + 76, 30, 600, DISPLAY, T.fg, 'left', -0.6);
      checkMark(g, x2 + w2 - 64, y2 + 64, 26, done);
      wrap(g, 'Signed off by a human reviewer and logged for audit', w2 - 64, 24, 500, UI).forEach((ln, i) => tx(g, ln, x2 + 32, y2 + 156 + i * 34, 24, 500, UI, T.muted));
      g.restore();
    }
    g.restore();
  },
});

// ---------------------------------------------------------------- 8 · screen 3: evidence ready (the vault), and the tender list fills in
const FILES = ['FRIA', 'DPIA', 'Model documentation', 'Bias test results', 'Post-market surveillance plan'];
const EVD = { css: [1500, 640], lw: 840, rx: 880 };
board('evidS', {
  css: EVD.css, s: 1.0, pose: { C: [3.5, -0.5, -142], yaw: -8 }, frame: { ox: 0, oy: 84 },
  els: [[0, 0, EVD.lw, 140], ...FILES.map((_, i) => [0, 150 + i * 80, EVD.lw, 76]), [EVD.rx, 0, EVD.css[0] - EVD.rx, 560]], anim: [[TB.evidIn, 82.6]],
  draw(g, u) {
    const lw = EVD.lw, h = EVD.css[1], k = eo(u, TB.evidIn + 0.1, TB.evidIn + 0.9);
    if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    panel(g, 0, 0, lw, h, { grad: T.green, border: 'rgba(255,255,255,0.1)', r: 24 });
    const sk = springB(u, TB.seal, { stiffness: 320, damping: 15 });
    g.save(); const s = 0.82 + 0.18 * sk; g.translate(66, 66); g.scale(s, s); g.rotate((1 - sk) * -0.3); g.translate(-66, -66);
    tile(g, 32, 32, 68, 'SealCheck', { fill: 'rgba(255,255,255,0.15)', ring: 'rgba(255,255,255,0.2)', color: T.fg, weight: sk > 0.05 ? 'fill' : 'regular', r: 18 }); g.restore();
    tx(g, 'Audit-ready', 122, 66, 34, 600, DISPLAY, T.fg, 'left', -0.8);
    tx(g, 'Every action generates timestamped, immutable evidence.', 122, 100, 20, 500, UI, fgA(0.86));
    FILES.forEach((f, i) => {
      const t = TB.files + i * 0.4, ka = eo(u, t, t + 0.55); if (ka <= 0) return;
      const y = 150 + i * 80;
      g.save(); g.globalAlpha *= ka; g.translate((1 - ka) * 46, 0);
      field(g, 32, y, lw - 64, 66, { fill: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.1)' });
      icon(g, 'FileText', 52, y + 19, 28, fgA(0.9));
      tx(g, f, 96, y + 42, 24, 600, UI, T.fg);
      g.globalAlpha *= eo(u, t + 0.35, t + 0.7); tx(g, 'Filed', lw - 56, y + 42, 20, 600, UI, fgA(0.85), 'right');
      g.restore();
    });
    const mk = eo(u, TB.mapped, TB.mapped + 0.6);
    if (mk > 0) {
      g.save(); g.globalAlpha *= mk;
      const fy = h - 34;
      tx(g, 'Mapped to', 32, fy, 20, 600, UI, fgA(0.8));
      let x = 32 + tw(g, 'Mapped to', 20, 600, UI) + 18;
      [['eu', 'EU AI Act'], ['iso', 'ISO/IEC 42001']].forEach(([im, label]) => {
        const img = IMGS[im];
        if (img) { const ih = 34, iw = (img.width / img.height) * ih; g.drawImage(img, x, fy - 26, iw, ih); x += iw + 10; }
        tx(g, label, x, fy, 22, 600, UI, T.fg); x += tw(g, label, 22, 600, UI) + 30;
      });
      g.restore();
    }
    g.restore();
    const ak = eo(u, TB.ticks - 0.9, TB.ticks - 0.2);
    if (ak > 0) { g.save(); g.globalAlpha *= ak; g.translate((1 - ak) * 30, 0); askList(g, u, EVD.rx, 60, EVD.css[0] - EVD.rx, 0, TB.ticks, true); g.restore(); }
  },
});

// ---------------------------------------------------------------- 9 · the finale: every model and agent, in one place (V1's register card)
// the AI register again, now with its three columns; each fills down the rows, one column after another; centred
const GOV = { css: [1640, 640], cols: [1010, 1240, 1470], rowY: 186, rowH: 74 };
const COLS = ['Risk assessed', 'People in the loop', 'Evidence ready'];
const FTICK = [84.0, 84.7, 85.4];
board('finale', {
  css: GOV.css, s: 1.0, pose: { C: [0, -0.6, -166], yaw: 0 }, frame: { ox: 0, oy: 34 },
  els: [[0, 0, GOV.css[0], 130], ...CLONES.map((_, i) => [0, GOV.rowY + i * GOV.rowH - 4, GOV.css[0], GOV.rowH]), [0, GOV.css[1] - 80, GOV.css[0], 80]], anim: [[TB.trioIn, 87.4]],
  draw(g, u) {
    const [w, h] = GOV.css, k = eo(u, TB.trioIn + 0.1, TB.trioIn + 0.9);
    if (k <= 0) return;
    g.save(); g.globalAlpha *= k;
    bezel(g, 0, 0, w, h); panel(g, 8, 8, w - 16, h - 16);
    g.save(); g.translate(40, 34); g.scale(1.25, 1.25); drawLogo(g, u, TB.trioIn + 0.3); g.restore();
    tx(g, 'AI register', 40 + 156 * 1.25 + 24, 76, 24, 600, UI, T.muted);
    COLS.forEach((c, j) => { const ck = eo(u, FTICK[j] - 0.5, FTICK[j]); g.save(); g.globalAlpha *= 0.55 + 0.45 * ck; tx(g, c, GOV.cols[j], 150, 22, 600, UI, ck > 0.5 ? T.fg : T.subtle, 'center'); g.restore(); });
    tx(g, 'AI system', 40, 150, 22, 600, UI, T.subtle);
    g.restore();
    CLONES.forEach(({ kind: [name, ic, type] }, i) => {
      const t = TB.trioIn + 0.3 + i * 0.12, rk = eo(u, t, t + 0.5); if (rk <= 0) return;
      const y = GOV.rowY + i * GOV.rowH;
      g.save(); g.globalAlpha *= rk; g.translate((1 - rk) * -24, 0);
      field(g, 28, y, w - 56, GOV.rowH - 10);
      tile(g, 40, y + 9, 46, ic, { r: 23 });
      tx(g, name, 104, y + 42, 27, 600, UI, T.fg);
      pill(g, 104 + tw(g, name, 27, 600, UI) + 16, y + 17, type, { h: 32, size: 17, color: T.muted });
      COLS.forEach((_, j) => {
        const tk = clamp((u - (FTICK[j] + i * 0.1)) / 0.3), cx = GOV.cols[j], cy = y + (GOV.rowH - 10) / 2;
        if (tk <= 0) { g.lineWidth = 1.5; g.strokeStyle = T.lineStrong; g.beginPath(); g.arc(cx, cy, 15, 0, TAU); g.stroke(); }
        else checkMark(g, cx, cy, 16, tk);
      });
      g.restore();
    });
    const fk = eo(u, FTICK[2] + 0.7, FTICK[2] + 1.3);
    if (fk > 0) {
      g.save(); g.globalAlpha *= fk; g.translate(0, (1 - fk) * 10);
      const fy = h - 50;
      tx(g, 'Mapped to', 40, fy + 8, 22, 600, UI, T.subtle);
      let x = 40 + tw(g, 'Mapped to', 22, 600, UI) + 18;
      [['eu', 'EU AI Act'], ['iso', 'ISO/IEC 42001']].forEach(([im, label]) => {
        const img = IMGS[im];
        if (img) { const ih = 34, iw = (img.width / img.height) * ih; g.drawImage(img, x, fy - 22, iw, ih); x += iw + 10; }
        tx(g, label, x, fy + 8, 24, 600, UI, T.fg); x += tw(g, label, 24, 600, UI) + 30;
      });
      g.restore();
    }
  },
});

// ---------------------------------------------------------------- the particle story: states and transitions
// rest shapes: 0 nebula · 1 spark · 2 ribbons · 9 the double helix
const LAYERS = ['claimA', 'claimB', 'logoA', 'buyers', 'register', 'riskS', 'loopS', 'evidS', 'finale', 'logoEnd'];
const LCOUNT = { claimA: 36000, claimB: 42000, logoA: 70000, buyers: 60000, register: 56000, riskS: 60000, loopS: 58000, evidS: 62000, finale: 70000, logoEnd: 74000 };
const LSAMPLE = { claimA: 5, claimB: 11.5, logoA: 18, buyers: 60, register: 66, riskS: 1000, loopS: 1000, evidS: 1000, finale: 1000, logoEnd: 1000 };
const wordEls = (ts, off, gh) => ts.map((t) => [t + off, gh]);
const STATES = [
  { rest: 1 },
  { rest: 2 },
  { lay: 'claimA', rest: 2, el: [5.55, 5.6, 5.65, 5.7, 5.75, 5.8].map((t) => [t, 0.24]) },
  { lay: 'claimB', rest: 2, el: wordEls([6.85, 7.68, 8.0, 8.64, 9.22, 9.85, 10.2, 10.65], 0.12, 0.05) },
  { lay: 'logoA', rest: 2, el: [...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [15.92 + i * 0.07, 0.25]), [16.85, 0.25]] },
  { rest: 9 },
  { lay: 'buyers', rest: 0, el: [[TB.hosp, 0.25], [TB.ask, 0.25]] },
  { lay: 'register', rest: 0, el: [[TB.regIn + 0.3, 0.3], ...CLONES.map((_, i) => [TB.rows + i * 0.28, 0.2])] },
  { lay: 'riskS', rest: 0, el: [[TB.riskIn + 0.2, 0.3], [TB.radar, 0.2], [TB.fria, 0.1], [TB.others, 0.2]] },
  { lay: 'loopS', rest: 0, el: [[TB.cmd, 0.3], [TB.card, 0.2]] },
  { lay: 'evidS', rest: 0, el: [[TB.evidIn + 0.2, 0.3], ...FILES.map((_, i) => [TB.files + i * 0.4, 0.15]), [TB.ticks - 0.8, 0.2]] },
  { lay: 'finale', rest: 0, el: [[TB.trioIn + 0.3, 0.3], ...CLONES.map((_, i) => [TB.trioIn + 0.3 + i * 0.12, 0.2]), [FTICK[2] + 0.7, 0.05]] },
  { lay: 'logoEnd', rest: 2, el: [] },
];
// [K0, Kd, Ks, [ax, ay, bx, by], kr, kc, arc, squeeze]
const TR = [
  [0.25, 2.4, 1.4, [0, 0, 0, 0], 0.35, 1.0, 0.5],             // spark → ribbons, unfurling from the centre
  [4.1, 1.0, 0.8, [0, 0, 0.85, 0.15], 0.2, 0, 0.7],           // ribbons → headline one, left to right
  [6.2, 1.3, 0.5, [0.6, 0, 0, 0], 0.3, 0, 1.2],               // headline one → headline two
  [13.6, 1.5, 0.6, [0, 0, 0.8, 0], 0.3, 0, 1.4],              // headline two → wordmark, letter by letter
  [19.0, 1.8, 0.7, [0.4, 0, 0, 0], 0.4, 0, 1.4],              // wordmark → the double helix
  [AV.out, 2.0, 0.8, [0, 0, 0.6, 0.15], 0.3, 0, 1.2, 0.9],    // the helix → the bigger risk
  [60.6, 1.5, 0.6, [0.5, 0, 0, 0], 0.3, 0, 2.0, 0.85],        // → the AI register
  [67.2, 1.4, 0.6, [0.5, 0, 0, 0], 0.3, 0, 2.0, 0.85],        // → risk assessed
  [71.4, 1.4, 0.6, [0.5, 0, 0, 0], 0.3, 0, 2.0, 0.85],        // → people in the loop
  [76.6, 1.4, 0.6, [0.5, 0, 0, 0], 0.3, 0, 2.0, 0.85],        // → evidence ready
  [82.6, 1.6, 0.7, [0, 0, 0, 0], 0.4, 1.0, 1.4],              // → the finale: the register with its three columns
  [V.end - 1.4, 1.4, 0.4, [0, 0, 0.8, 0], 0.5, 0, 2.0, 0.5],  // → the end wordmark, letter by letter
];
const trAt = (u) => { let i = 0; while (i + 1 < TR.length && TR[i + 1][0] <= u) i++; return i; };
const SHOW = { claimA: [1.5, 2], claimB: [6.4, 3], logoA: [15.4, 4], buyers: [TB.buyIn, 6], register: [TB.regIn, 7], riskS: [TB.riskIn, 8],
  loopS: [TB.loopIn, 9], evidS: [TB.evidIn, 10], finale: [TB.trioIn, 11], logoEnd: [V.end - 0.6, null] };
const END_C = [0, -0.6, -196];
function nebulaPath(B, mid) {
  return [[0, 0, 8], [0, 0, -4], [0, 0, -10], [0, 0.2, -16], BLOB_C.map((v, i) => v + [0, 0, 8][i]), mid(B.buyers), mid(B.register), mid(B.riskS), mid(B.loopS), mid(B.evidS), mid(B.finale), END_C];
}

// ---------------------------------------------------------------- camera
let CAM = null;
function buildCam() {
  const B = BOARDS, fr = (e, t) => [...e, ...t, FOV];
  Object.assign(B.logoEnd, poseFor(B.logoEnd, END_C, 0)); B.logoEnd.pose = { C: B.logoEnd.C, yaw: 0 };
  B.logoEnd.frame = { ox: 0, oy: -40 };
  CAM = [
    [0, fr([0, 0, D0 * 1.04], [0, 0, 0])], [6.0, fr([0, 0.04, D0 * 0.98], [0, 0, 0])], [12.8, fr([0, 0.08, D0 * 0.93], [0, 0, 0])],
    [16.0, fr([0, 0, D0 * 1.0], [0, 0, 0])], [18.8, fr([0, 0.1, D0 * 0.92], [0, 0, 0])],
    [22.3, look(BLOBF, { yaw: -12, d: 1.06 })], [26.5, look(BLOBF, { yaw: 2, d: 1.0 })], [29.6, look(BLOBF, { yaw: 6, d: 0.99 })],
    [33.0, look(BLOBF, { yaw: 4, d: 1.0 })], [38.0, look(BLOBF, { yaw: 0, d: 1.01 })], [43.0, look(BLOBF, { yaw: -2, d: 1.02 })], [47.2, look(BLOBF, { yaw: -3, d: 1.0 })],
    [50.0, look(B.buyers, { yaw: 7, d: 1.06 })], [60.4, look(B.buyers, { yaw: -2, d: 0.96 })],
    [63.0, look(B.register, { yaw: -7, d: 1.05 })], [67.0, look(B.register, { yaw: 1, d: 0.97 })],
    [68.8, look(B.riskS, { yaw: 7, d: 1.05 })], [71.2, look(B.riskS, { yaw: -1, d: 0.97 })],
    [73.4, look(B.loopS, { yaw: -7, d: 1.05 })], [76.4, look(B.loopS, { yaw: 1, d: 0.97 })],
    [78.6, look(B.evidS, { yaw: 7, d: 1.05 })], [82.4, look(B.evidS, { yaw: -1, d: 0.97 })],
    [85.0, look(B.finale, { d: 1.08 })], [V.hold, look(B.finale, { d: 1.04 })], [V.end - 1.6, look(B.finale, { d: 1.03 })],
    [V.end - 0.2, look(B.logoEnd, { d: 1.1 })], [V.end + 1.2, look(B.logoEnd)], [V.dur + 2, look(B.logoEnd, { d: 0.95 })],
  ];
}

// ---------------------------------------------------------------- per-frame GL
const EXP = (u) => M.kf(u, [[0, 1.45], [15.7, 1.45], [16.0, 2.0], [17.6, 1.45], [V.end - 0.2, 1.45], [V.end + 0.2, 2.0], [V.end + 2.0, 1.4]], E.inOutSine);
function visible(u) {
  const out = [], add = (b, a, leave) => out.push({ b, a, leave, final: false, C: b.C, X: b.X, Y: b.Y });
  for (const [name, [from, leave]] of Object.entries(SHOW)) {
    if (u < from) continue;
    const b = BOARDS[name];
    if (leave !== null) { const tr = TR[leave]; if (u > tr[0] + tr[2] + tr[1] + 0.05) continue; add(b, 1, [tr[0], tr[1], tr[2], tr[3][0], tr[3][1], tr[4]]); }
    else add(b, 1, null);
  }
  return out;
}
// the ribbons' flow: an integrated speed, so it can surge on "accelerating" and settle again (as in the launch film)
const ribSpeed = (u) => 0.014 + 0.05 * ease(u, 2.6, 4.6) * (1 - ease(u, 5.4, 7.6));
let RIBPH = null;
function buildRib() { RIBPH = new Float32Array(2001); for (let i = 1; i <= 2000; i++) RIBPH[i] = RIBPH[i - 1] + ribSpeed((i - 0.5) / 100) / 100; }
const ribPhase = (u) => (u <= 20 ? (() => { const f = Math.max(0, u * 100), i = Math.floor(f); return lerp(RIBPH[i], RIBPH[Math.min(2000, i + 1)], f - i); })() : RIBPH[2000] + (u - 20) * 0.014);
function drawBlobs(gl, sc, sb) {
  const LB = G.ul.blob;
  gl.useProgram(G.progs.blob);
  gl.uniformMatrix4fv(LB('uProj'), false, sb.pj.proj); gl.uniformMatrix4fv(LB('uView'), false, sb.pj.view);
  gl.uniform3fv(LB('uEye'), sb.cam.eye); gl.uniform1f(LB('uT'), sb.u);
  sc.blobs.forEach((b) => {
    if (b.R < 0.01) return;
    const m = b.main ? G.meshHi : G.meshLo;
    gl.bindVertexArray(m.vao);
    const bd = new Float32Array(32), bk = new Float32Array(8);
    (b.buds || []).slice(0, 8).forEach((x, k) => { bd.set(x.slice(0, 4), k * 4); bk[k] = x[4]; });
    gl.uniform4fv(LB('uBud'), bd); gl.uniform1fv(LB('uBudK'), bk); gl.uniform1i(LB('uBudN'), Math.min(8, (b.buds || []).length));
    gl.uniform3fv(LB('uC'), b.C); gl.uniform1f(LB('uR'), b.R); gl.uniform1f(LB('uCapL'), b.capL || 0); gl.uniformMatrix3fv(LB('uRot'), false, b.rot || I3);
    gl.uniform1f(LB('uEyes'), b.eyes === undefined ? 1 : b.eyes); gl.uniform3fv(LB('uTint2'), b.tint2 || b.tint); gl.uniform1f(LB('uTwo'), b.two || 0);
    gl.uniform1f(LB('uAmp'), b.amp); gl.uniform1f(LB('uVoice'), b.voice); gl.uniform1f(LB('uSpike'), b.spike); gl.uniform1f(LB('uSeed'), b.seed);
    gl.uniform3fv(LB('uTint'), b.tint); gl.uniform1f(LB('uFlick'), b.flick); gl.uniform1f(LB('uRev'), b.rev);
    gl.uniform3fv(LB('uLook'), b.look || [0, 0, 1]); gl.uniform1f(LB('uBlink'), b.blink === undefined ? 1 : b.blink); gl.uniform1f(LB('uMood'), b.mood || 0); gl.uniform1f(LB('uGlow'), b.glow);
    gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_INT, 0);
  });
}
function renderGL(u, t, subs, vis, cam, pj, glowUsed) {
  const { gl, progs, ul } = G;
  gl.bindFramebuffer(gl.FRAMEBUFFER, G.scene.f); gl.viewport(0, 0, W, H);
  gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  const L = ul.parts;
  const occ = vis.filter((v) => v.b.occ !== false && v.a > 0.05).map((v) => {
    let a = v.a; if (v.leave) a *= 1 - clamp((u - v.leave[0]) / (v.leave[1] + v.leave[2]));
    return { v, a, d: Math.hypot(...v.C.map((c, i) => c - cam.eye[i])) };
  }).filter((o) => o.a > 0.02).sort((a, b) => a.d - b.d).slice(0, 4);
  const occU = new Float32Array(48).map((_, i) => { const o = occ[Math.floor(i / 12)]; if (!o) return 0; const r = Math.floor((i % 12) / 4), c = i % 4; const src = r === 0 ? [...o.v.C, o.a] : r === 1 ? [...o.v.X, 0] : [...o.v.Y, 0]; return src[c]; });
  for (const sb of subs) {
    const uu = sb.u, i = trAt(uu), tr = TR[i];
    const sc = blobScene(uu, sb.cam.eye);
    if (sc) {   // the avatar is opaque: drawn on its own (sharing the scene's depth), then added in at this sub-frame's weight
      gl.bindFramebuffer(gl.FRAMEBUFFER, G.mesh.f); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      drawBlobs(gl, sc, sb);
      gl.disable(gl.CULL_FACE); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      quad(progs.copy, G.scene, () => { tex(0, G.mesh.tex); gl.uniform1i(ul.copy('uT'), 0); gl.uniform1f(ul.copy('uGain'), 1 / subs.length); });
    } else { gl.bindFramebuffer(gl.FRAMEBUFFER, G.scene.f); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, G.scene.f); gl.viewport(0, 0, W, H);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false);
    gl.useProgram(progs.parts); gl.bindVertexArray(G.vaoP); tex(0, G.data);
    gl.uniform4fv(L('uOcc'), occU); gl.uniform1i(L('uOccN'), occ.length);
    stateUniforms(L, gl, i, i + 1);
    gl.uniform1f(L('uK0'), tr[0]); gl.uniform1f(L('uKd'), tr[1]); gl.uniform1f(L('uKs'), tr[2]); gl.uniform4fv(L('uKw'), tr[3]);
    gl.uniform1f(L('uKr'), tr[4]); gl.uniform1f(L('uKc'), tr[5]); gl.uniform1f(L('uArc'), tr[6]); gl.uniform1f(L('uSq'), tr[7] || 0);
    gl.uniformMatrix4fv(L('uProj'), false, sb.pj.proj); gl.uniformMatrix4fv(L('uView'), false, sb.pj.view); gl.uniform3fv(L('uEye'), sb.cam.eye);
    gl.uniform1f(L('uU'), uu); gl.uniform1f(L('uGain'), 1 / subs.length);
    gl.uniform1f(L('uFocus'), Math.hypot(...sb.cam.eye.map((e, k) => e - sb.cam.tgt[k]))); gl.uniform1f(L('uAper'), 0.012);
    gl.uniform3fv(L('uSpC'), [0, 0, 0]); gl.uniform1f(L('uPt'), 0.006 * ease(uu, 0, 0.3));
    // ribbons: around the headlines at the open, far behind the end card at the close
    const endR = uu > V.end - 0.6, eb = BOARDS.logoEnd;
    gl.uniform1f(L('uRibPhase'), ribPhase(uu)); gl.uniform1f(L('uRibY'), endR ? -4.4 : -2.25);
    gl.uniform3fv(L('uRibO'), endR ? vadd(eb.C, vsc(eb.N, -6)) : [0, 0, 0]); gl.uniform1f(L('uRibYaw'), 0);
    gl.uniform1f(L('uRibK'), endR ? 0.32 : 1 - 0.45 * ease(uu, 13.6, 16.0));
    gl.uniform3fv(L('uBlobC'), [0, 0, -400]); gl.uniform1f(L('uBlobR'), 0.3); gl.uniform1f(L('uBlobP'), 0);
    hxUniforms(L, gl, uu);   // the double helix (rest 9)
    gl.uniform3fv(L('uLpC'), [0, 0, -400]); gl.uniform1f(L('uLpK'), 0);
    gl.uniform3fv(L('uScC'), [0, 0, -400]); gl.uniform1f(L('uScVis'), 0); gl.uniform1f(L('uFlK'), 0); gl.uniform1f(L('uWvK'), 0); gl.uniform1f(L('uLnK'), 0);
    gl.drawArrays(gl.POINTS, 0, N);
  }
  gl.disable(gl.DEPTH_TEST); gl.depthMask(true);
  if (glowUsed) {
    upload(G.glowTex, G.glowCv, false, true);
    quad(progs.copy, G.scene, () => { tex(0, G.glowTex); gl.uniform1i(ul.copy('uT'), 0); gl.uniform1f(ul.copy('uGain'), 1.4); });
  }
  gl.disable(gl.BLEND);
  let src = G.scene;
  G.lv.forEach(([a, b], i) => {
    quad(progs.bright, a, () => { tex(0, src.tex); gl.uniform1i(ul.bright('uT'), 0); gl.uniform2f(ul.bright('uPx'), 1 / src.w, 1 / src.h); gl.uniform1f(ul.bright('uThr'), i === 0 ? 0.5 : 0.0); });
    quad(progs.blur, b, () => { tex(0, a.tex); gl.uniform1i(ul.blur('uT'), 0); gl.uniform2f(ul.blur('uDir'), 1 / a.w, 0); });
    quad(progs.blur, a, () => { tex(0, b.tex); gl.uniform1i(ul.blur('uT'), 0); gl.uniform2f(ul.blur('uDir'), 0, 1 / a.h); });
    src = a;
  });
  const [sa, sb2] = G.streak;
  quad(progs.bright, sa, () => { tex(0, G.lv[0][0].tex); gl.uniform1i(ul.bright('uT'), 0); gl.uniform2f(ul.bright('uPx'), 1 / G.lv[0][0].w, 1 / G.lv[0][0].h); gl.uniform1f(ul.bright('uThr'), 0.7); });
  [2, 5, 11, 22].forEach((st, i) => {
    const [a, b] = i % 2 ? [sb2, sa] : [sa, sb2];
    quad(progs.blur, b, () => { tex(0, a.tex); gl.uniform1i(ul.blur('uT'), 0); gl.uniform2f(ul.blur('uDir'), st / a.w, 0); });
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, G.cards.f); gl.viewport(0, 0, W, H);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(progs.board); gl.bindVertexArray(G.vaoQ);
  const LB = ul.board;
  gl.uniformMatrix4fv(LB('uProj'), false, pj.proj); gl.uniformMatrix4fv(LB('uView'), false, pj.view);
  gl.uniform1i(LB('uT'), 0); gl.uniform1f(LB('uU'), u);
  vis.slice().sort((a, b) => Math.hypot(...b.C.map((c, i) => c - cam.eye[i])) - Math.hypot(...a.C.map((c, i) => c - cam.eye[i]))).forEach((v) => {
    tex(0, v.tex);
    gl.uniform3fv(LB('uC'), v.C); gl.uniform3fv(LB('uX'), v.X); gl.uniform3fv(LB('uY'), v.Y); gl.uniform1f(LB('uA'), v.a);
    gl.uniform1i(LB('uLeave'), v.leave ? 1 : 0);
    if (v.leave) { const [k0, kd, ks, ax, ay, kr] = v.leave; gl.uniform1f(LB('uK0'), k0); gl.uniform1f(LB('uKd'), kd); gl.uniform1f(LB('uKs'), ks); gl.uniform2f(LB('uKw'), ax, ay); gl.uniform1f(LB('uKr'), kr); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
  gl.disable(gl.BLEND);
  quad(progs.comp, null, () => {
    tex(0, G.scene.tex); tex(1, G.lv[0][0].tex); tex(2, G.lv[1][0].tex); tex(3, G.lv[2][0].tex); tex(4, sa.tex); tex(5, G.cards.tex);
    const C = ul.comp;
    gl.uniform1i(C('uScene'), 0); gl.uniform1i(C('uB1'), 1); gl.uniform1i(C('uB2'), 2); gl.uniform1i(C('uB3'), 3); gl.uniform1i(C('uSt'), 4); gl.uniform1i(C('uCards'), 5);
    gl.uniform2f(C('uRes'), W, H); gl.uniform1f(C('uT'), t); gl.uniform1f(C('uExp'), EXP(u)); gl.uniform1f(C('uGrain'), 0.025);
    gl.uniform3fv(C('uBg0'), [0x10 / 255, 0x09 / 255, 0x36 / 255]); gl.uniform3fv(C('uBg1'), [0x06 / 255, 0x01 / 255, 0x1f / 255]);
  });
}

// ---------------------------------------------------------------- accents that bloom
// the regulatory clock: a ring of light round the helix; twelve marks, a hand that ticks round once
const CLOCK = { t0: 42.75, t1: 46.75, out: [46.9, 47.6] };
function accents(g, u, pj) {
  let used = false;
  const sp = (b, x, y) => pj.to(at(b, x, y));
  if (u > CLOCK.t0 - 0.4 && u < CLOCK.out[1]) {
    const c = pj.to(BLOB_C), k = ease(u, CLOCK.t0 - 0.4, CLOCK.t0 + 0.4) * (1 - ease(u, ...CLOCK.out));
    if (c.ok && k > 0) {
      const r = 228, steps = clamp((u - CLOCK.t0) / ((CLOCK.t1 - CLOCK.t0) / 12), 0, 12), i = Math.floor(steps);
      const hand = (i + E.outBack(clamp((steps - i) * 2.2), 2.2)) / 12, a = -Math.PI / 2 + hand * TAU;
      g.lineWidth = 2; g.strokeStyle = lilac(0.32 * k); g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.stroke();
      for (let m = 0; m < 12; m++) {
        const am = -Math.PI / 2 + (m * TAU) / 12, lit = steps >= m;
        g.strokeStyle = lit ? lilac(0.85 * k) : lilac(0.3 * k); g.lineWidth = m % 3 ? 2 : 4;
        g.beginPath(); g.moveTo(c.x + Math.cos(am) * (r - 18), c.y + Math.sin(am) * (r - 18)); g.lineTo(c.x + Math.cos(am) * (r - 4), c.y + Math.sin(am) * (r - 4)); g.stroke();
      }
      g.strokeStyle = lilac(0.9 * k); g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.arc(c.x, c.y, r, -Math.PI / 2, a); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = `rgba(255,255,255,${0.95 * k})`; g.beginPath(); g.arc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 7, 0, TAU); g.fill();
      used = true;
    }
  }
  // the tender list fills in on the evidence screen: a small burst of light per check
  ASKS.forEach((_, i) => {
    const t0 = TB.ticks + i * 0.35; if (u < t0 || u > t0 + 1.1) return;
    const c = sp(BOARDS.evidS, EVD.rx + 28 + 22 + 20, 60 + 104 + i * 100 + 42), k = prog(u, t0, t0 + 1.1); if (!c.ok) return;
    g.strokeStyle = green(0.7 * (1 - k)); g.lineWidth = 2.5; g.beginPath(); g.arc(c.x, c.y, 18 + 46 * E.outCubic(k), 0, TAU); g.stroke(); used = true;
  });
  // the finale: each column's ticks land with small bursts of light, down the rows
  FTICK.forEach((t0, j) => CLONES.forEach((_, i) => {
    const t1 = t0 + i * 0.1; if (u < t1 || u > t1 + 1.0) return;
    const c = sp(BOARDS.finale, GOV.cols[j], GOV.rowY + i * GOV.rowH + (GOV.rowH - 10) / 2), k = prog(u, t1, t1 + 1.0); if (!c.ok) return;
    g.strokeStyle = green(0.6 * (1 - k)); g.lineWidth = 2.2; g.beginPath(); g.arc(c.x, c.y, 16 + 34 * E.outCubic(k), 0, TAU); g.stroke(); used = true;
  }));
  // the approval: light ripples out from the pressed button
  if (u > TB.press && u < TB.press + 1.4) {
    const [x2, y2, , h2] = LOOP.card, c = sp(BOARDS.loopS, x2 + 32 + 190, y2 + h2 - 32 - 32), k = prog(u, TB.press, TB.press + 1.4);
    if (c.ok) { g.strokeStyle = green(0.7 * (1 - k)); g.lineWidth = 3; g.beginPath(); g.ellipse(c.x, c.y, 90 + 220 * k, 30 + 90 * k, 0, 0, TAU); g.stroke(); used = true; }
  }
  return used;
}

// ---------------------------------------------------------------- type and labels over the film
const CAPS = [
  [21.0, 28.6, [['AI is already at work in '], ['healthcare', 1], ['.']], 'Clinical decision support, triage, diagnostic imaging and drug discovery.'],
  [48.0, 60.4, [['The bigger risk: '], ['losing business', 1], [' before a regulator ever comes knocking.']], null, true],
  [62.0, 67.0, [['Every model and agent, in '], ['one place', 1], ['.']], null, true],
  [67.8, 71.2, [['Every risk, '], ['assessed', 1], ['.']], null, true],
  [72.4, 76.4, [['Keep '], ['people in the loop', 1], [' when it matters most.']], null, true],
  [77.6, 82.4, [['Evidence '], ['ready', 1], [' for every audit and tender.']], null, true],
  [83.4, V.end - 1.4, [['Every model and agent, in '], ['one place', 1], ['.']], null, true],
  [84.0, V.end - 1.4, [['So you can scale healthcare AI with confidence, and prove it.']], null, true, CAP_SUB],
];
// the problem, as statements that stack, centred on the left: the bridge and the three risks. When the clock comes, they
// step away and "And the regulatory clock / is already ticking." takes their place, with the two laws under it
function problems(ctx, u) {
  const list = [[V.bridge, 'But governance hasn\'t kept pace.'], [32.75, 'Models no one validated.'], [36.0, 'Agents acting on their own.'], [39.25, 'Patient data at risk.']];
  if (u < list[0][0] || u > 43.4) return;
  const size = P ? 56 : 48, lh = size * 1.27, X = CAP.x, top = 540 - (list.length * lh) / 2 - 10;
  list.forEach(([b0, s], i) => {
    if (u < b0) return;
    const kin = E.outCubic(prog(u, b0, b0 + 0.9)), kout = E.inCubic(prog(u, 42.3 + i * 0.1, 43.0 + i * 0.1));
    const dim = list.slice(i + 1).reduce((a, [b1]) => a + ease(u, b1, b1 + 0.8), 0);
    const y = top + i * lh + size * 0.9;
    ctx.save(); ctx.beginPath(); ctx.rect(X - 40, y - size * 1.05, 1200, lh + 10); ctx.clip();
    ctx.globalAlpha = (1 - kout) * lerp(1, 0.42, Math.min(1, dim));
    tx(ctx, s, X, y + (1 - kin) * lh * 0.9 - kout * lh * 0.9, size, 600, DISPLAY, T.fg, 'left', -size * 0.03);
    ctx.restore();
  });
}
const CLK_Y = 340;   // the clock group (two lines, the law cards, the small print) sits centred on the left
function clockLines(ctx, u) {
  if (u < 42.7 || u > 48.0) return;
  const size = 58, lh = size * 1.18;
  ['And the regulatory clock', 'is already ticking.'].forEach((s, i) => {
    const t = 42.75 + i * 0.35, kin = E.outCubic(prog(u, t, t + 0.9)), kout = E.inCubic(prog(u, 46.9 + i * 0.1, 47.6 + i * 0.1));
    const y = CLK_Y + i * lh + size * 0.9;
    ctx.save(); ctx.beginPath(); ctx.rect(CAP.x - 40, y - size * 1.05, 1200, lh + 10); ctx.clip();
    ctx.globalAlpha = kin * (1 - kout);
    tx(ctx, s, CAP.x, y + (1 - kin) * lh * 0.9 - kout * lh * 0.9, size, 600, DISPLAY, T.fg, 'left', -size * 0.03);
    ctx.restore();
  });
}
// the two laws, under the stack: the same cards as the TIME Medical film's clock
const LAWS = [
  { flag: 'flagIn', where: 'India · DPDP Act', fig: 'Up to ₹250 crore', note: 'in penalties, for certain contraventions', grad: T.blue, t: 43.6 },
  { flag: 'flagEu', where: 'Europe · EU AI Act', fig: '2 August 2027', note: 'high-risk rules for regulated products apply', grad: T.violet, t: 44.4 },
];
function lawCards(ctx, u) {
  if (u < LAWS[0].t - 0.1 || u > 48.0) return;
  const out = ease(u, 46.9, 47.6), w = 420, h = 150, y = CLK_Y + 190;
  LAWS.forEach((l, i) => {
    const k = eo(u, l.t, l.t + 0.7) * (1 - out); if (k <= 0) return;
    const x = CAP.x + i * (w + 24);
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 24);
    panel(ctx, x, y, w, h, { grad: l.grad, border: 'rgba(255,255,255,0.14)', r: 20 });
    flag(ctx, IMGS[l.flag], x + 24, y + 24, 26, 4);
    tx(ctx, l.where, x + 24 + 39 + 12, y + 45, 20, 700, UI, fgA(0.92));
    txr(ctx, l.fig, x + 24, y + 98, 40, 600, DISPLAY, T.fg, -1.2);
    tx(ctx, l.note, x + 24, y + 130, 17, 500, UI, fgA(0.82));
    ctx.restore();
  });
  const nk = eo(u, 45.0, 45.7) * (1 - out);
  if (nk > 0) { ctx.save(); ctx.globalAlpha = nk; tx(ctx, 'Subject to the applicable provisions and timelines.', CAP.x, y + h + 34, 17, 500, UI, T.subtle); ctx.restore(); }
}
// the real risks ride on the tablets: as each is spoken, one capsule's name label turns into its risk (in the alert
// colour), centred on top of the pill and following it, never flipping sides
const RISKS = [
  { i: 0, t: 33.0, text: 'Models no one validated', col: T.warn },
  { i: 1, t: 36.2, text: 'Agents acting on their own', col: T.warn },
  { i: 4, t: 39.4, text: 'Patient data at risk', col: T.risk },
  { i: 2, t: 41.0, text: 'Governance gaps found late', col: T.risk },
  { i: 3, t: 41.8, text: 'Evidence scattered across spreadsheets', col: T.risk },
];
// a chip: the site's pill, a violet icon; centred directly above what it names, so it rides with it and never flips sides
function chipC(ctx, s, label, ic, { a = 1, col = T.fg, icol = T.tertiary, dy = 16 } = {}) {
  if (a <= 0.01 || !s.ok) return;
  const h = 44, size = 19, w = tw(ctx, label, size, 600, UI) + 32 + 26;
  const x = clamp(s.x - w / 2, 24, W - 24 - w), y = s.y - dy - h;
  ctx.save(); ctx.globalAlpha = a;
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(20,13,61,0.9)'; ctx.fill();
  ctx.strokeStyle = T.lineStrong; ctx.lineWidth = 1; rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2); ctx.stroke();
  icon(ctx, ic, x + 16, y + (h - 20) / 2, 20, icol, 'bold');
  tx(ctx, label, x + 16 + 26, y + h / 2 + size * 0.36, size, 600, UI, col);
  ctx.restore();
}
function agentChips(ctx, u, pj) {
  if (u < AV.chip || u > 47.8) return;
  const sc = blobScene(u, pj.eye); if (!sc) return;
  const mc = pj.to(BLOB_C), rad = Math.abs(pj.to(vadd(BLOB_C, [HX.R * 1.3, 0, 0])).x - mc.x), out = ease(u, 46.8, 47.5);
  // each label above its pill; where two would collide, the lower one steps down just enough (it still rides its pill)
  const items = [];
  sc.blobs.filter((b) => b.i !== undefined).forEach((b) => {
    const bc = pj.to(b.C), behind = bc.d > mc.d && Math.abs(bc.x - mc.x) < rad;
    const kin = eo(u, AV.chip + b.i * 0.25, AV.chip + 0.6 + b.i * 0.25) * (1 - out);   // a risk stays readable even behind the helix; a name dims there
    const risk = RISKS.find((r) => r.i === b.i), rk = risk ? eo(u, risk.t - 0.15, risk.t + 0.35) : 0;
    const s0 = pj.to(vadd(b.C, [0, b.R * 2.1 + 0.05, 0])); if (!s0.ok || kin <= 0.01) return;
    const label = rk > 0.5 && risk ? risk.text : CLONES[b.i].kind[0];
    const w = tw(ctx, label, 19, 600, UI) + 32 + 26, h = 44;
    items.push({ b, s0, kin, risk, rk, behind, w, h, x: clamp(s0.x - w / 2, 24, W - 24 - w), y: s0.y - 16 - h, d: bc.d });
  });
  items.sort((p, q) => p.y - q.y);
  items.forEach((it, k) => {
    for (let j = 0; j < k; j++) {
      const o = items[j];
      if (it.x < o.x + o.w + 8 && o.x < it.x + it.w + 8 && it.y < o.y + o.h + 6) it.y = o.y + o.h + 6;
    }
  });
  items.sort((p, q) => q.d - p.d).forEach((it) => {
    const dy = it.s0.y - it.y - it.h;
    if (it.rk < 1) chipC(ctx, it.s0, CLONES[it.b.i].kind[0], CLONES[it.b.i].kind[1], { a: it.kin * (1 - it.rk) * (it.behind ? 0.25 : 1), dy });
    if (it.rk > 0) chipC(ctx, it.s0, it.risk.text, 'Warning', { a: it.kin * it.rk, col: it.risk.col, icol: it.risk.col, dy: dy + (1 - it.rk) * 8 });
  });
}
function endCard(ctx, u, pj) {
  if (u < V.url) return;
  const b = BOARDS.logoEnd, bot = pj.to(at(b, b.css[0] / 2, b.css[1]));
  const s = 'www.niticore.ai', size = 36, n = Math.round(clamp((u - V.url) / 1.1) * s.length);
  if (n <= 0 || !bot.ok) return;
  const full = tw(ctx, s, size, 700, UI, 0.5), x = W / 2 - full / 2, y = bot.y + 110;
  ctx.save(); tx(ctx, s.slice(0, n), x, y, size, 700, UI, T.accent, 'left', 0.5);
  if (n < s.length) { ctx.fillStyle = T.accent; ctx.fillRect(x + tw(ctx, s.slice(0, n), size, 700, UI, 0.5) + 3, y - size * 0.78, 3, size * 0.95); }
  ctx.restore();
}
function overlay(ctx, u, pj) {
  agentChips(ctx, u, pj);
  CAPS.forEach((c) => caption(ctx, u, c, c[5] || (c[4] ? CAP_TOP : CAP)));
  problems(ctx, u);
  clockLines(ctx, u);
  lawCards(ctx, u);
  endCard(ctx, u, pj);
}

// ---------------------------------------------------------------- hits (sounds on the picture's accents)
const HITS = [
  // the launch film's opening, as it was
  [0.25, 'the spark', 'sub', { len: 1.6, gain: 0.4 }],
  [1.6, 'ribbons unfurl', 'whoosh', { len: 2.0, from: 300, to: 2400, gain: 0.13 }],
  [4.4, 'accelerating', 'whoosh', { len: 1.6, from: 600, to: 3600, gain: 0.14 }],
  [6.6, 'headline one breaks', 'whoosh', { len: 1.0, from: 2400, to: 700, gain: 0.1 }],
  [8.64, 'governance', 'blip', { pitch: 'A5', gain: 0.08 }],
  [16.0, 'into the wordmark', 'swell', { gain: 0.12 }],
  [16.0, 'wordmark forms', 'bell', { pitch: 'D5', gain: 0.16 }], [16.0, 'wordmark chord', 'bell', { pitch: 'A5', gain: 0.12 }],
  [16.85, 'sparkle', 'bell', { pitch: 'D6', gain: 0.2 }], [17.1, 'sparkle 2', 'bell', { pitch: 'F#6', gain: 0.16 }],
  // the helix (as in V1)
  [20.0, 'the helix forms', 'swell', { gain: 0.12 }],
  ...Array.from({ length: 7 }, (_, j) => [AV.nodes + j * 0.22, 'a base lights', 'blip', { pitch: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'][j], gain: 0.05 }]),
  ...CLONES.map((_, i) => [AV.bud + 0.35 + i * 0.25, 'a capsule buds', 'pop', { pitch: ['A5', 'B5', 'D6', 'E6', 'F#6'][i], gain: 0.1 }]),
  [25.2, 'faster', 'whoosh', { len: 1.8, from: 400, to: 2600, gain: 0.1 }],
  [V.bridge, 'the helix slows', 'swell', { gain: 0.08 }],
  [AV.amber[0] + 0.5, 'it turns amber', 'swell', { gain: 0.13 }],
  [AV.tear[0] + 0.2, 'a capsule breaks orbit', 'whoosh', { len: 1.6, from: 900, to: 300, gain: 0.12 }],
  [AV.coral[0] + 0.3, 'it unravels', 'thud', { pitch: 58, to: 32, gain: 0.3 }],
  ...RISKS.map((r) => [r.t, 'a risk is pinned', 'tick', { gain: 0.16 }]),
  ...Array.from({ length: 12 }, (_, m) => [CLOCK.t0 + (m * (CLOCK.t1 - CLOCK.t0)) / 12, 'the clock ticks', 'tick', { gain: m % 3 ? 0.08 : 0.13 }]),
  ...LAWS.map((l) => [l.t + 0.2, 'a law card', 'thud', { pitch: 68, to: 44, gain: 0.2 }]),
  [AV.peel[0], 'the helix pours out', 'whoosh', { len: 1.6, from: 2600, to: 300, gain: 0.17 }],
  // the bigger risk
  ...HOSP.map((_, i) => [TB.hosp + i * 0.42, 'a buyer lights', 'blip', { pitch: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6'][i], gain: 0.09 }]),
  ...ASKS.map((_, i) => [TB.ask + i * 0.35, 'an ask', 'tick', { gain: 0.14 }]),
  ...ASKS.map((_, i) => [TB.askPulse + i * 0.45, 'an empty check', 'blip', { pitch: 'F#4', gain: 0.06 }]),
  // Niticore: the register, the three screens, the three together
  [60.7, 'to the register', 'whoosh', { len: 1.3, from: 400, to: 2200, gain: 0.12 }],
  [TB.regIn + 0.3, 'wordmark', 'bell', { pitch: 'D5', gain: 0.12 }],
  ...CLONES.map((_, i) => [TB.rows + i * 0.28, 'a row', 'tick', { gain: 0.15 }]),
  [67.3, 'to risk assessed', 'whoosh', { len: 1.2, from: 400, to: 2200, gain: 0.12 }],
  [TB.radar, 'the radar grows', 'swell', { gain: 0.1 }], [TB.tier, 'high risk', 'thud', { pitch: 70, to: 45, gain: 0.22 }],
  ...CLONES.map((_, i) => [TB.others + i * 0.22, 'assessed', 'pop', { pitch: ['D5', 'E5', 'F#5', 'A5', 'B5'][i], gain: 0.08 }]),
  [TB.fria + 0.3, 'FRIA', 'tick', { gain: 0.18 }],
  [71.5, 'to people in the loop', 'whoosh', { len: 1.2, from: 400, to: 2200, gain: 0.12 }],
  [TB.cmd, 'typing', 'type', { n: 10, len: 0.5, gain: 0.12 }],
  ...TB.run.map((t, i) => [t, 'a log line', 'tick', { gain: i === 3 ? 0.2 : 0.1 }]),
  [TB.run[4], 'approval required', 'blip', { pitch: 'F#5', gain: 0.14 }],
  [TB.press, 'approve', 'click', { gain: 0.3 }], [TB.press + 0.2, 'approved', 'bell', { pitch: 'D6', gain: 0.2 }],
  [76.7, 'to evidence ready', 'whoosh', { len: 1.2, from: 400, to: 2200, gain: 0.12 }],
  ...FILES.map((_, i) => [TB.files + i * 0.4, 'a file', 'tick', { gain: 0.18 }]),
  [TB.seal, 'sealed', 'bell', { pitch: 'A5', gain: 0.2 }],
  ...ASKS.map((_, i) => [TB.ticks + i * 0.35, 'a check fills', 'pop', { pitch: ['D5', 'F#5', 'A5', 'D6'][i], gain: 0.12 }]),
  [82.7, 'the three together', 'whoosh', { len: 1.4, from: 400, to: 2400, gain: 0.13 }],
  ...FTICK.map((t, j) => [t, 'a column ticks', 'bell', { pitch: ['D5', 'F#5', 'A5'][j], gain: 0.15 }]),
  ...FTICK.flatMap((t) => CLONES.map((_, i) => [t + i * 0.1, 'a tick', 'tick', { gain: 0.06 }])),
  [FTICK[2] + 0.8, 'mapped', 'pop', { pitch: 'A5', to: 'D6', gain: 0.1 }],
  [V.end - 1.3, 'into the wordmark', 'whoosh', { len: 1.4, from: 400, to: 2400, gain: 0.12 }],
  [V.end + 0.4, 'wordmark', 'impact'],
  [V.end + 0.95, 'sparkle', 'bell', { pitch: 'D6', gain: 0.22 }], [V.end + 1.2, 'sparkle 2', 'bell', { pitch: 'A6', gain: 0.2 }],
  [V.url, 'www.niticore.ai types', 'type', { n: 15, len: 0.7, gain: 0.1 }],
].sort((a, b) => a[0] - b[0]);

M.film({
  fonts: [`600 100px ${DISPLAY}`, `500 100px ${DISPLAY}`, `500 40px ${UI}`, `600 40px ${UI}`, `700 40px ${UI}`, `400 40px ${MONO}`, `700 40px ${MONO}`],
  images: { eu: 'assets/logos/eu-ai-act.webp', iso: 'assets/logos/iso-42001.webp', flagIn: 'assets/logos/in.svg', flagEu: 'assets/logos/eu.svg' },
  hits: HITS,
  samples: 1,   // motion blur happens on the GPU (renderGL accumulates particle and mesh sub-frames)
  async init(ctx, IMG) {
    IMGS = IMG;
    [ICONS, VOENV] = await Promise.all([fetch('assets/icons.json').then((r) => r.json()), fetch('audio/vo_env.json').then((r) => r.json())]);
    await loadSub(); defineEndBoard();
    STATES[12].el = [...SUB.letters.slice(0, NEL - 2).map((_, i) => [END_T0 + 0.02 + i * 0.07, 0.25]), [END_T0 + 0.95, 0.25], [V.tag - 0.05, 0.03]].slice(0, NEL);
    buildPhi(); buildRib(); buildCam(); setupGL(); sampleLayers();
  },
  draw(ctx, u, t) {
    const cam = camera(u), pj = projector(cam);
    const vis = visible(u);
    vis.forEach((v) => (v.tex = boardTex(v.b, u, v.final)));
    G.glow.clearRect(0, 0, W, H);
    const glowUsed = accents(G.glow, u, pj);
    const subs = [];
    for (let k = 0; k < MB; k++) {
      const uk = M.U(t + (k / MB - 0.5) * (SHUTTER / FPS)), ck = camera(uk);
      subs.push({ u: uk, cam: ck, pj: projector(ck) });
    }
    renderGL(u, t, subs, vis, cam, pj, glowUsed);
    ctx.drawImage(G.cv, 0, 0);
    overlay(ctx, u, pj);
  },
});
