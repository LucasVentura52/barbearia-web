<template>
  <v-app>
    <div class="app-bg"></div>
    <v-navigation-drawer v-model="drawer" :permanent="mdAndUp" class="app-drawer">
      <div class="drawer-header">
        <div class="brand-mark"></div>
        <div>
          <div class="brand-title">Barbearia</div>
          <div class="brand-subtitle">Cliente</div>
        </div>
      </div>
      <v-list nav density="comfortable">
        <v-list-item v-for="item in visibleNav" :key="item.to" :to="item.to" :prepend-icon="item.icon"
          :title="item.title" />
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
      <div class="app-bar-title ml-2">Painel do cliente</div>
      <v-spacer />
      <CompanySwitcher v-if="auth.isAuthenticated" class="me-3" />
      <v-chip v-if="auth.user" color="secondary" variant="flat" class="me-3">
        {{ auth.user.name }}
      </v-chip>
      <v-btn v-if="auth.isStaff" color="primary" variant="outlined" :to="{ name: 'staff-dashboard' }">
        Área do colaborador
      </v-btn>
      <v-btn v-else-if="!auth.isAuthenticated" color="primary" variant="flat" :to="{ name: 'login' }">
        Login
      </v-btn>
      <v-btn v-else color="primary" variant="outlined" @click="handleLogout">
        Sair
      </v-btn>
    </v-app-bar>

    <v-main>
      <div class="page-shell">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import CompanySwitcher from '@/components/CompanySwitcher.vue'

const { mdAndUp } = useDisplay()
const drawer = ref(true)
const auth = useAuthStore()
const router = useRouter()

const navItems = [
  { title: 'Início', to: { name: 'client-home' }, icon: 'mdi-home-variant-outline' },
  { title: 'Serviços', to: { name: 'client-services' }, icon: 'mdi-scissors-cutting' },
  { title: 'Agendar', to: { name: 'client-booking' }, icon: 'mdi-calendar-check-outline', auth: true },
  { title: 'Meus horários', to: { name: 'client-appointments' }, icon: 'mdi-calendar-clock', auth: true },
  { title: 'Perfil', to: { name: 'client-profile' }, icon: 'mdi-account-outline', auth: true },
]

const visibleNav = computed(() => navItems.filter((item) => !item.auth || auth.isAuthenticated))

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}

onMounted(() => {
  auth.loadMe()
})
</script>

<style scoped>
.app-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(200, 163, 90, 0.15), transparent 45%),
    radial-gradient(circle at 30% 20%, rgba(224, 98, 58, 0.12), transparent 40%),
    linear-gradient(135deg, #f6f1e8 0%, #f1e9dd 35%, #f7f3ec 100%);
  z-index: 0;
}

.app-bar {
  background: rgba(246, 241, 232, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(11, 31, 36, 0.08);
}

.app-bar-title {
  font-family: var(--display-font);
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0b1f24;
}

.app-drawer {
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid rgba(11, 31, 36, 0.08);
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
  background: linear-gradient(135deg, #0b1f24 0%, #205c6a 100%);
  box-shadow: 0 10px 24px rgba(11, 31, 36, 0.25);
}

.brand-title {
  font-family: var(--display-font);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 1rem;
  color: #0b1f24;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: rgba(11, 31, 36, 0.6);
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
