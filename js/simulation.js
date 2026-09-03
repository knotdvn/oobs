import { PhysicsSystem } from "./physics.js";
import { RuleSystem } from "./rules.js";

export const WORLD_BOUNDS = Object.freeze({ width: 1200, height: 700 });
export const INITIAL_OOB_COUNT = 12;
export const INITIAL_FOOD_COUNT = 100;
export const PERCEPTION_PIXELS_PER_POINT = 60;
export const MAX_VITALITY = 1000;
export const TIME_VITALITY_COST = 1;

const VITALITY_SCALE = MAX_VITALITY / 10;
const EXPLORATION_CANDIDATES = 10;
const EXPLORATION_GRACE_CYCLES = 30;

const SPECTRUM_COLOR_COUNT = INITIAL_OOB_COUNT - 2;
const spectrumColors = Array.from(
  { length: SPECTRUM_COLOR_COUNT },
  (_, index) => {
    const hue = index * (360 / SPECTRUM_COLOR_COUNT);
    const usesLightFace = hue >= 234 && hue <= 270;

    return Object.freeze({
      label: "Spectrum " + String(index + 1).padStart(2, "0"),
      hue,
      value: "hsl(" + hue + " 82% 58%)",
      foreground: usesLightFace ? "#fffdf6" : "#171713",
    });
  },
);

export const OOB_COLORS = Object.freeze([
  Object.freeze({
    label: "White",
    hue: null,
    value: "#fff",
    foreground: "#171713",
  }),
  ...spectrumColors,
  Object.freeze({
    label: "Black",
    hue: null,
    value: "#000",
    foreground: "#fffdf6",
  }),
]);

export const OOB_FACES = Object.freeze([
  "(0_o)",
  "(o_0)",
  "(•_•)",
  "(^_^)",
  "(¬_¬)",
  "(◉_◉)",
  "(•‿•)",
  "(>_<)",
  "(°_°)",
  "(ಠ_ಠ)",
  "(⊙_⊙)",
  "(ᵔᴗᵔ)",
]);

const consonants = "bcdfghjklmnprstvwxyz".split("");
const vowels = "aeiouy".split("");
const endings = ["ck", "rs", "rz", "lm", "lk", "lp", "rt", "ff", "tz", "sh"];

function randomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function choose(list) {
  return list[randomInteger(0, list.length - 1)];
}

function shuffle(list) {
  const result = [...list];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function createName() {
  const pairCount = randomInteger(1, 3);
  let name = choose(consonants).toUpperCase();

  for (let index = 0; index < pairCount; index += 1) {
    name += choose(vowels);
    name += choose(consonants);
  }

  if (Math.random() < 0.3) {
    name += choose(endings);
  }

  return name;
}

const PERIMETER_MARGIN = 46;
const MINIMUM_STARTING_DISTANCE = 62;

function perimeterPositionAt(distance) {
  const horizontalLength = WORLD_BOUNDS.width - PERIMETER_MARGIN * 2;
  const verticalLength = WORLD_BOUNDS.height - PERIMETER_MARGIN * 2;
  const perimeter = 2 * (horizontalLength + verticalLength);
  let perimeterDistance = ((distance % perimeter) + perimeter) % perimeter;

  if (perimeterDistance <= horizontalLength) {
    return {
      x: PERIMETER_MARGIN + perimeterDistance,
      y: PERIMETER_MARGIN,
    };
  }

  perimeterDistance -= horizontalLength;
  if (perimeterDistance <= verticalLength) {
    return {
      x: WORLD_BOUNDS.width - PERIMETER_MARGIN,
      y: PERIMETER_MARGIN + perimeterDistance,
    };
  }

  perimeterDistance -= verticalLength;
  if (perimeterDistance <= horizontalLength) {
    return {
      x: WORLD_BOUNDS.width - PERIMETER_MARGIN - perimeterDistance,
      y: WORLD_BOUNDS.height - PERIMETER_MARGIN,
    };
  }

  perimeterDistance -= horizontalLength;
  return {
    x: PERIMETER_MARGIN,
    y: WORLD_BOUNDS.height - PERIMETER_MARGIN - perimeterDistance,
  };
}

function createRandomPerimeterPositions(total) {
  const horizontalLength = WORLD_BOUNDS.width - PERIMETER_MARGIN * 2;
  const verticalLength = WORLD_BOUNDS.height - PERIMETER_MARGIN * 2;
  const perimeter = 2 * (horizontalLength + verticalLength);
  const positions = [];
  let attempts = 0;

  while (positions.length < total && attempts < 5000) {
    attempts += 1;
    const candidate = perimeterPositionAt(Math.random() * perimeter);
    const hasClearance = positions.every(
      (position) =>
        Math.hypot(candidate.x - position.x, candidate.y - position.y) >=
        MINIMUM_STARTING_DISTANCE,
    );

    if (hasClearance) {
      positions.push(candidate);
    }
  }

  if (positions.length === total) {
    return positions;
  }

  const randomOffset = Math.random() * perimeter;
  return Array.from({ length: total }, (_, index) =>
    perimeterPositionAt(randomOffset + (index / total) * perimeter),
  );
}

export class Oob {
  constructor(soul, color, face, position) {
    this.soul = soul;
    this.name = createName();
    this.face = face;
    this.backgroundColor = color.value;
    this.foregroundColor = color.foreground;
    this.colorLabel = color.label;
    this.colorHue = color.hue;
    this.age = 0;
    this.attack = randomInteger(1, 10);
    this.defense = randomInteger(1, 10);
    this.movement = randomInteger(1, 10);
    this.perception = randomInteger(1, 10);
    this.perceptionRadius = this.perception * PERCEPTION_PIXELS_PER_POINT;
    this.health = randomInteger(6, 10) * VITALITY_SCALE;
    this.maxHealth = MAX_VITALITY;
    this.storedFood = 0;
    this.storageCapacity = 5;
    this.lastAction = "None yet";
    this.lastRule = null;
    this.lastMovement = 0;
    this.heading = Math.random() * Math.PI * 2;
    this.explorationTarget = null;
    this.explorationCyclesRemaining = 0;
    this.stalledCycles = 0;

    const radius = 18 + this.defense * 0.35;
    this.body = {
      id: soul,
      x: position.x,
      y: position.y,
      radius,
      mass: 1 + radius / 20,
      velocity: { x: 0, y: 0 },
    };
  }

  get isAlive() {
    return this.health > 0;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}

export class FoodParticle {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = randomInteger(3, 5);
    this.nutrition = 3 * VITALITY_SCALE;
  }
}

export class OobWorld {
  constructor() {
    this.bounds = WORLD_BOUNDS;
    this.backgroundColor = "#dcebd2";
    this.physics = new PhysicsSystem(this.bounds);
    this.rules = new RuleSystem();
    this.oobs = [];
    this.food = [];
    this.cycle = 0;
  }

  get livingOobs() {
    return this.oobs.filter((oob) => oob.isAlive);
  }

  reset() {
    this.cycle = 0;
    this.rules.resetStatistics();
    const startingPositions = createRandomPerimeterPositions(INITIAL_OOB_COUNT);
    this.oobs = OOB_COLORS.map((color, index) => {
      return new Oob(
        index + 1,
        color,
        OOB_FACES[index],
        startingPositions[index],
      );
    });
    this.food = Array.from(
      { length: INITIAL_FOOD_COUNT },
      (_, index) => this.createFoodParticle(index + 1),
    );
    this.physics.settleBodies(this.oobs);
  }

  createFoodParticle(id) {
    const centerX = this.bounds.width / 2;
    const centerY = this.bounds.height / 2;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * 118;
    return new FoodParticle(
      id,
      centerX + Math.cos(angle) * distance,
      centerY + Math.sin(angle) * distance,
    );
  }

  removeFood(id) {
    const index = this.food.findIndex((particle) => particle.id === id);
    if (index >= 0) {
      this.food.splice(index, 1);
      return true;
    }
    return false;
  }

  findOob(soul) {
    return this.oobs.find((oob) => oob.soul === soul) ?? null;
  }

  createExplorationTarget(oob) {
    const margin = oob.body.radius + 24;
    let farthestTarget = null;
    let farthestDistance = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < EXPLORATION_CANDIDATES; index += 1) {
      const candidate = {
        x: margin + Math.random() * (this.bounds.width - margin * 2),
        y: margin + Math.random() * (this.bounds.height - margin * 2),
      };
      const distance = Math.hypot(
        candidate.x - oob.body.x,
        candidate.y - oob.body.y,
      );

      if (distance > farthestDistance) {
        farthestTarget = candidate;
        farthestDistance = distance;
      }
    }

    return farthestTarget;
  }

  planMovement(oob) {
    const perception = this.physics.perceive(oob, this.oobs, this.food);
    let target = perception.nearestFood;

    if (!target && perception.nearestOob) {
      target = perception.nearestOob.body;
    }

    if (target) {
      oob.explorationTarget = null;
      oob.explorationCyclesRemaining = 0;
      oob.stalledCycles = 0;
      const baseAngle = Math.atan2(
        target.y - oob.body.y,
        target.x - oob.body.x,
      );
      const jitter = (Math.random() - 0.5) * 0.22;
      oob.heading = baseAngle + jitter;
    } else {
      const madeLittleProgress =
        oob.age > 1 &&
        oob.lastMovement < Math.max(0.5, oob.movement * 0.2);
      oob.stalledCycles = madeLittleProgress ? oob.stalledCycles + 1 : 0;

      const currentTarget = oob.explorationTarget;
      const distanceToTarget = currentTarget
        ? Math.hypot(
            currentTarget.x - oob.body.x,
            currentTarget.y - oob.body.y,
          )
        : 0;
      const needsNewTarget =
        currentTarget === null ||
        distanceToTarget <= oob.body.radius + oob.movement ||
        oob.explorationCyclesRemaining <= 0 ||
        oob.stalledCycles >= 3;

      if (needsNewTarget) {
        oob.explorationTarget = this.createExplorationTarget(oob);
        const newDistance = Math.hypot(
          oob.explorationTarget.x - oob.body.x,
          oob.explorationTarget.y - oob.body.y,
        );
        oob.explorationCyclesRemaining =
          Math.ceil(newDistance / Math.max(1, oob.movement)) +
          EXPLORATION_GRACE_CYCLES;
        oob.stalledCycles = 0;
      }

      oob.explorationCyclesRemaining -= 1;
      oob.heading =
        Math.atan2(
          oob.explorationTarget.y - oob.body.y,
          oob.explorationTarget.x - oob.body.x,
        ) +
        (Math.random() - 0.5) * 0.08;
    }

    return {
      x: Math.cos(oob.heading) * oob.movement,
      y: Math.sin(oob.heading) * oob.movement,
    };
  }

  runCycle() {
    const events = [];
    const activeOobs = this.livingOobs;

    if (activeOobs.length === 0) {
      return {
        completed: false,
        events: [
          {
            action: "system",
            message: "No living oobs remain. Reset the world to begin again.",
          },
        ],
      };
    }

    this.cycle += 1;
    for (const oob of this.oobs) {
      oob.body.velocity.x = 0;
      oob.body.velocity.y = 0;
    }

    for (const oob of activeOobs) {
      oob.takeDamage(TIME_VITALITY_COST);
      oob.age += 1;

      if (!oob.isAlive) {
        oob.lastAction = "Vitality exhausted by time";
        oob.lastRule = "time-vitality";
        events.push({
          action: "system",
          rule: "time-vitality",
          message: oob.name + " goes dormant as its vitality runs out.",
        });
      }
    }

    for (const oob of shuffle(activeOobs.filter((oob) => oob.isAlive))) {
      if (!oob.isAlive) {
        continue;
      }

      const perception = this.physics.perceive(oob, this.oobs, this.food);
      const outcome = this.rules.execute({
        oob,
        perception,
        world: this,
      });

      if (outcome) {
        events.push(outcome);
      }

      if (oob.isAlive) {
        const intendedMovement = this.planMovement(oob);
        oob.lastMovement = this.physics.moveOob(
          oob,
          intendedMovement,
          this.oobs,
        );
      }
    }

    this.physics.settleBodies(this.oobs);
    return { completed: true, events };
  }
}
