<template>
  <v-app class="staff-app">
    <div class="staff-bg"></div>
    <v-navigation-drawer v-model="drawer" :permanent="mdAndUp" :temporary="!mdAndUp" class="staff-drawer">
      <div class="drawer-header">
        <v-avatar size="42" class="user-avatar">
          <v-img v-if="userAvatarSrc" :src="userAvatarSrc" cover />
          <span v-else class="user-initials">{{ userInitials }}</span>
        </v-avatar>
        <div>
          <div class="brand-title">{{ drawerName }}</div>
          <div class="brand-subtitle">{{ subtitle }}</div>
        </div>
      </div>
      <v-list nav density="comfortable">
        <v-list-item v-for="item in visibleNav" :key="item.to" :to="item.to" :prepend-icon="item.icon"
          :title="item.title" @click="handleNavClick" />
      </v-list>
      <div v-if="auth.isSuperAdmin && smAndDown" class="drawer-company px-4 pb-2">
        <CompanySwitcher />
      </div>
      <div class="drawer-footer">
        <v-btn variant="tonal" color="primary" size="large" block @click="handleLogout">
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
      <CompanySwitcher v-if="auth.isSuperAdmin && !smAndDown" class="me-3 app-company-switcher" />
      <v-menu v-if="smAndDown" location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>
        <v-list density="compact" min-width="220">
          <v-list-item v-if="auth.user" :title="auth.user.name" :subtitle="subtitle" />
          <v-divider v-if="auth.user" />
          <v-list-item :to="{ name: 'client-home' }" prepend-icon="mdi-account-outline" title="Área do cliente" />
          <v-list-item prepend-icon="mdi-logout" title="Sair" @click="handleLogout" />
        </v-list>
      </v-menu>
      <v-btn v-else color="primary" variant="outlined" :to="{ name: 'client-home' }">
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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import CompanySwitcher from '@/components/CompanySwitcher.vue'
import { resolveMediaUrl } from '@/lib/media'

const { mdAndUp, smAndDown } = useDisplay()
const drawer = ref(mdAndUp.value)
const auth = useAuthStore()
const router = useRouter()

const navItems = [
  { title: 'Dashboard', to: { name: 'staff-dashboard' }, icon: 'mdi-view-dashboard-outline' },
  { title: 'Agenda', to: { name: 'staff-appointments' }, icon: 'mdi-calendar-range' },
  { title: 'Clientes', to: { name: 'staff-clients' }, icon: 'mdi-account-multiple-outline' },
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
const drawerName = computed(() => auth.user?.name || 'Equipe')
const userAvatarSrc = computed(() => resolveMediaUrl(auth.user?.avatar_url))
const userInitials = computed(() => {
  const source = String(drawerName.value || '').trim()
  if (!source) return '?'
  const value = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return value || '?'
})

const appBarTitle = computed(() => {
  if (auth.user?.role === 'super_admin') return 'Painel Super Admin'
  return 'Painel do colaborador'
})

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
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
.staff-app {
  color: var(--ink-900);
}

.staff-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at -8% -6%, rgba(184, 136, 94, 0.22), transparent 34%),
    radial-gradient(circle at 108% -4%, rgba(91, 140, 143, 0.22), transparent 40%),
    radial-gradient(circle at 50% 118%, rgba(143, 176, 178, 0.18), transparent 36%),
    linear-gradient(180deg, #f3f7f6 0%, #ebf3f1 100%);
}

.staff-bar {
  background: rgba(252, 255, 255, 0.78) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(87, 120, 132, 0.16);
}

.app-bar-title {
  font-family: var(--display-font);
  font-size: 1.05rem;
  letter-spacing: 0.01em;
  font-weight: 700;
  color: var(--ink-900);
}

.staff-drawer {
  background: rgba(252, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-right: 1px solid rgba(87, 120, 132, 0.14);
}

.drawer-header {
  display: flex;
  gap: 10px;
  padding: 22px 18px 10px;
  align-items: center;
}

.user-avatar {
  background: var(--brand-gradient-strong);
  box-shadow: 0 10px 24px rgba(75, 114, 117, 0.26);
  color: #f6fbfc;
  flex-shrink: 0;
}

.user-initials {
  font-family: var(--display-font);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.brand-title {
  font-family: var(--display-font);
  letter-spacing: 0.01em;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink-900);
}

.brand-subtitle {
  font-size: 0.8rem;
  color: rgba(66, 87, 99, 0.7);
}

.drawer-footer {
  margin-top: auto;
  padding: 16px;
}

.drawer-company :deep(.company-switcher) {
  min-width: 0;
}

.app-company-switcher :deep(.company-switcher) {
  min-width: 200px;
}

.page-shell {
  position: relative;
  z-index: 1;
  padding: 28px 22px 56px;
  animation: fadeUp 0.6s ease both;
}

@media (max-width: 960px) {
  .page-shell {
    padding: 22px 14px 42px;
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
