import * as PIXI from "pixi.js";

declare global {
  interface Window {
    Live2DCubismCore?: unknown;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/** Cubism 4 Live2D stage via pixi-live2d-display. */
export async function createLive2dStage(
  host: HTMLElement,
  modelUrl: string,
): Promise<() => void> {
  await loadScript("/live2d-core/live2dcubismcore.min.js");
  const { Live2DModel } = await import("pixi-live2d-display/cubism4");

  // @ts-expect-error pixi ticker registration used by the plugin
  Live2DModel.registerTicker?.(PIXI.Ticker);

  const app = new PIXI.Application({
    backgroundAlpha: 0,
    resizeTo: host,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  host.appendChild(app.view as HTMLCanvasElement);

  const model = await Live2DModel.from(modelUrl);
  const scale = Math.min(host.clientWidth / model.width, host.clientHeight / model.height) * 0.95;
  model.scale.set(scale);
  model.x = host.clientWidth / 2;
  model.y = host.clientHeight * 0.92;
  model.anchor.set(0.5, 1);
  app.stage.addChild(model);

  const onTick = () => {
    // idle motion handled by model internals when available
  };
  app.ticker.add(onTick);

  return () => {
    app.ticker.remove(onTick);
    model.destroy();
    app.destroy(true, { children: true });
  };
}
