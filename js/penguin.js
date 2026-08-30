import * as THREE from "three";
import { outfits } from "./outfits.js";
import { cube, voxelMat, pixelFace } from "./voxels.js";

function giTexture(jacket, belt, stitch) {
  const J = jacket;
  const B = belt;
  const S = stitch;
  const I = 0xf3efe6;
  return pixelFace(8, 12, [
    [S, J, J, I, I, J, J, S],
    [S, J, J, I, I, J, J, S],
    [J, S, J, I, I, J, S, J],
    [J, S, J, J, J, J, S, J],
    [J, J, S, J, J, S, J, J],
    [J, J, J, J, J, J, J, J],
    [B, B, B, B, B, B, B, B],
    [B, B, B, B, B, B, B, B],
    [J, J, J, J, J, J, J, J],
    [J, J, J, J, J, J, J, J],
    [J, J, J, J, J, J, J, J],
    [J, J, J, J, J, J, J, J],
  ]);
}

function kimonoTexture(jacket, belt, stitch) {
  const J = jacket;
  const B = belt;
  const S = stitch;
  const I = 0x2b1c22;
  return pixelFace(8, 12, [
    [S, S, J, I, I, J, S, S],
    [S, J, J, I, I, J, J, S],
    [J, J, I, I, I, I, J, J],
    [J, J, J, I, I, J, J, J],
    [J, J, J, I, I, J, J, J],
    [B, B, B, B, B, B, B, B],
    [B, B, B, S, S, B, B, B],
    [J, J, J, B, B, J, J, J],
    [J, J, J, J, J, J, J, J],
    [J, J, J, J, J, J, J, J],
    [J, J, J, J, J, J, J, J],
    [J, J, J, J, J, J, J, J],
  ]);
}

function blank(w, h, fill) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function stamp(grid, x, y, sprite) {
  sprite.forEach((row, j) => {
    row.forEach((cell, i) => {
      if (cell == null || !grid[y + j] || grid[y + j][x + i] === undefined) return;
      grid[y + j][x + i] = cell;
    });
  });
}

function monsterFront() {
  const K = 0x0a0a0a;
  const G = 0x76e013;
  const L = 0xc6ff2e;
  const g = blank(16, 12, K);
  const claw = [
    [G, null, G, null],
    [G, G, G, G],
    [G, L, G, L],
    [null, G, null, G],
  ];
  stamp(g, 1, 2, claw);
  stamp(g, 11, 2, claw);
  return pixelFace(16, 12, g);
}

function monsterBack() {
  const K = 0x0a0a0a;
  const G = 0x76e013;
  const L = 0xc6ff2e;
  const W = 0xf2f2f2;
  const g = blank(16, 16, K);
  const big = [
    [null, G, null, G, null, L],
    [G, G, G, G, G, null],
    [G, L, G, L, G, G],
    [G, G, G, G, L, G],
    [G, null, G, null, G, L],
    [null, null, G, null, G, null],
  ];
  stamp(g, 5, 1, big);
  for (let x = 2; x < 14; x += 1) g[9][x] = G;
  // MONSTER
  const letters = [1, 3, 5, 7, 9, 11, 13];
  letters.forEach((x) => {
    g[11][x] = W;
    g[12][x] = W;
  });
  for (let x = 4; x < 12; x += 1) g[14][x] = W;
  return pixelFace(16, 16, g);
}

function venumFront() {
  const K = 0x0c0c0c;
  const W = 0xf4f4f4;
  const S = 0xa8a8a8;
  const g = blank(16, 16, K);
  for (let y = 0; y < 16; y += 1) {
    g[y][0] = S;
    g[y][15] = S;
  }
  // VENUM on left chest
  const word = [
    [W, null, W, W, W, null, W, W, W],
    [W, W, W, W, null, W, W, W, W],
    [W, null, W, W, W, null, W, null, W],
  ];
  stamp(g, 1, 3, word);
  for (let x = 1; x < 8; x += 1) {
    g[7][x] = W;
    g[8][x] = x % 2 ? W : S;
  }
  return pixelFace(16, 16, g);
}

function venumBack() {
  const K = 0x0c0c0c;
  const W = 0xf4f4f4;
  const S = 0x9a9a9a;
  const g = blank(16, 16, K);
  // snake-like head
  stamp(g, 6, 1, [
    [null, W, W, null],
    [W, S, W, W],
    [W, W, W, W],
    [null, W, W, null],
  ]);
  for (let i = 0; i < 4; i += 1) {
    g[2 + i][2 + i] = S;
    g[2 + i][13 - i] = S;
    g[3 + i][1 + i] = S;
    g[3 + i][14 - i] = S;
  }
  for (let x = 3; x < 13; x += 1) g[13][x] = W;
  g[14][4] = W;
  g[14][6] = W;
  g[14][8] = W;
  g[14][10] = W;
  return pixelFace(16, 16, g);
}

function dragonFront() {
  const K = 0x0b0b0b;
  const G = 0xffd000;
  const L = 0xffe566;
  const D = 0xc9a000;
  const g = blank(16, 16, K);
  for (let x = 0; x < 16; x += 1) g[0][x] = x % 2 ? G : D;
  for (let x = 0; x < 16; x += 1) g[1][x] = x % 2 ? D : G;
  stamp(g, 1, 3, [
    [null, G, L, G, null, null],
    [G, D, G, L, G, null],
    [L, G, G, G, D, G],
    [G, L, D, G, G, L],
    [null, G, G, L, G, null],
    [G, D, L, G, D, G],
    [L, G, G, D, G, L],
    [G, L, D, G, L, G],
  ]);
  g[4][12] = G;
  g[5][13] = L;
  g[6][12] = G;
  return pixelFace(16, 16, g);
}

function dragonBack() {
  const K = 0x0b0b0b;
  const G = 0xffd000;
  const D = 0xc9a000;
  const g = blank(16, 16, K);
  for (let x = 0; x < 16; x += 1) {
    g[0][x] = x % 2 ? G : D;
    g[15][x] = x % 2 ? D : G;
    g[x][0] = x % 2 ? G : D;
    g[x][15] = x % 2 ? D : G;
  }
  stamp(g, 5, 4, [
    [null, G, G, G, null, null],
    [G, G, D, G, G, null],
    [G, D, G, G, D, G],
    [null, G, G, D, G, G],
    [G, D, G, G, G, null],
    [G, G, D, G, D, G],
    [null, G, G, G, G, null],
  ]);
  return pixelFace(16, 16, g);
}

function frontArt(outfit) {
  if (outfit.art === "monster") return monsterBack();
  if (outfit.art === "venum") return venumFront();
  if (outfit.art === "dragon") return dragonFront();
  if (outfit.style === "kimono") return kimonoTexture(outfit.jacket, outfit.belt, outfit.stitch);
  return giTexture(outfit.jacket, outfit.belt, outfit.stitch);
}

function backArt(outfit) {
  if (outfit.art === "monster") return monsterBack();
  if (outfit.art === "venum") return venumBack();
  if (outfit.art === "dragon") return dragonBack();
  return null;
}

function faceTexture() {
  const N = 0x16181c;
  const W = 0xf3efe6;
  const E = 0x111111;
  const O = 0xe08a32;
  const P = 0xf3b2be;
  return pixelFace(8, 8, [
    [N, N, N, N, N, N, N, N],
    [N, N, W, W, W, W, N, N],
    [N, W, E, W, W, E, W, N],
    [N, W, W, W, W, W, W, N],
    [N, P, W, O, O, W, P, N],
    [N, N, W, O, O, W, N, N],
    [N, N, N, N, N, N, N, N],
    [N, N, N, N, N, N, N, N],
  ]);
}

const STRETCH = [
  { name: "Isquios", hips: [1.25, 0, 0], torso: [0.15, 0, 0], head: [0.45, 0, 0], lArm: [0.95, 0, 0.15], rArm: [0.95, 0, -0.15], lLeg: [0.15, 0, 0], rLeg: [0.15, 0, 0], y: 0.04 },
  { name: "Lateral", hips: [0.2, 0, 0], torso: [0, 0.1, 0.7], head: [0, 0, 0.15], lArm: [-0.2, 0, 1.25], rArm: [0.55, 0, 0.05], lLeg: [0.1, 0, 0], rLeg: [0.1, 0, 0], y: 0.02 },
  { name: "Mariposa", hips: [0.95, 0, 0], torso: [0, 0, 0], head: [0.1, 0, 0], lArm: [0.55, 0.25, 0.4], rArm: [0.55, -0.25, -0.4], lLeg: [0.25, 0.85, 0.45], rLeg: [0.25, -0.85, -0.45], y: 0.06 },
  { name: "Cobra", hips: [-0.55, 0, 0], torso: [-0.55, 0, 0], head: [-0.35, 0, 0], lArm: [-0.55, 0, 0.45], rArm: [-0.55, 0, -0.45], lLeg: [0.05, 0, 0], rLeg: [0.05, 0, 0], y: 0.08 },
  { name: "Cadera", hips: [0.75, 0.2, 0], torso: [0.1, 0.35, 0], head: [0.05, 0.2, 0], lArm: [0.3, 0, 0.55], rArm: [0.45, 0, -0.2], lLeg: [1.2, 0.15, 0], rLeg: [-0.35, 0, 0], y: 0.05 },
];

const BJJ = [
  { name: "Roll", kind: "roll" },
  { name: "Guardia cerrada", kind: "closed" },
  { name: "Guardia abierta", kind: "open" },
  { name: "Half guard", kind: "half" },
  { name: "Frames", kind: "frames" },
  { name: "Tortuga", kind: "turtle" },
  { name: "Roll", kind: "roll" },
  { name: "Base", kind: "base" },
];

function apply(node, xyz) {
  node.rotation.set(xyz[0], xyz[1], xyz[2]);
}

export function createPenguin(options = {}) {
  const isGhost = Boolean(options.ghost);
  const root = new THREE.Group();
  const hips = new THREE.Group();
  const torso = new THREE.Group();
  const head = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();

  hips.position.y = 0.42;
  torso.position.y = 0.28;
  head.position.y = 0.56;
  leftArm.position.set(-0.28, 0.18, 0);
  rightArm.position.set(0.28, 0.18, 0);
  leftLeg.position.set(-0.1, -0.02, 0);
  rightLeg.position.set(0.1, -0.02, 0);

  root.add(hips);
  hips.add(torso, leftLeg, rightLeg);
  torso.add(head, leftArm, rightArm);

  const body = cube(0.46, 0.54, 0.34, 0x16181c, [0, 0.02, 0]);
  const belly = cube(0.32, 0.42, 0.08, 0xf3efe6, [0, 0.0, 0.16]);
  torso.add(body, belly);

  const coat = cube(0.52, 0.6, 0.4, 0xf4f0e8, [0, 0.02, 0.01]);
  const skirt = cube(0.54, 0.2, 0.42, 0xf4f0e8, [0, -0.28, 0.01]);
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.5, 0.03),
    voxelMat(0xffffff, { map: giTexture(0xf4f0e8, 0xc9a227, 0x1a1a1a) }),
  );
  front.position.set(0, 0.06, 0.22);
  front.scale.set(1, 1, 1);
  front.castShadow = true;
  const belt = cube(0.56, 0.1, 0.46, 0x76e013, [0, -0.08, 0.02]);
  const beltTip = cube(0.1, 0.08, 0.12, 0xc4122f, [0.24, -0.06, 0.22]);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.5, 0.03),
    voxelMat(0xffffff),
  );
  back.position.set(0, 0.04, -0.2);
  const pantsL = cube(0.2, 0.34, 0.22, 0x0a0a0a, [0, -0.14, 0]);
  const pantsR = cube(0.2, 0.34, 0.22, 0x0a0a0a, [0, -0.14, 0]);
  const thighL = cube(0.02, 0.07, 0.05, 0x76e013, [-0.11, -0.1, 0]);
  const thighR = cube(0.02, 0.07, 0.05, 0x76e013, [0.11, -0.1, 0]);
  const cuffL = cube(0.16, 0.06, 0.14, 0xffd000, [-0.02, -0.38, 0]);
  const cuffR = cube(0.16, 0.06, 0.14, 0xffd000, [0.02, -0.38, 0]);
  torso.add(coat, skirt, front, back, belt, beltTip);
  leftLeg.add(pantsL, thighL);
  rightLeg.add(pantsR, thighR);
  leftArm.add(cuffL);
  rightArm.add(cuffR);

  const headBox = cube(0.48, 0.48, 0.48, 0x16181c, [0, 0, 0]);
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.02),
    voxelMat(0xffffff, { map: faceTexture() }),
  );
  face.position.set(0, 0, 0.25);
  const beak = cube(0.16, 0.1, 0.14, 0xe08a32, [0, -0.06, 0.31]);
  const bowL = cube(0.1, 0.08, 0.06, 0xe7a0b0, [-0.22, 0.2, 0.08]);
  const bowR = cube(0.1, 0.08, 0.06, 0xe7a0b0, [-0.12, 0.2, 0.08]);
  head.add(headBox, face, beak, bowL, bowR);

  const leftFlipper = cube(0.14, 0.4, 0.12, 0x16181c, [-0.02, -0.2, 0]);
  const rightFlipper = cube(0.14, 0.4, 0.12, 0x16181c, [0.02, -0.2, 0]);
  leftArm.add(leftFlipper);
  rightArm.add(rightFlipper);
  leftLeg.add(cube(0.18, 0.12, 0.26, 0xe08a32, [0, -0.28, 0.04]));
  rightLeg.add(cube(0.18, 0.12, 0.26, 0xe08a32, [0, -0.28, 0.04]));

  let outfitId = "perla";
  let pose = "idle";
  let time = 0;

  const paintGi = (outfit) => {
    if (isGhost) return;
    const bare = outfit.style === "nogi";
    const brand = outfit.art;
    coat.visible = !bare;
    skirt.visible = outfit.style === "kimono";
    front.visible = !bare;
    back.visible = Boolean(backArt(outfit));
    belt.visible = !bare;
    beltTip.visible = brand === "venum";
    pantsL.visible = pantsR.visible = !bare;
    thighL.visible = thighR.visible = brand === "monster" || brand === "venum" || brand === "dragon";
    cuffL.visible = cuffR.visible = brand === "dragon";
    belly.visible = bare;
    body.visible = true;
    if (front.material.map) front.material.map.dispose();
    if (back.material.map) back.material.map.dispose();
    if (!bare) {
      front.material.map = frontArt(outfit);
      front.material.color.setHex(0xffffff);
      front.material.needsUpdate = true;
      const rear = backArt(outfit);
      if (rear) {
        back.material.map = rear;
        back.material.color.setHex(0xffffff);
        back.material.needsUpdate = true;
      }
      coat.material.color.setHex(outfit.jacket);
      skirt.material.color.setHex(outfit.jacket);
      pantsL.material.color.setHex(outfit.pants);
      pantsR.material.color.setHex(outfit.pants);
      belt.material.color.setHex(outfit.belt);
      beltTip.material.color.setHex(outfit.accent);
      const mark = brand === "monster" ? 0x76e013 : brand === "dragon" ? 0xffd000 : 0xf4f4f4;
      thighL.material.color.setHex(mark);
      thighR.material.color.setHex(mark);
      cuffL.material.color.setHex(0xffd000);
      cuffR.material.color.setHex(0xffd000);
      coat.scale.set(1, outfit.style === "kimono" ? 1.12 : 1, 1);
    }
    bowL.material.color.setHex(outfit.bow);
    bowR.material.color.setHex(outfit.bow);
    leftFlipper.material.color.setHex(0x16181c);
    rightFlipper.material.color.setHex(0x16181c);
  };

  const applyOutfit = (id) => {
    const outfit = outfits.find((item) => item.id === id) || outfits[0];
    outfitId = outfit.id;
    paintGi(outfit);
  };

  applyOutfit(outfitId);

  if (isGhost) {
    [coat, skirt, front, back, belt, beltTip, belly, pantsL, pantsR, thighL, thighR, cuffL, cuffR].forEach((mesh) => {
      mesh.visible = false;
    });
    root.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      child.material = child.material.clone();
      child.material.transparent = true;
      child.material.opacity = 0.4;
      child.material.color.setHex(0x9fd4ff);
      child.material.map = null;
      child.castShadow = false;
    });
    bowL.visible = false;
    bowR.visible = false;
    body.visible = true;
  }

  const resetRig = () => {
    hips.rotation.set(0, 0, 0);
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    leftArm.rotation.set(0.12, 0, 0.18);
    rightArm.rotation.set(0.12, 0, -0.18);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
    root.rotation.x = 0;
    root.position.y = 0;
  };

  const phase = () => BJJ[Math.floor((time % 24) / 3) % BJJ.length];

  return {
    root,
    get outfitId() {
      return outfitId;
    },
    get time() {
      return time;
    },
    setOutfit: applyOutfit,
    setPose(next) {
      if (pose !== next) time = 0;
      pose = next;
    },
    getDrill() {
      if (pose === "stretch") return STRETCH[Math.floor(time / 5) % STRETCH.length].name;
      if (pose === "bjj" || pose === "bjj-ghost") return phase().name;
      return "";
    },
    getBjjSlot() {
      const item = phase();
      const slots = {
        roll: { dist: 1.15, side: 0, turn: Math.PI },
        closed: { dist: 0.62, side: 0, turn: Math.PI },
        open: { dist: 0.85, side: 0.7, turn: Math.PI * 0.8 },
        half: { dist: 0.7, side: -0.55, turn: Math.PI * 1.1 },
        frames: { dist: 0.78, side: 0.15, turn: Math.PI },
        turtle: { dist: 0.7, side: 0, turn: 0.2 },
        base: { dist: 1.0, side: 0.25, turn: Math.PI * 0.9 },
      };
      return { ...slots[item.kind], kind: item.kind, name: item.name };
    },
    update(delta, moving, yaw) {
      root.rotation.y = yaw;
      time += delta;
      resetRig();

      if (pose === "stretch") {
        const index = Math.floor(time / 5) % STRETCH.length;
        const local = time % 5;
        const ease = 1 - (1 - Math.min(1, local / 0.7)) ** 3;
        const pulse = 1 + Math.sin(time * 2.4) * 0.06;
        const s = STRETCH[index];
        const mix = (a) => a.map((n) => n * ease * pulse);
        apply(hips, mix(s.hips));
        apply(torso, mix(s.torso));
        apply(head, mix(s.head));
        apply(leftArm, mix(s.lArm));
        apply(rightArm, mix(s.rArm));
        apply(leftLeg, mix(s.lLeg));
        apply(rightLeg, mix(s.rLeg));
        root.position.y = s.y * ease;
        if (s.name === "Cobra") root.rotation.x = -0.35 * ease;
        if (s.name === "Isquios") root.rotation.x = 0.2 * ease;
        return;
      }

      if (pose === "bjj" || pose === "bjj-ghost") {
        const item = phase();
        const ghosted = pose === "bjj-ghost";
        if (item.kind === "roll" && !ghosted) {
          const p = (time % 3) / 3;
          root.rotation.x = p * Math.PI * 2;
          root.position.y = Math.sin(p * Math.PI) * 0.5;
          root.position.x += Math.sin(yaw) * Math.sin(p * Math.PI) * 0.4;
          root.position.z += Math.cos(yaw) * Math.sin(p * Math.PI) * 0.4;
          return;
        }
        if (item.kind === "closed") {
          apply(hips, ghosted ? [0.4, 0, 0] : [1.02, 0, 0]);
          apply(torso, ghosted ? [0.4, 0, 0] : [0, 0, 0]);
          apply(leftLeg, ghosted ? [0.55, 0.2, 0] : [0.25, 0.15, 0.2]);
          apply(rightLeg, ghosted ? [0.55, -0.2, 0] : [1.2, -0.1, 0]);
          apply(leftArm, [0.6, 0.2, 0.35]);
          apply(rightArm, [0.55, -0.2, -0.35]);
        } else if (item.kind === "open") {
          apply(hips, ghosted ? [0.25, 0.2, 0] : [0.85, -0.15, 0]);
          apply(leftLeg, ghosted ? [0.4, 0.3, 0] : [0.35, 0.55, 0.25]);
          apply(rightLeg, ghosted ? [0.15, 0, 0] : [0.9, -0.35, 0]);
          apply(leftArm, [0.45, 0.25, 0.55]);
          apply(rightArm, [0.3, -0.1, -0.25]);
        } else if (item.kind === "half") {
          apply(hips, ghosted ? [0.35, -0.2, 0] : [0.9, 0.2, 0]);
          apply(leftLeg, ghosted ? [0.7, 0, 0] : [1.05, 0.2, 0]);
          apply(rightLeg, ghosted ? [0.2, 0, 0] : [0.25, -0.4, 0]);
          apply(leftArm, [0.5, 0.15, 0.45]);
          apply(rightArm, [0.7, -0.1, -0.2]);
        } else if (item.kind === "frames") {
          apply(hips, ghosted ? [0.3, 0, 0] : [0.7, 0, 0]);
          apply(torso, ghosted ? [0.25, 0, 0] : [-0.1, 0, 0]);
          apply(leftArm, ghosted ? [0.8, 0.2, 0.2] : [0.15, 0.1, 1.05]);
          apply(rightArm, ghosted ? [0.8, -0.2, -0.2] : [0.15, -0.1, -1.05]);
          apply(leftLeg, [0.45, 0.2, 0]);
          apply(head, [0.15, 0, 0]);
        } else if (item.kind === "turtle") {
          apply(hips, ghosted ? [0.2, 0, 0] : [1.15, 0, 0]);
          apply(torso, ghosted ? [0.15, 0, 0] : [0.35, 0, 0]);
          apply(head, ghosted ? [0.1, 0, 0] : [0.5, 0, 0]);
          apply(leftArm, [0.7, 0.15, 0.55]);
          apply(rightArm, [0.7, -0.15, -0.55]);
          apply(leftLeg, [0.8, 0.25, 0]);
          apply(rightLeg, [0.8, -0.25, 0]);
          root.position.y = ghosted ? 0 : 0.08;
        } else {
          apply(hips, [0.22, 0, 0]);
          apply(leftLeg, [0.75, 0.1, 0]);
          apply(rightLeg, [0.15, 0, 0]);
          apply(leftArm, [0.25, 0.1, 0.45]);
          apply(rightArm, [0.2, -0.1, -0.4]);
        }
        return;
      }

      if (pose === "punch") {
        const jab = Math.max(0, Math.sin(time * 10));
        const cross = Math.max(0, Math.sin(time * 10 - 1.2));
        torso.rotation.y = -jab * 0.2 + cross * 0.25;
        leftArm.rotation.set(0.12 - 1.15 * jab, 0, 0.18);
        rightArm.rotation.set(0.12 - 1.25 * cross, 0, -0.18);
        return;
      }

      if (pose === "read") {
        hips.rotation.x = 0.3;
        head.rotation.x = 0.25;
        leftArm.rotation.set(0.5, 0.1, 0.25);
        rightArm.rotation.set(0.5, -0.1, -0.25);
        return;
      }

      const step = moving ? time * 8 : time * 2;
      const amp = moving ? 1 : 0.2;
      root.position.y = Math.abs(Math.sin(step)) * 0.03 * amp;
      leftArm.rotation.set(0.12 + Math.sin(step) * 0.35 * amp, 0, 0.18);
      rightArm.rotation.set(0.12 + Math.sin(step + Math.PI) * 0.35 * amp, 0, -0.18);
      leftLeg.rotation.x = Math.sin(step + Math.PI) * 0.45 * amp;
      rightLeg.rotation.x = Math.sin(step) * 0.45 * amp;
    },
  };
}
