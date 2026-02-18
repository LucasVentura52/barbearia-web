<template>
  <v-app>
    <div class="app-bg"></div>
    <v-navigation-drawer v-model="drawer" :permanent="mdAndUp" :temporary="!mdAndUp" class="app-drawer">
      <div class="drawer-header">
        <div class="brand-mark"></div>
        <div>
          <div class="brand-title">Barbearia</div>
          <div class="brand-subtitle">Agenda inteligente</div>
        </div>
      </div>
      <v-list nav density="comfortable">
        <v-list-item v-for="item in visibleNav" :key="item.to" :to="item.to" :prepend-icon="item.icon"
          :title="item.title" @click="handleNavClick" />
      </v-list>
      <div class="drawer-footer">
        <v-btn v-if="!auth.isAuthenticated" color="primary" size="large" block :to="{ name: 'login' }">
          Entrar
        </v-btn>
        <v-btn v-else variant="tonal" color="primary" size="large" block @click="handleLogout">
          Sair
        </v-btn>
      </div>
    </v-navigation-drawer>

    <v-app-bar elevation="0" class="app-bar">
      <v-btn icon @click="drawer = !drawer" class="d-md-none">
        <v-icon icon="mdi-menu" />
      </v-btn>
      <div class="app-bar-title">Barbearia</div>
      <v-spacer />
      <v-chip v-if="auth.user && !smAndDown" color="secondary" variant="flat" class="me-3">
        {{ auth.user.name }}
      </v-chip>
      <v-menu v-if="smAndDown" location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>
        <v-list density="compact" min-width="200">
          <v-list-item v-if="auth.user" :title="auth.user.name" />
          <v-divider v-if="auth.user" />
          <v-list-item v-if="!auth.isAuthenticated" :to="{ name: 'login' }" prepend-icon="mdi-login" title="Login" />
          <v-list-item v-else prepend-icon="mdi-logout" title="Sair" @click="handleLogout" />
        </v-list>
      </v-menu>
      <template v-else>
        <v-btn v-if="!auth.isAuthenticated" color="primary" variant="flat" :to="{ name: 'login' }">
          Login
        </v-btn>
        <v-btn v-else color="primary" variant="outlined" @click="handleLogout">
          Sair
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <div class="page-shell">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

const { mdAndUp, smAndDown } = useDisplay()
const drawer = ref(mdAndUp.value)
const auth = useAuthStore()

const navItems = [
  { title: 'Início', to: { name: 'home' }, icon: 'mdi-home-variant-outline' },
  { title: 'Serviços', to: { name: 'services' }, icon: 'mdi-scissors-cutting' },
  { title: 'Agendar', to: { name: 'booking' }, icon: 'mdi-calendar-check-outline', auth: true },
  { title: 'Meus horários', to: { name: 'appointments' }, icon: 'mdi-calendar-clock', auth: true },
  { title: 'Perfil', to: { name: 'profile' }, icon: 'mdi-account-outline', auth: true },
]

const visibleNav = computed(() =>
  navItems.filter((item) => !item.auth || auth.isAuthenticated)
)

const handleLogout = async () => {
  await auth.logout()
}

const handleNavClick = () => {
  if (!mdAndUp.value) {
    drawer.value = false
  }
}

watch(mdAndUp, (desktop) => {
  drawer.value = desktop
})
</script>

<style scoped>
.app-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(200, 163, 90, 0.15), transparent 45%),
    radial-gradient(circle at 30% 20%, rgba(224, 98, 58, 0.12), transparent 40%),
    linear-gradient(135deg, #edf3f7 0%, #f1e9dd 35%, #f7f3ec 100%);
  z-index: 0;
}

.app-bar {
  background: rgba(246, 241, 232, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(35, 58, 74, 0.08);
}

.app-bar-title {
  font-family: var(--display-font);
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #203241;
}

.app-drawer {
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid rgba(35, 58, 74, 0.08);
}

.drawer-header {
  display: flex;
  gap: 12px;
  padding: 24px 20px 12px;
  align-items: center;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #203241 0%, #205c6a 100%);
  box-shadow: 0 10px 24px rgba(35, 58, 74, 0.25);
}

.brand-title {
  font-family: var(--display-font);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 1rem;
  color: #203241;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: rgba(35, 58, 74, 0.6);
}

.drawer-footer {
  margin-top: auto;
  padding: 16px;
}

.page-shell {
  position: relative;
  z-index: 1;
  padding: 32px 24px 64px;
  animation: fadeUp 0.6s ease both;
}

@media (max-width: 960px) {
  .page-shell {
    padding: 24px 16px 48px;
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
