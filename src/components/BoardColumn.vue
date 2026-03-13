<template>
  <v-card class="board-column h-100">
    <v-card-item>
      <template #prepend>
        <v-avatar :color="color" variant="tonal">
          <v-icon :icon="icon" />
        </v-avatar>
      </template>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-subtitle>{{ items.length }} cartões ativos</v-card-subtitle>
    </v-card-item>

    <v-card-text class="d-flex flex-column ga-3">
      <v-sheet
        v-for="item in items"
        :key="item.id"
        class="board-ticket"
        color="surface"
        border
      >
        <div class="d-flex align-start justify-space-between ga-3">
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ item.client }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ item.service }}</div>
          </div>
          <v-chip :color="color" variant="tonal">{{ item.eta }}</v-chip>
        </div>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-chip size="small" variant="outlined" prepend-icon="mdi-seat-outline">{{ item.chair }}</v-chip>
          <v-chip size="small" variant="outlined" prepend-icon="mdi-account-outline">{{ item.barber }}</v-chip>
          <v-chip size="small" :color="color" variant="tonal">{{ item.priority }}</v-chip>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  color: { type: String, default: 'primary' },
  icon: { type: String, required: true },
  items: { type: Array, default: () => [] },
})
</script>
