import { GraphicsSystem } from "./graphics.js";
import {
  INITIAL_FOOD_COUNT,
  INITIAL_OOB_COUNT,
  OobWorld,
  WORLD_BOUNDS,
} from "./simulation.js";

const AUTO_CYCLE_INTERVAL = 160;
const MAX_LOG_ENTRIES = 120;

const elements = {
  canvas: document.querySelector("#world-canvas"),
  eventLog: document.querySelector("#event-log"),
  livingCount: document.querySelector("#living-count"),
  cycleCount: document.querySelector("#cycle-count"),
  foodCount: document.querySelector("#food-count"),
  status: document.querySelector("#world-status"),
  toggleRun: document.querySelector("#toggle-run"),
  stepCycle: document.querySelector("#step-cycle"),
  resetWorld: document.querySelector("#reset-world"),
  clearLog: document.querySelector("#clear-log"),
  inspector: document.querySelector("#oob-inspector"),
  closeInspector: document.querySelector("#close-inspector"),
  inspectorFace: document.querySelector("#inspector-face"),
  inspectorSoul: document.querySelector("#inspector-soul"),
  inspectorName: document.querySelector("#inspector-name"),
  inspectorHealth: document.querySelector("#inspector-health"),
  inspectorAttack: document.querySelector("#inspector-attack"),
  inspectorDefense: document.querySelector("#inspector-defense"),
  inspectorMovement: document.querySelector("#inspector-movement"),
  inspectorFood: document.querySelector("#inspector-food"),
  inspectorAge: document.querySelector("#inspector-age"),
  inspectorMass: document.querySelector("#inspector-mass"),
  inspectorLastMove: document.querySelector("#inspector-last-move"),
  inspectorColor: document.querySelector("#inspector-color"),
  inspectorColorSwatch: document.querySelector("#inspector-color-swatch"),
  inspectorAction: document.querySelector("#inspector-action"),
  eatRuleCount: document.querySelector("#eat-rule-count"),
  storeRuleCount: document.querySelector("#store-rule-count"),
  fightRuleCount: document.querySelector("#fight-rule-count"),
};

const world = new OobWorld();
const graphics = new GraphicsSystem(elements.canvas, WORLD_BOUNDS);
let selectedSoul = null;
let autoCycleTimer = null;

function addTextElement(parent, className, text) {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  parent.append(element);
}

function logEvent(message, type = "system") {
  const item = document.createElement("li");
  item.className = "event event--" + type;
  addTextElement(item, "event__cycle", "C" + world.cycle);
  addTextElement(item, "event__message", message);
  elements.eventLog.prepend(item);

  while (elements.eventLog.children.length > MAX_LOG_ENTRIES) {
    elements.eventLog.lastElementChild.remove();
  }
}

function setStatus(message) {
  elements.status.textContent = message;
}

function renderSummary() {
  elements.livingCount.textContent =
    world.livingOobs.length + "/" + world.oobs.length;
  elements.cycleCount.textContent = String(world.cycle);
  elements.foodCount.textContent = String(world.food.length);
  elements.eatRuleCount.textContent = String(
    world.rules.getActionCount("eat"),
  );
  elements.storeRuleCount.textContent = String(
    world.rules.getActionCount("store"),
  );
  elements.fightRuleCount.textContent = String(
    world.rules.getActionCount("fight"),
  );
  elements.canvas.setAttribute(
    "aria-label",
    "Oob environment at cycle " +
      world.cycle +
      " with " +
      world.livingOobs.length +
      " living oobs and " +
      world.food.length +
      " food particles.",
  );
}

function renderInspector() {
  if (selectedSoul === null) {
    elements.inspector.hidden = true;
    return;
  }

  const oob = world.findOob(selectedSoul);
  if (!oob) {
    selectedSoul = null;
    graphics.setSelected(null);
    elements.inspector.hidden = true;
    return;
  }

  elements.inspector.hidden = false;
  elements.inspectorFace.textContent = oob.isAlive ? oob.face : "(×_×)";
  elements.inspectorFace.style.setProperty(
    "--oob-color",
    oob.backgroundColor,
  );
  elements.inspectorFace.style.setProperty(
    "--oob-ink",
    oob.foregroundColor,
  );
  elements.inspectorSoul.textContent =
    "Oob #" + oob.soul + (oob.isAlive ? "" : " · Dormant");
  elements.inspectorName.textContent = oob.name;
  elements.inspectorHealth.textContent = oob.health + "/" + oob.maxHealth;
  elements.inspectorAttack.textContent = String(oob.attack);
  elements.inspectorDefense.textContent = String(oob.defense);
  elements.inspectorMovement.textContent = oob.movement + " px";
  elements.inspectorFood.textContent =
    oob.storedFood + "/" + oob.storageCapacity;
  elements.inspectorAge.textContent = oob.age + " cycles";
  elements.inspectorMass.textContent = oob.body.mass.toFixed(2);
  elements.inspectorLastMove.textContent =
    oob.lastMovement.toFixed(1) + " px";
  elements.inspectorColor.textContent =
    oob.colorLabel +
    " · " +
    oob.colorLightness.toFixed(2).replace(/\.?0+$/, "") +
    "% lightness";
  elements.inspectorColorSwatch.style.setProperty(
    "--oob-color",
    oob.backgroundColor,
  );
  elements.inspectorAction.textContent = oob.lastAction;
}

function renderInterface() {
  renderSummary();
  renderInspector();
}

function selectOob(oob) {
  selectedSoul = oob?.soul ?? null;
  graphics.setSelected(selectedSoul);
  renderInspector();
}

function runOneCycle() {
  const result = world.runCycle();

  for (const event of result.events) {
    logEvent(event.message, event.action);
  }

  renderInterface();
  setStatus(
    result.completed
      ? "Cycle " + world.cycle + " complete"
      : "Simulation complete",
  );

  if (!result.completed) {
    stopAutoRun();
  }
}

function startAutoRun() {
  if (autoCycleTimer !== null) {
    return;
  }

  elements.toggleRun.textContent = "Pause simulation";
  elements.toggleRun.setAttribute("aria-pressed", "true");
  elements.stepCycle.disabled = true;
  setStatus("Simulation running");
  autoCycleTimer = window.setInterval(runOneCycle, AUTO_CYCLE_INTERVAL);
}

function stopAutoRun() {
  if (autoCycleTimer !== null) {
    window.clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }

  elements.toggleRun.textContent = "Run simulation";
  elements.toggleRun.setAttribute("aria-pressed", "false");
  elements.stepCycle.disabled = false;
}

function cycleSelection(direction) {
  const oobs = world.oobs;
  if (oobs.length === 0) {
    return;
  }

  const currentIndex = oobs.findIndex((oob) => oob.soul === selectedSoul);
  const nextIndex =
    currentIndex < 0
      ? 0
      : (currentIndex + direction + oobs.length) % oobs.length;
  selectOob(oobs[nextIndex]);
}

elements.toggleRun.addEventListener("click", () => {
  if (autoCycleTimer === null) {
    startAutoRun();
  } else {
    stopAutoRun();
    setStatus("Simulation paused at cycle " + world.cycle);
  }
});

elements.stepCycle.addEventListener("click", runOneCycle);

elements.resetWorld.addEventListener("click", () => {
  stopAutoRun();
  world.reset();
  selectOob(null);
  elements.eventLog.replaceChildren();
  renderInterface();
  logEvent(
    INITIAL_OOB_COUNT +
      " oobs take the perimeter around " +
      INITIAL_FOOD_COUNT +
      " food particles.",
  );
  setStatus("World reset");
});

elements.clearLog.addEventListener("click", () => {
  elements.eventLog.replaceChildren();
  setStatus("Log cleared");
});

elements.closeInspector.addEventListener("click", () => {
  selectOob(null);
  elements.canvas.focus();
});

elements.canvas.addEventListener("click", (event) => {
  const point = graphics.eventToWorld(event);
  selectOob(graphics.pickOob(point, world.oobs));
});

elements.canvas.addEventListener("pointermove", (event) => {
  const point = graphics.eventToWorld(event);
  elements.canvas.style.cursor = graphics.pickOob(point, world.oobs)
    ? "pointer"
    : "crosshair";
});

elements.canvas.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    cycleSelection(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    cycleSelection(-1);
  } else if (event.key === "Escape") {
    selectOob(null);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && autoCycleTimer !== null) {
    stopAutoRun();
    setStatus("Simulation paused while hidden");
  }
});

world.reset();
renderInterface();
logEvent(
  INITIAL_OOB_COUNT +
    " oobs take the perimeter around " +
    INITIAL_FOOD_COUNT +
    " food particles.",
);
graphics.start(() => world);
