// calendar.js: shot 5. Deep-plum room, walnut desk, a clay flip calendar (charcoal stand, navy pages,
// crimson month band, gold day): February 1 2025 flips away to February 2 2025; Stella rings the 2;
// a gold tag "In force from 2 Feb 2025" swings in.
import { THREE } from '../lib/gl.js';
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';
import { clay, PAL, cove, roundBox, canvasTex } from './clay.js';
import { stageLights, talk, blink, idle, speaking, panelTex, faceMat } from './common.js';

const { springU, SPRING, prog, E, lerp, wobble, clamp } = M;

// the day numeral is centred by its drawn shape (not the font box) at this point of the page
const PAGE_H = 1150, DAY_Y = 640;

function pageTex(day) {
  return panelTex(1000, 1150, PAL.navy, (c, w) => {
    c.fillStyle = PAL.crimson; c.beginPath(); c.roundRect(0, 0, w, 250, [40, 40, 0, 0]); c.fill();
    c.fillStyle = PAL.type; c.font = '600 132px Display'; c.fillText('February', w / 2, 132);
    c.fillStyle = PAL.gold; c.font = '600 580px Display';
    c.textBaseline = 'alphabetic';
    const m = c.measureText(String(day));
    c.fillText(String(day), w / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, DAY_Y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    c.textBaseline = 'middle';
    c.fillStyle = PAL.type; c.font = '700 110px UI'; c.fillText('2025', w / 2, 1045);
  }, { seed: 50 + day });
}

export function calendarSet(stella) {
  const scene = new THREE.Scene(), cam = G.camera(30);
  stageLights(scene, { key: 3.6, keyPos: [-4, 11, 9], target: [0.6, 1.8, 0], angle: 0.55, rimColor: '#FF7AA8', rim: 2.0, sky: '#C79BE0', ground: '#12050F' });
  const bg = new THREE.Mesh(cove(90, 40, 4, 40), clay(PAL.plum, { rough: 0.85, amp: 0.03, freq: 0.8, sheen: 0.2, env: 0.2 }));
  bg.position.z = -7; bg.receiveShadow = true; scene.add(bg);
  // a real walnut table: plank top with grain and seams, a matching front edge, and the things a
  // desk collects (mug, pencil cup, notebook and pen, a stack of books, a plant), all in deep solids
  const deskTop = 0;
  const desk = new THREE.Mesh(roundBox(16, 0.6, 6.5, 0.22, 3), clay(PAL.walnutDeep, { rough: 0.55, amp: 0.006, freq: 2 }));
  desk.position.set(0, -0.3, 0.6); desk.receiveShadow = true; desk.castShadow = true; scene.add(desk);
  const woodMap = canvasTex(2048, 800, (c, w, h) => {
    const r = M.mulberry32(77), planks = 5, base = '#4A2412';
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let p = 0; p < planks; p++) {
      const y0 = (p * h) / planks, ph = h / planks;
      c.fillStyle = M.mix(base, p % 2 ? '#5E3019' : '#36180B', 0.35 + r() * 0.3); c.fillRect(0, y0, w, ph);
      for (let k = 0; k < 34; k++) {   // grain: long wavy streaks along the board
        c.strokeStyle = r() < 0.55 ? `rgba(22,9,3,${0.16 + r() * 0.22})` : `rgba(150,92,52,${0.08 + r() * 0.12})`;
        c.lineWidth = 1 + r() * 2.6;
        const yy = y0 + 4 + r() * (ph - 8), a = r() * 6, f = 0.002 + r() * 0.004, amp = 2 + r() * 5;
        c.beginPath();
        for (let x = 0; x <= w; x += 12) c.lineTo(x, yy + Math.sin(x * f + a) * amp + Math.sin(x * f * 3.1 + a) * amp * 0.3);
        c.stroke();
      }
      for (let k = 0; k < 2; k++) {   // a knot or two
        const kx = r() * w, ky = y0 + ph * (0.3 + r() * 0.4);
        for (let ring = 5; ring > 0; ring--) {
          c.strokeStyle = `rgba(24,10,4,${0.12 + ring * 0.04})`; c.lineWidth = 1.5;
          c.beginPath(); c.ellipse(kx, ky, ring * 9, ring * 3.2, 0, 0, Math.PI * 2); c.stroke();
        }
      }
      c.fillStyle = 'rgba(14,6,2,0.85)'; c.fillRect(0, y0, w, 5);           // seam between boards
      c.fillStyle = 'rgba(160,100,60,0.18)'; c.fillRect(0, y0 + 5, w, 2);    // its lit lip
      const butt = r() * w; c.fillStyle = 'rgba(14,6,2,0.8)'; c.fillRect(butt, y0, 4, ph);   // board end
    }
  });
  const woodM = clay('#ffffff', { map: woodMap, rough: 0.42, amp: 0.003, freq: 2, sheen: 0.12, env: 0.5 });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(15.56, 6.06), woodM);
  top.rotation.x = -Math.PI / 2; top.position.set(0, deskTop + 0.004, 0.6); top.receiveShadow = true; scene.add(top);
  const edgeGeo = new THREE.PlaneGeometry(15.56, 0.3);
  { const uv = edgeGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 0.12 + uv.getY(i) * 0.05); }
  const edge = new THREE.Mesh(edgeGeo, woodM);
  edge.position.set(0, -0.3, 0.6 + 3.25 + 0.004); edge.receiveShadow = true; scene.add(edge);

  const prop = (geo, color, opts = {}) => {
    const m = new THREE.Mesh(geo, clay(color, { rough: 0.5, amp: 0.008, freq: 5, ...opts }));
    m.castShadow = true; m.receiveShadow = true; return m;
  };
  // mug of coffee, handle to the right
  const mug = new THREE.Group(); mug.position.set(2.95, deskTop, 1.75); mug.rotation.y = -0.5; scene.add(mug);
  const mugBody = prop(new THREE.CylinderGeometry(0.4, 0.36, 0.86, 40), PAL.crimson); mugBody.position.y = 0.43; mug.add(mugBody);
  const mugRim = prop(new THREE.TorusGeometry(0.375, 0.035, 10, 40), PAL.crimson); mugRim.rotation.x = Math.PI / 2; mugRim.position.y = 0.86; mug.add(mugRim);
  const coffee = prop(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 32), '#2A1206', { rough: 0.2, sheen: 0.1, env: 0.8 }); coffee.position.y = 0.865; mug.add(coffee);
  const handle = prop(new THREE.TorusGeometry(0.2, 0.06, 12, 24, Math.PI), PAL.crimson); handle.rotation.z = -Math.PI / 2; handle.position.set(0.37, 0.45, 0); mug.add(handle);
  // pencil cup with three pencils
  const cup = new THREE.Group(); cup.position.set(-3.35, deskTop, 2.0); scene.add(cup);
  const cupBody = prop(new THREE.CylinderGeometry(0.32, 0.29, 0.78, 36), PAL.royal); cupBody.position.y = 0.39; cup.add(cupBody);
  [[PAL.gold, -0.09, 0.2, 0.12], [PAL.orange, 0.1, -0.15, 0.04], [PAL.emerald, 0.0, 0.05, -0.2]].forEach(([col, x, tz, tx]) => {
    const pen = new THREE.Group(); pen.position.set(x, 0.3, 0); pen.rotation.set(tx, 0, tz); cup.add(pen);
    const stick = prop(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 6), col); stick.position.y = 0.55; pen.add(stick);
    const tip = prop(new THREE.ConeGeometry(0.05, 0.16, 12), '#C89058'); tip.position.y = 1.2; pen.add(tip);
    const lead = prop(new THREE.ConeGeometry(0.018, 0.06, 8), PAL.charcoal); lead.position.y = 1.3; pen.add(lead);
  });
  // notebook with an elastic band, a gold pen on top
  const book = new THREE.Group(); book.position.set(-1.1, deskTop, 2.75); book.rotation.y = 0.28; scene.add(book);
  const cover = prop(roundBox(1.55, 0.1, 1.1, 0.04, 2), PAL.emeraldDeep); cover.position.y = 0.05; book.add(cover);
  const band = prop(roundBox(0.06, 0.112, 1.12, 0.02, 1), PAL.charcoal); band.position.set(0.55, 0.05, 0); book.add(band);
  const pen = prop(new THREE.CylinderGeometry(0.045, 0.045, 1.2, 12), PAL.gold, { rough: 0.3, env: 0.8 }); pen.rotation.set(0, 0.6, Math.PI / 2); pen.position.set(-0.05, 0.16, 0.05); book.add(pen);
  // a stack of books
  const stack = new THREE.Group(); stack.position.set(-4.05, deskTop, -1.1); stack.rotation.y = 0.15; scene.add(stack);
  [[PAL.crimsonDeep, 0, 0.32], [PAL.royal, 0.12, 0.28], [PAL.tealBright, -0.08, 0.26]].reduce((y, [col, ry, hh]) => {
    const b = prop(roundBox(1.75, hh, 1.2, 0.05, 2), col); b.position.y = y + hh / 2; b.rotation.y = ry; stack.add(b);
    return y + hh;
  }, 0);
  // potted plant
  const plant = new THREE.Group(); plant.position.set(5.4, deskTop, -1.35); scene.add(plant);
  const pot = prop(new THREE.CylinderGeometry(0.52, 0.4, 0.82, 36), '#A8401A'); pot.position.y = 0.41; plant.add(pot);
  const potRim = prop(new THREE.TorusGeometry(0.52, 0.06, 10, 36), '#A8401A'); potRim.rotation.x = Math.PI / 2; potRim.position.y = 0.82; plant.add(potRim);
  const soil = prop(new THREE.CylinderGeometry(0.48, 0.48, 0.03, 30), '#2A1308'); soil.position.y = 0.79; plant.add(soil);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + (i % 2) * 0.3, tilt = 0.35 + (i % 3) * 0.18;
    const leaf = prop(new THREE.SphereGeometry(0.5, 18, 12), i % 3 ? PAL.emerald : PAL.emeraldDeep, { rough: 0.45 });
    leaf.scale.set(0.2, 0.62 + (i % 3) * 0.12, 0.09);
    const holder = new THREE.Group(); holder.position.y = 0.82; holder.rotation.set(0, a, 0); plant.add(holder);
    leaf.position.set(0, 0.3, 0); const tiltG = new THREE.Group(); tiltG.rotation.x = tilt; tiltG.add(leaf); holder.add(tiltG);
  }

  const cal = new THREE.Group(); cal.position.set(0.6, 0, 0); scene.add(cal);
  const standM = clay(PAL.charcoal, { rough: 0.5, amp: 0.01, freq: 4 });
  const back = new THREE.Mesh(roundBox(3.0, 3.6, 0.16, 0.07, 3), standM);
  back.position.set(0, 1.72, -0.5); back.rotation.x = 0.3; back.castShadow = true; cal.add(back);
  const frontB = new THREE.Mesh(roundBox(3.0, 3.6, 0.16, 0.07, 3), standM);
  frontB.position.set(0, 1.72, 0.55); frontB.rotation.x = -0.3; frontB.castShadow = true; frontB.receiveShadow = true; cal.add(frontB);
  const hinge = new THREE.Group(); hinge.position.set(0, 3.45, 0.14); hinge.rotation.x = -0.3; cal.add(hinge);
  const mkPage = (day, z) => {
    const p = new THREE.Group();
    const body = new THREE.Mesh(roundBox(2.8, 3.25, 0.035, 0.04, 2), clay(PAL.navy, { rough: 0.7, amp: 0.004 }));
    body.position.y = -1.7; body.castShadow = true; body.receiveShadow = true; p.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.76, 3.18), faceMat(pageTex(day)));
    face.position.set(0, -1.7, 0.02); p.add(face);
    p.position.z = z; hinge.add(p);
    return p;
  };
  const page2 = mkPage(2, -0.02), page1 = mkPage(1, 0.03);
  const ringM = clay(PAL.steel, { rough: 0.3, amp: 0.003, env: 0.9 });
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 10, 24), ringM);
    r.position.set(-1.15 + i * 0.383, 3.5, 0.08); r.rotation.y = Math.PI / 2; cal.add(r);
  }
  // red ring drawn round the 2
  // the ring lives in the page's own plane (tilted 0.3 back), centred on the numeral, a hair in front
  const RX = 0.78, RY = 0.84, START = Math.PI / 2 + 0.25;
  const PUP = new THREE.Vector3(0, Math.cos(0.3), -Math.sin(0.3)), PN = new THREE.Vector3(0, Math.sin(0.3), Math.cos(0.3));
  const DIG = 1.7 + (DAY_Y - PAGE_H / 2) * (3.18 / PAGE_H);   // numeral centre below the hinge, along the page
  const cc = new THREE.Vector3(0.6, 3.45, 0.14).addScaledVector(PUP, -DIG).addScaledVector(PN, 0.09);
  const ringG = new THREE.Group(); ringG.position.copy(cc); ringG.rotation.x = -0.3; ringG.scale.set(RX, RY, 1); scene.add(ringG);
  const circle = new THREE.Mesh(new THREE.BufferGeometry(), clay(PAL.red, { rough: 0.45, amp: 0.008, freq: 6 }));
  circle.castShadow = true; circle.rotation.z = START; ringG.add(circle);

  // tag
  const tag = new THREE.Group(); scene.add(tag);
  const tagBody = new THREE.Mesh(roundBox(3.3, 1.35, 0.2, 0.14, 4), clay(PAL.gold, { rough: 0.45, amp: 0.012, freq: 4 }));
  tagBody.castShadow = true; tag.add(tagBody);
  const tagFace = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.3), faceMat(panelTex(1000, 400, null, (c, w) => {
    c.fillStyle = PAL.ink; c.font = '700 76px UI'; c.fillText('In force from', w / 2, 118);
    c.font = '600 136px Display'; c.fillText('2 Feb 2025', w / 2, 262);
  })));
  tagFace.position.z = 0.105; tag.add(tagFace);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), clay(PAL.crimson)); pin.position.set(-1.42, 0.46, 0.14); tag.add(pin);

  let lastArc = -1;
  const set = {
    scene, camera: cam, fx: { ao: 1.0, dof: 0.0005 },   // light depth of field: the table stays sharp
    update(t, u) {
      scene.add(stella.root);
      const id = idle(t), bl = blink(t), speak = speaking(t);
      const push = E.inOutSine(prog(u, 46, 56));
      const look = [lerp(0.6, 1.15, E.outCubic(prog(u, 46, 53))), 1.9, 0.4];
      G.lookFrom(cam, [look[0], lerp(2.9, 2.5, push), lerp(13.6, 11.9, push)], look);
      set.focus = cam.position.distanceTo(new THREE.Vector3(...look));

      // page 1 flips up and over toward camera at "second of February"
      const f = E.inOutCubic(prog(u, 49.6, 50.9));
      page1.rotation.x = -f * Math.PI * 1.05;
      page1.position.y = f > 0.85 ? (f - 0.85) * 4 : 0;
      page1.visible = f < 1;
      cal.rotation.z = 0.015 * wobble(u - 50.9, 2.6, 5) * (u > 50.9 ? 1 : 0);

      // the ring, drawn round the 2
      const ck = E.inOutCubic(prog(u, 51.4, 52.8));
      const arc = Math.round(ck * 64) / 64;
      if (arc !== lastArc) {
        circle.geometry.dispose();
        circle.geometry = arc > 0 ? new THREE.TorusGeometry(1, 0.085, 12, 96, Math.max(0.001, arc * Math.PI * 2.1)) : new THREE.BufferGeometry();
        lastArc = arc;
      }
      ringG.visible = arc > 0;

      // tag swings in
      const tk = springU(u, 52.6, SPRING.bouncy);
      tag.visible = u >= 52.4;
      tag.position.set(lerp(8, 3.55, tk), 2.75, 0.7);
      tag.rotation.set(0, -0.07, 0.08 * wobble(u - 53.2, 1.6, 2.5) - (1 - tk) * 0.6);

      // Stella: left of the calendar; draws the ring with a pointing glove
      const drawK = clamp((u - 51.2) * 3) * (u < 53.2 ? 1 : 0);
      const a = START + ck * Math.PI * 2.1;
      const pos = [-2.3, 2.15 + id.bob, 1.0];
      const tipV = cc.clone().add(new THREE.Vector3(Math.cos(a) * RX, 0, 0)).addScaledVector(PUP, Math.sin(a) * RY).addScaledVector(PN, 0.1);
      const tip = tipV.toArray();
      // hand targets are in Stella's turned body space: undo her turn so the glove lands on the ring tip
      const ry = lerp(0.3, 0.05, drawK);
      const ox = tip[0] - pos[0], oy = tip[1] - pos[1], oz = tip[2] - pos[2];
      const loc = [ox * Math.cos(ry) - oz * Math.sin(ry), oy, ox * Math.sin(ry) + oz * Math.cos(ry)];
      const handR = drawK > 0 ? [lerp(0.95, loc[0], drawK), lerp(-0.3, loc[1], drawK), lerp(0.2, loc[2], drawK)] : [0.95, -0.35 + 0.12 * speak * Math.sin(t * 2.4), 0.2];
      stella.pose({
        pos, scale: 1.0, squash: (1 + 0.15 * wobble(u - 47.2, 2.2, 5)) * id.breath, lean: id.sway,
        rotY: ry, blink: bl, look: drawK > 0 ? [0.8, 0.1] : [0.5, 0], brows: 0.3 + 0.2 * speak,
        mouth: { open: talk(t) * 1.1, smile: 0.8 },
        handR, point: [0, drawK], handL: [-0.95, -0.3 + 0.12 * speak * Math.sin(t * 2.1), 0.25],
      });
    },
  };
  return set;
}
