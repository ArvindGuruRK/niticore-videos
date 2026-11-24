// EU AI Act, Article 5: prohibited AI practices. A 3-D clay explainer hosted by Stella the Standard.
// Pure function of time: window.seek(t) paints frame t. Timing in beats (u) on beats.json (112 bpm).
// docs/shotlist.md is the plan. Sets live in sets/*.js; each is built once and posed from (t, u).
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';
import { PAL } from './sets/clay.js';
import { buildStella } from './sets/stella.js';
import { setLipsync } from './sets/common.js';
import { titleSet } from './sets/title.js';
import { cabinetSet } from './sets/cabinet.js';
import { calendarSet } from './sets/calendar.js';
import { boardSet } from './sets/board.js';

const { W, H, E, prog, clamp, lerp } = M;

// [story beat, label, sfx, opts]: story beats are the sets' own timing; HITS below maps them onto the film
const STORY_HITS = [
  [0.3, 'the 5 slams down', 'impact'],
  [0.95, 'A hops in', 'tok', { pitch: 'C5' }], [1.15, 'r', 'tok', { pitch: 'D5' }], [1.35, 't', 'tok', { pitch: 'E5' }],
  [1.55, 'i', 'tok', { pitch: 'F5' }], [1.75, 'c', 'tok', { pitch: 'G5' }], [1.95, 'l', 'tok', { pitch: 'A5' }], [2.15, 'e', 'tok', { pitch: 'C6' }],
  [4.2, 'module line', 'tick'],
  [6.5, 'prohibited AI practices', 'pop', { pitch: 'C5', to: 'F5' }],
  [11.1, 'title flies off', 'whoosh', { len: 0.5, from: 500, to: 3000 }],
  [12.2, 'Stella lands', 'thud', { pitch: 'G3' }],
  [12.7, 'ID card flips up', 'whoosh', { len: 0.35, from: 800, to: 2600 }],
  [13.3, 'card settles', 'click'],
  [18.5, 'whip to cabinet', 'whoosh', { len: 0.5, from: 2800, to: 500, pan: 0.3 }],
  [21.6, 'arrow grows', 'riser', { len: 1.8 }],
  [24.0, 'more risk label', 'pop', { pitch: 'E5' }],
  [27, 'minimal drawer', 'thud', { pitch: 'C3' }], [27.05, 'minimal', 'tok', { pitch: 'F4' }],
  [29, 'limited drawer', 'thud', { pitch: 'D3' }], [29.05, 'limited', 'tok', { pitch: 'A4' }],
  [31, 'high drawer', 'thud', { pitch: 'E3' }], [31.05, 'high', 'tok', { pitch: 'C5' }],
  [35.5, 'UNACCEPTABLE bursts', 'impact'],
  [38.8, 'file pops up', 'boing', { pitch: 'G4', to: 'G5' }],
  [45, 'banned outright seal', 'impact'],
  [46.7, 'to the calendar', 'whoosh', { len: 0.5, from: 600, to: 2400 }],
  [49.7, 'page tears', 'whoosh', { len: 0.4, from: 1500, to: 5000 }],
  [50.9, 'page 2 shows', 'click'],
  [51.4, 'red ring drawn', 'type', { len: 0.7, n: 6 }],
  [52.6, 'in-force tag', 'pop', { pitch: 'G5' }],
  [55.9, 'whip to the board', 'whoosh', { len: 0.5, from: 2600, to: 500, pan: 0.3 }],
  [57.4, 'card 1', 'click'], [57.9, 'card 2', 'click'], [58.4, 'card 3', 'click'],
  [60, 'social scoring', 'pop', { pitch: 'D5' }],
  [62.5, 'banned seal 1', 'impact'],
  [63.5, 'harmful manipulation', 'pop', { pitch: 'F5' }],
  [66.5, 'banned seal 2', 'impact'],
  [67.5, 'face scraping', 'pop', { pitch: 'A5' }],
  [70.5, 'banned seal 3', 'impact'],
  [71.6, 'cards fly to the file', 'whoosh', { len: 0.6, from: 3000, to: 600 }],
  [74.7, 'file slams', 'thud', { pitch: 'A2' }],
  [76.2, 'up to the sign-off', 'whoosh', { len: 0.5, from: 500, to: 2600 }],
  [78.6, 'a compliant system', 'pop', { pitch: 'C5' }],
  [80.6, 'happy', 'bell', { pitch: 'F6' }],
  [81.8, 'Niticore plaque', 'thud', { pitch: 'F3' }],
  [82.4, 'logo', 'bell', { pitch: 'C6' }],
];

let S = {}, STELLA = null, GRAIN = null;

// ---------------------------------------------------------------- story time -> film time
// timeline.json (shared with audio/score.py): each transition replaces story beats [a0, b1] with L
// film beats, where the designed wipe plays. Outside them the story runs 1:1, shifted.
const TL = await fetch('timeline.json').then((r) => r.json());
const TR = TL.transitions;
function toFilm(us) {
  let off = 0;
  for (const tr of TR) {
    if (us <= tr.a0) return us + off;
    if (us < tr.b1) return tr.a0 + off + ((us - tr.a0) / (tr.b1 - tr.a0)) * tr.L;
    off += tr.L - (tr.b1 - tr.a0);
  }
  return us + off;
}
function toStory(uf) {
  let off = 0;
  for (const tr of TR) {
    const fs = tr.a0 + off;
    if (uf < fs) return { us: uf - off };
    if (uf < fs + tr.L) return { tr, p: (uf - fs) / tr.L };
    off += tr.L - (tr.b1 - tr.a0);
  }
  return { us: uf - off };
}

// how each transition looks. aR / bR: the story beats scene A and B play through during the wipe
// (A starts where the story left off, B ends where it resumes). Bands take the colours of the scene
// they lead into; the star opens out of Stella.
const LOOK = {
  titleCab: { A: 'title', B: 'cab', aR: [18.0, 18.6], bR: [18.4, 19.0], style: 'star', at: [0.5, 0.5] },
  cabFile: { A: 'cab', B: 'cab', aR: [37.0, 37.5], bR: [40.6, 41.2], style: 'bands', dir: [0, -1], colors: [PAL.gold, PAL.crimson, PAL.navy] },
  cabCal: { A: 'cab', B: 'cal', aR: [46.3, 46.8], bR: [46.8, 47.3], style: 'bands', dir: [0, 1], colors: [PAL.gold, PAL.crimson, PAL.plum] },
  calBoard: { A: 'cal', B: 'board', aR: [55.4, 55.9], bR: [55.9, 56.4], style: 'bands', dir: [-1, 0], colors: [PAL.gold, PAL.emerald, PAL.forest] },
  boardDesk: { A: 'board', B: 'board', aR: [71.2, 71.5], bR: [72.0, 72.6], style: 'bands', dir: [0, 1], colors: [PAL.gold, PAL.orange, PAL.walnutDeep] },
  deskEnd: { A: 'board', B: 'title', aR: [75.8, 76.3], bR: [76.3, 76.8], style: 'star', at: [0.5, 0.48] },
};

// hits: story hits outside the transitions, shifted onto the film, plus each transition's own sounds
const HITS = STORY_HITS.filter(([b]) => !TR.some((tr) => b > tr.a0 && b < tr.b1))
  .map(([b, ...rest]) => [+toFilm(b).toFixed(3), ...rest]);
{
  let off = 0;
  for (const tr of TR) {
    const fs = tr.a0 + off, lk = LOOK[tr.name], isStar = lk.style === 'star';
    if (isStar) HITS.push([+(fs + 0.1).toFixed(3), `${tr.name}: star spark`, 'blip', { pitch: 'E6' }]);
    HITS.push([+(fs + tr.L * 0.42).toFixed(3), `${tr.name}: wipe`, 'whoosh',
      { len: 0.75, from: isStar ? 600 : 2600, to: isStar ? 3000 : 500, pan: lk.dir ? -0.3 * lk.dir[0] : 0 }]);
    HITS.push([+(fs + tr.L * 0.8).toFixed(3), `${tr.name}: lands`, 'thud', { pitch: 'C3', gain: 0.25 }]);
    off += tr.L - (tr.b1 - tr.a0);
  }
  HITS.sort((a, b) => a[0] - b[0]);
}

function shot(ctx, set, t, u, opts = {}) {
  ctx.save(); G.renderSet(ctx, set, t, u, opts); ctx.restore();
}
function setAt(us) {
  return us < 18.5 ? S.title : us < 46.8 ? S.cab : us < 55.9 ? S.cal : us < 76.3 ? S.board : S.title;
}

// ---------------------------------------------------------------- the wipes
// Layered clay bands: three solid bands sweep across in a stagger, each with a soft wavy clay lip
// (lighter rim, darker body) that casts a shadow forward; scene B is revealed behind the last one.
function halfPlane(ctx, d, e, k, p) {
  const n = [-d[1], d[0]];
  const D = W * Math.abs(d[0]) + H * Math.abs(d[1]), Lp = (W * Math.abs(n[0]) + H * Math.abs(n[1])) / 2 + 300;
  const O = [W / 2 - (d[0] * D) / 2, H / 2 - (d[1] * D) / 2];
  const pt = (s, q) => [O[0] + d[0] * s + n[0] * q, O[1] + d[1] * s + n[1] * q];
  ctx.beginPath();
  for (let q = -Lp; q <= Lp; q += 30) {
    const w = 16 * Math.sin(q * 0.0042 + k * 1.9 + p * 2.2) + 7 * Math.sin(q * 0.011 + k * 0.7);
    const [x, y] = pt(e + w, q);
    if (q === -Lp) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  const [x1, y1] = pt(-80, Lp), [x2, y2] = pt(-80, -Lp);
  ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath();
  return O;
}
function bands(ctx, p, lk, drawB) {
  const d = lk.dir;
  const D = W * Math.abs(d[0]) + H * Math.abs(d[1]);
  const edge = (k) => D * (-0.35 + 1.75 * E.inOutCubic(clamp((p - 0.08 * k) / 0.76)));
  for (let k = 0; k < 4; k++) {
    const e = edge(k);
    if (e < -60) break;
    const O = halfPlane(ctx, d, e, k, p);
    const c = lk.colors[Math.min(k, 2)];
    const g = ctx.createLinearGradient(O[0] + d[0] * (e - 260), O[1] + d[1] * (e - 260), O[0] + d[0] * e, O[1] + d[1] * e);
    g.addColorStop(0, M.mix(c, '#000000', 0.22)); g.addColorStop(0.8, c);
    g.addColorStop(0.93, M.mix(c, '#ffffff', 0.18)); g.addColorStop(1, M.mix(c, '#000000', 0.12));
    for (const [off, a] of [[34, 0.12], [20, 0.16], [9, 0.2]]) {
      halfPlane(ctx, d, e + off, k, p); ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fill();
    }
    halfPlane(ctx, d, e, k, p);
    if (k < 3) { ctx.fillStyle = g; ctx.fill(); }
    if (k === 3) { ctx.save(); halfPlane(ctx, d, e, k, p); ctx.clip(); drawB(); ctx.restore(); }
  }
}

// Star iris: scene B opens inside a growing, turning clay star (Stella's shape) with a gold rim.
function starPath(ctx, cx, cy, r, rot) {
  const v = [];
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r;
    v.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  const m0 = mid(v[9], v[0]); ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < 10; i++) {
    const a = v[i], m = mid(a, v[(i + 1) % 10]);
    ctx.arcTo(a[0], a[1], m[0], m[1], r * (i % 2 ? 0.16 : 0.1));
  }
  ctx.closePath();
}
function star(ctx, p, lk, drawB) {
  const cx = lk.at[0] * W, cy = lk.at[1] * H;
  const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
  // pops in at a readable size, then grows at a constant rate (log space) until it covers the frame
  const r1 = (far / 0.5) * 1.12, r0 = 70;
  const k = clamp((p - 0.04) / 0.84);
  const r = r0 * (r1 / r0) ** k * E.outCubic(clamp(p / 0.1)), rot = 0.9 * (1 - E.outCubic(p));
  const rim = clamp(r * 0.075, 7, 80);
  if (r * 0.5 > far * 1.05) { drawB(); return; }   // the star already covers the frame
  for (const [off, a] of [[22, 0.12], [13, 0.16], [6, 0.2]]) {
    starPath(ctx, cx, cy + off * 0.6, r + rim + off, rot); ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fill();
  }
  ctx.save();
  starPath(ctx, cx, cy, r + rim, rot);
  const g = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.4, cx, cy, r + rim);
  g.addColorStop(0, PAL.gold); g.addColorStop(0.85, PAL.gold); g.addColorStop(1, PAL.goldDeep);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save(); starPath(ctx, cx, cy, r + rim * 0.55, rot); ctx.strokeStyle = M.mix(PAL.gold, '#ffffff', 0.35);
  ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(2, rim * 0.12); ctx.stroke(); ctx.restore();
  if (r > 4) { ctx.save(); starPath(ctx, cx, cy, r, rot); ctx.clip(); drawB(); ctx.restore(); }
  ctx.save(); starPath(ctx, cx, cy, r, rot); ctx.strokeStyle = 'rgba(40,20,0,0.45)'; ctx.lineWidth = Math.max(2, rim * 0.18); ctx.stroke(); ctx.restore();
}

function transition(ctx, tr, p, t) {
  const lk = LOOK[tr.name];
  // the camera leans into the wipe on A and carries the move on into B
  shot(ctx, S[lk.A], t, lerp(lk.aR[0], lk.aR[1], p), { dolly: 1.8 * E.inCubic(p) });
  const drawB = () => shot(ctx, S[lk.B], t, lerp(lk.bR[0], lk.bR[1], p), { dolly: -1.8 * (1 - E.outCubic(p)) });
  (lk.style === 'star' ? star : bands)(ctx, p, lk, drawB);
}

M.film({
  fonts: [M.font(100, 600, 'Display'), M.font(40, 700, 'UI')],
  images: { logo: 'assets/logos/niticore.svg' },
  hits: HITS,
  samples: 8,
  async init(ctx, IMG) {
    await G.initGL({ font: 'fonts/display.ttf', exposure: 0.84 });
    setLipsync(await fetch('lipsync.json').then((r) => r.json()));
    STELLA = buildStella();
    S.title = titleSet(STELLA, IMG);
    S.cab = cabinetSet(STELLA);
    S.cal = calendarSet(STELLA);
    S.board = boardSet(STELLA);
    // warm-up: draw every set once (at moments when its props are visible) so all shaders compile
    // while the page loads. Compiling mid-render, with every worker page reaching the board at once,
    // stalled one frame past the renderer's 30 s capture limit.
    const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H;
    const sctx = scratch.getContext('2d');
    for (const [set, u] of [[S.title, 8], [S.title, 14], [S.cab, 33], [S.cab, 45], [S.cal, 53], [S.board, 63], [S.board, 72.5], [S.title, 84]]) {
      G.renderSet(sctx, set, M.TS(u), u);
    }
    // film grain tile
    GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256;
    const g = GRAIN.getContext('2d'), im = g.createImageData(256, 256), r = M.mulberry32(9);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
  },
  draw(ctx, uf, t) {
    M.fill(ctx, PAL.navyDeep);
    const at = toStory(uf);
    if (at.tr) transition(ctx, at.tr, at.p, t);
    else shot(ctx, setAt(at.us), t, at.us);
    const u = at.tr ? LOOK[at.tr.name].bR[0] : at.us;

    // footer on the sign-off
    const fk = E.outCubic(prog(u, 80.2, 81.2));
    if (fk > 0) {
      ctx.globalAlpha = fk;
      M.text(ctx, 'EU AI Act · Module 2 · Article 5', W / 2, H - 66 + (1 - fk) * 20, M.font(38, 700, 'UI'), PAL.gold, 'center', 1.5);
      ctx.globalAlpha = 1;
    }
  },
  post(ctx, u, t) {
    // dark neutral vignette (pulls the eye to the lit stage) + fine grain
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.5, H * 1.05);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const f = Math.floor(t * 60), r = M.mulberry32(f + 1);
    ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(GRAIN, x, y);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },
});
