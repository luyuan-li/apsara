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

type Live2dHandlers = {
  /** Double-click pet → open/close chrome */
  onActivate?: () => void;
};

/** Cubism 4 Live2D stage via pixi-live2d-display. */
export async function createLive2dStage(
  host: HTMLElement,
  modelUrl: string,
  handlers: Live2dHandlers = {},
): Promise<() => void> {
  await loadScript("/live2d-core/live2dcubismcore.min.js");
  if (!window.Live2DCubismCore) {
    throw new Error("Live2D Cubism core missing after script load");
  }
  const { Live2DModel } = await import("pixi-live2d-display/cubism4");

  Live2DModel.registerTicker?.(PIXI.Ticker);

  const app = new PIXI.Application({
    backgroundAlpha: 0,
    resizeTo: host,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  const view = app.view as HTMLCanvasElement;
  view.style.pointerEvents = "auto";
  view.style.cursor = "pointer";
  // Don't let Tauri treat the canvas as a drag region — keep drag on empty stage margins
  view.removeAttribute("data-tauri-drag-region");
  host.appendChild(view);

  const url = absoluteUrl(modelUrl);
  const model = await Live2DModel.from(url, {
    autoInteract: true, // eyes / head follow pointer
  });

  const bw = Math.max(model.width || 1, 1);
  const bh = Math.max(model.height || 1, 1);
  const pad = 0.88;
  const scale = Math.min(host.clientWidth / bw, host.clientHeight / bh) * pad;
  model.scale.set(Number.isFinite(scale) && scale > 0 ? scale : 0.4);
  model.anchor.set(0.5, 0.5);
  model.x = host.clientWidth / 2;
  model.y = host.clientHeight / 2;
  model.interactive = true;
  model.cursor = "pointer";
  app.stage.addChild(model);

  const playTap = () => {
    void model.motion("TapBody").then((ok) => {
      if (!ok) void model.motion("Idle");
    });
  };

  // Hit-area aware tap (Body / Head when model defines them)
  const onHit = (hitAreas: string[]) => {
    if (!hitAreas?.length) {
      playTap();
      return;
    }
    void model.motion("TapBody").then((ok) => {
      if (!ok) void model.motion("Idle");
    });
  };
  model.on("hit", onHit);

  // Fallback pointer tap when hit areas are missing
  const onPointerTap = () => playTap();
  model.on("pointertap", onPointerTap);

  // Double-click opens chrome (don't rely only on stage behind pointer-events)
  const onDblClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlers.onActivate?.();
  };
  view.addEventListener("dblclick", onDblClick);

  try {
    void model.motion("Idle");
  } catch {
    /* optional */
  }

  return () => {
    view.removeEventListener("dblclick", onDblClick);
    try {
      model.off("hit", onHit);
      model.off("pointertap", onPointerTap);
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
