// clay.js: the plasticine look. A physical material whose normals are perturbed by a procedural
// 3-D noise (lumps + tool marks + fine grain) in object space, so it sticks to the object and needs no
// UVs; CPU helpers to make geometry a little lumpy; the shared palette and canvas textures.
import { THREE } from '../lib/gl.js';
import * as M from '../lib/motion.js';

export const PAL = {
  // backdrops: deep solids, one per scene
  navy: '#141B3D', navyDeep: '#0B1029', teal: '#0A4652', tealDeep: '#052D35',
  plum: '#3A1646', plumDeep: '#230A2C', forest: '#123D31', forestDeep: '#09271F',
  // props: saturated solids
  crimson: '#C8102E', crimsonDeep: '#8A0A1F', red: '#E01E2E', gold: '#FFB000', goldDeep: '#D98200',
  orange: '#F26419', royal: '#1F45C8', blue: '#3D6BFF', emerald: '#0E9A58', emeraldDeep: '#09703F',
  amber: '#F59E0B', violet: '#6A2BD6', tealBright: '#0E8C99', walnut: '#5A3220', walnutDeep: '#38190D',
  charcoal: '#22252D', steel: '#56607A',
  // character
  star: '#FFB000', cheek: '#EE4B35', limb: '#2A170D', glove: '#FFF6E8', shoe: '#F26419', eyeWhite: '#FFFAF0', pupil: '#120B07',
  // type on the solids
  type: '#FFF1D6', ink: '#1A1210',
};

const NOISE = /* glsl */ `
varying vec3 vClayPos;
uniform float uClayAmp, uClayFreq;
float clayHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float clayVN(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(clayHash(i), clayHash(i + vec3(1,0,0)), f.x), mix(clayHash(i + vec3(0,1,0)), clayHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(clayHash(i + vec3(0,0,1)), clayHash(i + vec3(1,0,1)), f.x), mix(clayHash(i + vec3(0,1,1)), clayHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float clayH(vec3 p) {
  float h = clayVN(p) * 0.55 + clayVN(p * 2.7 + 3.1) * 0.25 + clayVN(p * 9.0 + 7.7) * 0.08;
  h += 0.05 * sin(dot(p, vec3(5.3, 3.7, 2.9)) * 2.0 + clayVN(p * 0.8) * 7.0);   // thumb / tool strokes
  // fingerprints: concentric ridges in sparse patches
  vec3 cc = floor(p * 0.6); vec3 q = fract(p * 0.6) - 0.5;
  float on = step(0.6, clayHash(cc + 11.0));
  float rr = length(q.xy + (vec2(clayHash(cc), clayHash(cc + 3.0)) - 0.5) * 0.3);
  h += on * 0.035 * sin(rr * 110.0) * smoothstep(0.42, 0.08, rr);
  return h;
}
vec3 clayPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {
  vec3 sx = dFdx(surf_pos), sy = dFdy(surf_pos);
  vec3 R1 = cross(sy, surf_norm), R2 = cross(surf_norm, sx);
  float det = dot(sx, R1) * faceDir;
  vec3 g = sign(det) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(det) * surf_norm - g);
}
`;

// color: hex; amp: bump height in object units; freq: noise cycles per object unit
export function clay(color, { rough = 0.58, amp = 0.016, freq = 5, sheen = 0.55, env = 0.35, map = null, emissive = null, emissiveIntensity = 1, transparent = false, side = THREE.FrontSide } = {}) {
  const c = new THREE.Color(color);
  const m = new THREE.MeshPhysicalMaterial({
    color: c, roughness: rough, metalness: 0, sheen, sheenRoughness: 0.6,
    sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.55), envMapIntensity: env, map, transparent, side,
  });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveIntensity; }
  m.userData.amp = amp; m.userData.freq = freq;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uClayAmp = { value: m.userData.amp };
    sh.uniforms.uClayFreq = { value: m.userData.freq };
    m.userData.shader = sh;
    sh.vertexShader = 'varying vec3 vClayPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvClayPos = position;');
    sh.fragmentShader = NOISE + '\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>',
      '#include <normal_fragment_maps>\n{ float hh = clayH(vClayPos * uClayFreq) * uClayAmp; normal = clayPerturb(-vViewPosition, normal, vec2(dFdx(hh), dFdy(hh)), faceDirection); }\n');
  };
  m.customProgramCacheKey = () => 'clay' + (map ? 'm' : '');
  return m;
}

// ---------------------------------------------------------------- geometry helpers

function noise3(x, y, z, seed = 1) {
  const h = (i, j, k) => M.hash01(((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) | 0, seed);
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(fx), v = s(fy), w = s(fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
           L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
}

// vertex normals averaged over vertices that share a position (no seams)
export function smoothNormals(geo) {
  geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, acc = new Map();
  const key = (i) => `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
  for (let i = 0; i < p.count; i++) {
    const k = key(i), a = acc.get(k) || [0, 0, 0];
    a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); acc.set(k, a);
  }
  for (let i = 0; i < p.count; i++) {
    const a = acc.get(key(i)), l = Math.hypot(...a) || 1;
    n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l);
  }
  n.needsUpdate = true;
  return geo;
}

// push each vertex along its (seamless) normal by low-frequency noise: hand-made wobble
export function lumpy(geo, amp = 0.02, freq = 2.5, seed = 1) {
  smoothNormals(geo);
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = (noise3(x * freq, y * freq, z * freq, seed) - 0.5) * 2 * amp;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  p.needsUpdate = true;
  return smoothNormals(geo);
}

// a rounded box (pillowy edges) without the addon: a subdivided box whose corners are rounded by
// clamping each vertex into the inner box and pushing it out by r along the offset
export function roundBox(w, h, d, r = 0.08, seg = 6) {
  const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2);
  const p = g.attributes.position, ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const cx = M.clamp(x, -ix, ix), cy = M.clamp(y, -iy, iy), cz = M.clamp(z, -iz, iz);
    const dx = x - cx, dy = y - cy, dz = z - cz, l = Math.hypot(dx, dy, dz) || 1;
    p.setXYZ(i, cx + (dx / l) * r, cy + (dy / l) * r, cz + (dz / l) * r);
  }
  return smoothNormals(g);
}

// floor that curves up into a wall (photo cove). Floor toward +z, wall at z = 0 rising in +y.
export function cove(width = 60, floor = 30, radius = 6, wall = 30, segX = 2, segS = 120) {
  const L = floor + (Math.PI / 2) * radius + wall;
  const g = new THREE.PlaneGeometry(width, L, segX, segS);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), s = (p.getY(i) + L / 2);   // 0 at the front edge
    let y, z;
    if (s < floor) { y = 0; z = floor - s + radius; }
    else if (s < floor + (Math.PI / 2) * radius) { const a = (s - floor) / radius; y = radius - Math.cos(a) * radius; z = radius - Math.sin(a) * radius + 0; z = radius - Math.sin(a) * radius; }
    else { y = radius + (s - floor - (Math.PI / 2) * radius); z = 0; }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- canvas textures

export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  draw(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.redraw = (fn) => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); fn(c, w, h); t.needsUpdate = true; };
  return t;
}

// soft speckle so painted surfaces don't look printed
export function speckle(c, w, h, seed = 1, n = 900, alpha = 0.05) {
  const r = M.mulberry32(seed);
  for (let i = 0; i < n; i++) {
    c.fillStyle = r() < 0.5 ? `rgba(60,36,20,${alpha * r()})` : `rgba(255,250,235,${alpha * r()})`;
    c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 4, 0, M.TAU); c.fill();
  }
}

export function stripesTex(w = 1024, h = 512, n = 16) {
  return canvasTex(w, h, (c) => {
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? PAL.stripe : PAL.beige; c.fillRect((i * w) / n, 0, w / n + 1, h); }
    speckle(c, w, h, 7, 2500, 0.06);
  });
}

export function woodTex(w = 1024, h = 1024, seed = 5) {
  return canvasTex(w, h, (c) => {
    c.fillStyle = PAL.wood; c.fillRect(0, 0, w, h);
    const r = M.mulberry32(seed);
    const planks = 6;
    for (let p = 0; p < planks; p++) {
      const y0 = (p * h) / planks, ph = h / planks;
      c.fillStyle = M.mix(PAL.wood, p % 2 ? PAL.woodLight : PAL.woodDark, 0.25 + r() * 0.2);
      c.fillRect(0, y0, w, ph);
      for (let k = 0; k < 26; k++) {
        c.strokeStyle = `rgba(${r() < 0.5 ? '40,22,12' : '140,96,62'},${0.12 + r() * 0.18})`;
        c.lineWidth = 1 + r() * 3;
        const yy = y0 + r() * ph, a = r() * 6, f = 0.004 + r() * 0.006;
        c.beginPath();
        for (let x = 0; x <= w; x += 16) c.lineTo(x, yy + Math.sin(x * f + a) * (3 + r() * 4));
        c.stroke();
      }
      c.fillStyle = 'rgba(30,16,8,0.55)'; c.fillRect(0, y0, w, 4);
    }
  });
}

// label text on a texture; lines: [{text, font, color, y, align?}]
export function labelTex(w, h, bg, lines, { radius = 0, border = null, seed = 3 } = {}) {
  return canvasTex(w, h, (c) => {
    if (bg) {
      c.fillStyle = bg;
      if (radius) { c.beginPath(); c.roundRect(0, 0, w, h, radius); c.fill(); } else c.fillRect(0, 0, w, h);
      speckle(c, w, h, seed, Math.round((w * h) / 400), 0.05);
    }
    if (border) { c.strokeStyle = border.color; c.lineWidth = border.width; c.beginPath(); c.roundRect(border.inset, border.inset, w - 2 * border.inset, h - 2 * border.inset, border.radius || 0); c.stroke(); }
    for (const L of lines) {
      c.font = L.font; c.fillStyle = L.color; c.textAlign = L.align || 'center'; c.textBaseline = 'middle';
      if (L.track) c.letterSpacing = `${L.track}px`;
      c.fillText(L.text, L.x ?? (L.align === 'left' ? 40 : w / 2), L.y);
      c.letterSpacing = '0px';
    }
  });
}

// ---------------------------------------------------------------- 3-D type on a real baseline
// (lib/gl.js glyphs3D centres every glyph on its own box, which lifts descenders and dots off the
// line.) One mesh per glyph, x-centred on its advance, baseline at y = -0.36 * size so the row's
// cap height is centred on 0. Same return shape as glyphs3D.
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import * as GL from '../lib/gl.js';
const glyphCache = new Map();
export function glyphLine(str, size, depth, material, bevel = 0.03) {
  const F = GL.FONT, res = F.data.resolution;
  const group = new THREE.Group(), glyphs = [];
  let x = 0;
  const items = [];
  for (const ch of str) {
    const gd = F.data.glyphs[ch];
    const adv = gd ? (gd.ha * size) / res : size * 0.3;
    if (ch !== ' ' && gd) {
      const key = `${ch}|${size}|${depth}|${bevel}`;
      let geo = glyphCache.get(key);
      if (!geo) {
        geo = new TextGeometry(ch, { font: F, size, depth, curveSegments: 8, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 3 });
        geo.translate(-adv / 2, 0, -depth / 2);
        glyphCache.set(key, geo);
      }
      items.push([geo, x + adv / 2]);
    }
    x += adv;
  }
  for (const [geo, cx] of items) {
    const m = new THREE.Mesh(geo, material);
    m.userData.home = new THREE.Vector3(cx - x / 2, -0.36 * size, 0);
    m.position.copy(m.userData.home);
    group.add(m); glyphs.push(m);
  }
  return { group, glyphs, width: x };
}
