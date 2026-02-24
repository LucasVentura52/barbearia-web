<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card class="pa-6 pa-sm-8 text-center" max-width="520" rounded="xl" elevation="6">
      <v-icon icon="mdi-alert-circle-outline" size="58" color="warning" class="mb-3" />
      <h1 class="text-h5 text-sm-h4 mb-2">Página não encontrada</h1>
      <p class="text-body-1 text-medium-emphasis mb-6">
        A rota que você tentou acessar não existe no sistema.
      </p>

      <v-btn color="primary" size="large" @click="goToMainRoute">
        Voltar para o início
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const goToMainRoute = () => {
  if (!auth.isAuthenticated) {
    router.replace({ name: 'login' })
    return
  }

  if (auth.isSuperAdmin) {
    router.replace({ name: 'super-admin-companies' })
    return
  }

  if (auth.isStaff) {
    router.replace({ name: 'staff-dashboard' })
    return
  }

  router.replace({ name: 'client-home' })
}
</script>
