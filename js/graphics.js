export class GraphicsSystem {
  constructor(canvas, bounds) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.bounds = bounds;
    this.selectedSoul = null;
    this.animationFrame = null;
    this.worldProvider = null;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.resize();
  }

  resize() {
    const rectangle = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rectangle.width * pixelRatio));
    const height = Math.max(1, Math.round(rectangle.height * pixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  start(worldProvider) {
    this.worldProvider = worldProvider;

    const drawFrame = (time) => {
      this.render(this.worldProvider(), time);
      this.animationFrame = window.requestAnimationFrame(drawFrame);
    };

    this.animationFrame = window.requestAnimationFrame(drawFrame);
  }

  setSelected(soul) {
    this.selectedSoul = soul;
  }

  eventToWorld(event) {
    const rectangle = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rectangle.left) / rectangle.width) * this.bounds.width,
      y: ((event.clientY - rectangle.top) / rectangle.height) * this.bounds.height,
    };
  }

  pickOob(point, oobs) {
    return (
      [...oobs].reverse().find((oob) => {
        const deltaX = point.x - oob.body.x;
        const deltaY = point.y - oob.body.y;
        return Math.hypot(deltaX, deltaY) <= oob.body.radius + 4;
      }) ?? null
    );
  }

  render(world, time) {
    const context = this.context;
    const scaleX = this.canvas.width / this.bounds.width;
    const scaleY = this.canvas.height / this.bounds.height;

    context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    context.clearRect(0, 0, this.bounds.width, this.bounds.height);
    this.drawEnvironment(context, world);

    const selectedOob = world.findOob(this.selectedSoul);
    if (selectedOob?.isAlive) {
      this.drawPerception(context, selectedOob);
    }

    this.drawFood(context, world.food, time);

    for (const oob of world.oobs) {
      this.drawOob(context, oob, oob.soul === this.selectedSoul);
    }
  }

  drawEnvironment(context, world) {
    const centerX = this.bounds.width / 2;
    const centerY = this.bounds.height / 2;
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      30,
      centerX,
      centerY,
      620,
    );
    gradient.addColorStop(0, "#edf7df");
    gradient.addColorStop(1, world.backgroundColor);
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.bounds.width, this.bounds.height);

    context.save();
    context.strokeStyle = "rgba(23, 23, 19, 0.09)";
    context.lineWidth = 1;
    for (let x = 50; x < this.bounds.width; x += 50) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, this.bounds.height);
      context.stroke();
    }
    for (let y = 50; y < this.bounds.height; y += 50) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(this.bounds.width, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(23, 23, 19, 0.24)";
    context.setLineDash([7, 9]);
    context.lineWidth = 2;
    context.beginPath();
    context.arc(centerX, centerY, 140, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  drawPerception(context, oob) {
    const body = oob.body;

    context.save();
    context.fillStyle = "rgba(45, 85, 255, 0.035)";
    context.strokeStyle = "rgba(23, 23, 19, 0.32)";
    context.lineWidth = 1.5;
    context.setLineDash([7, 9]);
    context.beginPath();
    context.arc(
      body.x,
      body.y,
      oob.perceptionRadius,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();
    context.restore();
  }

  drawFood(context, foodParticles, time) {
    const pulse = Math.sin(time / 420) * 0.7;

    for (const food of foodParticles) {
      context.save();
      context.translate(food.x, food.y);
      context.fillStyle = "rgba(23, 23, 19, 0.16)";
      context.beginPath();
      context.ellipse(
        1.5,
        food.radius + 2,
        food.radius + 1,
        2.2,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();

      context.fillStyle = "#ffd43b";
      context.strokeStyle = "#171713";
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(0, 0, food.radius + pulse, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  drawOob(context, oob, isSelected) {
    const body = oob.body;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);

    context.save();
    if (speed > 0.1 && oob.isAlive) {
      context.strokeStyle = "rgba(23, 23, 19, 0.18)";
      context.lineWidth = Math.max(2, body.radius * 0.18);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(body.x, body.y);
      context.lineTo(
        body.x - body.velocity.x * 2.2,
        body.y - body.velocity.y * 2.2,
      );
      context.stroke();
    }

    context.translate(body.x, body.y);

    if (isSelected) {
      context.strokeStyle = "#fffdf6";
      context.lineWidth = 8;
      context.beginPath();
      context.arc(0, 0, body.radius + 7, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = "#171713";
      context.lineWidth = 2.5;
      context.beginPath();
      context.arc(0, 0, body.radius + 7, 0, Math.PI * 2);
      context.stroke();
    }

    context.fillStyle = "rgba(23, 23, 19, 0.18)";
    context.beginPath();
    context.ellipse(
      3,
      body.radius + 5,
      body.radius * 0.82,
      body.radius * 0.28,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.globalAlpha = oob.isAlive ? 1 : 0.48;
    context.fillStyle = oob.isAlive ? oob.backgroundColor : "#8b8b84";
    context.strokeStyle = "#171713";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, body.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = oob.isAlive ? oob.foregroundColor : "#171713";
    context.font =
      "900 " +
      Math.max(10, body.radius * 0.53) +
      "px ui-monospace, SFMono-Regular, Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(oob.isAlive ? oob.face : "(×_×)", 0, 1);
    context.restore();
  }
}
