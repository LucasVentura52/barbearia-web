<template>
  <v-container>
    <div class="section-title"><h2>Relatório de Agendamentos</h2></div>
    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-date-input v-model="dateRange" label="Período" multiple="range" hide-details />
        <v-select v-model="status" :items="statusOptions" item-title="label" item-value="value" label="Status" variant="outlined" density="compact" hide-details />
        <v-text-field v-model="search" label="Buscar cliente/colaborador" variant="outlined" density="compact" hide-details />
        <v-btn color="secondary" :loading="loading" @click="loadReport">Atualizar</v-btn>
        <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" :disabled="loading" @click="downloadExcel">
          Excel
        </v-btn>
        <v-btn color="error" variant="tonal" prepend-icon="mdi-file-pdf-box" :disabled="loading" @click="downloadPdf">
          PDF
        </v-btn>
      </v-card-text>
    </v-card>
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-text class="chips-row">
        <v-chip color="secondary" variant="tonal">Total: {{ summary.total }}</v-chip>
        <v-chip color="primary" variant="tonal">Agendados: {{ summary.scheduled }}</v-chip>
        <v-chip color="success" variant="tonal">Concluídos: {{ summary.done }}</v-chip>
        <v-chip color="warning" variant="tonal">Cancelados: {{ summary.canceled }}</v-chip>
        <v-chip color="error" variant="tonal">No-show: {{ summary.no_show }}</v-chip>
      </v-card-text>
    </v-card>
    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <v-table>
          <thead><tr><th>Data</th><th>Cliente</th><th>Colaborador</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ formatDateTime(item.start_at) }}</td>
              <td>{{ item.client?.name || '—' }}</td>
              <td>{{ item.staff?.name || '—' }}</td>
              <td>{{ statusLabel(item.status) }}</td>
              <td>{{ formatCurrencyBRL(item.total_price) }}</td>
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
import { useAlertStore } from '@/stores/alerts'
import { buildPeriodLabel, exportReportToExcel, exportReportToPdf } from '@/lib/reportExport'
const pad = (v) => String(v).padStart(2, '0')
const toDate = (value) => { if (!value) return ''; if (typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return value; const d = value instanceof Date ? value : new Date(value); if (Number.isNaN(d.getTime())) return ''; return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const formatDateTime = (value) => { const d = new Date(value); if (Number.isNaN(d.getTime())) return '--'; return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
const statusLabel = (status) => ({ scheduled: 'Agendado', done: 'Finalizado', canceled: 'Cancelado', no_show: 'Não compareceu' }[status] || status)
const monthRange = () => { const now = new Date(); return [toDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate(new Date(now.getFullYear(), now.getMonth()+1, 0))] }
const dateRange = ref(monthRange())
const status = ref('all')
const search = ref('')
const statusOptions = [{ label: 'Todos', value: 'all' }, { label: 'Agendado', value: 'scheduled' }, { label: 'Finalizado', value: 'done' }, { label: 'Cancelado', value: 'canceled' }, { label: 'Não compareceu', value: 'no_show' }]
const loading = ref(false)
const alerts = useAlertStore()
const summary = ref({ total: 0, scheduled: 0, done: 0, canceled: 0, no_show: 0 })
const items = ref([])
const period = computed(() => { const values = (Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]).map((v) => toDate(v)).filter(Boolean).sort(); if (!values.length) return { from: monthRange()[0], to: monthRange()[1] }; if (values.length === 1) return { from: values[0], to: values[0] }; return { from: values[0], to: values[values.length-1] } })

const periodLabel = computed(() => buildPeriodLabel(period.value.from, period.value.to))
const summaryRows = computed(() => [
  { label: 'Total', value: summary.value.total },
  { label: 'Agendados', value: summary.value.scheduled },
  { label: 'Concluídos', value: summary.value.done },
  { label: 'Cancelados', value: summary.value.canceled },
  { label: 'Não compareceu', value: summary.value.no_show },
])

const sections = computed(() => [
  {
    title: 'Lista de agendamentos',
    columns: [
      { label: 'Data', width: 22, value: (row) => formatDateTime(row.start_at) },
      { label: 'Cliente', width: 24, value: (row) => row.client?.name || '—' },
      { label: 'Colaborador', width: 24, value: (row) => row.staff?.name || '—' },
      { label: 'Status', width: 16, value: (row) => statusLabel(row.status) },
      { label: 'Total', width: 16, value: (row) => formatCurrencyBRL(row.total_price) },
    ],
    rows: items.value,
  },
])

const reportFileName = computed(() => `relatorio_agendamentos_${period.value.from}_${period.value.to}`)

const downloadExcel = async () => {
  try {
    await exportReportToExcel({
      fileName: reportFileName.value,
      title: 'Relatório de Agendamentos',
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
      title: 'Relatório de Agendamentos',
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
    const params = new URLSearchParams({ from: period.value.from, to: period.value.to, status: status.value })
    if (search.value.trim()) params.set('search', search.value.trim())
    const { data } = await api.get(`/api/reports/appointments?${params.toString()}`)
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
