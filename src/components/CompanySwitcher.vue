<template>
  <v-select
    :model-value="company.currentSlug"
    :items="company.options"
    :loading="company.loading"
    :disabled="isLockedForAuthenticatedUser"
    label="Empresa"
    variant="outlined"
    density="compact"
    hide-details
    class="company-switcher"
    @update:model-value="onSelect"
  />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'

const props = defineProps({
  reloadOnChange: {
    type: Boolean,
    default: true,
  },
})

const auth = useAuthStore()
const company = useCompanyStore()
const isLockedForAuthenticatedUser = computed(() => auth.isAuthenticated && !auth.isSuperAdmin)

const loadCompanies = async () => {
  if (auth.isAuthenticated) {
    await company.loadMyCompanies()
    return
  }

  await company.loadPublicCompanies()
}

const onSelect = async (value) => {
  if (auth.isAuthenticated && !auth.isSuperAdmin) {
    return
  }

  const nextSlug = String(value || '').trim()
  if (!nextSlug || nextSlug === company.currentSlug) {
    return
  }

  company.setCurrentSlug(nextSlug)

  if (auth.isAuthenticated) {
    await auth.loadMe()
  }

  if (props.reloadOnChange) {
    window.location.reload()
  }
}

onMounted(loadCompanies)
</script>

<style scoped>
.company-switcher {
  min-width: 220px;
}

@media (max-width: 960px) {
  .company-switcher {
    min-width: 0;
    width: 100%;
  }
}
</style>
