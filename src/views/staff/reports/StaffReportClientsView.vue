<template>
  <v-container>
    <div class="section-title"><h2>Relatório de Clientes</h2></div>
    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-date-input v-model="dateRange" label="Período" multiple="range" hide-details class="toolbar-field" />
        <v-text-field v-model="search" label="Buscar cliente" variant="outlined" density="compact" hide-details class="toolbar-field" />
        <v-text-field v-model.number="minSpent" type="number" min="0" label="Gasto mínimo" variant="outlined" density="compact" hide-details class="toolbar-field" />
        <v-btn color="secondary" :loading="loading" class="toolbar-btn" @click="loadReport">Atualizar</v-btn>
        <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" :disabled="loading" class="toolbar-btn" @click="downloadExcel">
          Excel
        </v-btn>
        <v-btn color="error" variant="tonal" prepend-icon="mdi-file-pdf-box" :disabled="loading" class="toolbar-btn" @click="downloadPdf">
          PDF
        </v-btn>
      </v-card-text>
    </v-card>
    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <div class="chips-row mb-3">
          <v-chip color="secondary" variant="tonal">Com agendamentos: {{ summary.total_with_appointments }}</v-chip>
          <v-chip color="primary" variant="tonal">Novos: {{ summary.new_clients }}</v-chip>
          <v-chip color="success" variant="tonal">Top listados: {{ summary.top_clients_count }}</v-chip>
        </div>
        <v-table>
          <thead><tr><th>Cliente</th><th>Concluídos</th><th>Total gasto</th><th>Último atendimento</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.appointments_done }}</td>
              <td>{{ formatCurrencyBRL(item.total_spent) }}</td>
              <td>{{ formatDateTime(item.last_appointment_at) }}</td>
            </tr>
            <tr v-if="!items.length"><td colspan="4" class="text-muted">Sem dados no período.</td></tr>
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
import { useAlertStore } from '@/stores/alerts'
import { buildPeriodLabel, exportReportToExcel, exportReportToPdf } from '@/lib/reportExport'
const pad = (v) => String(v).padStart(2, '0')
const toDate = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const formatDateTime = (value) => {
  if (!value) return '--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const monthRange = () => { const now = new Date(); return [toDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))] }
const dateRange = ref(monthRange())
const search = ref('')
const minSpent = ref(null)
const loading = ref(false)
const alerts = useAlertStore()
const summary = ref({ total_with_appointments: 0, new_clients: 0, top_clients_count: 0 })
const items = ref([])
const period = computed(() => {
  const values = (Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]).map((v) => toDate(v)).filter(Boolean).sort()
  if (!values.length) return { from: monthRange()[0], to: monthRange()[1] }
  if (values.length === 1) return { from: values[0], to: values[0] }
  return { from: values[0], to: values[values.length - 1] }
})

const periodLabel = computed(() => buildPeriodLabel(period.value.from, period.value.to))
const summaryRows = computed(() => [
  { label: 'Com agendamentos', value: summary.value.total_with_appointments },
  { label: 'Novos clientes', value: summary.value.new_clients },
  { label: 'Top listados', value: summary.value.top_clients_count },
])

const sections = computed(() => [
  {
    title: 'Ranking de clientes',
    columns: [
      { label: 'Cliente', key: 'name', width: 30 },
      { label: 'Concluídos', key: 'appointments_done', width: 14 },
      { label: 'Total gasto', width: 18, value: (row) => formatCurrencyBRL(row.total_spent) },
      { label: 'Último atendimento', width: 22, value: (row) => formatDateTime(row.last_appointment_at) },
    ],
    rows: items.value,
  },
])

const reportFileName = computed(() => `relatorio_clientes_${period.value.from}_${period.value.to}`)

const downloadExcel = async () => {
  try {
    await exportReportToExcel({
      fileName: reportFileName.value,
      title: 'Relatório de Clientes',
      periodLabel: periodLabel.value,
      summary: summaryRows.value,
      sections: sections.value,
    })
  } catch (error) {
    alerts.error(error?.message || 'Não foi possível exportar o relatório em Excel.')
  }
}

const downloadPdf = async () => {
  try {
    await exportReportToPdf({
      fileName: reportFileName.value,
      title: 'Relatório de Clientes',
      periodLabel: periodLabel.value,
      summary: summaryRows.value,
      sections: sections.value,
    })
  } catch (error) {
    alerts.error(error?.message || 'Não foi possível exportar o relatório em PDF.')
  }
}

const loadReport = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ from: period.value.from, to: period.value.to })
    if (search.value.trim()) params.set('search', search.value.trim())
    if (minSpent.value !== null && minSpent.value !== '' && Number(minSpent.value) > 0) params.set('min_spent', String(minSpent.value))
    const { data } = await api.get(`/api/reports/clients?${params.toString()}`)
    summary.value = data?.summary || summary.value
    items.value = Array.isArray(data?.items) ? data.items : []
  } finally { loading.value = false }
}
onMounted(loadReport)
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.toolbar-field {
  flex: 1 1 240px;
  min-width: 220px;
  max-width: 100%;
}

.toolbar-btn {
  height: 40px;
}

@media (max-width: 720px) {
  .toolbar {
    align-items: stretch;
  }

  .toolbar-field {
    flex-basis: 100%;
    min-width: 0;
  }
}

.chips-row { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
