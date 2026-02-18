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
              <v-img v-if="avatarSrc" :src="avatarSrc" cover />
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
        <v-card class="glass-card" elevation="0">
          <v-card-text class="profile-actions">
            <v-btn color="primary" size="large" @click="refresh">
              Atualizar dados
            </v-btn>
            <v-btn variant="outlined" color="primary" size="large" @click="logout">
              Sair
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { resolveMediaUrl } from '@/lib/media'

const auth = useAuthStore()
const user = computed(() => auth.user)
const avatarSrc = computed(() => resolveMediaUrl(user.value?.avatar_url))

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
</script>

<style scoped>
.profile-card {
  display: flex;
  gap: 18px;
  align-items: center;
}

.profile-avatar {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(35, 58, 74, 0.1);
  display: grid;
  place-items: center;
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
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
</style>