// stella.js: Stella the Standard. A puffy yellow clay star with big toon eyes, noodle limbs, white
// gloves and little shoes (retro-cartoon host, our own design). buildStella() once; pose(o) every frame
// sets EVERYTHING from o (pure function of the pose), so it is safe under out-of-order seeks and blur.
import { THREE } from '../lib/gl.js';
import * as M from '../lib/motion.js';
import { clay, PAL, smoothNormals, lumpy } from './clay.js';

const R_OUT = 1.0, R_IN = 0.58, SHARP = 1.45, DEPTH = 0.44, FLAT = 0.62;
// star outline radius at angle a (top point at +90deg), soft rounded points
export const starRad = (a) => R_IN + (R_OUT - R_IN) * ((Math.cos(5 * (a - Math.PI / 2)) + 1) / 2) ** SHARP;
const thick = (a, s = 1) => 1 + ((R_IN / starRad(a)) ** 0.45 - 1) * Math.min(1, s * s * 1.6);
// front surface height at local (x, y)
export function surfaceZ(x, y) {
  const a = Math.atan2(y, x), r = starRad(a), s = Math.min(0.999, Math.hypot(x, y) / r);
  return DEPTH * thick(a, s) * Math.sqrt(1 - s * s) ** FLAT;
}

function starBody() {
  const g = new THREE.SphereGeometry(1, 200, 100);
  g.rotateX(Math.PI / 2);                       // poles to front/back (z)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(y, x), r = starRad(a);
    p.setXYZ(i, x * r, y * r, Math.sign(z) * Math.abs(z) ** FLAT * DEPTH * thick(a, Math.hypot(x, y)));
  }
  return lumpy(g, 0.018, 2.4, 11);
}

// a bent plane that hugs the face (for the painted mouth)
function facePatch(cx, cy, w, h, lift = 0.006) {
  const g = new THREE.PlaneGeometry(w, h, 20, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, y = p.getY(i) + cy;
    p.setXYZ(i, x, y, surfaceZ(x, y) + lift);
  }
  g.computeVertexNormals();
  return g;
}

function drawMouth(c, w, h, { open = 0, smile = 0.6, wide = 1 }) {
  c.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.36, hw = w * 0.3 * wide;
  const lift = smile * h * 0.1;
  const L = [cx - hw, cy - lift], Rr = [cx + hw, cy - lift];
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (open < 0.06) {
    c.strokeStyle = PAL.ink; c.lineWidth = h * 0.07;
    c.beginPath(); c.moveTo(...L); c.quadraticCurveTo(cx, cy + smile * h * 0.26, ...Rr); c.stroke();
    // little dimples at the corners
    c.lineWidth = h * 0.035;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * hw * 1.02, cy - lift - h * 0.05); c.lineTo(cx + s * hw * 1.09, cy - lift + h * 0.03); c.stroke(); }
    return;
  }
  const topY = cy + smile * h * 0.06 - open * h * 0.06;
  const botY = cy + smile * h * 0.28 + open * h * 0.55;
  const path = () => { c.beginPath(); c.moveTo(...L); c.quadraticCurveTo(cx, topY, ...Rr); c.quadraticCurveTo(cx, botY, ...L); c.closePath(); };
  path(); c.fillStyle = '#5E1D16'; c.fill();
  c.save(); path(); c.clip();
  c.fillStyle = '#E86F70';                                   // tongue
  c.beginPath(); c.ellipse(cx, botY * 0.62 + cy * 0.38 + h * 0.12, hw * 0.62, h * 0.2, 0, 0, M.TAU); c.fill();
  c.fillStyle = '#FFFDF6';                                   // top teeth
  c.fillRect(cx - hw, topY - h * 0.3, hw * 2, h * 0.3 + h * 0.07 * M.clamp(open * 2));
  c.restore();
  path(); c.strokeStyle = PAL.ink; c.lineWidth = h * 0.045; c.stroke();
}

export function buildStella() {
  const root = new THREE.Group();          // placed in the set
  const body = new THREE.Group();          // squash + lean live here
  root.add(body);
  const yellow = clay(PAL.star, { rough: 0.52, amp: 0.011, freq: 5, sheen: 0.45 });
  const mBody = new THREE.Mesh(starBody(), yellow);
  mBody.castShadow = true; mBody.receiveShadow = true;
  body.add(mBody);

  // eyes
  const white = clay(PAL.eyeWhite, { rough: 0.35, amp: 0.002, freq: 14, sheen: 0.2, env: 0.8 });
  const black = clay('#20140E', { rough: 0.25, amp: 0.001, freq: 20, env: 1.0 });
  const shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const brown = clay(PAL.ink, { rough: 0.5, amp: 0.004, freq: 12 });
  const sph = new THREE.SphereGeometry(1, 48, 32);
  const eyes = [-1, 1].map((s) => {
    const ex = 0.19 * s, ey = 0.12;
    const g = new THREE.Group();
    g.position.set(ex, ey, surfaceZ(ex, ey) - 0.035);
    const ball = new THREE.Mesh(sph, white); ball.scale.set(0.125, 0.165, 0.085); g.add(ball);
    const pupil = new THREE.Mesh(sph, black); pupil.scale.set(0.068, 0.088, 0.035); g.add(pupil);
    const hl = new THREE.Mesh(sph, shine); hl.scale.setScalar(0.019); g.add(hl);
    const hl2 = new THREE.Mesh(sph, shine); hl2.scale.setScalar(0.009); g.add(hl2);
    // lashes on the outer top
    const lashes = [0, 1].map((k) => {
      const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.075, 4, 8), black);
      g.add(l);
      const a = (s > 0 ? 0.55 : Math.PI - 0.55) + (k ? 0.32 : 0) * (s > 0 ? 1 : -1);
      l.userData.a = a;
      return l;
    });
    body.add(g);
    return { g, ball, pupil, hl, hl2, lashes, s };
  });
  // brows
  const brows = [-1, 1].map((s) => {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.1, 4, 10), brown);
    b.rotation.z = Math.PI / 2;
    body.add(b);
    return { b, s };
  });
  // cheeks
  const cheekM = clay(PAL.cheek, { rough: 0.6, amp: 0.002, freq: 10 });
  [-1, 1].forEach((s) => {
    const x = 0.33 * s, y = -0.07;
    const c = new THREE.Mesh(sph, cheekM); c.scale.set(0.07, 0.045, 0.018);
    c.position.set(x, y, surfaceZ(x, y) - 0.004);
    body.add(c);
  });
  // mouth (painted onto a patch that hugs the face)
  const mcv = document.createElement('canvas'); mcv.width = 256; mcv.height = 180;
  const mctx = mcv.getContext('2d');
  const mtex = new THREE.CanvasTexture(mcv); mtex.colorSpace = THREE.SRGBColorSpace;
  const mouthMat = new THREE.MeshStandardMaterial({ map: mtex, transparent: true, roughness: 0.4, alphaTest: 0.02 });
  const mouth = new THREE.Mesh(facePatch(0, -0.15, 0.38, 0.27), mouthMat);
  body.add(mouth);

  // limbs + gloves + shoes
  const limbM = clay(PAL.limb, { rough: 0.5, amp: 0.004, freq: 12 });
  const gloveM = clay(PAL.glove, { rough: 0.5, amp: 0.006, freq: 8, sheen: 0.3 });
  const shoeM = clay(PAL.shoe, { rough: 0.45, amp: 0.006, freq: 8 });
  const limbs = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), limbM); m.castShadow = true; body.add(m); return m; });
  const glove = () => {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(sph, gloveM); palm.scale.set(0.085, 0.095, 0.07); palm.position.y = 0.06; palm.castShadow = true; g.add(palm);
    const thumb = new THREE.Mesh(sph, gloveM); thumb.scale.set(0.032, 0.045, 0.032); thumb.position.set(0.07, 0.06, 0.02); g.add(thumb);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.026, 12, 28), gloveM); cuff.rotation.x = Math.PI / 2; g.add(cuff);
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.09, 4, 10), gloveM); finger.position.set(0, 0.16, 0); g.add(finger);
    body.add(g);
    return { g, finger, thumb };
  };
  const gloves = [glove(), glove()];
  const shoes = [0, 1].map(() => {
    const m = new THREE.Mesh(sph, shoeM); m.scale.set(0.1, 0.065, 0.15); m.castShadow = true; body.add(m); return m;
  });

  const tmpQ = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  function tube(mesh, a, b, droop, r) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const C = A.clone().lerp(B, 0.5).add(new THREE.Vector3(...droop));
    const curve = new THREE.QuadraticBezierCurve3(A, C, B);
    mesh.geometry.dispose();
    mesh.geometry = new THREE.TubeGeometry(curve, 20, r, 10, false);
    return curve.getTangent(1);
  }

  function pose(o = {}) {
    const pos = o.pos || [0, 0, 0], sc = o.scale ?? 1, sq = o.squash ?? 1;
    root.position.set(...pos);
    root.rotation.set(o.tilt ?? 0, o.rotY ?? 0, 0);
    root.scale.setScalar(sc);
    root.visible = o.visible ?? true;
    body.rotation.set(0, 0, o.lean ?? 0);
    body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    // eyes
    const [lx, ly] = o.look || [0, 0];
    const blink = M.clamp(o.blink ?? 0), open = o.eyesOpen ?? 1;
    for (const e of eyes) {
      e.g.scale.set(1, Math.max(0.06, (1 - blink) * open), 1);
      e.pupil.position.set(lx * 0.04, ly * 0.05 - 0.01, 0.07);
      e.hl.position.set(lx * 0.04 + 0.025, ly * 0.05 + 0.03, 0.1);
      e.hl2.position.set(lx * 0.04 - 0.02, ly * 0.05 - 0.04, 0.1);
      e.lashes.forEach((l) => {
        const a = l.userData.a;
        l.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.19, 0.03);
        l.rotation.set(0.3, 0, a - Math.PI / 2);
      });
    }
    const br = o.brows ?? 0, ba = o.browAngle ?? 0;
    for (const b of brows) {
      const x = 0.2 * b.s, y = 0.335 + br * 0.04 - blink * 0.02;
      b.b.position.set(x, y, surfaceZ(x, y) + 0.008);
      b.b.rotation.set(0, 0, Math.PI / 2 + b.s * (0.12 + ba * 0.35));
    }
    // mouth
    const mo = o.mouth || {};
    drawMouth(mctx, mcv.width, mcv.height, { open: mo.open ?? 0, smile: mo.smile ?? 0.7, wide: mo.wide ?? 1 });
    mtex.needsUpdate = true;
    // arms: shoulders sit in the lower side valleys
    const sh = [[-0.5, -0.16, 0.0], [0.5, -0.16, 0.0]];
    const lim = M.clamp(o.limbs ?? 1);
    const tuck = (a, b) => a.map((v, i) => v + (b[i] - v) * lim);
    const hands = [tuck(sh[0], o.handL || [-0.92, -0.5, 0.18]), tuck(sh[1], o.handR || [0.92, -0.5, 0.18])];
    for (let k = 0; k < 2; k++) {
      const s = k ? 1 : -1;
      const droop = (o.droop && o.droop[k]) || [s * 0.06, -0.14, 0.04];
      const tan = tube(limbs[k], sh[k], hands[k], droop, 0.034);
      const gl = gloves[k];
      gl.g.position.set(...hands[k]);
      gl.g.scale.setScalar(Math.max(0.001, lim));
      limbs[k].visible = lim > 0.02;
      tmpQ.setFromUnitVectors(up, tan.normalize());
      gl.g.quaternion.copy(tmpQ);
      if (o.handRot && o.handRot[k]) gl.g.rotateY(o.handRot[k]);
      const pt = M.clamp(o.point ? o.point[k] : 0);
      gl.finger.scale.setScalar(Math.max(0.001, pt));
      gl.finger.position.y = 0.06 + 0.11 * pt;
      gl.thumb.position.x = 0.07 * s * -1 * -1;
    }
    // legs
    const hips = [[-0.12, -0.45, 0], [0.12, -0.45, 0]];
    const feet = [tuck(hips[0], o.footL || [-0.2, -1.08, 0.04]), tuck(hips[1], o.footR || [0.2, -1.08, 0.04])];
    for (let k = 0; k < 2; k++) {
      tube(limbs[2 + k], hips[k], feet[k], [(k ? 1 : -1) * 0.02, 0, 0.03], 0.038);
      shoes[k].position.set(feet[k][0] + (k ? 0.02 : -0.02), feet[k][1] - 0.03, feet[k][2] + 0.07);
      shoes[k].rotation.set(0.15, (k ? 1 : -1) * 0.25, 0);
      shoes[k].scale.set(0.1 * lim + 1e-3, 0.065 * lim + 1e-3, 0.15 * lim + 1e-3);
      limbs[2 + k].visible = lim > 0.02;
    }
  }
  pose({});
  return { root, body, pose };
}
