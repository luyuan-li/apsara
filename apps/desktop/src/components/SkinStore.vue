<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loadCatalog } from "../skins/catalog";
import type { SkinItem } from "../types/skins";

const props = defineProps<{ currentId: string }>();
const emit = defineEmits<{
  select: [SkinItem];
  close: [];
}>();

const skins = ref<SkinItem[]>([]);
const loading = ref(true);
const query = ref("");

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return skins.value;
  return skins.value.filter((s) => {
    const hay = [s.name, s.blurb ?? "", ...(s.tags ?? [])].join(" ").toLowerCase();
    return hay.includes(q);
  });
});

onMounted(async () => {
  loading.value = true;
  try {
    const cat = await loadCatalog();
    skins.value = cat.skins;
  } finally {
    loading.value = false;
  }
});

function pick(s: SkinItem) {
  emit("select", s);
}
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <section class="store" role="dialog" aria-modal="true" aria-label="皮肤仓库">
      <header class="head">
        <div>
          <h2>皮肤仓库</h2>
          <p class="hint">选择模型；之后可把 Live2D 文件夹放进 pets/live2d 并写入 catalog</p>
        </div>
        <button type="button" class="x" @click="emit('close')">关闭</button>
      </header>

      <input
        v-model="query"
        class="search"
        type="search"
        placeholder="搜索名称 / 标签…"
      />

      <div v-if="loading" class="empty">加载中…</div>
      <div v-else-if="!filtered.length" class="empty">没有匹配的皮肤</div>
      <div v-else class="grid">
        <button
          v-for="s in filtered"
          :key="s.id"
          type="button"
          class="card"
          :class="{ active: s.id === currentId }"
          @click="pick(s)"
        >
          <div class="thumb-wrap">
            <img class="thumb" :src="s.preview" :alt="s.name" />
          </div>
          <div class="meta">
            <div class="row">
              <strong>{{ s.name }}</strong>
              <span v-if="s.id === currentId" class="badge">使用中</span>
            </div>
            <div class="tags">
              <span v-for="t in s.tags ?? []" :key="t" class="tag">{{ t }}</span>
              <span class="tag kind">{{ s.kind === "live2d" ? "Live2D" : "图片" }}</span>
            </div>
            <p v-if="s.blurb" class="blurb">{{ s.blurb }}</p>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(40, 24, 16, 0.4);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 14px;
}
.store {
  width: min(360px, 100%);
  max-height: min(560px, 92%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(180deg, #fffaf4, #fff3e8);
  border-radius: 16px;
  border: 1px solid rgba(180, 120, 80, 0.28);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
  padding: 14px;
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}
h2 {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
}
.hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ink-soft);
  opacity: 0.85;
  line-height: 1.35;
}
.x {
  border: 1px solid rgba(168, 123, 69, 0.3);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
  color: var(--ink-soft);
}
.search {
  border-radius: 12px;
  border: 1px solid rgba(168, 123, 69, 0.28);
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  outline: none;
}
.search:focus {
  border-color: rgba(126, 184, 216, 0.7);
  box-shadow: 0 0 0 3px rgba(126, 184, 216, 0.16);
}
.grid {
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
}
.card {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 10px;
  text-align: left;
  border: 1px solid rgba(168, 123, 69, 0.2);
  background: rgba(255, 255, 255, 0.72);
  border-radius: 14px;
  padding: 8px;
  cursor: pointer;
}
.card:hover {
  border-color: rgba(126, 184, 216, 0.55);
}
.card.active {
  border-color: rgba(184, 125, 69, 0.65);
  box-shadow: 0 0 0 2px rgba(201, 160, 106, 0.25);
}
.thumb-wrap {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 248, 240, 0.9);
}
.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e8c9a0;
  color: var(--ink);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(126, 184, 216, 0.18);
  color: var(--ink-soft);
}
.tag.kind {
  background: rgba(232, 180, 200, 0.28);
}
.blurb {
  margin: 0;
  font-size: 11px;
  color: var(--ink-soft);
  line-height: 1.35;
}
.empty {
  padding: 24px 8px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 13px;
}
</style>
