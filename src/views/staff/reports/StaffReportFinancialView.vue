<template>
  <v-container>
    <div class="section-title"><h2>Relatório Financeiro</h2></div>
    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-date-input v-model="dateRange" label="Período" multiple="range" hide-details class="toolbar-field" />
        <v-btn color="secondary" :loading="loading" class="toolbar-btn" @click="loadReport">Atualizar</v-btn>
        <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" :disabled="loading" class="toolbar-btn" @click="downloadExcel">
          Excel
        </v-btn>
        <v-btn color="error" variant="tonal" prepend-icon="mdi-file-pdf-box" :disabled="loading" class="toolbar-btn" @click="downloadPdf">
          PDF
        </v-btn>
      </v-card-text>
    </v-card>
    <v-row class="mb-2">
      <v-col cols="12" md="3"><v-card class="glass-card" elevation="0"><v-card-text><div class="card-label">Receita prevista</div><div class="card-value">{{ formatCurrencyBRL(summary.revenue_expected) }}</div></v-card-text></v-card></v-col>
      <v-col cols="12" md="3"><v-card class="glass-card" elevation="0"><v-card-text><div class="card-label">Receita realizada</div><div class="card-value">{{ formatCurrencyBRL(summary.revenue_realized) }}</div></v-card-text></v-card></v-col>
      <v-col cols="12" md="3"><v-card class="glass-card" elevation="0"><v-card-text><div class="card-label">A receber</div><div class="card-value">{{ formatCurrencyBRL(summary.receivable) }}</div></v-card-text></v-card></v-col>
      <v-col cols="12" md="3"><v-card class="glass-card" elevation="0"><v-card-text><div class="card-label">Ticket médio</div><div class="card-value">{{ formatCurrencyBRL(summary.average_ticket_done) }}</div></v-card-text></v-card></v-col>
    </v-row>
    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <div class="chips-row mb-3">
          <v-chip color="secondary" variant="tonal">Serviços: {{ formatCurrencyBRL(summary.services_revenue_realized) }}</v-chip>
          <v-chip color="primary" variant="tonal">Produtos: {{ formatCurrencyBRL(summary.products_revenue_realized) }}</v-chip>
          <v-chip color="warning" variant="tonal">Cancelado: {{ formatCurrencyBRL(summary.revenue_canceled) }}</v-chip>
        </div>
        <v-table>
          <thead><tr><th>Data</th><th>Agendamentos</th><th>Previsto</th><th>Realizado</th></tr></thead>
          <tbody>
            <tr v-for="item in daily" :key="item.date">
              <td>{{ formatDate(item.date) }}</td>
              <td>{{ item.appointments_total }}</td>
              <td>{{ formatCurrencyBRL(item.revenue_expected) }}</td>
              <td>{{ formatCurrencyBRL(item.revenue_realized) }}</td>
            </tr>
            <tr v-if="!daily.length"><td colspan="4" class="text-muted">Sem dados no período.</td></tr>
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
const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const monthRange = () => { const now = new Date(); return [toDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate(new Date(now.getFullYear(), now.getMonth()+1, 0))] }
const dateRange = ref(monthRange())
const loading = ref(false)
const alerts = useAlertStore()
const summary = ref({ revenue_expected: 0, revenue_realized: 0, revenue_canceled: 0, services_revenue_realized: 0, products_revenue_realized: 0, receivable: 0, average_ticket_done: 0 })
const daily = ref([])
const period = computed(() => { const values = (Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]).map((v) => toDate(v)).filter(Boolean).sort(); if (!values.length) return { from: monthRange()[0], to: monthRange()[1] }; if (values.length === 1) return { from: values[0], to: values[0] }; return { from: values[0], to: values[values.length-1] } })

const periodLabel = computed(() => buildPeriodLabel(period.value.from, period.value.to))
const summaryRows = computed(() => [
  { label: 'Receita prevista', value: formatCurrencyBRL(summary.value.revenue_expected) },
  { label: 'Receita realizada', value: formatCurrencyBRL(summary.value.revenue_realized) },
  { label: 'A receber', value: formatCurrencyBRL(summary.value.receivable) },
  { label: 'Ticket médio', value: formatCurrencyBRL(summary.value.average_ticket_done) },
  { label: 'Serviços', value: formatCurrencyBRL(summary.value.services_revenue_realized) },
  { label: 'Produtos', value: formatCurrencyBRL(summary.value.products_revenue_realized) },
  { label: 'Cancelado', value: formatCurrencyBRL(summary.value.revenue_canceled) },
])

const sections = computed(() => [
  {
    title: 'Consolidado diário',
    columns: [
      { label: 'Data', width: 14, value: (row) => formatDate(row.date) },
      { label: 'Agendamentos', key: 'appointments_total', width: 14 },
      { label: 'Previsto', width: 16, value: (row) => formatCurrencyBRL(row.revenue_expected) },
      { label: 'Realizado', width: 16, value: (row) => formatCurrencyBRL(row.revenue_realized) },
    ],
    rows: daily.value,
  },
])

const reportFileName = computed(() => `relatorio_financeiro_${period.value.from}_${period.value.to}`)

const downloadExcel = async () => {
  try {
    await exportReportToExcel({
      fileName: reportFileName.value,
      title: 'Relatório Financeiro',
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
      title: 'Relatório Financeiro',
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
    const { data } = await api.get(`/api/reports/financial?from=${period.value.from}&to=${period.value.to}`)
    summary.value = data?.summary || summary.value
    daily.value = Array.isArray(data?.daily) ? data.daily : []
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
.card-label { font-size: .84rem; color: rgba(66,84,97,.74); margin-bottom: 6px; }
.card-value { font-size: 1.35rem; font-weight: 700; color: #2c4552; }
</style>
