// board.js: shots 6-7. Deep-forest room, a walnut-framed navy felt board "Art. 5 · Prohibited
// practices" with three solid clay cards (royal, violet, teal) and clay icons; a red "Banned" seal
// slams onto each as Stella names it; then the cards fly into an orange case file that slams shut on
// the walnut desk.
import { THREE } from '../lib/gl.js';
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';
import { clay, PAL, roundBox, cove } from './clay.js';
import { stageLights, talk, blink, idle, speaking, buildSeal, panelTex, faceMat } from './common.js';
import { canvasTex } from './clay.js';

const { springU, SPRING, prog, E, lerp, wobble, clamp, springKeys, bump } = M;

export const CARDS = [
  { lines: ['Social scoring'], color: PAL.royal, at: 60.0, stamp: 62.5 },
  { lines: ['Harmful', 'manipulation'], color: PAL.violet, at: 63.5, stamp: 66.5 },
  { lines: ['Untargeted', 'face scraping'], color: PAL.tealBright, at: 67.5, stamp: 70.5 },
];
const CX = [-2.75, 0, 2.75], CY = 2.55, CZ = -0.55;
const SKIN = '#E39A6B';
// the case file rests on a sloped clay stand so its cover faces the desk camera straight on
const TILT = 0.62, SLOPE = 3.0, STAND_Z = 3.9;
const NRM = [0, Math.cos(TILT), Math.sin(TILT)];
const FOLD = [0, 1.5 * Math.sin(TILT) + 0.07, STAND_Z - 1.5 * Math.cos(TILT)];

// right-triangle prism, flat on the desk, its top face rising toward the back at angle a
function wedge(width, a, len, mat) {
  const depth = len * Math.cos(a), h = len * Math.sin(a);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(depth, 0); s.lineTo(depth, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
  g.rotateY(Math.PI / 2); g.translate(-width / 2, 0, 0); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}

function cardTex(lines, color) {
  return panelTex(920, 1200, null, (c, w) => {
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.roundRect(50, 110, w - 100, 640, 30); c.fill();
    c.fillStyle = PAL.type; c.font = '600 112px Display';
    lines.forEach((l, i) => c.fillText(l, w / 2, (lines.length === 1 ? 950 : 885) + i * 128));
  });
}

function person(color, s = 1) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.13 * s, 0.18 * s, 6, 14), clay(color, { rough: 0.5, amp: 0.008, freq: 8 })); b.position.y = 0.2 * s; g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 20, 16), clay(SKIN, { rough: 0.55, amp: 0.006, freq: 9 })); h.position.y = 0.5 * s; g.add(h);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function smallStar(r = 0.09) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r; i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 });
  g.center();
  return g;
}

function faceDiscTex() {
  return canvasTex(256, 256, (c, w) => {
    c.fillStyle = PAL.gold; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, M.TAU); c.fill();
    c.fillStyle = PAL.ink; c.beginPath(); c.arc(90, 110, 16, 0, M.TAU); c.arc(166, 110, 16, 0, M.TAU); c.fill();
    c.strokeStyle = PAL.ink; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.arc(128, 150, 42, 0.35, Math.PI - 0.35); c.stroke();
  });
}

export function boardSet(stella) {
  const scene = new THREE.Scene(), cam = G.camera(30);
  stageLights(scene, { key: 3.7, keyPos: [-4, 11, 10], target: [0, 2.2, 0], angle: 0.62, rimColor: '#FFC46B', rim: 1.8, sky: '#8FD6B4', ground: '#04120D' });
  const bg = new THREE.Mesh(cove(90, 40, 3, 40), clay(PAL.forest, { rough: 0.85, amp: 0.03, freq: 0.8, sheen: 0.2, env: 0.2 }));
  bg.position.set(0, -0.3, -2.0); bg.receiveShadow = true; scene.add(bg);
  const desk = new THREE.Mesh(roundBox(18, 0.5, 9.6, 0.2, 3), clay(PAL.walnutDeep, { rough: 0.6, amp: 0.025, freq: 1.4 }));
  desk.position.set(0, -0.25, 2.7); desk.receiveShadow = true; scene.add(desk);

  // board
  const frame = new THREE.Mesh(roundBox(9.0, 5.1, 0.3, 0.14, 4), clay(PAL.walnut, { rough: 0.55, amp: 0.016, freq: 3 }));
  frame.position.set(0, 2.9, -1.1); frame.castShadow = true; frame.receiveShadow = true; scene.add(frame);
  const felt = new THREE.Mesh(roundBox(8.5, 4.6, 0.2, 0.08, 4), clay(PAL.navyDeep, { rough: 0.95, amp: 0.03, freq: 9, sheen: 0.6 }));
  felt.position.set(0, 2.9, -0.92); felt.receiveShadow = true; scene.add(felt);
  const plate = new THREE.Group(); plate.position.set(0, 5.1, -0.68); scene.add(plate);
  const plateBody = new THREE.Mesh(roundBox(5.8, 0.8, 0.16, 0.1, 3), clay(PAL.gold, { rough: 0.45, amp: 0.01 })); plateBody.castShadow = true; plate.add(plateBody);
  const plateFace = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 0.76), faceMat(panelTex(1800, 240, null, (c, w, h) => {
    c.fillStyle = PAL.ink; c.font = '600 124px Display'; c.fillText('Art. 5 · Prohibited practices', w / 2, h / 2 + 6);
  })));
  plateFace.position.z = 0.085; plate.add(plateFace);

  // cards
  const clipM = clay(PAL.charcoal, { rough: 0.35, amp: 0.003, env: 0.8 });
  const wire = clay(PAL.steel, { rough: 0.25, amp: 0.002, env: 1.0 });
  const cards = CARDS.map((d) => {
    const g = new THREE.Group(); scene.add(g);
    const body = new THREE.Mesh(roundBox(2.35, 3.05, 0.08, 0.07, 3), clay(d.color, { rough: 0.55, amp: 0.01, freq: 4 }));
    body.castShadow = true; body.receiveShadow = true; g.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 3.0), faceMat(cardTex(d.lines, d.color)));
    face.position.z = 0.043; g.add(face);
    const clip = new THREE.Mesh(roundBox(0.72, 0.34, 0.18, 0.05, 2), clipM); clip.position.set(0, 1.52, 0.05); clip.castShadow = true; g.add(clip);
    const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.026, 8, 24, Math.PI), wire); w1.position.set(0, 1.68, 0.07); w1.rotation.x = -0.6; g.add(w1);
    const icon = new THREE.Group(); icon.position.set(0, 0.55, 0.07); g.add(icon);
    const seal = buildSeal('Banned', null, 2.0, 0.82); seal.position.set(0, 0.02, 0.55); g.add(seal);
    return { g, icon, seal, ...d };
  });

  // icon 1: social scoring (three people, star ratings above)
  const ppl = [[PAL.gold, 1], [PAL.emerald, 3], [PAL.orange, 2]].map(([col, n], k) => {
    const p = person(col, 0.95); p.position.set(-0.6 + k * 0.6, -0.55, 0.12); cards[0].icon.add(p);
    const stars = [];
    for (let s = 0; s < n; s++) { const st = new THREE.Mesh(smallStar(0.085), clay(PAL.gold, { amp: 0.004 })); st.position.set(-0.6 + k * 0.6 + (s - (n - 1) / 2) * 0.17, 0.25, 0.15); st.castShadow = true; cards[0].icon.add(st); stars.push(st); }
    return { p, stars };
  });
  // icon 2: harmful manipulation (a puppet on strings)
  const puppet = person(PAL.gold, 1.05); cards[1].icon.add(puppet);
  const crossM = clay(PAL.walnut, { rough: 0.55, amp: 0.008 });
  const cross = new THREE.Group(); cross.position.set(0, 0.5, 0.16); cards[1].icon.add(cross);
  const cb1 = new THREE.Mesh(roundBox(0.9, 0.09, 0.09, 0.03, 2), crossM); cb1.castShadow = true; cross.add(cb1);
  const cb2 = new THREE.Mesh(roundBox(0.09, 0.09, 0.5, 0.03, 2), crossM); cross.add(cb2);
  const strM = new THREE.MeshStandardMaterial({ color: PAL.type, roughness: 0.7 });
  const strings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 6), strM); cards[1].icon.add(m); return m; });
  // icon 3: untargeted face scraping (faces pulled through a funnel into a database)
  const fTex = faceDiscTex();
  const discM = [clay(PAL.goldDeep, { amp: 0.003 }), new THREE.MeshStandardMaterial({ map: fTex, roughness: 0.6 }), clay(PAL.goldDeep)];
  const faces = Array.from({ length: 7 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), discM); m.castShadow = true; cards[2].icon.add(m); return m; });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.1, 0.45, 32, 1, true), clay(PAL.steel, { rough: 0.35, amp: 0.004, side: THREE.DoubleSide }));
  funnel.position.set(0, -0.25, 0.15); funnel.castShadow = true; cards[2].icon.add(funnel);
  const dbM = clay(PAL.charcoal, { rough: 0.4, amp: 0.004 });
  for (let k = 0; k < 3; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.13, 28), dbM); d.position.set(0, -0.77 + k * 0.15, 0.15); d.castShadow = true; cards[2].icon.add(d); }

  // case file on the desk
  const stand = wedge(4.2, TILT, SLOPE, clay(PAL.charcoal, { rough: 0.55, amp: 0.012, freq: 3 })); stand.position.set(0, 0, STAND_Z); scene.add(stand);
  const folder = new THREE.Group(); folder.position.set(...FOLD); folder.rotation.x = TILT; scene.add(folder);
  const orange = clay(PAL.orange, { rough: 0.6, amp: 0.008, freq: 3 });
  const backC = new THREE.Mesh(roundBox(3.6, 0.05, 2.6, 0.02, 2), orange); backC.receiveShadow = true; backC.castShadow = true; folder.add(backC);
  const tab = new THREE.Mesh(roundBox(1.3, 0.05, 0.35, 0.02, 2), orange); tab.position.set(-0.9, 0, -1.43); folder.add(tab);
  const lid = new THREE.Group(); lid.position.set(-1.8, 0.05, 0); folder.add(lid);
  const lidBody = new THREE.Mesh(roundBox(3.6, 0.05, 2.6, 0.02, 2), clay('#E0581A', { rough: 0.6, amp: 0.008, freq: 3 })); lidBody.position.x = 1.8; lidBody.castShadow = true; lidBody.receiveShadow = true; lid.add(lidBody);
  const lidFace = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.5), faceMat(panelTex(1400, 1000, null, (c) => {
    c.textAlign = 'left';
    c.fillStyle = PAL.ink; c.font = '700 70px UI'; c.fillText('File:', 110, 250);
    c.fillStyle = PAL.type; c.font = '600 118px Display'; c.fillText('Prohibited AI', 110, 395); c.fillText('practices', 110, 530);
    c.fillStyle = 'rgba(26,18,16,0.45)'; c.fillRect(110, 640, 1180, 7);
    c.fillStyle = PAL.ink; c.font = '700 74px UI'; c.fillText('EU AI Act · Article 5', 110, 760);
  })));
  lidFace.rotation.x = -Math.PI / 2; lidFace.position.set(1.8, 0.03, 0); lid.add(lidFace);

  const set = {
    scene, camera: cam, fx: { ao: 1.0, dof: 0.0013 },
    update(t, u) {
      scene.add(stella.root);
      const id = idle(t), bl = blink(t), speak = speaking(t);
      const shake = 0.05 * CARDS.reduce((a, d) => a + Math.sin(u * 40) * Math.exp(-Math.max(0, u - d.stamp) * 4) * (u >= d.stamp ? 1 : 0), 0);
      const [cx, cy, cz, tx, ty, tz] = springKeys(u, [
        [55, [-0.9, 3.2, 15.0, -0.9, 2.85, 0]],
        [59.6, [CX[0] * 0.12 - 0.8, 3.0, 14.2, CX[0] * 0.12 - 0.8, 2.75, 0]],
        [63.2, [CX[1] * 0.12 - 0.8, 3.0, 14.2, CX[1] * 0.12 - 0.8, 2.75, 0]],
        [67.2, [CX[2] * 0.12 - 0.8, 3.0, 14.2, CX[2] * 0.12 - 0.8, 2.75, 0]],
        [71.2, [0.8, FOLD[1] + 5.9, FOLD[2] + 7.0, 0.8, FOLD[1] + 0.1, FOLD[2]]],
      ], SPRING.gentle);
      G.lookFrom(cam, [cx + shake, cy + shake, cz], [tx, ty, tz], shake * 0.2);
      set.focus = cam.position.distanceTo(new THREE.Vector3(tx, ty, tz));

      // cards hop onto the board, pop when named, get sealed, then fly into the folder
      const lidK = E.inOutCubic(prog(u, 73.7, 74.7));
      cards.forEach((c, i) => {
        const inK = springU(u, 57.4 + i * 0.5, SPRING.bouncy);
        const named = springU(u, c.at, SPRING.bouncy) - springU(u, c.at + 3.6, SPRING.gentle);
        const hit = u >= c.stamp ? wobble(u - c.stamp, 3, 5) : 0;
        const fly = E.inOutCubic(prog(u, 71.6 + i * 0.25, 72.9 + i * 0.25));
        const off = 0.07 + i * 0.03;
        const dst = [lerp(-0.3, 0.3, i / 2), FOLD[1] + NRM[1] * off, FOLD[2] + NRM[2] * off];
        const x = lerp(CX[i], dst[0], fly), y = lerp(CY + (1 - inK) * 6, dst[1], fly) + Math.sin(Math.PI * fly) * 1.5, z = lerp(CZ + 0.35 * named, dst[2], fly);
        c.g.position.set(x, y, z);
        c.g.rotation.set(lerp(0, -(Math.PI / 2 - TILT), fly), 0, lerp((1 - inK) * 0.5 * (i - 1) + 0.03 * (i - 1) + 0.04 * hit, 0.05 * (i - 1), fly));
        const s = (1 + 0.07 * named) * lerp(1, 0.62, fly);
        c.g.scale.set(s * (1 + 0.04 * hit), s * (1 - 0.04 * hit), s);
        c.g.visible = !(lidK > 0.6 && u > 74.4);
        // the seal flies in from the camera and slams
        const sk = prog(u, c.stamp - 0.45, c.stamp);
        c.seal.visible = u >= c.stamp - 0.45;
        const ss = lerp(4, 1, E.inQuad(sk)) * (1 + 0.08 * (u >= c.stamp ? wobble(u - c.stamp, 3, 6) : 0));
        c.seal.scale.set(ss, ss, 1);
        c.seal.position.z = 0.55 + (1 - E.inQuad(sk)) * 3;
        c.seal.rotation.z = lerp(-0.6, -0.13 + 0.06 * (i - 1), E.inQuad(sk));
      });
      // icons
      ppl.forEach((p, k) => {
        const hop = Math.max(0, Math.sin(t * 5 + k * 1.3)) * 0.08 * (1 + bump(u, 60.6, 1.5));
        p.p.position.y = -0.55 + hop;
        p.stars.forEach((s, j) => { s.rotation.y = t * 2 + j; s.position.y = 0.25 + hop + Math.sin(t * 3 + j) * 0.02; });
      });
      const sway = Math.sin(t * 2.2) * 0.3 * (1 + bump(u, 64, 1.5));
      cross.rotation.set(0, 0, sway * 0.5);
      puppet.position.set(Math.sin(t * 2.2 - 0.4) * 0.12, -0.6 + Math.abs(Math.sin(t * 2.2)) * 0.06, 0.12);
      puppet.rotation.z = -sway * 0.3;
      const ends = [-0.42, 0.42, 0];
      const attach = [[puppet.position.x - 0.22, puppet.position.y + 0.25, 0.12], [puppet.position.x + 0.22, puppet.position.y + 0.25, 0.12], [puppet.position.x, puppet.position.y + 0.62, 0.12]];
      strings.forEach((m, k) => {
        const ca = Math.cos(cross.rotation.z), sa = Math.sin(cross.rotation.z);
        const a = new THREE.Vector3(cross.position.x + ends[k] * ca, cross.position.y + ends[k] * sa, cross.position.z);
        const b = new THREE.Vector3(...attach[k]);
        const d = b.clone().sub(a);
        m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.scale.set(1, d.length(), 1);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      });
      faces.forEach((m, k) => {
        const ph = ((t * 0.45 + k / faces.length) % 1);
        const a = -Math.PI / 2 + (k - 3) * 0.5;
        const x0 = Math.cos(a + Math.PI) * 0.75 * (k % 2 ? 1 : -1), y0 = 0.45 - (k % 3) * 0.12;
        const p = E.inQuad(ph);
        m.position.set(lerp(x0 * 0.9, 0, p), lerp(y0, -0.2, p), 0.2);
        m.scale.setScalar(Math.max(0.001, lerp(1, 0.25, p) * clamp(ph * 8) * clamp((1 - ph) * 10)));
        m.rotation.set(Math.PI / 2, p * 4 * (k % 2 ? 1 : -1), 0);
      });

      // the case file pops onto the desk just before the cards fly in; the lid closes
      const fIn = springU(u, 71.85, SPRING.bouncy);
      folder.visible = u >= 71.8;
      folder.position.set(FOLD[0], FOLD[1] + (1 - Math.min(1, fIn)) * 0.5, FOLD[2]);
      stand.visible = u >= 71.6;
      const sIn = Math.max(0.001, springU(u, 71.6, SPRING.snappy)); stand.scale.set(1, sIn, 1);
      lid.rotation.z = lerp(Math.PI * 0.97, 0, lidK);
      const fs = Math.max(0.001, fIn);
      folder.scale.set(fs, fs * (1 + 0.6 * (u > 74.7 ? wobble(u - 74.7, 3, 6) : 0)), fs);

      // Stella
      if (u < 71.4) {
        const active = u < 63.5 ? 0 : u < 67.5 ? 1 : 2;
        const pos = [lerp(-6.4, -5.1, springU(u, 55.8, SPRING.gentle)), 2.7 + id.bob, 0.9];
        const slam = CARDS.reduce((a, c) => a + bump(u, c.stamp, 0.45), 0);
        const pointK = u >= 59.6 ? clamp((u - 59.6) * 2) : 0;
        stella.pose({
          pos, scale: 0.92, squash: (1 - 0.1 * slam) * id.breath, lean: id.sway - 0.08 * pointK,
          rotY: 0.4, blink: bl, look: [0.85, -0.05 - 0.15 * slam],
          brows: 0.3 + 0.2 * speak - 0.4 * slam, browAngle: -0.5 * slam,
          mouth: slam > 0.3 && talk(t) < 0.15 ? { open: 0.3, smile: 0.4, wide: 1.2 } : { open: talk(t) * 1.1, smile: 0.75 },
          handR: slam > 0.05 ? [0.95, 0.35 - 0.8 * slam, 0.35] : pointK > 0 ? [1.1, 0.0 + 0.08 * Math.sin(t * 3), 0.35] : [0.95, -0.3 + 0.12 * speak * Math.sin(t * 2.4), 0.25],
          point: [0, pointK * (1 - slam)],
          handL: [-0.95, -0.3 + 0.12 * speak * Math.sin(t * 2.1), 0.25],
        });
      } else {
        const k = springU(u, 71.6, SPRING.gentle);
        const pat = bump(u, 75.2, 0.5) + bump(u, 75.9, 0.4);
        const pos = [lerp(-3, 3.3, k), lerp(2.6, 1.0, k) + id.bob, lerp(2.5, 2.9, k)];
        stella.pose({
          pos, scale: 0.85, squash: (1 - 0.1 * pat) * id.breath, lean: id.sway + 0.12, rotY: -0.25, blink: bl, look: [-0.6, -0.6],
          brows: 0.3, mouth: { open: talk(t) * 1.1, smile: 0.85 },
          handL: [-1.45, -0.02 - 0.16 * pat, -0.2], handR: [0.95, -0.3 + 0.1 * speaking(t) * Math.sin(t * 2.4), 0.2],
        });
      }
    },
  };
  return set;
}
