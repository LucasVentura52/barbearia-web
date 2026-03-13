<template>
  <v-app>
    <div class="shell-noise"></div>

    <v-navigation-drawer
      v-if="mdAndUp"
      v-model="drawer"
      :rail="mdAndUp && rail"
      expand-on-hover
      class="shell-drawer"
    >
      <div class="drawer-brand">
        <v-avatar color="secondary" variant="tonal" size="52">
          <v-img v-if="auth.user?.avatar_url" :src="resolveMediaUrl(auth.user.avatar_url)" cover />
          <span v-else class="text-subtitle-1 font-weight-black">{{ userInitials }}</span>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-black">{{ auth.user?.name || 'Equipe interna' }}</div>
          <div class="text-caption text-medium-emphasis">{{ roleLabel }}</div>
        </div>
      </div>

      <v-list nav class="px-2">
        <v-list-item
          v-for="item in visibleNavigationItems"
          :key="item.name"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="handleNavClick"
        />
      </v-list>

      <div class="drawer-footer">
        <v-sheet class="drawer-pulse pa-4" color="surface-variant">
          <div class="d-flex align-center justify-space-between ga-3 mb-4">
            <div>
              <div class="text-overline">Empresa ativa</div>
              <div class="text-h6 font-weight-black">{{ currentCompanyName }}</div>
            </div>
            <v-avatar color="secondary" variant="tonal" size="46">
              <v-icon icon="mdi-domain" />
            </v-avatar>
          </div>
          <div class="text-body-2 text-medium-emphasis mb-3">
            Contexto atual enviado para a API via `X-Company-Slug`.
          </div>
          <company-switcher v-if="auth.isAuthenticated" />
        </v-sheet>
      </div>
    </v-navigation-drawer>

    <v-app-bar class="shell-bar px-2">
      <v-btn v-if="mdAndUp" icon variant="text" @click="ui.toggleDrawer()" class="mr-1">
        <v-icon :icon="smAndDown ? 'mdi-menu' : 'mdi-menu-open'" />
      </v-btn>

      <div>
        <div class="text-subtitle-1 font-weight-black">Atelier Barber</div>
      </div>

      <v-spacer />

      <v-text-field
        v-if="mdAndUp"
        class="shell-search mr-3"
        density="compact"
        variant="solo-filled"
        flat
        hide-details
        prepend-inner-icon="mdi-magnify"
        placeholder="Buscar cliente, serviço ou insight"
      />

      <v-tooltip
        v-if="mdAndUp"
        location="bottom"
        :text="rail ? 'Expandir menu lateral' : 'Compactar menu lateral'"
      >
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" class="mr-1" @click="ui.toggleRail()">
            <v-icon :icon="rail ? 'mdi-arrow-expand-horizontal' : 'mdi-arrow-collapse-horizontal'" />
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip location="bottom" :text="themeModeLabel">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" class="mr-1" @click="toggleTheme">
            <v-icon :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" />
          </v-btn>
        </template>
      </v-tooltip>

      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" class="mr-1">
            <v-icon icon="mdi-account-circle-outline" />
          </v-btn>
        </template>

        <v-card min-width="320">
          <v-list lines="two">
            <v-list-item
              :title="auth.user?.name || 'Usuário'"
              :subtitle="currentCompanyName"
              prepend-icon="mdi-account-badge-outline"
            />
            <v-list-item
              :title="roleLabel"
              subtitle="Sessão autenticada"
              prepend-icon="mdi-shield-account-outline"
            />
            <v-list-item
              :title="apiBaseLabel"
              subtitle="API configurada"
              prepend-icon="mdi-lan-connect"
            />
            <v-list-item
              title="Abrir perfil"
              subtitle="Conta autenticada"
              prepend-icon="mdi-account-cog-outline"
              :to="{ name: 'profile' }"
            />
          </v-list>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="handleLogout">Sair</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

    </v-app-bar>

    <v-main>
      <v-container fluid class="shell-content">
        <div class="mb-6">
          <div class="text-h4 font-weight-black">{{ pageTitle }}</div>
          <div class="text-body-1 text-medium-emphasis">{{ pageSubtitle }}</div>
        </div>

        <router-view />
      </v-container>
    </v-main>

    <div v-if="smAndDown" class="shell-bottom-nav">
      <div class="shell-bottom-nav__scroll">
        <v-btn
          v-for="item in visibleNavigationItems"
          :key="item.name"
          class="shell-bottom-nav__button"
          :class="{ 'shell-bottom-nav__button--active': mobileRoute === item.name }"
          stacked
          rounded="xl"
          variant="text"
          :color="mobileRoute === item.name ? 'secondary' : undefined"
          @click="router.push(item.to)"
        >
          <v-icon :icon="item.icon" />
          <span>{{ item.title }}</span>
        </v-btn>
      </div>
    </div>

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
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay, useTheme } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import CompanySwitcher from '@/components/CompanySwitcher.vue'
import { navigationItems } from '@/data/mock'
import { resolveMediaUrl } from '@/lib/media'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const { mdAndUp, smAndDown } = useDisplay()
const auth = useAuthStore()
const company = useCompanyStore()
const ui = useUiStore()
const { drawer, rail, snackbar } = storeToRefs(ui)

watch(mdAndUp, (value) => {
  if (value) {
    ui.toggleDrawer(true)
  } else {
    ui.toggleRail(false)
    ui.toggleDrawer(false)
  }
}, { immediate: true })

const pageTitle = computed(() => String(route.meta.title || 'Atelier Barber'))
const pageSubtitle = computed(() => String(route.meta.subtitle || ''))
const isDark = computed(() => theme.global.current.value.dark)
const themeModeLabel = computed(() => (isDark.value ? 'Trocar para modo claro' : 'Trocar para modo escuro'))
const currentCompanyName = computed(() => company.currentCompany?.name || auth.user?.company?.name || 'Selecione a empresa')
const apiBaseLabel = computed(() => String(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'))
const userInitials = computed(() =>
  String(auth.user?.name || 'AB')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()
)
const roleLabel = computed(() => {
  if (auth.user?.role === 'super_admin') return 'Super admin'
  if (auth.user?.role === 'admin') return 'Administrador'
  return 'Colaborador'
})
const visibleNavigationItems = computed(() =>
  navigationItems.filter((item) => item.visibility.includes(auth.user?.role || ''))
)

const mobileRoute = computed({
  get: () => String(route.name || visibleNavigationItems.value[0]?.name || 'overview'),
  set: () => {},
})

const handleNavClick = () => {
  if (smAndDown.value) ui.toggleDrawer(false)
}

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'atelierLight' : 'atelierNight'
  ui.notify(
    isDark.value ? 'Modo claro ativado para a operação.' : 'Modo escuro ativado para o lounge.',
    'primary'
  )
}

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>
