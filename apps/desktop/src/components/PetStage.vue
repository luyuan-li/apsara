<script setup lang="ts">
</script>

<template>
  <div class="stage" data-tauri-drag-region>
    <svg class="pet" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-label="Apsara placeholder">
      <defs>
        <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#9ad7ff"/>
          <stop offset="50%" stop-color="#f7c6e0"/>
          <stop offset="100%" stop-color="#ffe6a7"/>
        </linearGradient>
      </defs>
      <path d="M20 120 C40 40, 160 40, 180 120" fill="none" stroke="url(#silk)" stroke-width="8" stroke-linecap="round" opacity="0.9">
        <animate attributeName="d" dur="6s" repeatCount="indefinite"
          values="M20 120 C40 40, 160 40, 180 120;M25 125 C50 50, 150 30, 175 115;M20 120 C40 40, 160 40, 180 120"/>
      </path>
      <ellipse cx="100" cy="118" rx="36" ry="48" fill="#fff6ea" stroke="#e2c8a8"/>
      <circle cx="100" cy="68" r="28" fill="#fff6ea" stroke="#e2c8a8"/>
      <circle cx="90" cy="66" r="3" fill="#4a3040"/>
      <circle cx="110" cy="66" r="3" fill="#4a3040"/>
      <path d="M92 76 Q100 82 108 76" fill="none" stroke="#c48b7a" stroke-width="2" stroke-linecap="round"/>
      <path d="M70 50 Q100 20 130 50" fill="none" stroke="url(#silk)" stroke-width="5" stroke-linecap="round"/>
      <text x="100" y="200" text-anchor="middle" font-size="12" fill="#8a5a40">飞天 · placeholder</text>
    </svg>
  </div>
</template>

<style scoped>
.stage {
  flex: 1;
  min-height: 180px;
  display: grid;
  place-items: center;
}
.pet {
  width: min(220px, 70%);
  filter: drop-shadow(0 10px 18px rgba(90, 50, 30, 0.18));
}
</style>
