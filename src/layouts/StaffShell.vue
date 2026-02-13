<template>
  <v-app class="staff-app">
    <div class="staff-bg"></div>
    <v-navigation-drawer v-model="drawer" :permanent="mdAndUp" class="staff-drawer">
      <div class="drawer-header">
        <div class="brand-mark"></div>
        <div>
          <div class="brand-title">Barbearia</div>
          <div class="brand-subtitle">{{ subtitle }}</div>
        </div>
      </div>
      <v-list nav density="comfortable">
        <v-list-item v-for="item in visibleNav" :key="item.to" :to="item.to" :prepend-icon="item.icon"
          :title="item.title" />
      </v-list>
      <div class="drawer-footer">
        <v-btn variant="tonal" color="secondary" size="large" block @click="handleLogout">
          Sair
        </v-btn>
      </div>
    </v-navigation-drawer>

    <v-app-bar elevation="0" class="staff-bar">
      <v-btn icon @click="drawer = !drawer" class="d-md-none">
        <v-icon icon="mdi-menu" />
      </v-btn>
      <div class="app-bar-title ml-2">{{ appBarTitle }}</div>
      <v-spacer />
      <CompanySwitcher v-if="auth.isAuthenticated" class="me-3" />
      <v-chip v-if="auth.user" color="secondary" variant="flat" class="me-3">
        {{ auth.user.name }}
      </v-chip>
      <v-btn color="secondary" variant="outlined" :to="{ name: 'client-home' }">
        Ver área do cliente
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
  { title: 'Dashboard', to: { name: 'staff-dashboard' }, icon: 'mdi-view-dashboard-outline' },
  { title: 'Agenda', to: { name: 'staff-appointments' }, icon: 'mdi-calendar-range' },
  { title: 'Horários', to: { name: 'staff-schedule' }, icon: 'mdi-calendar-clock-outline' },
  { title: 'Serviços', to: { name: 'staff-services' }, icon: 'mdi-scissors-cutting' },
  { title: 'Produtos', to: { name: 'staff-products' }, icon: 'mdi-bottle-tonic-outline' },
  { title: 'Perfil', to: { name: 'staff-profile' }, icon: 'mdi-account-tie' },
  { title: 'Colaboradores', to: { name: 'staff-team' }, icon: 'mdi-account-group', admin: true },
  { title: 'Empresas', to: { name: 'super-admin-companies' }, icon: 'mdi-domain', superAdmin: true },
]

const visibleNav = computed(() => {
  return navItems.filter((item) => {
    if (item.superAdmin) return auth.user?.role === 'super_admin'
    if (item.admin) return ['admin', 'super_admin'].includes(auth.user?.role)
    return true
  })
})

const subtitle = computed(() => {
  if (auth.user?.role === 'super_admin') return 'Super Admin'
  if (auth.user?.role === 'admin') return 'Administrador'
  return 'Colaborador'
})

const appBarTitle = computed(() => {
  if (auth.user?.role === 'super_admin') return 'Painel Super Admin'
  return 'Painel do colaborador'
})

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}

onMounted(() => {
  auth.loadMe()
})
</script>

<style scoped>
.staff-app {
  --staff-surface: rgba(255, 255, 255, 0.92);
  --staff-surface-strong: rgba(255, 255, 255, 0.98);
  --staff-border: rgba(200, 163, 90, 0.28);
  --staff-ink: #0b1f24;
  --staff-muted: rgba(11, 31, 36, 0.6);
  --staff-shadow: 0 18px 40px rgba(5, 14, 18, 0.32);
  color: #f6f1e8;
}

.staff-bg {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 15% 10%, rgba(200, 163, 90, 0.25), transparent 48%),
    radial-gradient(circle at 85% 0%, rgba(32, 92, 106, 0.3), transparent 46%),
    linear-gradient(150deg, #0b1f24 0%, #102c33 55%, #f1e6d6 100%);
  z-index: 0;
}

.staff-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 45%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04) 1px, transparent 1px, transparent 18px);
  opacity: 0.6;
  pointer-events: none;
}

.staff-bar {
  background: rgba(9, 25, 30, 0.94) !important;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(200, 163, 90, 0.3);
  color: #f6f1e8;
}

.app-bar-title {
  font-family: var(--display-font);
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f6f1e8;
}

.staff-drawer {
  background: rgba(9, 22, 26, 0.98);
  color: #f6f1e8;
  border-right: 1px solid rgba(200, 163, 90, 0.15);
}

.staff-drawer :deep(.v-list-item-title),
.staff-drawer :deep(.v-list-item-subtitle),
.staff-drawer :deep(.v-list-item__content) {
  color: #f6f1e8;
}

.staff-drawer :deep(.v-list-item--active) {
  background: linear-gradient(90deg, rgba(200, 163, 90, 0.22), rgba(200, 163, 90, 0.04));
  border-left: 3px solid rgba(200, 163, 90, 0.7);
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
  background: linear-gradient(135deg, #c8a35a 0%, #f0b35a 45%, #e0623a 100%);
  box-shadow: 0 12px 26px rgba(11, 31, 36, 0.5);
}

.brand-title {
  font-family: var(--display-font);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 1rem;
  color: #f6f1e8;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: rgba(246, 241, 232, 0.6);
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
  color: #f6f1e8;
}

.page-shell :deep(.glass-card) {
  border: 1px solid var(--staff-border);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.86));
  box-shadow: var(--staff-shadow);
  backdrop-filter: blur(12px);
}

.page-shell :deep(.v-table) {
  background: transparent;
}

.page-shell :deep(.v-table thead th) {
  color: rgba(11, 31, 36, 0.7);
}

.page-shell :deep(.v-table tbody tr:hover) {
  background: rgba(11, 31, 36, 0.04);
}

.page-shell :deep(.section-title),
.page-shell :deep(.section-title h2) {
  color: #f6f1e8;
}

.page-shell :deep(.section-title::before) {
  background: #c8a35a;
}

.page-shell :deep(.glass-card) {
  color: var(--staff-ink);
}

.page-shell :deep(.glass-card .text-muted) {
  color: var(--staff-muted);
}


.page-shell :deep(.staff-table thead th) {
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(11, 31, 36, 0.65);
}

.page-shell :deep(.staff-table tbody tr) {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.page-shell :deep(.staff-table tbody tr:hover) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(11, 31, 36, 0.08);
}

.page-shell :deep(.staff-toolbar-card) {
  margin-bottom: 16px;
  border-radius: 20px;
}

.page-shell :deep(.staff-toolbar-card .v-card-text) {
  padding: 8px 12px;
}

@media (max-width: 720px) {
  .page-shell {
    padding: 24px 16px 48px;
  }

  .page-shell :deep(.staff-toolbar-card .toolbar),
  .page-shell :deep(.staff-toolbar-card .calendar-toolbar),
  .page-shell :deep(.staff-toolbar-card .dashboard-toolbar),
  .page-shell :deep(.staff-toolbar-card .schedule-toolbar) {
    flex-direction: column;
    align-items: stretch;
  }

  .page-shell :deep(.staff-toolbar-card .toolbar-actions),
  .page-shell :deep(.staff-toolbar-card .toolbar-left) {
    width: 100%;
  }

  .page-shell :deep(.staff-toolbar-card .toolbar-actions .v-btn) {
    width: 100%;
  }

  .page-shell :deep(.staff-toolbar-card .staff-select),
  .page-shell :deep(.staff-toolbar-card .status-filter) {
    width: 100%;
    min-width: 0;
  }

  .page-shell :deep(.staff-toolbar-card .v-input) {
    width: 100%;
  }

  .page-shell :deep(.staff-table) {
    display: block;
    overflow-x: auto;
  }

  .page-shell :deep(.staff-table table) {
    min-width: 720px;
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
