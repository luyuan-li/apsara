<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createGuofengStage } from "../renderer/guofengPet";
import { createLive2dStage } from "../renderer/live2dPet";

const props = withDefaults(
  defineProps<{
    skin?: "guofeng" | "live2d-mao";
    zoom?: number;
  }>(),
  { skin: "guofeng", zoom: 1 },
);

const emit = defineEmits<{
  activate: [];
  zoom: [number];
}>();

const host = ref<HTMLDivElement | null>(null);
const stage = ref<HTMLDivElement | null>(null);
let dispose: (() => void) | null = null;

async function mountSkin() {
  dispose?.();
  dispose = null;
  if (!host.value) return;
  host.value.innerHTML = "";
  if (props.skin === "live2d-mao") {
    dispose = await createLive2dStage(host.value, "/pets/live2d/mao/Mao.model3.json");
  } else {
    dispose = await createGuofengStage(host.value, "/pets/guofeng/apsara.png");
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.08 : 0.08;
  emit("zoom", (props.zoom ?? 1) + delta);
}

function onClick() {
  emit("activate");
}

onMounted(mountSkin);
watch(() => props.skin, mountSkin);
onBeforeUnmount(() => {
  dispose?.();
  dispose = null;
});
</script>

<template>
  <div
    ref="stage"
    class="stage"
    data-tauri-drag-region
    @wheel.prevent="onWheel"
    @dblclick.stop="onClick"
  >
    <div
      ref="host"
      class="host"
      :style="{ transform: `scale(${zoom})` }"
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
  /* no border / outline — pet only */
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
  /* soft shadow only, no hard outline */
  filter: drop-shadow(0 18px 28px rgba(60, 35, 20, 0.18));
}
</style>
