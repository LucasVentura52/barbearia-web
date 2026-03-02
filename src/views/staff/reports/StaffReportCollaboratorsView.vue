<template>
  <v-container>
    <div class="section-title"><h2>Relatório de Colaboradores</h2></div>
    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-date-input v-model="dateRange" label="Período" multiple="range" hide-details />
        <v-text-field v-model="search" label="Buscar colaborador" variant="outlined" density="compact" hide-details />
        <v-btn color="secondary" :loading="loading" @click="loadReport">Atualizar</v-btn>
      </v-card-text>
    </v-card>
    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <div class="chips-row mb-3">
          <v-chip color="secondary" variant="tonal">Colaboradores: {{ summary.staff_total }}</v-chip>
          <v-chip color="primary" variant="tonal">Concluídos: {{ summary.done_total }}</v-chip>
          <v-chip color="success" variant="tonal">Receita: {{ formatCurrencyBRL(summary.revenue_realized_total) }}</v-chip>
        </div>
        <v-table>
          <thead><tr><th>Nome</th><th>Total</th><th>Agendados</th><th>Concluídos</th><th>Receita</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.name }}</td><td>{{ item.appointments_total }}</td><td>{{ item.scheduled_count }}</td><td>{{ item.done_count }}</td>
              <td>{{ formatCurrencyBRL(item.revenue_realized) }}</td>
            </tr>
            <tr v-if="!items.length"><td colspan="5" class="text-muted">Sem dados no período.</td></tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'

const pad = (v) => String(v).padStart(2, '0')
const toDate = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const monthRange = () => {
  const now = new Date()
  return [toDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))]
}
const dateRange = ref(monthRange())
const search = ref('')
const loading = ref(false)
const summary = ref({ staff_total: 0, done_total: 0, revenue_realized_total: 0 })
const items = ref([])
const period = computed(() => {
  const values = (Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]).map((v) => toDate(v)).filter(Boolean).sort()
  if (!values.length) return { from: monthRange()[0], to: monthRange()[1] }
  if (values.length === 1) return { from: values[0], to: values[0] }
  return { from: values[0], to: values[values.length - 1] }
})
const loadReport = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ from: period.value.from, to: period.value.to })
    if (search.value.trim()) params.set('search', search.value.trim())
    const { data } = await api.get(`/api/reports/collaborators?${params.toString()}`)
    summary.value = data?.summary || summary.value
    items.value = Array.isArray(data?.items) ? data.items : []
  } finally { loading.value = false }
}
onMounted(loadReport)
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.chips-row { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
