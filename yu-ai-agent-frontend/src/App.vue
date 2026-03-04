<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top, rgba(133, 142, 255, 0.25), transparent 50%),
    #0d1117;
  color: #f4f7ff;
}
</style>
