<script setup lang="ts">
defineProps<{ title: string; body: string }>();
defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div class="mask">
    <div class="card" role="dialog" aria-modal="true">
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
  background: rgba(40, 24, 16, 0.35);
  display: grid;
  place-items: center;
  z-index: 20;
}
.card {
  width: min(320px, 90%);
  background: #fffaf4;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(180, 120, 80, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
h2 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #5a321f;
}
p {
  margin: 0 0 14px;
  font-size: 13px;
  color: #6a4535;
  word-break: break-all;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
button {
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
}
.ghost {
  border: 1px solid #d0b09a;
  background: transparent;
  color: #6a4535;
}
.primary {
  border: 0;
  background: #c47a4a;
  color: #fff;
}
</style>
