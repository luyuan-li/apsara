<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  messages: { role: "user" | "assistant"; text: string }[];
  disabled?: boolean;
}>();
const emit = defineEmits<{ send: [string] }>();
const draft = ref("");
const logEl = ref<HTMLElement | null>(null);

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight;
  },
);

function submit() {
  const t = draft.value.trim();
  if (!t) return;
  emit("send", t);
  draft.value = "";
}
</script>

<template>
  <section class="chat">
    <div ref="logEl" class="log">
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="bubble"
        :class="m.role"
      >
        {{ m.text }}
      </div>
    </div>
    <form class="composer" @submit.prevent="submit">
      <input
        v-model="draft"
        :disabled="disabled"
        placeholder="跟飞天说点什么…"
        autocomplete="off"
      />
      <button type="submit" :disabled="disabled || !draft.trim()">发送</button>
    </form>
  </section>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 40%;
  padding: 10px;
  border-radius: var(--radius);
  background: var(--cream-glass);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px) saturate(1.15);
  -webkit-backdrop-filter: blur(14px) saturate(1.15);
  box-shadow: var(--shadow);
}
.log {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px;
  min-height: 72px;
  max-height: 180px;
  scrollbar-width: thin;
  scrollbar-color: rgba(168, 123, 69, 0.35) transparent;
}
.bubble {
  max-width: 92%;
  padding: 9px 12px;
  border-radius: 14px;
  white-space: pre-wrap;
  line-height: 1.45;
  font-size: 12.5px;
  user-select: text;
  word-break: break-word;
}
.bubble.assistant {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.88);
  color: var(--ink);
  border: 1px solid rgba(200, 160, 120, 0.28);
  border-bottom-left-radius: 6px;
}
.bubble.user {
  align-self: flex-end;
  background: linear-gradient(135deg, #8ebddc, #6ea0c8);
  color: #fff;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 12px rgba(110, 160, 200, 0.28);
}
.composer {
  display: flex;
  gap: 8px;
  align-items: center;
}
.composer input {
  flex: 1;
  border-radius: 12px;
  border: 1px solid rgba(168, 123, 69, 0.28);
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink);
  outline: none;
}
.composer input:focus {
  border-color: rgba(126, 184, 216, 0.7);
  box-shadow: 0 0 0 3px rgba(126, 184, 216, 0.18);
}
.composer input::placeholder {
  color: rgba(74, 50, 40, 0.4);
}
.composer button {
  border: 0;
  border-radius: 12px;
  padding: 9px 14px;
  background: linear-gradient(180deg, #d4a06a, #b87d45);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  font-size: 12.5px;
  box-shadow: 0 4px 12px rgba(168, 123, 69, 0.28);
}
.composer button:disabled,
.composer input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
