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
import {
  loadAntojos,
  addAntojo,
  toggleAntojo,
  removeAntojo,
  isSyncEnabled,
} from "./antojos.js";

const root = document.getElementById("game");
const promptBtn = document.getElementById("prompt");
const closetSheet = document.getElementById("closet");
const deskSheet = document.getElementById("desk");
const deskLetters = document.getElementById("desk-letters");
const deskAntojos = document.getElementById("desk-antojos");
const letterTitle = document.getElementById("letter-title");
const letterMeta = document.getElementById("letter-meta");
const letterBody = document.getElementById("letter-body");
const antojosList = document.getElementById("antojos-list");
const antojosForm = document.getElementById("antojos-form");
const antojoInput = document.getElementById("antojo-input");
const antojoSubmit = document.getElementById("antojo-submit");
const antojosBusy = document.getElementById("antojos-busy");
const antojosBusyText = document.getElementById("antojos-busy-text");
const antojosCount = document.getElementById("antojos-count");
const antojosPager = document.getElementById("antojos-pager");
const antojosPage = document.getElementById("antojos-page");
const antojosPrev = document.getElementById("antojos-prev");
const antojosNext = document.getElementById("antojos-next");
const deskClose = document.getElementById("desk-close");
const deskTabLetters = document.getElementById("desk-tab-letters");
const deskTabAntojos = document.getElementById("desk-tab-antojos");
const closetClose = document.getElementById("closet-close");
const letterPrev = document.getElementById("letter-prev");
const letterNext = document.getElementById("letter-next");
const outfitsBox = document.getElementById("outfits");
const loader = document.getElementById("loader");

const ANTOJOS_PAGE_SIZE = 4;

function on(el, event, handler) {
  if (el) el.addEventListener(event, handler);
}

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
let antojos = [];
let knownLatest = "";
let letterIndex = 0;
let deskTab = "letters";
let bagSwing = 0;
let antojosBusyLock = false;
let antojosPageIndex = 0;

function setAntojosBusy(on, message = "Guardando…") {
  antojosBusyLock = on;
  if (antojosBusy) antojosBusy.hidden = !on;
  if (antojosBusyText && on) antojosBusyText.textContent = message;
  if (antojoInput) antojoInput.disabled = on;
  if (antojoSubmit) {
    antojoSubmit.disabled = on;
    antojoSubmit.textContent = on ? "…" : "Añadir";
  }
  if (antojosPrev) antojosPrev.disabled = on;
  if (antojosNext) antojosNext.disabled = on;
}

function antojosPageCount() {
  return Math.max(1, Math.ceil(antojos.length / ANTOJOS_PAGE_SIZE));
}

function clampAntojosPage() {
  antojosPageIndex = Math.min(antojosPageIndex, antojosPageCount() - 1);
  antojosPageIndex = Math.max(0, antojosPageIndex);
}

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

function setDeskTab(tab) {
  deskTab = tab;
  const lettersOn = tab === "letters";
  if (deskLetters) deskLetters.hidden = !lettersOn;
  if (deskAntojos) deskAntojos.hidden = lettersOn;
  deskTabLetters?.classList.toggle("is-on", lettersOn);
  deskTabAntojos?.classList.toggle("is-on", !lettersOn);
}

function renderAntojos() {
  if (!antojosList) return;
  const syncNote = document.getElementById("antojos-sync");
  if (syncNote) syncNote.hidden = !isSyncEnabled();
  clampAntojosPage();

  const total = antojos.length;
  const done = antojos.filter((item) => item.done).length;
  if (antojosCount) {
    if (!total) antojosCount.textContent = "0";
    else if (done) antojosCount.textContent = `${total} · ${done} hechos`;
    else antojosCount.textContent = String(total);
  }

  const pages = antojosPageCount();
  const showPager = total > ANTOJOS_PAGE_SIZE;
  if (antojosPager) antojosPager.hidden = !showPager;
  if (antojosPage) antojosPage.textContent = `${antojosPageIndex + 1} / ${pages}`;
  if (antojosPrev) antojosPrev.disabled = antojosBusyLock || antojosPageIndex <= 0;
  if (antojosNext) antojosNext.disabled = antojosBusyLock || antojosPageIndex >= pages - 1;

  antojosList.replaceChildren();
  if (!total) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Todavía no hay nada. Escribe el primero abajo.";
    antojosList.appendChild(empty);
    return;
  }

  const start = antojosPageIndex * ANTOJOS_PAGE_SIZE;
  const pageItems = antojos.slice(start, start + ANTOJOS_PAGE_SIZE);
  pageItems.forEach((item) => {
    const row = document.createElement("li");
    if (item.done) row.classList.add("is-done");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = item.done;
    check.setAttribute("aria-label", "Marcar antojo");
    check.addEventListener("change", async () => {
      if (antojosBusyLock) {
        check.checked = item.done;
        return;
      }
      row.classList.add("is-busy");
      setAntojosBusy(true, "Actualizando…");
      try {
        antojos = await toggleAntojo(item.id);
      } finally {
        setAntojosBusy(false);
        renderAntojos();
      }
    });
    const text = document.createElement("span");
    text.textContent = item.text;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.addEventListener("click", async () => {
      if (antojosBusyLock) return;
      row.classList.add("is-busy");
      setAntojosBusy(true, "Eliminando…");
      try {
        antojos = await removeAntojo(item.id);
      } finally {
        setAntojosBusy(false);
        renderAntojos();
      }
    });
    row.append(check, text, remove);
    antojosList.appendChild(row);
  });
}

function renderLetter() {
  if (!letterTitle || !letterMeta || !letterBody) return;
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

function openDesk(tab = "letters") {
  if (!deskSheet) return;
  setDeskTab(tab);
  if (!letters.length) letterIndex = 0;
  else if (tab === "letters") letterIndex = letters.length - 1;
  renderLetter();
  renderAntojos();
  deskSheet.hidden = false;
  penguin.setPose("read");
  player.poseUntil = performance.now() + 1200;
}

function openLetter() {
  openDesk("letters");
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

on(promptBtn, "click", useActive);
on(closetClose, "click", () => {
  if (closetSheet) closetSheet.hidden = true;
});
on(deskClose, "click", () => {
  if (deskSheet) deskSheet.hidden = true;
  penguin.setPose("idle");
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});
on(deskTabLetters, "click", () => setDeskTab("letters"));
on(deskTabAntojos, "click", () => {
  setDeskTab("antojos");
  renderAntojos();
});
on(antojosForm, "submit", async (event) => {
  event.preventDefault();
  if (antojosBusyLock || !antojoInput) return;
  const value = antojoInput.value.trim();
  if (!value) return;
  setAntojosBusy(true, "Añadiendo…");
  try {
    antojos = await addAntojo(value);
    antojoInput.value = "";
    antojosPageIndex = antojosPageCount() - 1;
  } finally {
    setAntojosBusy(false);
    renderAntojos();
    antojoInput.focus();
  }
});
on(antojosPrev, "click", () => {
  if (antojosBusyLock || antojosPageIndex <= 0) return;
  antojosPageIndex -= 1;
  renderAntojos();
});
on(antojosNext, "click", () => {
  if (antojosBusyLock || antojosPageIndex >= antojosPageCount() - 1) return;
  antojosPageIndex += 1;
  renderAntojos();
});
on(letterPrev, "click", () => {
  if (!letters.length) return;
  letterIndex = (letterIndex - 1 + letters.length) % letters.length;
  renderLetter();
});
on(letterNext, "click", () => {
  if (!letters.length) return;
  letterIndex = (letterIndex + 1) % letters.length;
  renderLetter();
});

async function refreshDesk(announce) {
  letters = await loadLetters();
  antojos = await loadAntojos();
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
  if (deskSheet && !deskSheet.hidden && deskTab === "antojos" && !antojosBusyLock) {
    renderAntojos();
  }
}

await refreshDesk(true);
setInterval(() => refreshDesk(true), 12000);

if (loader) loader.hidden = true;

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
  const sheetOpen = (deskSheet && !deskSheet.hidden) || (closetSheet && !closetSheet.hidden);
  if (sheetOpen) {
    promptBtn.hidden = true;
  } else if (active) {
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
  if (!sheetOpen && input.consumeInteract()) useActive();

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
