export const ACTION_TYPES = Object.freeze({
  EAT: "eat",
  STORE: "store",
  FIGHT: "fight",
});

const STORED_FOOD_VITALITY = 200;
const FIGHT_DAMAGE = 200;
const FIGHT_RECOIL = 100;

function randomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function createRules() {
  return [
    {
      id: "eat-fresh",
      action: ACTION_TYPES.EAT,
      label: "Ate fresh food",
      applies: ({ oob, perception }) =>
        oob.health < oob.maxHealth && perception.touchingFood.length > 0,
      execute: ({ oob, perception, world }) => {
        const food = perception.touchingFood[0];
        world.removeFood(food.id);
        const restored = Math.min(food.nutrition, oob.maxHealth - oob.health);
        oob.health += restored;
        return oob.name + " eats touching food and restores " + restored + " vitality.";
      },
    },
    {
      id: "eat-stored",
      action: ACTION_TYPES.EAT,
      label: "Ate stored food",
      applies: ({ oob, perception }) =>
        perception.touchingFood.length === 0 &&
        oob.storedFood > 0 &&
        oob.health <= oob.maxHealth * 0.7,
      execute: ({ oob }) => {
        oob.storedFood -= 1;
        const restored = Math.min(
          STORED_FOOD_VITALITY,
          oob.maxHealth - oob.health,
        );
        oob.health += restored;
        return oob.name + " eats from storage and restores " + restored + " vitality.";
      },
    },
    {
      id: "store-food",
      action: ACTION_TYPES.STORE,
      label: "Stored food",
      applies: ({ oob, perception }) =>
        oob.storedFood < oob.storageCapacity &&
        perception.touchingFood.length > 0,
      execute: ({ oob, perception, world }) => {
        const food = perception.touchingFood[0];
        world.removeFood(food.id);
        oob.storedFood += 1;
        return (
          oob.name +
          " stores touching food (" +
          oob.storedFood +
          "/" +
          oob.storageCapacity +
          ")."
        );
      },
    },
    {
      id: "fight",
      action: ACTION_TYPES.FIGHT,
      label: "Fought an oob",
      applies: ({ perception }) => perception.touchingOobs.length > 0,
      execute: ({ oob, perception }) => {
        const target = perception.touchingOobs.reduce((weakest, candidate) =>
          candidate.health < weakest.health ? candidate : weakest,
        );
        const strike = oob.attack + randomInteger(1, 4);
        const block = target.defense + randomInteger(1, 4);

        if (strike > block) {
          target.takeDamage(FIGHT_DAMAGE);
          return target.isAlive
            ? oob.name +
                " strikes " +
                target.name +
                " for " +
                FIGHT_DAMAGE +
                " vitality."
            : oob.name + " sends " + target.name + " dormant.";
        }

        oob.takeDamage(FIGHT_RECOIL);
        return oob.isAlive
          ? target.name +
              " blocks " +
              oob.name +
              "; recoil costs " +
              FIGHT_RECOIL +
              " vitality."
          : target.name + " blocks the attack and " + oob.name + " goes dormant.";
      },
    },
  ];
}

export class RuleSystem {
  constructor() {
    this.rules = createRules();
    this.actionCounts = new Map(
      Object.values(ACTION_TYPES).map((action) => [action, 0]),
    );
  }

  resetStatistics() {
    for (const action of this.actionCounts.keys()) {
      this.actionCounts.set(action, 0);
    }
  }

  select(context) {
    return this.rules.find((rule) => rule.applies(context)) ?? null;
  }

  execute(context) {
    const selectedRule = this.select(context);

    if (!selectedRule) {
      context.oob.lastAction = "No action";
      return null;
    }

    const message = selectedRule.execute(context);
    context.oob.lastAction = selectedRule.label;
    context.oob.lastRule = selectedRule.id;
    this.actionCounts.set(
      selectedRule.action,
      this.getActionCount(selectedRule.action) + 1,
    );

    return {
      action: selectedRule.action,
      rule: selectedRule.id,
      message,
    };
  }

  getActionCount(action) {
    return this.actionCounts.get(action) ?? 0;
  }
}
