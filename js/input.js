export function createInput(root) {
  const keys = new Set();
  const look = { x: 0, y: 0 };
  const move = { x: 0, y: 0 };
  let interactQueued = false;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  window.addEventListener("keydown", (event) => {
    keys.add(event.key.toLowerCase());
    if (event.key === "e" || event.key === "E" || event.key === "Enter") {
      interactQueued = true;
    }
  });
  window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
  });

  const stick = root.querySelector("#stick");
  const knob = root.querySelector("#stick-knob");

  const setKnob = (x, y) => {
    if (!knob) return;
    knob.style.transform = `translate(${x * 28}px, ${y * 28}px)`;
  };

  const readStick = (clientX, clientY) => {
    const rect = stick.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.38;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, len / max);
    move.x = (dx / len) * scale;
    move.y = (dy / len) * scale;
    setKnob(move.x, move.y);
  };

  const endStick = () => {
    move.x = 0;
    move.y = 0;
    setKnob(0, 0);
  };

  if (stick) {
    stick.addEventListener("pointerdown", (event) => {
      stick.setPointerCapture(event.pointerId);
      readStick(event.clientX, event.clientY);
    });
    stick.addEventListener("pointermove", (event) => {
      if (event.pressure || event.buttons) readStick(event.clientX, event.clientY);
    });
    stick.addEventListener("pointerup", endStick);
    stick.addEventListener("pointercancel", endStick);
  }

  const onLookStart = (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
  };
  const onLookMove = (event) => {
    if (!dragging) return;
    look.x += (event.clientX - lastX) * 0.005;
    look.y += (event.clientY - lastY) * 0.003;
    look.y = Math.max(-0.35, Math.min(0.55, look.y));
    lastX = event.clientX;
    lastY = event.clientY;
  };
  const onLookEnd = () => {
    dragging = false;
  };

  root.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a, .sheet, .letter, .stick")) return;
    onLookStart(event);
  });
  window.addEventListener("pointermove", onLookMove);
  window.addEventListener("pointerup", onLookEnd);

  return {
    look,
    consumeInteract() {
      const value = interactQueued;
      interactQueued = false;
      return value;
    },
    sampleMove() {
      let x = move.x;
      let y = move.y;
      if (keys.has("a") || keys.has("arrowleft")) x -= 1;
      if (keys.has("d") || keys.has("arrowright")) x += 1;
      if (keys.has("w") || keys.has("arrowup")) y -= 1;
      if (keys.has("s") || keys.has("arrowdown")) y += 1;
      const len = Math.hypot(x, y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
      return { x, y: -y };
    },
  };
}
