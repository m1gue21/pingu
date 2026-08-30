import * as THREE from "three";
import { cube, voxelMat } from "./voxels.js";

function add(scene, mesh) {
  scene.add(mesh);
  return mesh;
}

export function createWorld(scene) {
  const iglooR = 8.2;
  const interactables = [];
  const block = 0.52;

  const floorBlock = 0.8;
  for (let x = -10; x <= 10; x += 1) {
    for (let z = -10; z <= 10; z += 1) {
      if (Math.hypot(x * floorBlock, z * floorBlock) > iglooR - 0.1) continue;
      const tile = cube(floorBlock, 0.16, floorBlock, (x + z) % 2 === 0 ? 0xf0e4d6 : 0xe7d8c8, [
        x * floorBlock,
        0.08,
        z * floorBlock,
      ]);
      tile.castShadow = false;
      scene.add(tile);
    }
  }

  for (let y = 0; y <= 12; y += 1) {
    const height = y * block;
    const ring = Math.sqrt(Math.max(0.4, (iglooR - 0.2) ** 2 - height ** 2));
    const steps = Math.max(12, Math.round((ring * Math.PI * 2) / block));
    for (let i = 0; i < steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const ice = cube(
        block,
        block,
        block,
        y % 2 === 0 ? 0xe8f4f8 : 0xd5ebf2,
        [Math.cos(angle) * ring, height + block / 2, Math.sin(angle) * ring],
      );
      ice.castShadow = false;
      scene.add(ice);
    }
  }

  [
    [0, 3.2, -7.1],
    [-5.2, 3, 4],
    [5.2, 3, 4],
  ].forEach(([x, y, z]) => {
    const windowBlock = cube(0.72, 0.72, 0.72, 0x9fd4ff, [x, y, z]);
    windowBlock.material.emissive = new THREE.Color(0x6fb7e0);
    windowBlock.material.emissiveIntensity = 0.4;
    windowBlock.castShadow = false;
    scene.add(windowBlock);
  });

  for (let x = -2; x <= 2; x += 1) {
    for (let z = -2; z <= 2; z += 1) {
      add(scene, cube(block, 0.12, block, 0xf3c9cf, [x * block, 0.18, z * block + 0.3]));
    }
  }

  const closet = new THREE.Group();
  closet.add(cube(2.08, 2.08, 0.72, 0xc89b6d, [0, 1.14, 0]));
  closet.add(cube(0.12, 1.9, 0.2, 0x8a6544, [0, 1.14, 0.3]));
  closet.add(cube(0.16, 0.16, 0.16, 0xf4d7b0, [-0.36, 1.14, 0.4]));
  closet.add(cube(0.16, 0.16, 0.16, 0xf4d7b0, [0.36, 1.14, 0.4]));
  closet.add(cube(1.5, 0.16, 0.16, 0xe7a0b0, [0, 1.9, 0.2]));
  closet.position.set(0, 0, -4.6);
  scene.add(closet);
  interactables.push({
    id: "closet",
    label: "Vestir al pingüino",
    position: new THREE.Vector3(0, 0, -3.8),
    radius: 1.6,
  });

  const blanket = new THREE.Group();
  for (let x = -2; x <= 2; x += 1) {
    for (let z = -1; z <= 1; z += 1) {
      blanket.add(cube(block, 0.14, block, 0xf4b8c4, [x * block, 0.12, z * block]));
    }
  }
  blanket.add(cube(1.2, 0.2, 0.32, 0xffe4c8, [-0.7, 0.22, 0.1]));
  blanket.position.set(-3.2, 0, -1.1);
  scene.add(blanket);
  interactables.push({
    id: "blanket",
    label: "Estirar",
    position: new THREE.Vector3(-3.2, 0, -1.1),
    radius: 1.5,
  });

  const mat = new THREE.Group();
  for (let x = -2; x <= 2; x += 1) {
    for (let z = -2; z <= 2; z += 1) {
      mat.add(cube(block, 0.14, block, (x + z) % 2 === 0 ? 0x4f86b8 : 0x5d8fbf, [x * block, 0.14, z * block]));
    }
  }
  mat.add(cube(2.4, 0.04, 0.08, 0xf7f2ea, [0, 0.22, 0]));
  mat.add(cube(0.08, 0.04, 2.4, 0xf7f2ea, [0, 0.22, 0]));
  mat.position.set(-2.8, 0, 2.6);
  scene.add(mat);
  interactables.push({
    id: "mat",
    label: "Practicar jiu-jitsu",
    position: new THREE.Vector3(-2.8, 0, 2.6),
    radius: 1.7,
  });

  const bag = new THREE.Group();
  bag.add(cube(0.12, 1, 0.12, 0xb9b3aa, [0, 2.4, 0]));
  bag.add(cube(0.72, 1.56, 0.72, 0xd45464, [0, 1.2, 0]));
  bag.add(cube(0.62, 0.2, 0.62, 0x2b1c22, [0, 2.08, 0]));
  bag.position.set(3.1, 0, -1.5);
  scene.add(bag);
  interactables.push({
    id: "bag",
    label: "Pegarle al saco",
    position: new THREE.Vector3(3.1, 0, -1.5),
    radius: 1.4,
    bag,
  });

  const desk = new THREE.Group();
  desk.add(cube(1.56, 0.16, 0.78, 0xb8885c, [0, 0.8, 0]));
  [
    [-0.62, 0.36, 0.28],
    [0.62, 0.36, 0.28],
    [-0.62, 0.36, -0.28],
    [0.62, 0.36, -0.28],
  ].forEach((pos) => desk.add(cube(0.14, 0.72, 0.14, 0x8a6544, pos)));
  desk.add(cube(0.36, 0.04, 0.26, 0xfff8f2, [-0.28, 0.9, 0.06]));
  desk.add(cube(0.36, 0.04, 0.26, 0xf6eee6, [-0.12, 0.94, 0.1]));
  desk.add(cube(0.12, 0.28, 0.12, 0xf4d7b0, [0.48, 1.02, -0.12]));
  const lampGlow = cube(0.2, 0.2, 0.2, 0xffe7b0, [0.48, 1.2, -0.12]);
  lampGlow.material = voxelMat(0xffe7b0, { emissive: 0xffc56a, emissiveIntensity: 0.7 });
  desk.add(lampGlow);
  const envelope = cube(0.28, 0.08, 0.2, 0xe7a0b0, [0.12, 0.92, 0.12]);
  desk.add(envelope);
  desk.position.set(3.1, 0, 2.5);
  desk.rotation.y = -0.7;
  scene.add(desk);
  interactables.push({
    id: "desk",
    label: "Leer carta de Miguel",
    position: new THREE.Vector3(2.5, 0, 2.1),
    radius: 1.5,
    envelope,
  });

  add(scene, cube(0.16, 0.24, 0.16, 0x6fbe57, [1.3, 0.28, 0.2]));
  add(scene, cube(0.36, 0.08, 0.36, 0xfff8f2, [1.55, 0.2, 0.45]));
  add(scene, cube(0.14, 0.08, 0.08, 0xf3d2b3, [1.48, 0.28, 0.42]));
  add(scene, cube(0.14, 0.08, 0.08, 0xf3d2b3, [1.62, 0.28, 0.48]));

  return {
    iglooR,
    interactables,
    blockers: [
      { x: 0, z: -4.6, r: 1.15 },
      { x: 3.1, z: -1.5, r: 0.7 },
      { x: 3.1, z: 2.5, r: 0.95 },
    ],
  };
}
