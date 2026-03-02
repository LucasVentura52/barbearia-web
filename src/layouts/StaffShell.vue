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
      <v-list nav density="comfortable" v-model:opened="openedGroups">
        <template v-for="item in visibleNav" :key="item.title">
          <v-list-group v-if="item.children" :value="item.group">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="item.icon" :title="item.title" />
            </template>
            <v-list-item
              v-for="child in item.children"
              :key="child.title"
              :to="child.to"
              :prepend-icon="child.icon"
              :title="child.title"
              class="nav-subitem"
              @click="handleNavClick"
            />
          </v-list-group>
          <v-list-item
            v-else
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            @click="handleNavClick"
          />
        </template>
      </v-list>
      <div v-if="auth.isAuthenticated && auth.user?.role === 'super_admin' && smAndDown" class="drawer-company px-4 pb-2">
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
      <CompanySwitcher
        v-if="auth.isAuthenticated && auth.user?.role === 'super_admin' && !smAndDown"
        class="me-3 app-company-switcher"
      />
      <v-menu v-if="smAndDown" location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon>
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>
        <v-list density="compact" min-width="220">
          <v-list-item v-if="auth.user" :title="auth.user.name" :subtitle="subtitle" />
          <v-divider v-if="auth.user" />
          <v-list-item
            v-if="canManageSettings"
            prepend-icon="mdi-cog-outline"
            title="Configurações"
            @click="openSettingsDialog"
          />
          <v-list-item :to="{ name: 'client-home' }" prepend-icon="mdi-account-outline" title="Área do cliente" />
          <v-list-item prepend-icon="mdi-logout" title="Sair" @click="handleLogout" />
        </v-list>
      </v-menu>
      <div v-else class="app-bar-actions">
        <v-btn v-if="canManageSettings" icon variant="outlined" color="primary" @click="openSettingsDialog">
          <v-icon icon="mdi-cog-outline" />
        </v-btn>
        <v-btn color="primary" variant="outlined" :to="{ name: 'client-home' }">
          Ver área do cliente
        </v-btn>
      </div>
    </v-app-bar>

    <v-main>
      <div class="page-shell">
        <slot />
      </div>
    </v-main>

    <v-dialog v-model="settingsDialog" max-width="760">
      <v-card>
        <v-card-item>
          <template #append>
            <v-btn
              icon
              variant="text"
              color="primary"
              size="small"
              title="Ajuda de configuração"
              @click="settingsHelpDialog = true"
            >
              <v-icon icon="mdi-help-circle-outline" />
            </v-btn>
          </template>
          <v-card-title>Configurações do sistema</v-card-title>
          <v-card-subtitle>Email da empresa (Gmail)</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            Use senha de app do Gmail (2FA ativo). Host/porta/criptografia já são configurados automaticamente.
          </v-alert>

          <v-row>
            <v-col cols="12" md="4">
              <v-switch v-model="settingsForm.active" color="primary" label="Ativar envio" inset hide-details />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="settingsForm.from_name"
                label="Nome remetente"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-account-outline"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="settingsForm.gmail_email"
                label="Email Gmail"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-email-outline"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settingsForm.smtp_password"
                :label="settingsForm.has_password ? 'Nova senha de app (opcional)' : 'Senha de app Gmail'"
                :type="showSmtpPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showSmtpPassword ? 'mdi-eye-off' : 'mdi-eye'"
                variant="outlined"
                density="compact"
                @click:append-inner="showSmtpPassword = !showSmtpPassword"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settingsTestTo"
                label="Email para teste (opcional)"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-send-outline"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="savingSettings || testingSettings" @click="settingsDialog = false">
            Fechar
          </v-btn>
          <v-btn
            variant="outlined"
            color="primary"
            :loading="testingSettings"
            :disabled="savingSettings"
            @click="sendSettingsTest"
          >
            Enviar teste
          </v-btn>
          <v-btn color="primary" :loading="savingSettings" :disabled="testingSettings" @click="saveSettings">
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="settingsHelpDialog" max-width="760">
      <v-card>
        <v-card-item>
          <v-card-title>Como configurar o email da empresa</v-card-title>
          <v-card-subtitle>Guia rápido para Gmail SMTP</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text>
          <div class="help-block">
            <div class="help-title">1. Ative a verificação em 2 etapas no Gmail</div>
            <div class="help-text">
              A conta Gmail precisa estar com 2FA ativo para liberar senha de app.
            </div>
          </div>
          <div class="help-block">
            <div class="help-title">2. Gere a senha de app</div>
            <div class="help-text">
              No Google Account, acesse Segurança &gt; Senhas de app e gere uma nova senha.
              Use essa senha no campo "Senha de app Gmail".
            </div>
          </div>
          <div class="help-block">
            <div class="help-title">3. Preencha os campos obrigatórios</div>
            <div class="help-text">
              Informe Nome remetente, Email Gmail e Senha de app. O sistema já usa host, porta e
              criptografia corretos automaticamente.
            </div>
          </div>
          <div class="help-block">
            <div class="help-title">4. Salve e teste</div>
            <div class="help-text">
              Clique em "Salvar" e depois em "Enviar teste". Se receber o email, a configuração está pronta.
            </div>
          </div>
          <div class="help-block">
            <div class="help-title">Dicas importantes</div>
            <div class="help-text">
              Não use a senha principal da conta Gmail. Se o teste falhar, revise a senha de app e o
              email informado.
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="settingsHelpDialog = false">Entendi</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import CompanySwitcher from '@/components/CompanySwitcher.vue'
import { resolveMediaUrl } from '@/lib/media'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'

const { mdAndUp, smAndDown } = useDisplay()
const drawer = ref(mdAndUp.value)
const openedGroups = ref([])
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const alerts = useAlertStore()
const settingsDialog = ref(false)
const settingsHelpDialog = ref(false)
const savingSettings = ref(false)
const testingSettings = ref(false)
const showSmtpPassword = ref(false)
const settingsTestTo = ref('')
const settingsForm = ref({
  active: false,
  from_name: '',
  gmail_email: '',
  smtp_password: '',
  has_password: false,
})

const navItems = [
  { title: 'Dashboard', to: { name: 'staff-dashboard' }, icon: 'mdi-view-dashboard-outline' },
  { title: 'Agenda', to: { name: 'staff-appointments' }, icon: 'mdi-calendar-range' },
  { title: 'Clientes', to: { name: 'staff-clients' }, icon: 'mdi-account-multiple-outline' },
  { title: 'Horários', to: { name: 'staff-schedule' }, icon: 'mdi-calendar-clock-outline' },
  { title: 'Serviços', to: { name: 'staff-services' }, icon: 'mdi-scissors-cutting' },
  { title: 'Produtos', to: { name: 'staff-products' }, icon: 'mdi-bottle-tonic-outline' },
  {
    title: 'Relatórios',
    icon: 'mdi-chart-box-outline',
    group: 'reports',
    children: [
      { title: 'Colaboradores', to: { name: 'staff-reports-collaborators' }, icon: 'mdi-account-group-outline' },
      { title: 'Clientes', to: { name: 'staff-reports-clients' }, icon: 'mdi-account-multiple-outline' },
      { title: 'Produtos', to: { name: 'staff-reports-products' }, icon: 'mdi-bottle-tonic-outline' },
      { title: 'Agendamentos', to: { name: 'staff-reports-appointments' }, icon: 'mdi-calendar-range' },
      { title: 'Financeiro', to: { name: 'staff-reports-financial' }, icon: 'mdi-cash-multiple' },
    ],
  },
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

watch(
  () => route.name,
  (name) => {
    const key = String(name || '')
    if (key.startsWith('staff-reports-')) {
      if (!openedGroups.value.includes('reports')) {
        openedGroups.value = [...openedGroups.value, 'reports']
      }
      return
    }
    openedGroups.value = openedGroups.value.filter((group) => group !== 'reports')
  },
  { immediate: true }
)

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
const canManageSettings = computed(() => ['admin', 'super_admin'].includes(auth.user?.role))

const handleLogout = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}

const handleNavClick = () => {
  if (!mdAndUp.value) {
    drawer.value = false
  }
}

const loadSettings = async () => {
  if (!canManageSettings.value) return
  const { data } = await api.get('/api/company/mail-settings')
  const setting = data?.setting || {}
  settingsForm.value = {
    active: Boolean(setting.active),
    from_name: setting.from_name || '',
    gmail_email: setting.smtp_username || setting.from_email || '',
    smtp_password: '',
    has_password: Boolean(setting.has_password),
  }
}

const openSettingsDialog = async () => {
  if (!canManageSettings.value) return
  try {
    await loadSettings()
    settingsDialog.value = true
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível carregar as configurações.')
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  try {
    const payload = {
      active: Boolean(settingsForm.value.active),
      provider: 'gmail_smtp',
      from_name: String(settingsForm.value.from_name || '').trim(),
      from_email: String(settingsForm.value.gmail_email || '').trim(),
      smtp_username: String(settingsForm.value.gmail_email || '').trim(),
    }
    const password = String(settingsForm.value.smtp_password || '').trim()
    if (password) payload.smtp_password = password

    const { data } = await api.put('/api/company/mail-settings', payload)
    settingsForm.value.smtp_password = ''
    settingsForm.value.has_password = Boolean(data?.setting?.has_password)
    alerts.success(data?.message || 'Configuração salva com sucesso.')
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível salvar as configurações.')
  } finally {
    savingSettings.value = false
  }
}

const sendSettingsTest = async () => {
  testingSettings.value = true
  try {
    const payload = {}
    const to = String(settingsTestTo.value || '').trim()
    if (to) payload.to_email = to
    const { data } = await api.post('/api/company/mail-settings/test', payload)
    alerts.success(data?.message || 'Email de teste enviado.')
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível enviar email de teste.')
  } finally {
    testingSettings.value = false
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

.app-bar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-block + .help-block {
  margin-top: 12px;
}

.help-title {
  font-weight: 700;
  color: var(--ink-900);
}

.help-text {
  color: var(--ink-700);
  margin-top: 2px;
}

.page-shell {
  position: relative;
  z-index: 1;
  padding: 28px 22px 56px;
  animation: fadeUp 0.6s ease both;
}

.page-shell :deep(.v-container) {
  max-width: 100%;
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
