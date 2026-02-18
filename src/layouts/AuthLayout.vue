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
    radial-gradient(circle at 10% 8%, rgba(184, 155, 117, 0.18), transparent 42%),
    radial-gradient(circle at 90% 0%, rgba(96, 125, 142, 0.2), transparent 42%),
    linear-gradient(180deg, #f4f6f8 0%, #edf2f6 100%);
  z-index: 0;
}

.auth-noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.22), transparent 42%);
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
