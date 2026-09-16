import * as PIXI from "pixi.js";

declare global {
  interface Window {
    Live2DCubismCore?: unknown;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      // Script tag exists — wait until Cubism core is actually on window
      if (window.Live2DCubismCore) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`failed to load ${src}`)));
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

function absoluteUrl(path: string): string {
  try {
    return new URL(path, window.location.href).href;
  } catch {
    return path;
  }
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

  const url = absoluteUrl(modelUrl);
  const model = await Live2DModel.from(url);
  const bw = Math.max(model.width || 1, 1);
  const bh = Math.max(model.height || 1, 1);
  const scale = Math.min(host.clientWidth / bw, host.clientHeight / bh) * 0.95;
  model.scale.set(Number.isFinite(scale) && scale > 0 ? scale : 0.5);
  model.x = host.clientWidth / 2;
  model.y = host.clientHeight * 0.92;
  model.anchor.set(0.5, 1);
  app.stage.addChild(model);

  return () => {
    try {
      app.stage.removeChild(model);
      model.destroy();
    } catch {
      /* ignore */
    }
    try {
      app.destroy(true, { children: true });
    } catch {
      /* ignore */
    }
  };
}
