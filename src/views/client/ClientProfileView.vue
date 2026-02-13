<template>
  <v-container>
    <div class="section-title">
      <h2>Meu perfil</h2>
    </div>

    <v-row>
      <v-col cols="12" md="5">
        <v-card class="glass-card" elevation="0">
          <v-card-text class="profile-card">
            <div class="profile-avatar">
              <v-img v-if="avatarSrc" :src="avatarSrc" cover class="profile-avatar__img" />
              <div v-else class="profile-initials">{{ initials }}</div>
            </div>
            <div>
              <div class="profile-name">{{ user?.name || 'Cliente' }}</div>
              <div class="text-muted">{{ user?.phone }}</div>
              <v-chip color="secondary" variant="tonal" class="mt-2">
                {{ user?.role || 'client' }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <div class="profile-stack">
          <v-card class="glass-card" elevation="0">
            <v-card-text class="profile-actions">
              <v-file-input v-model="file" label="Atualizar foto" accept="image/*" prepend-icon="mdi-camera"
                variant="outlined" />
              <div class="profile-buttons">
                <v-btn color="primary" size="large" :loading="uploading" @click="uploadPhoto">
                  Salvar foto
                </v-btn>
                <v-btn color="primary" variant="outlined" size="large" @click="refresh">
                  Atualizar dados
                </v-btn>
                <v-btn variant="outlined" color="primary" size="large" @click="logout">
                  Sair
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-card class="glass-card" elevation="0">
            <v-card-text class="profile-actions">
              <div class="section-label">Trocar senha</div>
              <v-text-field v-model="passwordForm.current" label="Senha atual" type="password" variant="outlined" />
              <v-text-field v-model="passwordForm.password" label="Nova senha" type="password" variant="outlined" />
              <v-text-field v-model="passwordForm.confirmation" label="Repetir nova senha" type="password"
                variant="outlined" />
              <div class="profile-buttons">
                <v-btn color="primary" size="large" :loading="updatingPassword" @click="updatePassword">
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
import { useAuthStore } from '@/stores/auth'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'
import { resolveMediaUrl } from '@/lib/media'

const auth = useAuthStore()
const user = computed(() => auth.user)
const avatarSrc = computed(() => resolveMediaUrl(user.value?.avatar_url))
const file = ref(null)
const uploading = ref(false)
const updatingPassword = ref(false)
const alerts = useAlertStore()
const passwordForm = ref({
  current: '',
  password: '',
  confirmation: '',
})

const initials = computed(() =>
  (user.value?.name || 'Cliente')
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
.profile-card {
  display: flex;
  gap: 18px;
  align-items: center;
}

.profile-avatar {
  width: 170px;
  height: 128px;
  border-radius: 28px;
  overflow: hidden;
  background: rgba(11, 31, 36, 0.1);
  display: grid;
  place-items: center;
}

.profile-avatar__img {
  width: 100%;
  height: 100%;
}

.profile-initials {
  font-family: var(--display-font);
  font-size: 1.6rem;
}

.profile-name {
  font-weight: 600;
  font-size: 1.2rem;
}

.profile-actions {
  display: grid;
  gap: 16px;
}

.profile-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.profile-stack {
  display: grid;
  gap: 16px;
}
</style>
