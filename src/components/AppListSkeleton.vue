<template>
  <div class="list-skeleton" :class="`list-skeleton--${mode}`">
    <template v-if="mode === 'table'">
      <div
        v-for="row in rows"
        :key="`row-${row}`"
        class="list-skeleton-table-row"
        :style="tableGridStyle"
      >
        <v-skeleton-loader
          v-for="col in columns"
          :key="`cell-${row}-${col}`"
          type="text"
          class="list-skeleton-block"
        />
      </div>
    </template>

    <template v-else-if="mode === 'cards'">
      <v-card v-for="row in rows" :key="`card-${row}`" variant="outlined" class="list-skeleton-card">
        <v-card-text>
          <v-skeleton-loader type="heading" class="mb-2" />
          <v-skeleton-loader type="text" />
          <v-skeleton-loader type="text" class="mt-1" />
          <div class="list-skeleton-actions">
            <v-skeleton-loader type="button" class="list-skeleton-action" />
            <v-skeleton-loader type="button" class="list-skeleton-action" />
          </div>
        </v-card-text>
      </v-card>
    </template>

    <template v-else>
      <div v-for="row in rows" :key="`list-${row}`" class="list-skeleton-list-item">
        <v-skeleton-loader type="list-item-two-line, chip" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'table',
  },
  rows: {
    type: Number,
    default: 6,
  },
  columns: {
    type: Number,
    default: 5,
  },
})

const tableGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
}))
</script>

<style scoped>
.list-skeleton {
  display: grid;
  gap: 10px;
}

.list-skeleton-table-row {
  display: grid;
  gap: 12px;
}

.list-skeleton-block :deep(.v-skeleton-loader__bone) {
  border-radius: 8px;
}

.list-skeleton-card {
  border-radius: 14px;
}

.list-skeleton-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.list-skeleton-action {
  width: 120px;
  max-width: 45%;
}

.list-skeleton-list-item {
  border-bottom: 1px solid rgba(35, 58, 74, 0.1);
  padding-bottom: 6px;
}
</style>
