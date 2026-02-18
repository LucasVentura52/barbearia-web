<template>
  <v-app>
    <div class="auth-bg"></div>
    <div class="auth-noise"></div>
    <v-main>
      <div class="auth-shell">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 10% 8%, rgba(184, 136, 94, 0.22), transparent 42%),
    radial-gradient(circle at 90% 0%, rgba(91, 140, 143, 0.24), transparent 44%),
    linear-gradient(180deg, #f4f8f7 0%, #edf4f2 100%);
  z-index: 0;
}

.auth-noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.34), transparent 44%);
  pointer-events: none;
}

.auth-shell {
  position: relative;
  z-index: 1;
  padding: 32px 20px;
  min-height: 100vh;
  display: grid;
  align-items: center;
}

@media (min-width: 960px) {
  .auth-shell {
    padding: 44px 24px;
  }
}
</style>
