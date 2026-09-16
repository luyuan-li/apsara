<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import PetStage from "./components/PetStage.vue";
import ChatPanel from "./components/ChatPanel.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import SkinStore from "./components/SkinStore.vue";
import { mockChat } from "@apsara/mock-llm";
import { invoke } from "@tauri-apps/api/core";
import { findSkin, loadCatalog } from "./skins/catalog";
import type { SkinItem } from "./types/skins";

type Msg = { role: "user" | "assistant"; text: string };

const messages = ref<Msg[]>([
  {
    role: "assistant",
    text: "双击角色打开面板；点「皮肤仓库」可选模型。滚轮缩放。",
  },
]);
const pending = ref<{ path: string } | null>(null);
const busy = ref(false);
const locked = ref(true);

/** locked=true → receive clicks; locked=false → click-through (穿透) */
async function applyClickThrough() {
  try {
    await getCurrentWindow().setIgnoreCursorEvents(!locked.value);
  } catch (e) {
    console.warn("setIgnoreCursorEvents failed", e);
  }
}

const chromeOpen = ref(false);
const storeOpen = ref(false);
const zoom = ref(1);
const skins = ref<SkinItem[]>([]);
const skinId = ref("live2d-mao");
/** Always prefer the skin object picked from the store (catalog may refresh). */
const activeSkin = ref<SkinItem | null>(null);

const fallbackSkin: SkinItem = {
  id: "live2d-mao",
  name: "Mao",
  kind: "live2d",
  preview: "/pets/live2d/mao/Mao.2048/texture_00.png",
  src: "/pets/live2d/mao/Mao.model3.json",
};

const currentSkin = computed<SkinItem>(() => {
  if (activeSkin.value && activeSkin.value.id === skinId.value) {
    return activeSkin.value;
  }
  return findSkin(skins.value, skinId.value) ?? activeSkin.value ?? fallbackSkin;
});

async function refreshCatalog() {
  const cat = await loadCatalog();
  skins.value = cat.skins;
  if (activeSkin.value) {
    const fresh = findSkin(skins.value, activeSkin.value.id);
    if (fresh) activeSkin.value = fresh;
  } else if (!findSkin(skins.value, skinId.value) && skins.value[0]) {
    skinId.value = skins.value[0].id;
    activeSkin.value = skins.value[0];
  } else {
    activeSkin.value = findSkin(skins.value, skinId.value) ?? skins.value[0] ?? fallbackSkin;
  }
}

onMounted(async () => {
  await refreshCatalog();
  window.addEventListener("keydown", onKey);
  await applyClickThrough();
});

watch(locked, () => {
  void applyClickThrough();
});

// Opening UI must disable click-through so panels stay clickable
watch([chromeOpen, storeOpen], ([chrome, store]) => {
  if (chrome || store) {
    locked.value = true;
  }
});
onUnmounted(() => window.removeEventListener("keydown", onKey));

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") {
    if (storeOpen.value) storeOpen.value = false;
    else chromeOpen.value = false;
  }
}

async function onSend(text: string) {
  if (!text.trim() || busy.value) return;
  messages.value.push({ role: "user", text });
  busy.value = true;
  try {
    const res = await mockChat(text);
    messages.value.push({ role: "assistant", text: res.text });
    if (res.kind === "tool" && res.name === "trash_path") {
      pending.value = { path: res.path };
      chromeOpen.value = true;
    }
  } finally {
    busy.value = false;
  }
}

async function onConfirm() {
  if (!pending.value) return;
  const path = pending.value.path;
  busy.value = true;
  try {
    const absolute = await invoke<string>("trash_path", { path });
    messages.value.push({
      role: "assistant",
      text: `好了，已送进废纸篓：\n\`${absolute}\``,
    });
  } catch (e) {
    messages.value.push({
      role: "assistant",
      text: `没能扔掉：${e instanceof Error ? e.message : String(e)}`,
    });
  } finally {
    pending.value = null;
    busy.value = false;
  }
}

function onCancel() {
  messages.value.push({ role: "assistant", text: "好，已取消。" });
  pending.value = null;
}

function onPetActivate() {
  chromeOpen.value = !chromeOpen.value;
}

function onZoom(next: number) {
  zoom.value = Math.min(2, Math.max(0.5, next));
}

async function openStore() {
  storeOpen.value = true;
  await refreshCatalog();
}

function onSelectSkin(s: SkinItem) {
  // Use the emitted item directly — don't rely on a possibly stale skins[] list.
  if (!findSkin(skins.value, s.id)) {
    skins.value = [...skins.value, s];
  }
  activeSkin.value = s;
  skinId.value = s.id;
  storeOpen.value = false;
  messages.value.push({
    role: "assistant",
    text: `已切换皮肤：${s.name}`,
  });
}
</script>

<template>
  <div class="shell" :class="{ locked, bare: !chromeOpen && !storeOpen }">
    <header v-show="chromeOpen" class="bar" data-tauri-drag-region>
      <div class="brand">
        <span class="mark" aria-hidden="true" />
        <div class="titles">
          <span class="title">Apsara</span>
          <span class="sub">{{ currentSkin.name }} · 滚轮缩放</span>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="chip" @click="openStore">皮肤仓库</button>
        <button
          type="button"
          class="chip quiet"
          :title="locked ? '当前锁定：可点击。点此切换为穿透' : '当前穿透：空白处点穿。点此锁定'"
          @click="locked = !locked"
        >
          {{ locked ? "穿透" : "锁定" }}
        </button>
        <button type="button" class="chip quiet" @click="chromeOpen = false">收起</button>
      </div>
    </header>

    <PetStage
      :skin="currentSkin"
      :zoom="zoom"
      @activate="onPetActivate"
      @zoom="onZoom"
    />

    <ChatPanel
      v-show="chromeOpen"
      :messages="messages"
      :disabled="busy"
      @send="onSend"
    />

    <SkinStore
      v-if="storeOpen"
      :current-id="skinId"
      @select="onSelectSkin"
      @close="storeOpen = false"
    />

    <ConfirmDialog
      v-if="pending"
      title="确认丢进废纸篓？"
      :body="`将移动：${pending.path}`"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 10px;
  isolation: isolate;
}
.shell.bare {
  padding: 0;
  gap: 0;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px 8px 12px;
  border-radius: 14px;
  background: var(--cream-glass);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  box-shadow: var(--shadow);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.mark {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--azure), var(--blush), var(--gold));
  box-shadow: 0 0 0 3px rgba(201, 160, 106, 0.18);
  flex: none;
}
.titles {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}
.title {
  font-weight: 650;
  letter-spacing: 0.04em;
  color: var(--ink);
  font-size: 14px;
}
.sub {
  font-size: 11px;
  color: var(--ink-soft);
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.actions {
  display: flex;
  gap: 6px;
  flex: none;
}
.chip {
  border: 1px solid rgba(168, 123, 69, 0.35);
  border-radius: 999px;
  padding: 5px 11px;
  background: linear-gradient(180deg, #f6e4cc, #e8c9a0);
  color: var(--ink);
  cursor: pointer;
  font-size: 12px;
  font-weight: 550;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}
.chip.quiet {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(168, 123, 69, 0.22);
  font-weight: 500;
}
</style>
