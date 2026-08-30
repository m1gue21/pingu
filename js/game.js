import * as THREE from "three";
import { createPenguin } from "./penguin.js";
import { createWorld } from "./world.js";
import { createInput } from "./input.js";
import { outfits } from "./outfits.js";
import {
  loadLetters,
  latestUnread,
  markSeen,
  notifyNewLetter,
} from "./letters.js";

const root = document.getElementById("game");
const promptBtn = document.getElementById("prompt");
const closetSheet = document.getElementById("closet");
const letterSheet = document.getElementById("letter");
const letterTitle = document.getElementById("letter-title");
const letterMeta = document.getElementById("letter-meta");
const letterBody = document.getElementById("letter-body");
const outfitsBox = document.getElementById("outfits");
const loader = document.getElementById("loader");

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
  failIfMajorPerformanceCaveat: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6eee6);
scene.fog = new THREE.Fog(0xf6eee6, 10, 18);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 40);
const input = createInput(document.body);
const penguin = createPenguin();
const ghost = createPenguin({ ghost: true });
ghost.root.visible = false;
const world = await createWorld(scene);
scene.add(penguin.root);
scene.add(ghost.root);

scene.add(new THREE.HemisphereLight(0xfff4ea, 0xb7c4b0, 0.95));
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
const sun = new THREE.DirectionalLight(0xfff0d8, 1.05);
sun.position.set(4, 8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const lamp = new THREE.PointLight(0xffc56a, 1.2, 10);
lamp.position.set(3.1, 2.1, 2.5);
scene.add(lamp);

const player = {
  x: 0.4,
  z: 1.6,
  yaw: 0.35,
  poseUntil: 0,
  training: "",
};
input.look.x = 0.55;
input.look.y = 0.08;
let active = null;
let letters = [];
let knownLatest = "";
let letterIndex = 0;
let bagSwing = 0;

outfits.forEach((outfit) => {
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `<i style="background:#${outfit.jacket.toString(16).padStart(6, "0")}"></i>${outfit.name}`;
  button.addEventListener("click", () => {
    penguin.setOutfit(outfit.id);
    localStorage.setItem("val_igloo_outfit", outfit.id);
    outfitsBox.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-on", item === button);
    });
  });
  if (outfit.id === (localStorage.getItem("val_igloo_outfit") || "perla")) {
    button.classList.add("is-on");
    penguin.setOutfit(outfit.id);
  }
  outfitsBox.appendChild(button);
});

function nearOf() {
  let best = null;
  let bestDist = 99;
  for (const item of world.interactables) {
    const dist = Math.hypot(player.x - item.position.x, player.z - item.position.z);
    if (dist < item.radius && dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}

function resolveMove(nx, nz) {
  const limit = world.iglooR - 1.15;
  const len = Math.hypot(nx, nz);
  if (len > limit) {
    nx = (nx / len) * limit;
    nz = (nz / len) * limit;
  }
  for (const block of world.blockers) {
    const dx = nx - block.x;
    const dz = nz - block.z;
    const dist = Math.hypot(dx, dz);
    if (dist < block.r) {
      nx = block.x + (dx / (dist || 1)) * block.r;
      nz = block.z + (dz / (dist || 1)) * block.r;
    }
  }
  return { x: nx, z: nz };
}

function openCloset() {
  closetSheet.hidden = false;
}

function renderLetter() {
  const letter = letters[letterIndex];
  if (!letter) {
    letterTitle.textContent = "El escritorio está vacío";
    letterMeta.textContent = "";
    letterBody.textContent = "Cuando Miguel deje una carta, aparece aquí.";
    return;
  }
  letterTitle.textContent = letter.title;
  letterMeta.textContent = `${letter.from} · ${letter.date}`;
  letterBody.textContent = letter.body;
  markSeen(letter.id);
  const desk = world.interactables.find((item) => item.id === "desk");
  if (desk?.envelope) desk.envelope.material.emissive?.setHex(0x000000);
}

function openLetter() {
  if (!letters.length) letterIndex = 0;
  else letterIndex = letters.length - 1;
  renderLetter();
  letterSheet.hidden = false;
  penguin.setPose("read");
  player.poseUntil = performance.now() + 1200;
}

function stopTraining() {
  player.training = "";
  player.poseUntil = 0;
  penguin.setPose("idle");
  ghost.root.visible = false;
}

function useActive() {
  if (!active) return;
  if (active.id === "closet") openCloset();
  if (active.id === "blanket") {
    if (player.training === "stretch") {
      stopTraining();
      return;
    }
    player.x = -3.2;
    player.z = -1.1;
    ghost.root.visible = false;
    penguin.setPose("stretch");
    player.training = "stretch";
    player.poseUntil = performance.now() + 120000;
  }
  if (active.id === "mat") {
    if (player.training === "bjj") {
      stopTraining();
      return;
    }
    player.x = -2.8;
    player.z = 2.6;
    player.yaw = 0.4;
    penguin.setPose("bjj");
    ghost.setPose("bjj-ghost");
    ghost.root.visible = true;
    player.training = "bjj";
    player.poseUntil = performance.now() + 120000;
  }
  if (active.id === "bag") {
    stopTraining();
    penguin.setPose("punch");
    bagSwing = 1;
    player.poseUntil = performance.now() + 2200;
  }
  if (active.id === "desk") openLetter();
}

promptBtn.addEventListener("click", useActive);
document.getElementById("closet-close").addEventListener("click", () => {
  closetSheet.hidden = true;
});
document.getElementById("letter-close").addEventListener("click", () => {
  letterSheet.hidden = true;
  penguin.setPose("idle");
});
document.getElementById("letter-prev").addEventListener("click", () => {
  if (!letters.length) return;
  letterIndex = (letterIndex - 1 + letters.length) % letters.length;
  renderLetter();
});
document.getElementById("letter-next").addEventListener("click", () => {
  if (!letters.length) return;
  letterIndex = (letterIndex + 1) % letters.length;
  renderLetter();
});

async function refreshLetters(announce) {
  letters = await loadLetters();
  const unread = latestUnread(letters);
  const desk = world.interactables.find((item) => item.id === "desk");
  if (desk?.envelope) {
    desk.envelope.material.emissive = new THREE.Color(unread ? 0xff4d6d : 0x000000);
    desk.envelope.material.emissiveIntensity = unread ? 0.7 : 0;
  }
  if (announce && unread && unread.id !== knownLatest) {
    notifyNewLetter(unread);
    knownLatest = unread.id;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
  if (unread) knownLatest = unread.id;
}

await refreshLetters(true);
setInterval(() => refreshLetters(true), 12000);

loader.hidden = true;

const clock = new THREE.Clock();
function tick() {
  const delta = Math.min(0.033, clock.getDelta());
  const move = input.sampleMove();
  const now = performance.now();
  const busy = now < player.poseUntil && !player.training;
  const moving = Boolean(move.x || move.y) && (!busy || player.training);

  if (moving) {
    const heading = input.look.x + Math.atan2(move.x, -move.y);
    player.yaw = heading;
    const next = resolveMove(
      player.x + Math.sin(heading) * 2.6 * delta,
      player.z + Math.cos(heading) * 2.6 * delta,
    );
    player.x = next.x;
    player.z = next.z;
    if (player.training) stopTraining();
    else {
      penguin.setPose("idle");
      ghost.root.visible = false;
    }
  } else if (!busy && !player.training) {
    if (ghost.root.visible) ghost.root.visible = false;
  }

  penguin.root.position.x = player.x;
  penguin.root.position.z = player.z;
  penguin.update(delta, Boolean(moving), player.yaw);

  if (ghost.root.visible) {
    const slot = penguin.getBjjSlot();
    const forward = slot.dist;
    const side = slot.side;
    const gx =
      player.x +
      Math.sin(player.yaw) * forward +
      Math.cos(player.yaw) * side;
    const gz =
      player.z +
      Math.cos(player.yaw) * forward -
      Math.sin(player.yaw) * side;
    ghost.root.position.set(gx, 0, gz);
    ghost.update(delta, false, player.yaw + slot.turn);
  }

  const drill = document.getElementById("drill");
  if (drill) {
    const name = penguin.getDrill();
    drill.hidden = !name;
    drill.textContent = name
      ? ghost.root.visible
        ? `Jiu-jitsu · ${name}`
        : `Estiramiento · ${name}`
      : "";
  }

  const bag = world.interactables.find((item) => item.id === "bag")?.bag;
  if (bag) {
    bagSwing = Math.max(0, bagSwing - delta * 1.4);
    bag.rotation.z = Math.sin(now * 0.02) * bagSwing * 0.45;
  }

  active = nearOf();
  if (active) {
    promptBtn.hidden = false;
    const unread = latestUnread(letters);
    if (player.training && (active.id === "mat" || active.id === "blanket")) {
      promptBtn.textContent = "Salir";
    } else if (active.id === "desk" && unread) {
      promptBtn.textContent = "Hay una carta nueva";
    } else {
      promptBtn.textContent = active.label;
    }
  } else {
    promptBtn.hidden = true;
  }
  if (input.consumeInteract()) useActive();

  const camYaw = input.look.x;
  const camPitch = 0.42 + input.look.y;
  const dist = 4.3;
  camera.position.set(
    player.x + Math.sin(camYaw) * dist,
    2.15 + input.look.y * 1.4,
    player.z + Math.cos(camYaw) * dist,
  );
  camera.lookAt(player.x, 0.95 + camPitch * 0.2, player.z);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

tick();
