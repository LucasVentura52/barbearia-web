<template>
  <v-app class="client-shell-app">
    <div class="client-shell-bg"></div>

    <v-main class="client-shell-main">
      <div class="client-shell-content">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.client-shell-app {
  position: relative;
}

.client-shell-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at -8% -6%, rgba(184, 136, 94, 0.22), transparent 34%),
    radial-gradient(circle at 108% -4%, rgba(91, 140, 143, 0.22), transparent 40%),
    radial-gradient(circle at 50% 118%, rgba(143, 176, 178, 0.18), transparent 36%),
    linear-gradient(180deg, #eff6f5 0%, #e6f0ee 100%);
  z-index: 0;
}

.client-shell-main {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
}

.client-shell-content {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0;
}

@media (max-width: 960px) {
  .client-shell-content {
    padding: 0;
  }
}

@media (max-width: 640px) {
  .client-shell-content {
    padding: 0;
  }
}
</style>
