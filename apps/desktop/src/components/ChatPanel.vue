<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  messages: { role: "user" | "assistant"; text: string }[];
  disabled?: boolean;
}>();
const emit = defineEmits<{ send: [string] }>();
const draft = ref("");

function submit() {
  const t = draft.value.trim();
  if (!t) return;
  emit("send", t);
  draft.value = "";
}
</script>

<template>
  <section class="chat">
    <div class="log">
      <div v-for="(m, i) in messages" :key="i" class="bubble" :class="m.role">
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
      <button type="submit" :disabled="disabled">发送</button>
    </form>
  </section>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 42%;
}
.log {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px;
}
.bubble {
  max-width: 92%;
  padding: 8px 10px;
  border-radius: 12px;
  white-space: pre-wrap;
  line-height: 1.4;
  font-size: 13px;
  user-select: text;
}
.bubble.assistant {
  align-self: flex-start;
  background: rgba(255, 250, 245, 0.95);
  color: #4a3228;
  border: 1px solid rgba(200, 150, 110, 0.25);
}
.bubble.user {
  align-self: flex-end;
  background: rgba(120, 160, 220, 0.92);
  color: #fff;
}
.composer {
  display: flex;
  gap: 6px;
}
.composer input {
  flex: 1;
  border-radius: 10px;
  border: 1px solid rgba(180, 130, 90, 0.35);
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.92);
}
.composer button {
  border: 0;
  border-radius: 10px;
  padding: 0 12px;
  background: #c47a4a;
  color: #fff;
  cursor: pointer;
}
.composer button:disabled,
.composer input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
