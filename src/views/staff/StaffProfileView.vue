<template>
  <v-container>
    <div class="section-title">
      <h2>Meu perfil</h2>
    </div>

    <v-row class="profile-layout" align="stretch">
      <v-col cols="12" lg="4">
        <v-card class="glass-card profile-hero h-100" elevation="0">
          <div class="profile-hero__top"></div>
          <v-card-text class="profile-hero__content">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar">
                <v-img v-if="avatarSrc" :src="avatarSrc" cover class="profile-avatar__img" />
                <div v-else class="profile-initials">{{ initials }}</div>
              </div>
            </div>

            <div class="profile-name">{{ user?.name || 'Colaborador' }}</div>
            <div class="text-muted profile-phone">{{ userPhoneText || 'Telefone não informado' }}</div>

            <v-chip color="secondary" variant="tonal" class="mt-3" prepend-icon="mdi-account-badge-outline">
              {{ profileRoleLabel }}
            </v-chip>

            <div class="profile-meta mt-5">
              <div class="meta-item">
                <v-icon icon="mdi-domain" size="18" />
                <span>{{ user?.company?.name || 'Empresa não vinculada' }}</span>
              </div>
              <div class="meta-item">
                <v-icon icon="mdi-shield-check-outline" size="18" />
                <span>Permissão de {{ profileRoleLabel.toLowerCase() }}</span>
              </div>
              <div class="meta-item">
                <v-icon icon="mdi-calendar-clock-outline" size="18" />
                <span>Gestão com sincronização em tempo real</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8">
        <div class="profile-stack">
          <v-card class="glass-card" elevation="0">
            <v-card-item>
              <v-card-title class="text-h6">Dados da conta</v-card-title>
              <v-card-subtitle>Informações principais do seu acesso</v-card-subtitle>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon icon="mdi-account-outline" size="18" />
                    <div>
                      <div class="info-label">Nome</div>
                      <div class="info-value">{{ user?.name || '—' }}</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon icon="mdi-phone-outline" size="18" />
                    <div>
                      <div class="info-label">Telefone</div>
                      <div class="info-value">{{ userPhoneText || '—' }}</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon icon="mdi-email-outline" size="18" />
                    <div>
                      <div class="info-label">Email</div>
                      <div class="info-value">{{ user?.email || 'Não informado' }}</div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon icon="mdi-account-tag-outline" size="18" />
                    <div>
                      <div class="info-label">Perfil</div>
                      <div class="info-value">{{ profileRoleLabel }}</div>
                    </div>
                  </div>
                </v-col>
              </v-row>

              <div class="profile-buttons mt-2">
                <v-btn color="primary" :block="smAndDown" prepend-icon="mdi-refresh" @click="refresh">
                  Atualizar dados
                </v-btn>
                <v-btn variant="outlined" color="primary" :block="smAndDown" prepend-icon="mdi-logout"
                  @click="logout">
                  Sair
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="glass-card" elevation="0">
            <v-card-item>
              <v-card-title class="text-h6">Foto do perfil</v-card-title>
              <v-card-subtitle>Envie uma foto para personalizar sua conta</v-card-subtitle>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <v-file-input v-model="file" label="Selecionar nova foto" accept="image/*" prepend-icon="mdi-camera"
                show-size chips />
              <div class="profile-buttons mt-2">
                <v-btn color="primary" :block="smAndDown" :loading="uploading" prepend-icon="mdi-content-save-outline"
                  @click="uploadPhoto">
                  Salvar foto
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="glass-card" elevation="0">
            <v-card-item>
              <v-card-title class="text-h6">Segurança</v-card-title>
              <v-card-subtitle>Atualize sua senha de acesso</v-card-subtitle>
            </v-card-item>
            <v-divider />
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field v-model="passwordForm.current" label="Senha atual"
                    :type="showCurrentPassword ? 'text' : 'password'" prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showCurrentPassword = !showCurrentPassword" />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="passwordForm.password" label="Nova senha"
                    :type="showNewPassword ? 'text' : 'password'" prepend-inner-icon="mdi-lock-plus-outline"
                    :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showNewPassword = !showNewPassword" />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="passwordForm.confirmation" label="Confirmar nova senha"
                    :type="showConfirmPassword ? 'text' : 'password'" prepend-inner-icon="mdi-lock-check-outline"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showConfirmPassword = !showConfirmPassword" />
                </v-col>
              </v-row>

              <div class="profile-buttons mt-2">
                <v-btn color="primary" :block="smAndDown" :loading="updatingPassword" prepend-icon="mdi-shield-key-outline"
                  @click="updatePassword">
                  Atualizar senha
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'
import { resolveMediaUrl } from '@/lib/media'
import { formatPhoneFromE164 } from '@/lib/phone'

const auth = useAuthStore()
const user = computed(() => auth.user)
const avatarSrc = computed(() => resolveMediaUrl(user.value?.avatar_url))
const userPhoneText = computed(() => formatPhoneFromE164(user.value?.phone))
const profileRoleLabel = computed(() => {
  if (user.value?.role === 'super_admin') return 'Super admin'
  if (user.value?.role === 'admin') return 'Administrador'
  return 'Colaborador'
})
const file = ref(null)
const uploading = ref(false)
const updatingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const alerts = useAlertStore()
const { smAndDown } = useDisplay()
const passwordForm = ref({
  current: '',
  password: '',
  confirmation: '',
})

const initials = computed(() =>
  (user.value?.name || 'Colaborador')
    .split(' ')
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
)

const refresh = () => auth.loadMe()
const logout = () => auth.logout()

const uploadPhoto = async () => {
  const selectedFile = Array.isArray(file.value) ? file.value[0] : file.value
  if (!selectedFile) return
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile)
    const { data } = await api.post('/api/me/photo', formData)
    auth.user = data.user
    await auth.loadMe()
    alerts.success('Foto atualizada com sucesso.')
  } finally {
    uploading.value = false
  }
}

const updatePassword = async () => {
  if (!passwordForm.value.current || !passwordForm.value.password || !passwordForm.value.confirmation) {
    alerts.warning('Preencha todos os campos de senha.')
    return
  }
  if (passwordForm.value.password !== passwordForm.value.confirmation) {
    alerts.warning('As senhas não conferem.')
    return
  }
  updatingPassword.value = true
  try {
    await api.post('/api/me/password', {
      current_password: passwordForm.value.current,
      password: passwordForm.value.password,
      password_confirmation: passwordForm.value.confirmation,
    })
    passwordForm.value = { current: '', password: '', confirmation: '' }
    alerts.success('Senha atualizada com sucesso.')
  } finally {
    updatingPassword.value = false
  }
}
</script>

<style scoped>
.profile-layout {
  row-gap: 16px;
}

.profile-stack {
  display: grid;
  gap: 16px;
}

.profile-hero {
  overflow: hidden;
}

.profile-hero__top {
  height: 96px;
  background: var(--brand-gradient-strong);
}

.profile-hero__content {
  padding-top: 0;
}

.profile-avatar-wrap {
  margin-top: -44px;
  margin-bottom: 10px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 32px;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.95);
  background: rgba(35, 58, 74, 0.1);
  box-shadow: 0 14px 26px rgba(43, 68, 74, 0.2);
  display: grid;
  place-items: center;
}

.profile-avatar__img {
  width: 100%;
  height: 100%;
}

.profile-initials {
  font-family: var(--display-font);
  font-size: 1.55rem;
  font-weight: 700;
}

.profile-name {
  font-family: var(--display-font);
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.profile-phone {
  margin-top: 4px;
}

.profile-meta {
  display: grid;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 12px;
  background: rgba(91, 140, 143, 0.09);
  color: var(--ink-700);
}

.info-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid rgba(87, 120, 132, 0.16);
  background: rgba(255, 255, 255, 0.58);
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-500);
}

.info-value {
  font-weight: 600;
  color: var(--ink-900);
}

.profile-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 960px) {
  .profile-avatar {
    width: 104px;
    height: 104px;
    border-radius: 28px;
  }

  .profile-buttons .v-btn {
    flex: 1 1 auto;
  }
}
</style>
