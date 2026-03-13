<template>
  <v-app>
    <div class="shell-noise"></div>

    <v-navigation-drawer v-if="mdAndUp" permanent class="shell-drawer">
      <div class="drawer-brand">
        <v-avatar color="secondary" variant="tonal" size="52">
          <v-img v-if="auth.user?.avatar_url" :src="resolveMediaUrl(auth.user.avatar_url)" cover />
          <span v-else class="text-subtitle-1 font-weight-black">{{ userInitials }}</span>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-black">{{ auth.user?.name || 'Cliente' }}</div>
          <div class="text-caption text-medium-emphasis">{{ roleLabel }}</div>
        </div>
      </div>

      <v-list nav class="px-2">
        <v-list-item
          v-for="item in clientNavigationItems"
          :key="item.name"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
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
              <v-icon icon="mdi-storefront-outline" />
            </v-avatar>
          </div>
          <div class="text-body-2 text-medium-emphasis mb-3">
            Seus agendamentos e dados sempre respeitam a empresa selecionada.
          </div>
          <company-switcher v-if="auth.isAuthenticated" />
        </v-sheet>
      </div>
    </v-navigation-drawer>

    <v-app-bar class="shell-bar px-2">
      <div>
        <div class="text-subtitle-1 font-weight-black">Atelier Barber</div>
      </div>

      <v-spacer />

      <v-chip v-if="mdAndUp" color="secondary" variant="tonal" class="mr-2">
        Portal do cliente
      </v-chip>

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
              :title="auth.user?.name || 'Cliente'"
              :subtitle="currentCompanyName"
              prepend-icon="mdi-account-heart-outline"
            />
            <v-list-item
              :title="roleLabel"
              subtitle="Sessão autenticada"
              prepend-icon="mdi-shield-account-outline"
            />
            <v-list-item
              title="Abrir perfil"
              subtitle="Conta e segurança"
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
          v-for="item in clientNavigationItems"
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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay, useTheme } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import CompanySwitcher from '@/components/CompanySwitcher.vue'
import { clientNavigationItems } from '@/data/mock'
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
const { snackbar } = storeToRefs(ui)

const pageTitle = computed(() => String(route.meta.title || 'Portal do cliente'))
const pageSubtitle = computed(() => String(route.meta.subtitle || ''))
const isDark = computed(() => theme.global.current.value.dark)
const themeModeLabel = computed(() => (isDark.value ? 'Trocar para modo claro' : 'Trocar para modo escuro'))
const currentCompanyName = computed(() => company.currentCompany?.name || auth.user?.company?.name || 'Selecione a empresa')
const userInitials = computed(() =>
  String(auth.user?.name || 'CL')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()
)
const roleLabel = computed(() => 'Cliente')
const mobileRoute = computed({
  get: () => String(route.name || clientNavigationItems[0]?.name || 'client-appointments'),
  set: () => {},
})

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'atelierLight' : 'atelierNight'
  ui.notify(
    isDark.value ? 'Modo claro ativado para o portal.' : 'Modo escuro ativado para o portal.',
    'primary'
  )
}

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>
