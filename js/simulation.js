import { PhysicsSystem } from "./physics.js";
import { RuleSystem } from "./rules.js";

export const WORLD_BOUNDS = Object.freeze({ width: 1200, height: 700 });
export const INITIAL_OOB_COUNT = 12;
export const INITIAL_FOOD_COUNT = 100;

export const OOB_COLORS = Object.freeze(
  Array.from({ length: INITIAL_OOB_COUNT }, (_, index) => {
    const lightness = Math.max(
      0,
      Number(
        (100 - index * (100 / (INITIAL_OOB_COUNT - 1))).toFixed(2),
      ),
    );
    const label =
      index === 0
        ? "White"
        : index === INITIAL_OOB_COUNT - 1
          ? "Black"
          : "Gray " + String(index).padStart(2, "0");

    return Object.freeze({
      label,
      lightness,
      value: "hsl(0 0% " + lightness + "%)",
      foreground: lightness < 46 ? "#fffdf6" : "#171713",
    });
  }),
);

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

function perimeterPosition(index, total) {
  const margin = 46;
  const horizontalLength = WORLD_BOUNDS.width - margin * 2;
  const verticalLength = WORLD_BOUNDS.height - margin * 2;
  const perimeter = 2 * (horizontalLength + verticalLength);
  let distance = (index / total) * perimeter;

  if (distance <= horizontalLength) {
    return { x: margin + distance, y: margin };
  }

  distance -= horizontalLength;
  if (distance <= verticalLength) {
    return {
      x: WORLD_BOUNDS.width - margin,
      y: margin + distance,
    };
  }

  distance -= verticalLength;
  if (distance <= horizontalLength) {
    return {
      x: WORLD_BOUNDS.width - margin - distance,
      y: WORLD_BOUNDS.height - margin,
    };
  }

  distance -= horizontalLength;
  return {
    x: margin,
    y: WORLD_BOUNDS.height - margin - distance,
  };
}

export class Oob {
  constructor(soul, color, face, position) {
    this.soul = soul;
    this.name = createName();
    this.face = face;
    this.backgroundColor = color.value;
    this.foregroundColor = color.foreground;
    this.colorLabel = color.label;
    this.colorLightness = color.lightness;
    this.age = 0;
    this.attack = randomInteger(1, 10);
    this.defense = randomInteger(1, 10);
    this.movement = randomInteger(1, 10);
    this.health = randomInteger(6, 10);
    this.maxHealth = 10;
    this.storedFood = 0;
    this.storageCapacity = 5;
    this.lastAction = "None yet";
    this.lastRule = null;
    this.lastMovement = 0;
    this.heading = Math.atan2(
      WORLD_BOUNDS.height / 2 - position.y,
      WORLD_BOUNDS.width / 2 - position.x,
    );

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
    this.nutrition = 3;
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
    this.oobs = OOB_COLORS.map((color, index) => {
      const position = perimeterPosition(index, INITIAL_OOB_COUNT);
      return new Oob(index + 1, color, OOB_FACES[index], position);
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

  planMovement(oob) {
    const perception = this.physics.perceive(oob, this.oobs, this.food);
    let target = perception.nearestFood;

    if (!target && perception.nearestOob) {
      target = perception.nearestOob.body;
    }

    if (target) {
      const baseAngle = Math.atan2(
        target.y - oob.body.y,
        target.x - oob.body.x,
      );
      const jitter = (Math.random() - 0.5) * 0.22;
      oob.heading = baseAngle + jitter;
    } else {
      oob.heading += (Math.random() - 0.5) * 0.7;
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

    for (const oob of shuffle(activeOobs)) {
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
        oob.age += 1;
      }
    }

    this.physics.settleBodies(this.oobs);
    return { completed: true, events };
  }
}
