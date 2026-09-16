<script setup lang="ts">
import { ref } from "vue";
import PetStage from "./components/PetStage.vue";
import ChatPanel from "./components/ChatPanel.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import { mockChat } from "@apsara/mock-llm";
import { invoke } from "@tauri-apps/api/core";

type Msg = { role: "user" | "assistant"; text: string };

const messages = ref<Msg[]>([
  { role: "assistant", text: "你好，我是 Apsara（飞天）。先聊几句，或让我把测试文件送进废纸篓。" },
]);
const pending = ref<{ path: string; absolute?: string } | null>(null);
const busy = ref(false);
const locked = ref(true);

async function onSend(text: string) {
  if (!text.trim() || busy.value) return;
  messages.value.push({ role: "user", text });
  busy.value = true;
  try {
    const res = await mockChat(text);
    messages.value.push({ role: "assistant", text: res.text });
    if (res.kind === "tool" && res.name === "trash_path") {
      pending.value = { path: res.path };
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
</script>

<template>
  <div class="shell" :class="{ locked }">
    <header class="bar" data-tauri-drag-region>
      <span class="title">Apsara</span>
      <button type="button" class="chip" @click="locked = !locked">
        {{ locked ? "已锁定" : "穿透中" }}
      </button>
    </header>
    <PetStage />
    <ChatPanel :messages="messages" :disabled="busy" @send="onSend" />
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
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 8px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 248, 240, 0.92);
  border: 1px solid rgba(180, 120, 80, 0.25);
  box-shadow: 0 4px 20px rgba(80, 40, 20, 0.08);
}
.title {
  font-weight: 600;
  color: #6b3f2a;
  letter-spacing: 0.04em;
}
.chip {
  border: 0;
  border-radius: 999px;
  padding: 4px 10px;
  background: #f0d2b0;
  color: #5a321f;
  cursor: pointer;
}
</style>
