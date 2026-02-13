<template>
  <v-select
    :model-value="company.currentSlug"
    :items="company.options"
    :loading="company.loading"
    label="Empresa"
    variant="outlined"
    density="compact"
    hide-details
    class="company-switcher"
    @update:model-value="onSelect"
  />
</template>

<script setup>
import { onMounted } from 'vue'
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

const loadCompanies = async () => {
  if (auth.isAuthenticated) {
    await company.loadMyCompanies()
    return
  }

  await company.loadPublicCompanies()
}

const onSelect = async (value) => {
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
</style>
