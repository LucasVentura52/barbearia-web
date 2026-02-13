<template>
  <div class="alert-stack">
    <v-snackbar v-for="alert in alerts.items" :key="alert.id" v-model="alert.show" :color="colorMap[alert.type]"
      :timeout="alert.timeout" location="top right" class="app-snackbar"
      @update:modelValue="(value) => !value && alerts.remove(alert.id)">
      <div class="snackbar-body">
        <v-icon :icon="iconMap[alert.type]" size="18" />
        <span class="snackbar-text">{{ alert.message }}</span>
      </div>
      <template #actions>
        <v-btn icon variant="text" @click="alerts.remove(alert.id)">
          <v-icon icon="mdi-close" />
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { useAlertStore } from '@/stores/alerts'

const alerts = useAlertStore()

const iconMap = {
  success: 'mdi-check-circle-outline',
  warning: 'mdi-alert-circle-outline',
  error: 'mdi-close-circle-outline',
  info: 'mdi-information-outline',
}

const colorMap = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
}
</script>

<style scoped>
.alert-stack :deep(.v-snackbar__wrapper) {
  border-radius: 16px;
}

.snackbar-body {
  display: flex;
  align-items: center;
  gap: 10px;
}

.snackbar-text {
  font-weight: 500;
}
</style>