<template>
  <v-card class="metric-card h-100">
    <v-card-text class="d-flex flex-column ga-4">
      <div class="d-flex align-center justify-space-between ga-3">
        <div>
          <div class="text-overline">{{ title }}</div>
          <div class="text-h4 font-weight-black">{{ value }}</div>
        </div>
        <v-avatar :color="`${color}`" variant="tonal" size="48">
          <v-icon :icon="icon" />
        </v-avatar>
      </div>

      <div class="text-body-2 text-medium-emphasis">{{ subtitle }}</div>

      <div class="d-flex align-center ga-3">
        <v-progress-linear :model-value="progress" :color="color" rounded height="8" />
        <v-chip :color="color" variant="tonal">{{ progress }}%</v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: String, required: true },
  subtitle: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, default: 'primary' },
  progress: { type: Number, default: 50 },
})
</script>
