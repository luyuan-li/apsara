<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createGuofengStage } from "../renderer/guofengPet";
import { createLive2dStage } from "../renderer/live2dPet";

const props = withDefaults(
  defineProps<{ skin?: "guofeng" | "live2d-mao" }>(),
  { skin: "guofeng" },
);

const host = ref<HTMLDivElement | null>(null);
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

onMounted(mountSkin);
watch(() => props.skin, mountSkin);
onBeforeUnmount(() => {
  dispose?.();
  dispose = null;
});
</script>

<template>
  <div class="stage" data-tauri-drag-region>
    <div ref="host" class="host" />
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  min-height: 200px;
  display: grid;
  place-items: center;
}
.host {
  width: min(280px, 85%);
  height: min(320px, 55vh);
  position: relative;
}
.host :deep(canvas),
.host :deep(img.pet) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 12px 22px rgba(90, 50, 30, 0.22));
}
</style>
