<template>
  <component :is="layoutComponent">
    <AppAlerts />
    <router-view />
  </component>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ClientShell from '@/layouts/ClientShell.vue'
import StaffShell from '@/layouts/StaffShell.vue'
import AppAlerts from '@/components/AppAlerts.vue'

const route = useRoute()
const auth = useAuthStore()

const layoutComponent = computed(() => {
  const layout = route.meta.layout || 'client'
  if (layout === 'auth') return AuthLayout
  if (layout === 'staff') return StaffShell
  return ClientShell
})

onMounted(() => {
  auth.loadMe()
})
</script>
