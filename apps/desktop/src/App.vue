<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import PetStage from "./components/PetStage.vue";
import ChatPanel from "./components/ChatPanel.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import { mockChat } from "@apsara/mock-llm";
import { invoke } from "@tauri-apps/api/core";

type Msg = { role: "user" | "assistant"; text: string };
type Skin = "guofeng" | "live2d-mao";

const messages = ref<Msg[]>([
  {
    role: "assistant",
    text: "双击角色打开/收起面板；滚轮缩放。再说一次也能丢文件进废纸篓。",
  },
]);
const pending = ref<{ path: string } | null>(null);
const busy = ref(false);
const locked = ref(true);
const skin = ref<Skin>("guofeng");
/** Chrome (header + chat) hidden by default — desk-pet mode */
const chromeOpen = ref(false);
const zoom = ref(1);

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

function toggleSkin() {
  skin.value = skin.value === "guofeng" ? "live2d-mao" : "guofeng";
}

function onPetActivate() {
  chromeOpen.value = !chromeOpen.value;
}

function onZoom(next: number) {
  zoom.value = Math.min(2, Math.max(0.5, next));
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") chromeOpen.value = false;
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="shell" :class="{ locked, bare: !chromeOpen }">
    <header v-show="chromeOpen" class="bar" data-tauri-drag-region>
      <div class="brand">
        <span class="mark" aria-hidden="true" />
        <div class="titles">
          <span class="title">Apsara</span>
          <span class="sub">滚轮缩放 · Esc 收起</span>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="chip" @click="toggleSkin">
          {{ skin === "guofeng" ? "古风皮" : "Live2D" }}
        </button>
        <button type="button" class="chip quiet" @click="locked = !locked">
          {{ locked ? "锁定" : "穿透" }}
        </button>
        <button type="button" class="chip quiet" @click="chromeOpen = false">收起</button>
      </div>
    </header>

    <PetStage
      :skin="skin"
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
  /* no chrome chrome → no panel lines around the pet */
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
