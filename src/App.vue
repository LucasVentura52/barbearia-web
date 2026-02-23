<template>
  <div v-if="appState.booting" class="boot-screen">
    <div class="boot-glow boot-glow--left"></div>
    <div class="boot-glow boot-glow--right"></div>
    <div class="boot-card">
      <div class="boot-spinner" aria-hidden="true"></div>
      <div class="boot-title">Carregando sua sessão</div>
      <div class="boot-subtitle">Estamos preparando o ambiente e validando seu acesso.</div>
    </div>
  </div>

  <component v-else :is="layoutComponent">
    <AppAlerts />
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ClientShell from '@/layouts/ClientShell.vue'
import StaffShell from '@/layouts/StaffShell.vue'
import AppAlerts from '@/components/AppAlerts.vue'

const route = useRoute()
const appState = useAppStore()

const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'client'
  if (layout === 'auth') return AuthLayout
  if (layout === 'staff') return StaffShell
  return ClientShell
})
</script>

<style scoped>
.boot-screen {
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% -4%, rgba(184, 136, 94, 0.24), transparent 34%),
    radial-gradient(circle at 104% 12%, rgba(91, 140, 143, 0.22), transparent 36%),
    linear-gradient(180deg, #eaf2f0 0%, #f5faf9 100%);
}

.boot-glow {
  position: absolute;
  width: min(48vw, 520px);
  height: min(48vw, 520px);
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.4;
  pointer-events: none;
}

.boot-glow--left {
  background: rgba(91, 140, 143, 0.34);
  left: -16vw;
  top: -18vh;
}

.boot-glow--right {
  background: rgba(184, 136, 94, 0.28);
  right: -14vw;
  bottom: -18vh;
}

.boot-card {
  position: relative;
  z-index: 1;
  width: min(92vw, 420px);
  border-radius: 20px;
  border: 1px solid rgba(87, 120, 132, 0.2);
  background: linear-gradient(172deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.74));
  box-shadow: 0 20px 44px rgba(35, 52, 62, 0.16);
  padding: 26px 20px;
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 10px;
}

.boot-spinner {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 3px solid rgba(91, 140, 143, 0.2);
  border-top-color: #5b8c8f;
  border-right-color: #b8885e;
  animation: spin 0.9s linear infinite;
}

.boot-title {
  margin-top: 2px;
  font-family: var(--display-font);
  color: var(--ink-900);
  font-size: 1.05rem;
  font-weight: 700;
}

.boot-subtitle {
  color: var(--ink-700);
  font-size: 0.9rem;
  line-height: 1.4;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .boot-card {
    width: min(94vw, 420px);
    padding: 22px 16px;
  }

  .boot-title {
    font-size: 0.98rem;
  }

  .boot-subtitle {
    font-size: 0.84rem;
  }
}
</style>
