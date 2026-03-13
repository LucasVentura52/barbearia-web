<template>
  <v-row>
    <v-col cols="12" lg="4">
      <v-card class="glass-panel h-100">
        <v-card-text class="d-flex flex-column align-center text-center ga-4 pa-8">
          <v-avatar color="secondary" variant="tonal" size="112">
            <v-img v-if="auth.user?.avatar_url" :src="resolveMediaUrl(auth.user.avatar_url)" cover />
            <span v-else class="text-h4 font-weight-black">{{ initials }}</span>
          </v-avatar>

          <div>
            <div class="text-h5 font-weight-black">{{ auth.user?.name || 'Usuário' }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ roleLabel }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ auth.user?.company?.name || 'Sem empresa' }}</div>
          </div>

          <v-file-input
            v-model="photoFile"
            label="Nova foto"
            accept="image/*"
            prepend-icon="mdi-camera-outline"
            chips
            show-size
          />

          <v-btn color="secondary" block :loading="photoSaving" :disabled="!photoFile" @click="uploadPhoto">
            Atualizar foto
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" lg="8">
      <div class="d-flex flex-column ga-6">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="mdi-account-edit-outline" />
              </v-avatar>
            </template>
            <v-card-title>Dados pessoais</v-card-title>
            <v-card-subtitle>Atualize nome e e-mail da conta autenticada.</v-card-subtitle>
          </v-card-item>
          <v-card-text class="d-flex flex-column ga-4">
            <v-text-field v-model="profileForm.name" label="Nome" />
            <v-text-field v-model="profileForm.email" label="E-mail" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="secondary" :loading="profileSaving" @click="saveProfile">Salvar perfil</v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="warning" variant="tonal">
                <v-icon icon="mdi-lock-reset" />
              </v-avatar>
            </template>
            <v-card-title>Segurança</v-card-title>
            <v-card-subtitle>Troque a senha da sua conta.</v-card-subtitle>
          </v-card-item>
          <v-card-text class="d-flex flex-column ga-4">
            <v-text-field v-model="passwordForm.current_password" label="Senha atual" type="password" />
            <v-text-field v-model="passwordForm.password" label="Nova senha" type="password" />
            <v-text-field v-model="passwordForm.password_confirmation" label="Confirmar nova senha" type="password" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="secondary" :loading="passwordSaving" @click="savePassword">Atualizar senha</v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const profileSaving = ref(false)
const passwordSaving = ref(false)
const photoSaving = ref(false)
const photoFile = ref(null)
const profileForm = ref({
  name: '',
  email: '',
})
const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const initials = computed(() =>
  String(auth.user?.name || 'AB')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()
)

const roleLabel = computed(() => {
  if (auth.user?.role === 'client') return 'Cliente'
  if (auth.user?.role === 'super_admin') return 'Super admin'
  if (auth.user?.role === 'admin') return 'Administrador'
  return 'Colaborador'
})

watch(
  () => auth.user,
  (user) => {
    profileForm.value = {
      name: user?.name || '',
      email: user?.email || '',
    }
  },
  { immediate: true }
)

const refreshUser = async () => {
  await auth.loadMe(true)
}

const resolveSelectedFile = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const saveProfile = async () => {
  profileSaving.value = true
  try {
    await api.put('/api/me', {
      name: profileForm.value.name,
      email: profileForm.value.email || null,
    })
    await refreshUser()
    ui.notify('Perfil atualizado.', 'success')
  } finally {
    profileSaving.value = false
  }
}

const uploadPhoto = async () => {
  const file = resolveSelectedFile(photoFile.value)
  if (!file) return
  photoSaving.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    await api.post('/api/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    photoFile.value = null
    await refreshUser()
    ui.notify('Foto atualizada.', 'success')
  } finally {
    photoSaving.value = false
  }
}

const savePassword = async () => {
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    ui.notify('A confirmação da senha não confere.', 'warning')
    return
  }

  passwordSaving.value = true
  try {
    await api.post('/api/me/password', passwordForm.value)
    passwordForm.value = {
      current_password: '',
      password: '',
      password_confirmation: '',
    }
    ui.notify('Senha atualizada.', 'success')
  } finally {
    passwordSaving.value = false
  }
}
</script>
