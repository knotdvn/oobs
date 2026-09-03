const CONTACT_TOLERANCE = 1.5;
const COLLISION_ELASTICITY = 0.45;

export function distanceBetween(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function circlesTouch(first, second, tolerance = CONTACT_TOLERANCE) {
  return distanceBetween(first, second) <= first.radius + second.radius + tolerance;
}

function limitVector(vector, maximumLength) {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0 || length <= maximumLength) {
    return { x: vector.x, y: vector.y, length };
  }

  const scale = maximumLength / length;
  return {
    x: vector.x * scale,
    y: vector.y * scale,
    length: maximumLength,
  };
}

export class PhysicsSystem {
  constructor(bounds) {
    this.bounds = bounds;
  }

  perceive(oob, oobs, foodParticles) {
    const body = oob.body;
    const livingOthers = oobs.filter(
      (candidate) => candidate !== oob && candidate.isAlive,
    );

    return {
      touchingFood: foodParticles.filter((food) => circlesTouch(body, food)),
      touchingOobs: livingOthers.filter((other) =>
        circlesTouch(body, other.body),
      ),
      nearestFood: this.findNearest(body, foodParticles),
      nearestOob: this.findNearest(
        body,
        livingOthers.map((other) => other.body),
        livingOthers,
      ),
    };
  }

  findNearest(origin, targets, sourceItems = targets) {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    targets.forEach((target, index) => {
      const currentDistance = distanceBetween(origin, target);
      if (currentDistance < nearestDistance) {
        nearest = sourceItems[index];
        nearestDistance = currentDistance;
      }
    });

    return nearest;
  }

  moveOob(oob, desiredMovement, allOobs) {
    const body = oob.body;
    const movement = limitVector(desiredMovement, oob.movement);
    const start = { x: body.x, y: body.y };

    body.velocity.x = movement.x;
    body.velocity.y = movement.y;

    if (movement.length === 0) {
      return 0;
    }

    const steps = Math.max(1, Math.ceil(movement.length));
    const stepX = movement.x / steps;
    const stepY = movement.y / steps;

    for (let step = 0; step < steps; step += 1) {
      body.x += stepX;
      body.y += stepY;
      this.resolveWallCollision(body);

      for (const other of allOobs) {
        if (other === oob) {
          continue;
        }
        this.resolveBodyCollision(body, other.body);
      }
    }

    const actualDistance = Math.hypot(body.x - start.x, body.y - start.y);
    return Math.min(oob.movement, actualDistance);
  }

  settleBodies(oobs, passes = 10) {
    for (let pass = 0; pass < passes; pass += 1) {
      for (let firstIndex = 0; firstIndex < oobs.length; firstIndex += 1) {
        const first = oobs[firstIndex].body;
        this.resolveWallCollision(first);

        for (
          let secondIndex = firstIndex + 1;
          secondIndex < oobs.length;
          secondIndex += 1
        ) {
          this.resolveBodyCollision(first, oobs[secondIndex].body);
        }
      }
    }
  }

  resolveWallCollision(body) {
    const left = body.radius;
    const right = this.bounds.width - body.radius;
    const top = body.radius;
    const bottom = this.bounds.height - body.radius;

    if (body.x < left) {
      body.x = left;
      body.velocity.x = Math.abs(body.velocity.x) * COLLISION_ELASTICITY;
    } else if (body.x > right) {
      body.x = right;
      body.velocity.x = -Math.abs(body.velocity.x) * COLLISION_ELASTICITY;
    }

    if (body.y < top) {
      body.y = top;
      body.velocity.y = Math.abs(body.velocity.y) * COLLISION_ELASTICITY;
    } else if (body.y > bottom) {
      body.y = bottom;
      body.velocity.y = -Math.abs(body.velocity.y) * COLLISION_ELASTICITY;
    }
  }

  resolveBodyCollision(first, second) {
    let deltaX = second.x - first.x;
    let deltaY = second.y - first.y;
    let distance = Math.hypot(deltaX, deltaY);
    const minimumDistance = first.radius + second.radius;

    if (distance >= minimumDistance) {
      return false;
    }

    let normalX;
    let normalY;

    if (distance === 0) {
      const angle = ((first.id + second.id) % 12) * (Math.PI / 6);
      normalX = Math.cos(angle);
      normalY = Math.sin(angle);
    } else {
      normalX = deltaX / distance;
      normalY = deltaY / distance;
    }

    const overlap = minimumDistance - distance;
    const firstInverseMass = 1 / first.mass;
    const secondInverseMass = 1 / second.mass;
    const inverseMassTotal = firstInverseMass + secondInverseMass;

    first.x -= normalX * overlap * (firstInverseMass / inverseMassTotal);
    first.y -= normalY * overlap * (firstInverseMass / inverseMassTotal);
    second.x += normalX * overlap * (secondInverseMass / inverseMassTotal);
    second.y += normalY * overlap * (secondInverseMass / inverseMassTotal);

    const relativeVelocityX = second.velocity.x - first.velocity.x;
    const relativeVelocityY = second.velocity.y - first.velocity.y;
    const normalVelocity =
      relativeVelocityX * normalX + relativeVelocityY * normalY;

    if (normalVelocity < 0) {
      const impulse =
        (-(1 + COLLISION_ELASTICITY) * normalVelocity) / inverseMassTotal;
      const impulseX = impulse * normalX;
      const impulseY = impulse * normalY;

      first.velocity.x -= impulseX * firstInverseMass;
      first.velocity.y -= impulseY * firstInverseMass;
      second.velocity.x += impulseX * secondInverseMass;
      second.velocity.y += impulseY * secondInverseMass;
    }

    this.resolveWallCollision(first);
    this.resolveWallCollision(second);
    return true;
  }
}
