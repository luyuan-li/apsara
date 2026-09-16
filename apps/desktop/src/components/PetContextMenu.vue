<script setup lang="ts">
defineProps<{
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  openPanel: [];
  openStore: [];
  randomExpression: [];
  hideWindow: [];
  close: [];
}>();
</script>

<template>
  <div class="ctx-root" @click="emit('close')" @contextmenu.prevent="emit('close')">
    <ul
      class="menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @click.stop
    >
      <li><button type="button" @click="emit('openPanel')">打开面板</button></li>
      <li><button type="button" @click="emit('openStore')">皮肤仓库</button></li>
      <li><button type="button" @click="emit('randomExpression')">随机表情</button></li>
      <li class="sep" />
      <li><button type="button" @click="emit('hideWindow')">隐藏到菜单栏</button></li>
    </ul>
  </div>
</template>

<style scoped>
.ctx-root {
  position: fixed;
  inset: 0;
  z-index: 80;
}
.menu {
  position: fixed;
  margin: 0;
  padding: 6px;
  list-style: none;
  min-width: 148px;
  border-radius: 12px;
  background: var(--cream-glass, rgba(255, 248, 240, 0.92));
  border: 1px solid var(--panel-border, rgba(168, 123, 69, 0.22));
  box-shadow: var(--shadow, 0 10px 36px rgba(74, 50, 40, 0.12));
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.menu li.sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--panel-border, rgba(168, 123, 69, 0.22));
}
.menu button {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: var(--ink, #4a3228);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.menu button:hover {
  background: rgba(201, 160, 106, 0.18);
}
</style>
