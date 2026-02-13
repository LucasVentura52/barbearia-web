<template>
  <v-app>
    <div class="auth-bg"></div>
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
    radial-gradient(circle at 20% 20%, rgba(200, 163, 90, 0.2), transparent 45%),
    radial-gradient(circle at 80% 10%, rgba(224, 98, 58, 0.15), transparent 40%),
    linear-gradient(160deg, #f6f1e8 0%, #f1e9dd 50%, #f7f3ec 100%);
  z-index: 0;
}

.auth-shell {
  position: relative;
  z-index: 1;
  padding: 48px 24px;
  min-height: 100vh;
  display: grid;
  align-items: center;
}
</style>