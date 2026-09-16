<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createGuofengStage } from "../renderer/guofengPet";
import { createLive2dStage } from "../renderer/live2dPet";
import type { SkinItem } from "../types/skins";

const props = defineProps<{
  skin: SkinItem;
  zoom?: number;
}>();

const emit = defineEmits<{
  activate: [];
  zoom: [number];
}>();

const host = ref<HTMLDivElement | null>(null);
let dispose: (() => void) | null = null;
let mountGen = 0;

async function mountSkin() {
  const gen = ++mountGen;
  dispose?.();
  dispose = null;
  if (!host.value) return;
  host.value.replaceChildren();
  try {
    const next =
      props.skin.kind === "live2d"
        ? await createLive2dStage(host.value, props.skin.src, {
            onActivate: () => emit("activate"),
          })
        : await createGuofengStage(host.value, props.skin.src);
    if (gen !== mountGen) {
      next();
      return;
    }
    dispose = next;
  } catch (e) {
    console.error("[PetStage] failed to mount skin", props.skin.id, props.skin.src, e);
    if (gen === mountGen && host.value) {
      const err = document.createElement("div");
      err.className = "skin-error";
      err.textContent = `皮肤加载失败：${props.skin.name}`;
      host.value.appendChild(err);
    }
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  let step: number;
  if (e.deltaMode === 1) {
    step = e.deltaY > 0 ? -0.04 : 0.04;
  } else if (e.deltaMode === 2) {
    step = e.deltaY > 0 ? -0.08 : 0.08;
  } else {
    step = -e.deltaY * 0.0008;
    step = Math.max(-0.035, Math.min(0.035, step));
  }
  emit("zoom", (props.zoom ?? 1) + step);
}

function onClick() {
  emit("activate");
}

onMounted(mountSkin);
watch(() => [props.skin.id, props.skin.src, props.skin.kind], mountSkin);
onBeforeUnmount(() => {
  dispose?.();
  dispose = null;
});
</script>

<template>
  <div
    class="stage"
    data-tauri-drag-region
    @wheel.prevent="onWheel"
    @dblclick.stop="onClick"
  >
    <div
      ref="host"
      class="host"
      :class="{ interactive: skin.kind === 'live2d' }"
      :style="{ transform: `scale(${zoom ?? 1})` }"
    />
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  min-height: 220px;
  width: 100%;
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
  outline: none;
  cursor: grab;
}
.host {
  width: min(300px, 88%);
  height: min(340px, 56vh);
  position: relative;
  transform-origin: center center;
  transition: transform 0.12s ease-out;
  background: transparent;
  border: 0;
  outline: none;
  box-shadow: none;
  /* Image skins: let drag region receive events on the pet */
  pointer-events: none;
}
.host.interactive {
  /* Live2D: canvas receives mouse for focus / tap */
  pointer-events: auto;
  cursor: pointer;
}
.host :deep(img.pet) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: transparent;
  border: 0;
  outline: none;
  filter: drop-shadow(0 18px 28px rgba(60, 35, 20, 0.18));
  pointer-events: none;
}
.host :deep(canvas) {
  display: block;
  max-width: 100%;
  max-height: 100%;
  background: transparent;
  border: 0;
  outline: none;
  filter: drop-shadow(0 18px 28px rgba(60, 35, 20, 0.18));
}
.host.interactive :deep(canvas) {
  pointer-events: auto;
}
.skin-error {
  color: #a87b45;
  font-size: 12px;
  text-align: center;
  padding: 12px;
  pointer-events: none;
}
</style>
