// title.js: the deep-navy stage. Shot 1 (hook: a giant crimson "5" slams onto the stage, "Article"
// hops in, Stella asleep in the ring), shot 2 (Stella wakes, shows her ID card), shots 8-9 (sign-off
// line, checklist, Niticore plaque). All type is clay standing on the stage floor.
import { THREE } from '../lib/gl.js';
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';
import { clay, PAL, cove, roundBox, canvasTex, glyphLine } from './clay.js';
import { stageLights, talk, blink, idle, speaking, dolly, panelTex, faceMat, crumbs } from './common.js';

const { springU, SPRING, prog, E, lerp, wobble, clamp } = M;

// a row of clay type standing on the floor (baseline y = 0), left edge at x
function standing(str, size, depth, mat, x, z) {
  const b = glyphLine(str, size, depth, mat, size * 0.05);
  b.group.position.set(x + b.width / 2, 0.36 * size, z);
  b.glyphs.forEach((g) => { g.castShadow = true; g.receiveShadow = true; });
  return b;
}

// a dark clay ledge under a row of type: letters sit on its front edge, descenders hang in front of it
const LEDGE = '#0A1238';
function ledge(width, size, depth, cx, z, mat) {
  const h = 0.3 * size, d = 0.8;
  const m = new THREE.Mesh(roundBox(width + 0.5 * size, h, d, Math.min(0.06, h / 2.2), 3), mat);
  m.position.set(cx, h / 2, z - depth / 2 - d / 2 + 0.12);
  m.castShadow = true; m.receiveShadow = true;
  m.userData.h = h;
  return m;
}

function starPath(c, cx, cy, R, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  c.closePath();
}

function idCardTex() {
  return panelTex(1600, 1000, PAL.tealBright, (c, w, h) => {
    c.fillStyle = PAL.gold; c.beginPath(); c.roundRect(0, 0, w, 210, [40, 40, 0, 0]); c.fill();
    c.fillStyle = PAL.ink; c.font = '600 96px Display'; c.fillText('Bureau of Compliance', w / 2, 110);
    c.fillStyle = PAL.navy; c.beginPath(); c.roundRect(90, 290, 460, 600, 36); c.fill();
    c.fillStyle = PAL.gold; starPath(c, 320, 585, 190, 92); c.fill();
    c.fillStyle = PAL.ink; c.beginPath(); c.ellipse(285, 565, 16, 22, 0, 0, M.TAU); c.ellipse(355, 565, 16, 22, 0, 0, M.TAU); c.fill();
    c.strokeStyle = PAL.ink; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.arc(320, 610, 34, 0.3, Math.PI - 0.3); c.stroke();
    const rows = [['Name', 'Stella the Standard'], ['Department', 'EU AI Act'], ['Clearance', 'AI']];
    c.textAlign = 'left';
    rows.forEach(([k, v], i) => {
      const y = 330 + i * 205;
      c.fillStyle = PAL.gold; c.font = '700 56px UI'; c.fillText(k, 640, y);
      c.fillStyle = PAL.type; c.font = '600 90px Display'; c.fillText(v, 640, y + 86);
      c.fillStyle = 'rgba(5,45,53,0.55)'; c.fillRect(640, y + 148, 860, 6);
    });
  });
}

export function titleSet(stella, IMG) {
  const scene = new THREE.Scene(), cam = G.camera(30);
  stageLights(scene, { key: 3.8, keyPos: [-3, 11, 10], target: [0, 1, 0], angle: 0.55, warm: '#FFE8D2', rimColor: '#5E86FF', sky: '#6F86E0', hemi: 0.25 });
  const bg = new THREE.Mesh(cove(90, 40, 5, 40), clay('#0F1850', { rough: 0.85, amp: 0.03, freq: 0.8, sheen: 0.15, env: 0.2 }));
  bg.position.z = -6.5; bg.receiveShadow = true; scene.add(bg);

  const goldM = clay(PAL.gold, { rough: 0.5, amp: 0.016, freq: 4 });
  const crimM = clay(PAL.crimson, { rough: 0.5, amp: 0.018, freq: 3.5 });
  const orangeM = clay(PAL.orange, { rough: 0.5, amp: 0.012, freq: 5 });
  const blueM = clay(PAL.blue, { rough: 0.55, amp: 0.01, freq: 6 });
  const typeM = clay(PAL.type, { rough: 0.6, amp: 0.012, freq: 5, sheen: 0.3 });

  // ---- shot 1: a podium facing the camera, everything centred. Top step: [Article][5] (ring);
  // floor ledge in front: "Prohibited AI practices"; "The EU AI Act · Module 2" on the back wall.
  const ledgeM = clay(LEDGE, { rough: 0.6, amp: 0.012, freq: 3, sheen: 0.3 });
  const art = glyphLine('Article', 1.55, 0.55, goldM, 0.07);
  const five = glyphLine('5', 2.5, 0.8, crimM, 0.1);
  const RING_R = 1.6, RING_T = 0.17, SH = 1.0, RZ = -0.2;
  const total = art.width + 0.3 + five.width + 1.0 + 2 * (RING_R + RING_T);
  const X0 = -total / 2;
  const artX = X0 + art.width / 2, fiveX = X0 + art.width + 0.3 + five.width / 2;
  const ringX = X0 + art.width + 0.3 + five.width + 1.0 + RING_R + RING_T;
  const step = new THREE.Mesh(roundBox(total + 1.2, SH, 2.4, 0.08, 3), ledgeM);
  step.position.set(0, SH / 2, RZ + 0.3 - 1.2); step.castShadow = true; step.receiveShadow = true; scene.add(step);
  art.group.position.set(artX, SH + 0.36 * 1.55, RZ); five.group.position.set(fiveX, SH + 0.36 * 2.5, RZ);
  [art, five].forEach((b) => { b.glyphs.forEach((g) => { g.castShadow = true; g.receiveShadow = true; }); scene.add(b.group); });
  const sub = standing('Prohibited AI practices', 0.66, 0.26, orangeM, 0, 1.7);
  const subLedge = ledge(sub.width, 0.66, 0.26, 0, 1.7, ledgeM); scene.add(subLedge);
  sub.group.position.set(0, 0.36 * 0.66 + subLedge.userData.h, 1.7);
  const head = glyphLine('The EU AI Act · Module 2', 0.5, 0.14, blueM, 0.025);
  head.group.position.set(0, 5.5, -6.35); scene.add(head.group);
  scene.add(sub.group);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_R, RING_T, 32, 160), crimM);
  ring.castShadow = true; ring.receiveShadow = true; scene.add(ring);
  const crumb = crumbs(34, PAL.crimson, 11); scene.add(crumb);

  // ---- ID card
  const card = new THREE.Group();
  const cardBody = new THREE.Mesh(roundBox(3.3, 2.06, 0.12, 0.1, 4), clay(PAL.tealBright, { rough: 0.6, amp: 0.008, freq: 4 }));
  cardBody.castShadow = true; card.add(cardBody);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.24, 2.02), faceMat(idCardTex()));
  face.position.z = 0.062; card.add(face);
  scene.add(card);

  // ---- sign-off
  const ES = 0.74;
  const l1 = standing('A compliant system', ES, 0.3, typeM, X0, -0.4);
  const l2a = standing('is a', ES, 0.3, typeM, X0, 1.25);
  const l2b = standing('happy', ES, 0.3, goldM, X0 + l2a.width + 0.28, 1.25);
  const l2c = standing('system.', ES, 0.3, typeM, X0 + l2a.width + l2b.width + 0.56, 1.25);
  // sign-off: a two-step podium facing the camera. Top step "A compliant system", lower step
  // "is a happy system.", the Niticore nameplate mounted on the lower step's face.
  const XC = -1.6, L2W = l2a.width + l2b.width + l2c.width + 0.56;
  const S1H = 1.45, S2H = 2.65, S1F = 1.3, S2F = 0.0;
  const step2 = new THREE.Mesh(roundBox(l1.width + 0.8, S2H, 2.0, 0.08, 3), ledgeM);
  step2.position.set(XC, S2H / 2, S2F - 1.0);
  const step1 = new THREE.Mesh(roundBox(L2W + 0.8, S1H, S1F - S2F + 0.2, 0.08, 3), ledgeM);
  step1.position.set(XC, S1H / 2, (S1F + S2F - 0.2) / 2);
  [step1, step2].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  l1.group.position.set(XC, S2H + 0.36 * ES, S2F - 0.1);
  const L2X = XC - L2W / 2, R2Y = S1H + 0.36 * ES, R2Z = S1F - 0.1;
  l2a.group.position.set(L2X + l2a.width / 2, R2Y, R2Z);
  l2b.group.position.set(L2X + l2a.width + 0.28 + l2b.width / 2, R2Y, R2Z);
  l2c.group.position.set(L2X + l2a.width + l2b.width + 0.56 + l2c.width / 2, R2Y, R2Z);
  // Stella in her ring stands to the right of the podium; the camera centres the whole group
  const PW = Math.max(l1.width, L2W) + 0.8;
  const ERS = 0.85, ERR = (RING_R + RING_T) * ERS;           // ring scale at the end
  const END_RX = XC + PW / 2 + 0.45 + ERR;
  const END_CX = (XC - PW / 2 + END_RX + ERR) / 2;
  const GW = END_RX + ERR - (XC - PW / 2);
  const END_D = GW / 0.88 / (2 * Math.tan(Math.PI / 12) * (16 / 9));   // group fills 82% of the width
  const endWords = [l1, l2a, l2b, l2c];
  endWords.forEach((b) => scene.add(b.group));
  const clip = new THREE.Group();
  const board = new THREE.Mesh(roundBox(1.0, 1.3, 0.08, 0.06, 3), clay(PAL.emerald, { amp: 0.008 })); board.castShadow = true; clip.add(board);
  const clamp_ = new THREE.Mesh(roundBox(0.46, 0.16, 0.1, 0.05, 2), clay(PAL.steel, { rough: 0.35, amp: 0.004 })); clamp_.position.set(0, 0.64, 0.06); clip.add(clamp_);
  const tickM = clay(PAL.gold, { amp: 0.006, freq: 8 });
  const ticks = [0, 1, 2].map((i) => {
    const t = new THREE.Group();
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), tickM); a.position.set(-0.05, -0.02, 0); a.rotation.z = 0.8; t.add(a);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.26, 4, 10), tickM); b.position.set(0.08, 0.05, 0); b.rotation.z = -0.6; t.add(b);
    t.position.set(-0.22, 0.32 - i * 0.36, 0.08); clip.add(t);
    const line = new THREE.Mesh(roundBox(0.38, 0.07, 0.04, 0.03, 2), clay(PAL.emeraldDeep, { amp: 0.004 })); line.position.set(0.2, 0.32 - i * 0.36, 0.05); clip.add(line);
    return t;
  });
  scene.add(clip);

  const plaque = new THREE.Group();
  const pBody = new THREE.Mesh(roundBox(3.2, 1.0, 0.3, 0.12, 4), clay('#101318', { rough: 0.45, amp: 0.008, freq: 4 }));
  pBody.castShadow = true; plaque.add(pBody);
  const logoTex = canvasTex(1240, 380, (c, w, h) => { if (IMG.logo) { const s = Math.min((w * 0.8) / IMG.logo.width, (h * 0.62) / IMG.logo.height); const lw = IMG.logo.width * s, lh = IMG.logo.height * s; c.drawImage(IMG.logo, (w - lw) / 2, (h - lh) / 2, lw, lh); } });
  const pFace = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.95), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, toneMapped: false }));
  pFace.position.z = 0.155; plaque.add(pFace);
  scene.add(plaque);

  const show = (b, v) => b.glyphs.forEach((g) => { g.visible = v; });
  const FIVE_LAND = 0.3;
  const set = {
    scene, camera: cam, fx: { ao: 1.0, dof: 0.0022 },
    update(t, u) {
      scene.add(stella.root);
      const end = u >= 72;
      const id = idle(t), bl = blink(t);
      let look;
      // ---------------- camera
      if (!end) {
        const close = { pos: [fiveX + 0.15, SH + 1.25, 7.0], look: [fiveX, SH + 1.25, RZ] };
        const wide = { pos: [0, 2.9, 19.4], look: [0, 2.05, 0.4] };
        const story = { pos: [0, 2.6, 11.6], look: [0.0, 1.8, 1.4] };
        const pull = E.inOutCubic(prog(u, FIVE_LAND + 0.05, 3.8));
        let c = dolly(close, wide, pull);
        const re = springU(u, 10.8, SPRING.gentle);
        if (re > 0) c = { pos: c.pos.map((v, i) => lerp(v, story.pos[i], re)), look: c.look.map((v, i) => lerp(v, story.look[i], re)) };
        const sh = u >= FIVE_LAND ? 0.09 * Math.sin(u * 48) * Math.exp(-(u - FIVE_LAND) * 5) : 0;
        G.lookFrom(cam, [c.pos[0] + sh, c.pos[1] + sh * 0.6, c.pos[2]], c.look, sh * 0.2);
        look = c.look;
        set.aperture = lerp(0.0024, 0.0009, pull) * (1 - re) + 0.0012 * re;
      } else {
        const push = E.inOutSine(prog(u, 76, 88));
        look = [END_CX, 1.5, 0.5];
        G.lookFrom(cam, [END_CX, 2.15, 0.5 + END_D * lerp(1.0, 0.95, push)], look);
        set.aperture = 0.0007;
      }
      set.focus = cam.position.distanceTo(new THREE.Vector3(...look));

      // ---------------- ring (standing on the stage; later a halo behind Stella)
      const ringIn = end ? springU(u, 75.6, SPRING.bouncy) : 1;
      const toHalo = end ? 0 : springU(u, 11.6, SPRING.gentle);
      const rx = end ? END_RX : lerp(ringX, -1.7, toHalo), rz = end ? -0.6 : lerp(RZ, -0.9, toHalo);
      ring.position.set(rx, end ? ERR : RING_R + RING_T + SH * (1 - toHalo), rz);
      ring.rotation.set(0, Math.sin(t * 0.9) * 0.1 + toHalo * Math.PI * 2 * 0 , (1 - toHalo) * 0 + Math.sin(t * 0.7) * 0.02 - toHalo * (1 - toHalo) * 4);
      ring.scale.setScalar(Math.max(0.001, ringIn * (end ? ERS : 1)));

      // ---------------- title type
      const showTitle = !end && u < 13;
      [art, five, sub, head].forEach((b) => show(b, showTitle));
      crumb.visible = showTitle; subLedge.visible = showTitle; step.visible = showTitle;
      if (showTitle) {
        // exit: the podium and the front ledge lower straight down into the stage (the floor hides them)
        const D = E.inCubic(prog(u, 10.9, 11.65)) * (SH + 4.2);
        const Dsub = E.inCubic(prog(u, 10.8, 11.4)) * 1.6;
        step.position.y = SH / 2 - D;
        // the 5 falls and slams
        five.glyphs.forEach((g) => {
          const fall = prog(u, -0.32, FIVE_LAND);
          const land = wobble(u - FIVE_LAND, 2.2, 4.5);
          g.position.set(g.userData.home.x, g.userData.home.y + 7.5 * (1 - fall) ** 2 - D, 0);
          g.scale.set(1 + 0.22 * land, Math.max(0.001, 1 - 0.28 * land), 1 + 0.22 * land);
          g.rotation.set(0, 0, (1 - fall) * 0.25);
        });
        crumb.position.y = SH - D;
        crumb.visible = D < SH + 0.2;
        crumb.place([fiveX, 0, RZ - 0.3], (u - FIVE_LAND) * M.GRID.period, RZ + 0.35);
        // "Article" hops in from the left, letter by letter
        art.glyphs.forEach((g, i) => {
          const at = 0.95 + i * 0.2;
          const k = E.outQuad(prog(u, at - 0.55, at));
          const land = wobble(u - at, 2.6, 5);
          g.position.set(g.userData.home.x - (1 - k) * 3.2, g.userData.home.y + Math.sin(Math.PI * k) * 1.6 - D, 0);
          g.rotation.set(0, 0, (1 - k) * 1.2);
          const vis = u > at - 0.55 ? 1 : 0.001;
          g.scale.set(vis * (1 + 0.15 * land), Math.max(0.001, vis * (1 - 0.2 * land)), vis);
        });
        const lk = springU(u, 6.35, SPRING.snappy);
        subLedge.scale.set(Math.max(0.001, lk), Math.max(0.001, lk), 1);
        subLedge.position.y = subLedge.userData.h / 2 - Dsub;
        sub.glyphs.forEach((g, i) => {
          const k = springU(u, 6.5 + i * 0.04, SPRING.bouncy);
          g.position.set(g.userData.home.x, g.userData.home.y - Dsub, 0);
          g.scale.setScalar(Math.max(0.001, k));
        });
        const headOut = 1 - E.inCubic(prog(u, 10.9, 11.4));
        head.glyphs.forEach((g, i) => {
          const k = springU(u, 4.2 + i * 0.03, SPRING.snappy);
          g.position.set(g.userData.home.x, g.userData.home.y - (1 - k) * 0.5, 0);
          g.scale.setScalar(Math.max(0.001, k * headOut));
        });
      }

      // ---------------- ID card
      const cardOn = !end && u >= 12;
      card.visible = cardOn;
      let cardPos = [1.6, 1.85, 2.0];
      if (cardOn) {
        const k = springU(u, 12.6, SPRING.bouncy);
        cardPos = [1.6, lerp(-2.5, 1.85, k) + Math.sin(t * 2.6) * 0.03, 2.0];
        card.position.set(...cardPos);
        card.rotation.set(-(1 - springU(u, 12.6, SPRING.wobbly)) * 1.3 - 0.03, -0.05, -0.02 + Math.sin(t * 1.3) * 0.012);
      }

      // ---------------- sign-off
      endWords.forEach((b) => show(b, end));
      step1.visible = step2.visible = end;
      if (end) {
        // the podium rises out of the stage, top step first
        const a = Math.max(0.001, springU(u, 77.4, SPRING.snappy)), b = Math.max(0.001, springU(u, 77.8, SPRING.snappy));
        step2.scale.set(1, a, 1); step2.position.y = (S2H * a) / 2;
        step1.scale.set(1, b, 1); step1.position.y = (S1H * b) / 2;
      }
      if (end) {
        const at = [78.6, 80.1, 80.6, 81.0];
        endWords.forEach((b, wi) => b.glyphs.forEach((g, i) => {
          const k = springU(u, at[wi] + i * 0.04, SPRING.bouncy);
          const land = wobble(u - at[wi] - i * 0.04 - 0.35, 2.4, 5);
          g.position.set(g.userData.home.x, g.userData.home.y + (1 - k) * 1.5, 0);
          g.scale.set(Math.max(0.001, k) * (1 + 0.1 * land), Math.max(0.001, k) * (1 - 0.12 * land), Math.max(0.001, k));
          if (wi === 2) g.position.y += Math.abs(Math.sin(t * 6 + i * 0.8)) * 0.12 * clamp(u - 81.3);
        }));
      }
      clip.visible = end;
      plaque.visible = end && u >= 81.5;
      if (plaque.visible) {
        const k = springU(u, 81.8, SPRING.bouncy);
        plaque.position.set(XC, 0.66, S1F + 0.17);
        plaque.scale.setScalar(Math.max(0.001, k));
        plaque.rotation.set(0, 0, (1 - Math.min(1, k)) * 0.4);
      }

      // ---------------- Stella
      if (!end) {
        const ringC = [ring.position.x, ring.position.y, ring.position.z + 0.3];
        const wake = springU(u, 0.9, SPRING.bouncy);   // the 5 slamming down wakes her: eyes open for the whole title
        const hop = E.inOutCubic(prog(u, 11.0, 12.2));
        const front = [-1.7, 1.75, 1.6];
        const x = lerp(ringC[0], front[0], hop), z = lerp(ringC[2], front[2], hop);
        const y = lerp(ringC[1], front[1], hop) + Math.sin(Math.PI * hop) * 1.6 + (hop >= 1 ? id.bob : Math.sin(t * 2) * 0.03);
        const sq = 1 + 0.18 * wobble(u - 12.2, 2.2, 5) - (u > 10.7 && u < 11.2 ? 0.15 : 0);
        const speak = speaking(t);
        const hold = cardOn ? springU(u, 12.8, SPRING.snappy) : 0;
        const handR = [lerp(0.95, cardPos[0] - 1.66 - x, hold), lerp(-0.4, cardPos[1] - 0.1 - y, hold), lerp(0.2, cardPos[2] - z, hold)];
        const sleepy = u < 0.9;
        const startle = u > 0.9 ? 0.16 * wobble(u - 0.9, 2.4, 5) : 0;
        stella.pose({
          pos: [x, y, z], scale: 1.0, squash: sq * (sleepy ? 1 + Math.sin(t * 2.2) * 0.025 : id.breath * (1 + startle)),
          lean: hop > 0 && hop < 1 ? -0.3 * Math.sin(Math.PI * hop) : sleepy ? 0.06 : id.sway - (cardOn ? 0.05 : 0),
          rotY: cardOn ? 0.2 : 0, eyesOpen: wake, blink: wake > 0.9 ? bl : 0, look: cardOn ? [0.6, -0.05] : [-0.4, 0.05],
          brows: 0.4 * wake + 0.2 * speak, mouth: sleepy ? { open: 0.08 + 0.05 * Math.sin(t * 2.2), smile: 0.3, wide: 0.5 } : { open: talk(t) * 1.1, smile: 0.75 },
          limbs: springU(u, 1.1, SPRING.bouncy),
          handL: [-0.95 - 0.1 * Math.sin(t * 3) * speak, -0.35 + 0.15 * speak * Math.sin(t * 2.2), 0.25],
          handR, footL: [-0.22, -1.05 - 0.1 * Math.sin(Math.PI * hop), 0.05], footR: [0.22, -1.05, 0.05],
        });
      } else {
        const k = springU(u, 75.8, SPRING.bouncy);
        const x = END_RX, y = lerp(-2.5, ERR, k) + id.bob, z = 0.5;
        const wave = clamp((u - 81.6) * 2) * (u < 87.5 ? 1 : 0);
        const speak = speaking(t);
        stella.pose({
          pos: [x, y, z], scale: 0.86, squash: (1 + 0.15 * wobble(u - 76.6, 2.2, 5)) * id.breath, lean: id.sway,
          rotY: -0.06, eyesOpen: 1, blink: bl, look: [-0.5 * (1 - wave), 0], brows: 0.3 + 0.2 * speak,
          mouth: { open: talk(t) * 1.1, smile: 0.9 },
          handL: [-0.95, -0.3, 0.35], handR: wave > 0 ? [1.0, 0.75 + 0.05 * Math.sin(t * 9), 0.2] : [0.95, -0.4 + 0.12 * speak * Math.sin(t * 2.4), 0.2],
          handRot: [0, wave * Math.sin(t * 9) * 0.6], limbs: 1,
        });
        clip.position.set(x - 0.88, y - 0.22, z + 0.35);
        clip.rotation.set(0, 0.12, 0.1 + Math.sin(t * 1.3) * 0.02);
        clip.scale.setScalar(Math.max(0.001, springU(u, 76.4, SPRING.bouncy)));
        ticks.forEach((tk, i) => tk.scale.setScalar(Math.max(0.001, springU(u, 77.2 + i * 0.35, SPRING.bouncy))));
      }
    },
  };
  return set;
}
