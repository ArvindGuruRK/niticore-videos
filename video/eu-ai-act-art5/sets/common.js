// common.js: studio lighting, Stella's performance helpers (talk, blink, idle), shared props (rubber
// stamp, "Banned" seal) and small helpers. All pure functions of (t, u).
import { THREE } from '../lib/gl.js';
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';
import { clay, PAL, roundBox, canvasTex, speckle } from './clay.js';

// A miniature-set rig: a warm spotlight key (soft pool + soft shadows), a coloured rim from behind,
// a dim front fill and a low hemisphere tinted by the backdrop. Environment light kept low so the
// deep solids stay deep.
export function stageLights(scene, { key = 3.6, keyPos = [-4, 10, 9], target = [0, 1, 0], angle = 0.6, penumbra = 0.8,
  warm = '#FFE0B2', rim = 2.4, rimColor = '#6F95FF', rimPos = [7, 6, -6], fill = 0.55, hemi = 0.35, sky = '#9DB4FF', ground = '#2A1A10', box = 9 } = {}) {
  scene.environment = G.ENV;
  scene.environmentIntensity = 0.3;
  const k = new THREE.SpotLight(warm, key, 0, angle, penumbra, 0);
  k.position.set(...keyPos); k.target.position.set(...target);
  k.castShadow = true; k.shadow.mapSize.set(2048, 2048); k.shadow.radius = 7; k.shadow.bias = -0.0004; k.shadow.normalBias = 0.02;
  k.shadow.camera.near = 1; k.shadow.camera.far = 60;
  scene.add(k); scene.add(k.target);
  const r = new THREE.DirectionalLight(rimColor, rim); r.position.set(...rimPos); scene.add(r);
  const f = new THREE.DirectionalLight('#FFF4E6', fill); f.position.set(3, 3, 10); scene.add(f);
  scene.add(new THREE.HemisphereLight(sky, ground, hemi));
  return k;
}

// ---------------------------------------------------------------- Stella's performance

let LIP = null;
export function setLipsync(j) { LIP = j; }
export function talk(t) {
  if (!LIP) return 0;
  const f = t * LIP.rate, i = Math.floor(f), a = LIP.open[i] ?? 0, b = LIP.open[i + 1] ?? 0;
  return a + (b - a) * (f - i);
}
export function speaking(t) {
  if (!LIP) return 0;
  let k = 0;
  for (const p of LIP.phrases) k = Math.max(k, M.clamp((t - p.t0 + 0.15) / 0.3) * M.clamp((p.t1 + 0.25 - t) / 0.3));
  return k;
}
const BLINKS = (() => { const r = M.mulberry32(42), out = []; let t = 1.3; while (t < 60) { out.push(t); t += 2.4 + r() * 1.8; } return out; })();
export function blink(t) {
  let b = 0;
  for (const bt of BLINKS) b = Math.max(b, M.bump(t, bt, 0.085));
  return b;
}
export function idle(t, amp = 1) {
  return { bob: Math.sin(t * 2.6) * 0.045 * amp, sway: Math.sin(t * 1.3 + 0.4) * 0.03 * amp, breath: 1 + Math.sin(t * 2.6 + 1.2) * 0.012 * amp };
}

// log-space camera pull between two framings (constant-rate dolly)
export function dolly(from, to, p) {
  const fl = new THREE.Vector3(...from.look), tl = new THREE.Vector3(...to.look);
  const fo = new THREE.Vector3(...from.pos).sub(fl), to_ = new THREE.Vector3(...to.pos).sub(tl);
  const a = fo.length(), b = to_.length();
  const dir = fo.normalize().lerp(to_.normalize(), p).normalize();
  const look = fl.lerp(tl, p);
  const pos = look.clone().add(dir.multiplyScalar(a * (b / a) ** p));
  return { pos: pos.toArray(), look: look.toArray() };
}

// ---------------------------------------------------------------- rubber stamp + seal

export function buildStamp() {
  const g = new THREE.Group();
  const wood = clay(PAL.walnut, { rough: 0.55, amp: 0.012, freq: 5 });
  const red = clay(PAL.crimson, { rough: 0.45, amp: 0.01, freq: 5 });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 24), red); knob.position.y = 1.1; g.add(knob);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.66, 24), wood); neck.position.y = 0.7; g.add(neck);
  const block = new THREE.Mesh(roundBox(1.2, 0.36, 0.78, 0.08, 3), wood); block.position.y = 0.22; g.add(block);
  const pad = new THREE.Mesh(roundBox(1.12, 0.09, 0.7, 0.03, 2), clay(PAL.crimsonDeep, { rough: 0.7 })); pad.position.y = 0.02; g.add(pad);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return g;
}

// a solid red clay seal with cream lettering (what the stamp leaves behind)
export function buildSeal(text, sub = null, w = 2.0, h = 0.82) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(roundBox(w, h, 0.18, 0.07, 3), clay(PAL.red, { rough: 0.5, amp: 0.008, freq: 5 }));
  body.castShadow = true; g.add(body);
  const tex = canvasTex(1000, Math.round(1000 * h / w), (c, cw, ch) => {
    c.strokeStyle = PAL.type; c.lineWidth = 14; c.beginPath(); c.roundRect(26, 26, cw - 52, ch - 52, 22); c.stroke();
    c.fillStyle = PAL.type; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `600 ${sub ? 170 : 210}px Display`; c.fillText(text, cw / 2, sub ? ch * 0.42 : ch / 2 + 8);
    if (sub) { c.font = '700 84px UI'; c.fillText(sub, cw / 2, ch * 0.77); }
    const r = M.mulberry32(text.length * 13 + 5);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) { c.globalAlpha = 0.2 + r() * 0.5; c.beginPath(); c.arc(r() * cw, r() * ch, 1 + r() * 4, 0, M.TAU); c.fill(); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.97, h * 0.95), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5 }));
  face.position.z = 0.092; g.add(face);
  return g;
}

// text painted on a solid panel: returns a CanvasTexture
export function panelTex(w, h, bg, draw, { radius = 40, seed = 3 } = {}) {
  return canvasTex(w, h, (c) => {
    if (bg) { c.fillStyle = bg; c.beginPath(); c.roundRect(0, 0, w, h, radius); c.fill(); speckle(c, w, h, seed, Math.round((w * h) / 500), 0.06); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    draw(c, w, h);
  });
}
export const faceMat = (tex) => new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.65 });

// clay crumbs thrown from an impact: positions are closed-form (ballistic, one bounce, slide to rest)
export function crumbs(n, color, seed = 7) {
  const r = M.mulberry32(seed);
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const mesh = new THREE.InstancedMesh(geo, clay(color, { amp: 0.004 }), n);
  mesh.castShadow = true;
  const P = Array.from({ length: n }, () => ({
    a: r() * M.TAU, sp: 1.5 + r() * 3.2, up: 2.5 + r() * 4, s: 0.04 + r() * 0.07, spin: (r() - 0.5) * 12, dx: (r() - 0.5) * 1.6,
  }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  mesh.place = (origin, dt, zMax = Infinity) => {
    P.forEach((p, i) => {
      if (dt < 0) { m4.makeScale(0, 0, 0); mesh.setMatrixAt(i, m4); return; }
      const g = 14, tLand = (2 * p.up) / g;
      const tt = Math.min(dt, tLand), slide = Math.max(0, dt - tLand);
      const horiz = p.sp * tt + p.sp * 0.35 * (1 - Math.exp(-slide * 3)) / 3;
      const y = Math.max(0, p.up * tt - 0.5 * g * tt * tt) + p.s;
      v.set(origin[0] + p.dx + Math.cos(p.a) * horiz, y, Math.min(zMax, origin[2] + Math.sin(p.a) * horiz * 0.6 + 0.3));
      e.set(p.spin * tt, p.spin * 0.7 * tt, 0); q.setFromEuler(e);
      sc.set(p.s, p.s * 0.8, p.s);
      m4.compose(v, q, sc); mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}
