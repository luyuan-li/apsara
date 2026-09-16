/**
 * Lightweight mouth-open hook for future TTS / ASR lip-sync.
 * Live2D Cubism parameters are typically ParamMouthOpenY or PARAM_MOUTH_OPEN_Y.
 */
export type LipSyncTarget = {
  internalModel?: {
    coreModel?: {
      getParameterIndex?: (id: string) => number;
      setParameterValueByIndex?: (index: number, value: number) => void;
      setParameterValueById?: (id: string, value: number) => void;
    };
  };
};

const MOUTH_IDS = ["ParamMouthOpenY", "PARAM_MOUTH_OPEN_Y", "ParamA"];

/** Set mouth open amount in 0..1. No-ops if the model has no mouth param. */
export function setLipSyncAmount(model: LipSyncTarget, amount: number): void {
  const core = model.internalModel?.coreModel;
  if (!core) return;
  const v = Math.max(0, Math.min(1, amount));
  for (const id of MOUTH_IDS) {
    try {
      if (core.setParameterValueById) {
        core.setParameterValueById(id, v);
        return;
      }
      const idx = core.getParameterIndex?.(id) ?? -1;
      if (idx >= 0) {
        core.setParameterValueByIndex?.(idx, v);
        return;
      }
    } catch {
      /* try next id */
    }
  }
}

/** Simple demo pulse — useful to verify mouth param wiring without TTS. */
export function pulseLipSync(model: LipSyncTarget, ms = 600): void {
  const start = performance.now();
  const tick = (now: number) => {
    const t = (now - start) / ms;
    if (t >= 1) {
      setLipSyncAmount(model, 0);
      return;
    }
    setLipSyncAmount(model, Math.sin(t * Math.PI));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
