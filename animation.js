// animation.js

const AnimationSystem = {
  effects: {},

  register(name, fn) {
    this.effects[name] = fn;
  },

  async play(name, cells, options = {}) {
    const effect = this.effects[name];
    if (!effect) return;
    await effect(cells, options);
  }
};

//import { AnimationSystem } from "./animation.js";

AnimationSystem.register("vaporize", async function(cells, { duration = 300 } = {}) {
  const start = performance.now();

  return new Promise(resolve => {
    function frame() {
      const now = performance.now();
      const t = Math.min(1, (now - start) / duration);

      // Draw overlay effects
      for (let { r, c } of cells) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        const alpha = 1 - t;
        const scale = 1 - t * 0.5;

        ctx.save();
        ctx.translate(x + TILE_SIZE/2, y + TILE_SIZE/2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Highlight ring
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    frame();
  });
});

