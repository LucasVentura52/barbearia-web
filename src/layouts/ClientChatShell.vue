<template>
  <v-app class="client-chat-app">
    <div class="client-chat-bg"></div>
    <v-main class="client-chat-main">
      <router-view />
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top right"
      timeout="3200"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { snackbar } = storeToRefs(ui)
</script>

<style scoped>
.client-chat-app {
  position: relative;
}

.client-chat-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 8% 0%, rgba(182, 119, 49, 0.18), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(23, 49, 51, 0.22), transparent 26%),
    linear-gradient(180deg, #efe1d2 0%, #dcc7b2 100%);
}

.client-chat-main {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
