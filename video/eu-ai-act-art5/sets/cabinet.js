// cabinet.js: shots 3-4. Deep-teal room, the EU AI Act filing cabinet (charcoal shell, four solid
// drawers: emerald minimal -> royal limited -> amber high -> crimson unacceptable), the "more risk"
// arrow, the top drawer bursting open, the "Unacceptable risk" file popping up and the red
// "Banned outright" seal slamming onto it.
import { THREE } from '../lib/gl.js';
import * as G from '../lib/gl.js';
import * as M from '../lib/motion.js';
import { clay, PAL, roundBox, cove, glyphLine } from './clay.js';
import { stageLights, talk, blink, idle, speaking, buildSeal, panelTex, faceMat } from './common.js';

const { springU, SPRING, prog, E, lerp, wobble, clamp, springKeys, bump } = M;

export const DRAWERS = [
  { name: 'Minimal', color: PAL.emerald, at: 27.0 },
  { name: 'Limited', color: PAL.royal, at: 29.0 },
  { name: 'High', color: PAL.amber, at: 31.0 },
  { name: 'Unacceptable', color: PAL.crimson, at: 35.5 },
];
const CAB_X = 0.6, CAB_Z = -1.0, CAB_YAW = -0.2;

export function cabinetSet(stella) {
  const scene = new THREE.Scene(), cam = G.camera(30);
  stageLights(scene, { key: 3.6, keyPos: [-5, 11, 9], target: [0.5, 2.4, 0], angle: 0.6, rimColor: '#FFB36B', rim: 2.0, sky: '#7FD0D8', ground: '#06171A' });
  const bg = new THREE.Mesh(cove(90, 40, 4, 40), clay(PAL.teal, { rough: 0.85, amp: 0.03, freq: 0.8, sheen: 0.2, env: 0.2 }));
  bg.position.z = -4.5; bg.receiveShadow = true; scene.add(bg);

  // ---- cabinet
  const cab = new THREE.Group(); cab.position.set(CAB_X, 0, CAB_Z); cab.rotation.y = CAB_YAW; scene.add(cab);
  const shell = new THREE.Mesh(roundBox(2.85, 4.75, 1.95, 0.16, 5), clay(PAL.charcoal, { rough: 0.5, amp: 0.014, freq: 3, sheen: 0.4 }));
  shell.position.y = 2.375; shell.castShadow = true; shell.receiveShadow = true; cab.add(shell);
  const top = glyphLine('EU AI Act', 0.5, 0.2, clay(PAL.gold, { rough: 0.5, amp: 0.012, freq: 5 }), 0.025);
  top.group.position.set(0, 4.75 + 0.18, 0.2); top.glyphs.forEach((g) => { g.castShadow = true; }); cab.add(top.group);

  const brass = clay(PAL.gold, { rough: 0.3, amp: 0.004, freq: 8, env: 0.9 });
  const inner = clay(PAL.charcoal, { rough: 0.8, amp: 0.01, freq: 3 });
  const drawers = DRAWERS.map((d, i) => {
    const g = new THREE.Group(); cab.add(g);
    const y = 0.72 + i * 1.08;
    g.userData.y = y;
    const front = new THREE.Mesh(roundBox(2.46, 0.98, 0.2, 0.09, 4), clay(d.color, { rough: 0.5, amp: 0.012, freq: 4, sheen: 0.45 }));
    front.castShadow = true; front.receiveShadow = true; g.add(front);
    const box = new THREE.Mesh(roundBox(2.26, 0.8, 1.6, 0.05, 2), inner); box.position.z = -0.85; box.castShadow = true; g.add(box);
    for (let k = 0; k < 4; k++) {
      const f = new THREE.Mesh(roundBox(1.9, 0.6, 0.05, 0.03, 2), clay([PAL.gold, PAL.orange, PAL.blue, PAL.emerald][(k + i) % 4], { amp: 0.006 }));
      f.position.set(0, 0.28 + (k % 2) * 0.05, -0.3 - k * 0.32); g.add(f);
    }
    const lt = panelTex(800, 240, null, (c, w, h) => {
      c.fillStyle = PAL.type; let fs = 142; c.font = `600 ${fs}px Display`; while (c.measureText(d.name).width > w * 0.86) { fs -= 4; c.font = `600 ${fs}px Display`; } c.fillText(d.name, w / 2, h / 2 + 6);
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.585), faceMat(lt));
    label.position.set(0, 0.1, 0.106); g.add(label);
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.6, 6, 12), brass);
    handle.rotation.z = Math.PI / 2; handle.position.set(0, -0.3, 0.14); handle.castShadow = true; g.add(handle);
    return { g, label, front, ...d };
  });

  // ---- "more risk" arrow (standing to the right of the cabinet)
  const arrow = new THREE.Group(); arrow.position.set(3.25, 0.05, -0.2); scene.add(arrow);
  const arrowM = clay(PAL.gold, { rough: 0.45, amp: 0.01, freq: 5 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1, 24), arrowM); shaft.castShadow = true; arrow.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.6, 32), arrowM); head.castShadow = true; arrow.add(head);
  const more = glyphLine('More risk', 0.42, 0.14, clay(PAL.type, { rough: 0.55, amp: 0.008 }), 0.02);
  more.group.rotation.z = Math.PI / 2; more.group.position.set(0.62, 2.2, 0); more.glyphs.forEach((g) => { g.castShadow = true; }); arrow.add(more.group);

  // ---- the "Unacceptable risk" file + the seal
  const file = new THREE.Group(); scene.add(file);
  const fileBody = new THREE.Mesh(roundBox(3.1, 2.15, 0.1, 0.08, 3), clay(PAL.navy, { rough: 0.55, amp: 0.008 }));
  fileBody.castShadow = true; file.add(fileBody);
  const fileFace = new THREE.Mesh(new THREE.PlaneGeometry(3.04, 2.1), faceMat(panelTex(1520, 1050, null, (c, w, h) => {
    c.fillStyle = PAL.crimson; c.beginPath(); c.roundRect(0, 0, w, 170, [40, 40, 0, 0]); c.fill();
    c.fillStyle = PAL.type; c.font = '700 74px UI'; c.fillText('Top drawer', w / 2, 90);
    c.font = '600 150px Display'; c.fillText('Unacceptable risk', w / 2, 380);
  })));
  fileFace.position.z = 0.052; file.add(fileFace);
  const seal = buildSeal('Banned', 'outright', 2.1, 0.9); seal.position.set(0, -0.48, 0.09); file.add(seal);

  const set = {
    scene, camera: cam, fx: { ao: 1.0, dof: 0.0013 },
    update(t, u) {
      scene.add(stella.root);
      const id = idle(t), bl = blink(t), speak = speaking(t);
      const shake = 0.07 * Math.sin(u * 37) * Math.exp(-Math.max(0, u - 35.5) * 3) * (u >= 35.5 ? 1 : 0)
                  + 0.06 * Math.sin(u * 41) * Math.exp(-Math.max(0, u - 45) * 3) * (u >= 45 ? 1 : 0);
      const [cx, cy, cz, tx, ty, tz] = springKeys(u, [
        [18, [0.0, 3.0, 14.8, 0.4, 2.7, 0]],
        [26, [0.3, 2.9, 12.8, 0.5, 2.7, 0]],
        [33, [0.4, 3.4, 12.2, 0.6, 3.0, 0]],
        [37.2, [0.2, 5.2, 9.6, 0.5, 4.5, 0]],
        [39.6, [-0.1, 9.3, 9.4, -0.1, 8.95, 0.6]],
      ], SPRING.gentle);
      G.lookFrom(cam, [cx + shake, cy + shake * 0.5, cz], [tx, ty, tz], shake * 0.15);
      set.focus = cam.position.distanceTo(new THREE.Vector3(tx, ty, tz + 0.4));

      // ---- drawers pop on their words; the top one bursts
      const burst = u >= 35.5 ? wobble(u - 35.5, 3.2, 4) : 0;
      cab.rotation.set(0, CAB_YAW, 0.03 * burst);
      cab.scale.set(1 + 0.02 * burst, 1 - 0.03 * burst, 1);
      drawers.forEach((d, i) => {
        const k = springU(u, d.at, SPRING.bouncy);
        const out = i < 3 ? 0.55 * k : 1.15 * k;
        const rattle = i === 3 && u > 33 && u < 35.5 ? Math.sin(u * 50) * 0.02 * (u - 33) : 0;
        d.g.position.set(rattle, d.g.userData.y, 0.97 + out);
        d.label.scale.set(1, Math.max(0.001, springU(u, d.at - 0.1, SPRING.wobbly)), 1);
        d.front.material.emissive.set(d.color);
        d.front.material.emissiveIntensity = 0.45 * bump(u, d.at + 0.4, 1.4) + (i === 3 ? 0.18 * clamp(u - 35.5) * (0.6 + 0.4 * Math.sin(t * 6)) : 0);
      });

      // ---- arrow grows with "four levels of risk"
      const ak = E.outCubic(prog(u, 21.5, 25.5));
      const L = 4.4 * ak;
      shaft.scale.set(1, Math.max(0.001, L), 1); shaft.position.y = L / 2;
      head.position.y = L + 0.25; head.scale.setScalar(Math.max(0.001, springU(u, 21.5, SPRING.bouncy)));
      more.glyphs.forEach((g, i) => { g.scale.setScalar(Math.max(0.001, springU(u, 24 + i * 0.05, SPRING.bouncy))); });

      // ---- the file pops out of the top drawer and floats above the cabinet; the seal slams on b45
      const fk = springU(u, 38.8, SPRING.bouncy);
      file.visible = u >= 38.6;
      file.position.set(lerp(CAB_X + 0.3, 0.85, fk), lerp(4.2, 9.0, fk) + Math.sin(t * 2) * 0.03 * fk, lerp(CAB_Z + 1.4, 0.9, fk));
      file.rotation.set(-0.06 * (1 - fk), lerp(CAB_YAW, 0, fk), (1 - fk) * 0.25 + 0.02 * wobble(u - 45, 3, 4) * (u >= 45 ? 1 : 0));
      file.scale.setScalar(Math.max(0.001, lerp(0.4, 1, fk)));
      const sk = prog(u, 44.55, 45);
      seal.visible = u >= 44.55;
      const s = lerp(4.5, 1, E.inQuad(sk)) * (1 + 0.08 * (u >= 45 ? wobble(u - 45, 3, 6) : 0));
      seal.scale.set(s, s, 1);
      seal.position.z = 0.09 + (1 - E.inQuad(sk)) * 3;
      seal.rotation.z = lerp(-0.7, -0.1, E.inQuad(sk));

      // ---- Stella: beside the cabinet, pointing at each drawer as she names it
      const tgt = springKeys(u, [
        [18, [-2.9, 2.5]], [26.3, [-2.25, 0.95]], [28.3, [-2.2, 2.0]], [30.3, [-2.15, 3.05]],
        [32.6, [-2.1, 4.25]], [37.2, [-1.7, 4.6]], [39.6, [-1.6, 8.85]],
      ], SPRING.gentle);
      const x = tgt[0], y = tgt[1] + id.bob, z = 0.75;
      const which = u < 27 ? -1 : u < 29 ? 0 : u < 31 ? 1 : u < 35.5 ? 2 : 3;
      const pointK = which >= 0 ? clamp((u - DRAWERS[which].at + 0.6) * 2) : 0;
      const shock = u >= 35.5 ? bump(u, 36.5, 1.7) : 0;
      const stern = clamp((u - 39.5) * 2) * (u < 46.8 ? 1 : 0);
      const slam = bump(u, 45, 0.5);
      stella.pose({
        pos: [x, y, z], scale: 0.95,
        squash: (1 + 0.12 * wobble(u - 35.6, 2.6, 5) * (u >= 35.5 ? 1 : 0) - 0.1 * slam) * id.breath,
        lean: id.sway - 0.1 * pointK + 0.15 * shock, rotY: 0.32,
        blink: shock > 0.3 ? 0 : bl, eyesOpen: 1 + 0.18 * shock, look: [0.7, which === 3 ? 0.4 : -0.1],
        brows: 0.3 + 0.6 * shock - 0.3 * stern, browAngle: -0.6 * stern,
        mouth: shock > 0.2 && talk(t) < 0.2 ? { open: 0.8 * shock, smile: -0.4, wide: 0.55 } : { open: talk(t) * 1.1, smile: 0.7 - 0.5 * stern },
        handR: slam > 0.05 ? [0.9, 0.2 - 0.6 * slam, 0.4] : pointK > 0 ? [1.05, 0.1 + 0.1 * Math.sin(t * 3), 0.35] : [0.95, -0.4 + 0.1 * speak * Math.sin(t * 2.4), 0.2],
        point: [0, pointK * (1 - shock) * (1 - slam)],
        handL: shock > 0.2 ? [-0.75, 0.35, 0.4] : stern > 0 ? [-0.6, -0.6, 0.3] : [-0.95, -0.35 + 0.12 * speak * Math.sin(t * 2.1), 0.2],
      });
    },
  };
  return set;
}
