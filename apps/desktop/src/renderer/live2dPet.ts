import * as PIXI from "pixi.js";
import { pulseLipSync, setLipSyncAmount } from "./lipSync";

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

export type Live2dHandlers = {
  onActivate?: () => void;
  onContextMenu?: (pos: { x: number; y: number }) => void;
};

function isHeadHit(areas: string[]): boolean {
  return areas.some((a) => /head/i.test(a));
}

function isBodyHit(areas: string[]): boolean {
  return areas.some((a) => /body/i.test(a));
}

/** Cubism 4 Live2D stage via pixi-live2d-display. */
export type Live2dController = {
  dispose: () => void;
  randomExpression: () => Promise<void>;
};

export async function createLive2dStage(
  host: HTMLElement,
  modelUrl: string,
  handlers: Live2dHandlers = {},
): Promise<Live2dController> {
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
  host.appendChild(view);

  const url = absoluteUrl(modelUrl);
  const model = await Live2DModel.from(url, {
    autoInteract: true,
  });

  const bw = Math.max(model.width || 1, 1);
  const bh = Math.max(model.height || 1, 1);
  const pad = 0.88;
  const baseScale = Math.min(host.clientWidth / bw, host.clientHeight / bh) * pad;
  const safeScale = Number.isFinite(baseScale) && baseScale > 0 ? baseScale : 0.4;
  model.scale.set(safeScale);
  model.anchor.set(0.5, 0.5);
  const homeX = host.clientWidth / 2;
  const homeY = host.clientHeight / 2;
  model.x = homeX;
  model.y = homeY;
  model.interactive = true;
  model.cursor = "pointer";
  app.stage.addChild(model);

  const play = async (group: string, index?: number) => {
    try {
      const ok = await model.motion(group, index);
      return ok;
    } catch {
      return false;
    }
  };

  const reactHead = async () => {
    // Prefer a random expression on head tap; fall back to TapBody
    try {
      const ok = await model.expression(Math.floor(Math.random() * 8));
      if (ok) {
        pulseLipSync(model, 450);
        return;
      }
    } catch {
      /* no expressions */
    }
    try {
      if (await model.expression()) {
        pulseLipSync(model, 450);
        return;
      }
    } catch {
      /* no expressions */
    }
    await play("TapBody", 0);
  };

  const reactBody = async () => {
    // Random TapBody index when the group has several motions
    const ok = await play("TapBody");
    if (!ok) await play("Idle");
  };

  const onHit = (hitAreas: string[]) => {
    if (suppressHit) {
      suppressHit = false;
      return;
    }
    if (isHeadHit(hitAreas)) void reactHead();
    else if (isBodyHit(hitAreas)) void reactBody();
    else void reactBody();
  };
  model.on("hit", onHit);

  // --- drag to shake / spring back ---
  let dragging = false;
  let dragMoved = false;
  let suppressHit = false;
  let pointerId: number | null = null;
  let startClientX = 0;
  let startClientY = 0;
  let originX = homeX;
  let originY = homeY;
  const maxPull = 48;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    dragging = true;
    dragMoved = false;
    pointerId = e.pointerId;
    startClientX = e.clientX;
    startClientY = e.clientY;
    originX = model.x;
    originY = model.y;
    view.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging || pointerId !== e.pointerId) return;
    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;
    if (Math.hypot(dx, dy) > 4) dragMoved = true;
    const pullX = Math.max(-maxPull, Math.min(maxPull, dx * 0.35));
    const pullY = Math.max(-maxPull, Math.min(maxPull, dy * 0.35));
    model.x = originX + pullX;
    model.y = originY + pullY;
    model.rotation = pullX * 0.0025;
  };

  const springHome = () => {
    const fromX = model.x;
    const fromY = model.y;
    const fromR = model.rotation;
    const t0 = performance.now();
    const dur = 280;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      model.x = fromX + (homeX - fromX) * ease;
      model.y = fromY + (homeY - fromY) * ease;
      model.rotation = fromR * (1 - ease);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return;
    dragging = false;
    pointerId = null;
    try {
      view.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (dragMoved) {
      suppressHit = true;
      springHome();
      void play("TapBody");
    }
  };

  view.addEventListener("pointerdown", onPointerDown);
  view.addEventListener("pointermove", onPointerMove);
  view.addEventListener("pointerup", onPointerUp);
  view.addEventListener("pointercancel", onPointerUp);

  const onDblClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlers.onActivate?.();
  };
  view.addEventListener("dblclick", onDblClick);

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlers.onContextMenu?.({ x: e.clientX, y: e.clientY });
  };
  view.addEventListener("contextmenu", onContextMenu);

  // --- random idle / expression ---
  let idleTimer: number | undefined;
  const scheduleIdle = () => {
    const delay = 7000 + Math.random() * 9000;
    idleTimer = window.setTimeout(async () => {
      if (!dragging) {
        // alternate expression vs idle motion
        if (Math.random() < 0.45) {
          try {
            await model.expression();
          } catch {
            await play("Idle");
          }
        } else {
          await play("Idle");
        }
      }
      scheduleIdle();
    }, delay);
  };
  scheduleIdle();

  try {
    void play("Idle");
  } catch {
    /* optional */
  }

  setLipSyncAmount(model, 0);

  const randomExpression = async () => {
    try {
      const ok = await model.expression(Math.floor(Math.random() * 8));
      if (ok) {
        pulseLipSync(model, 500);
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await model.expression();
      pulseLipSync(model, 500);
      return;
    } catch {
      /* fall through */
    }
    await play("Idle");
  };

  return {
    randomExpression,
    dispose: () => {
    if (idleTimer) window.clearTimeout(idleTimer);
    view.removeEventListener("dblclick", onDblClick);
    view.removeEventListener("contextmenu", onContextMenu);
    view.removeEventListener("pointerdown", onPointerDown);
    view.removeEventListener("pointermove", onPointerMove);
    view.removeEventListener("pointerup", onPointerUp);
    view.removeEventListener("pointercancel", onPointerUp);
    try {
      model.off("hit", onHit);
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
    },
  };
}
