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

async function mountSkin() {
  dispose?.();
  dispose = null;
  if (!host.value) return;
  host.value.innerHTML = "";
  if (props.skin.kind === "live2d") {
    dispose = await createLive2dStage(host.value, props.skin.src);
  } else {
    dispose = await createGuofengStage(host.value, props.skin.src);
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
watch(() => props.skin.id, mountSkin);
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
  cursor: pointer;
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
}
.host :deep(canvas),
.host :deep(img.pet) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: transparent;
  border: 0;
  outline: none;
  filter: drop-shadow(0 18px 28px rgba(60, 35, 20, 0.18));
}
</style>
