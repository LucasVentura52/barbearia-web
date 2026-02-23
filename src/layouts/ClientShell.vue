<template>
  <v-app class="client-shell-app">
    <div class="client-shell-bg"></div>

    <v-app-bar elevation="0" class="client-shell-bar" density="comfortable">
      <div class="bar-brand">
        <div class="bar-brand-dot"></div>
        <div>
          <div class="bar-brand-title">Chat do cliente</div>
          <div class="bar-brand-subtitle">{{ companyLabel }}</div>
        </div>
      </div>

      <v-spacer />

      <v-menu v-if="smAndDown" location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>
        <v-list density="compact" min-width="220">
          <v-list-item v-if="auth.user" :title="auth.user.name" :subtitle="auth.user.role" />
          <v-divider v-if="auth.user" />
          <v-list-item
            v-if="auth.isStaff"
            :to="{ name: 'staff-dashboard' }"
            prepend-icon="mdi-account-tie-outline"
            title="Área do colaborador"
          />
          <v-list-item v-if="!auth.isAuthenticated" :to="{ name: 'login' }" prepend-icon="mdi-login" title="Entrar" />
          <v-list-item v-else prepend-icon="mdi-logout" title="Sair" @click="handleLogout" />
        </v-list>
      </v-menu>

      <template v-else>
        <v-btn v-if="auth.isStaff" variant="outlined" color="primary" :to="{ name: 'staff-dashboard' }" class="me-2">
          Área do colaborador
        </v-btn>
        <v-btn v-if="!auth.isAuthenticated" color="primary" :to="{ name: 'login' }">Entrar</v-btn>
        <v-btn v-else variant="outlined" color="primary" @click="handleLogout">Sair</v-btn>
      </template>
    </v-app-bar>

    <v-main class="client-shell-main">
      <div class="client-shell-content">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const { smAndDown } = useDisplay()

const companyLabel = computed(() => auth.user?.company?.name || 'Atendimento digital')

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>

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

.client-shell-bar {
  position: relative;
  z-index: 3;
  background: rgba(252, 255, 255, 0.78) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(87, 120, 132, 0.16);
}

.bar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--brand-secondary), var(--accent-500));
  box-shadow: 0 0 0 6px rgba(184, 136, 94, 0.16);
}

.bar-brand-title {
  font-family: var(--display-font);
  color: var(--ink-900);
  font-weight: 700;
  line-height: 1.1;
}

.bar-brand-subtitle {
  font-size: 0.78rem;
  color: rgba(66, 87, 99, 0.72);
  line-height: 1.1;
}

.client-shell-main {
  position: relative;
  z-index: 1;
  padding-top: 78px;
}

.client-shell-content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 18px 26px;
}

@media (max-width: 960px) {
  .client-shell-main {
    padding-top: 70px;
  }

  .client-shell-content {
    padding: 8px 12px calc(18px + env(safe-area-inset-bottom));
  }
}

@media (max-width: 640px) {
  .client-shell-main {
    padding-top: 66px;
  }

  .client-shell-content {
    padding: 6px 8px calc(14px + env(safe-area-inset-bottom));
  }
}
</style>
