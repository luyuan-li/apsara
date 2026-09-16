<script setup lang="ts">
defineProps<{ title: string; body: string }>();
defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div class="mask">
    <div class="card" role="dialog" aria-modal="true">
      <div class="accent" aria-hidden="true" />
      <h2>{{ title }}</h2>
      <p>{{ body }}</p>
      <div class="actions">
        <button type="button" class="ghost" @click="$emit('cancel')">取消</button>
        <button type="button" class="primary" @click="$emit('confirm')">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: absolute;
  inset: 0;
  background: rgba(40, 24, 16, 0.38);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  z-index: 20;
  padding: 16px;
}
.card {
  position: relative;
  width: min(320px, 100%);
  overflow: hidden;
  background: linear-gradient(180deg, #fffaf4, #fff3e8);
  border-radius: 16px;
  padding: 18px 16px 14px;
  border: 1px solid rgba(180, 120, 80, 0.3);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
}
.accent {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--azure), var(--blush), var(--gold));
}
h2 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--ink);
  font-weight: 650;
}
p {
  margin: 0 0 16px;
  font-size: 12.5px;
  color: var(--ink-soft);
  word-break: break-all;
  line-height: 1.45;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
button {
  border-radius: 11px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 550;
}
.ghost {
  border: 1px solid rgba(168, 123, 69, 0.35);
  background: transparent;
  color: var(--ink-soft);
}
.primary {
  border: 0;
  background: linear-gradient(180deg, #d4a06a, #b87d45);
  color: #fff;
  box-shadow: 0 4px 12px rgba(168, 123, 69, 0.28);
}
</style>
