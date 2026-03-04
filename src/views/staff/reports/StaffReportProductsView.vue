<template>
  <v-container>
    <div class="section-title"><h2>Relatório de Produtos</h2></div>
    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-date-input v-model="dateRange" label="Período" multiple="range" hide-details />
        <v-text-field v-model="search" label="Buscar produto" variant="outlined" density="compact" hide-details />
        <v-select v-model="stockFilter" :items="stockFilterOptions" item-title="label" item-value="value" label="Filtro de estoque" variant="outlined" density="compact" hide-details />
        <v-btn color="secondary" :loading="loading" @click="loadReport">Atualizar</v-btn>
        <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel" :disabled="loading" @click="downloadExcel">
          Excel
        </v-btn>
        <v-btn color="error" variant="tonal" prepend-icon="mdi-file-pdf-box" :disabled="loading" @click="downloadPdf">
          PDF
        </v-btn>
      </v-card-text>
    </v-card>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="chips-row mb-3">
              <v-chip color="secondary" variant="tonal">Controlados: {{ summary.tracked_products }}</v-chip>
              <v-chip color="primary" variant="tonal">Unidades: {{ summary.total_units }}</v-chip>
              <v-chip color="warning" variant="tonal">Baixo: {{ summary.low_stock }}</v-chip>
              <v-chip color="error" variant="tonal">Sem estoque: {{ summary.out_of_stock }}</v-chip>
            </div>
            <div class="section-label">Top produtos vendidos</div>
            <v-table>
              <thead><tr><th>Produto</th><th>Qtd</th><th>Receita</th></tr></thead>
              <tbody>
                <tr v-for="item in sales" :key="item.id"><td>{{ item.name }}</td><td>{{ item.quantity }}</td><td>{{ formatCurrencyBRL(item.revenue) }}</td></tr>
                <tr v-if="!sales.length"><td colspan="3" class="text-muted">Sem vendas no período.</td></tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="section-label">Entradas de estoque</div>
            <div class="chips-row mb-3">
              <v-chip color="info" variant="tonal">Entradas: {{ stockEntriesSummary.entries_total }}</v-chip>
              <v-chip color="secondary" variant="tonal">Unidades: {{ stockEntriesSummary.quantity_total }}</v-chip>
              <v-chip color="primary" variant="tonal">Produtos: {{ stockEntriesSummary.products_total }}</v-chip>
            </div>
            <v-table class="mb-4">
              <thead><tr><th>Produto</th><th>Data</th><th>Fornecedor</th><th>Qtd</th><th>Responsável</th></tr></thead>
              <tbody>
                <tr v-for="entry in stockEntries" :key="entry.id">
                  <td>{{ entry.product_name }}</td>
                  <td>{{ formatDate(entry.entry_date) }}</td>
                  <td>{{ entry.supplier }}</td>
                  <td>{{ entry.quantity }}</td>
                  <td>{{ entry.created_by_name || 'Sistema' }}</td>
                </tr>
                <tr v-if="!stockEntries.length"><td colspan="5" class="text-muted">Sem entradas no período.</td></tr>
              </tbody>
            </v-table>

            <div class="section-label">Alertas de estoque</div>
            <v-table>
              <thead><tr><th>Produto</th><th>Estoque</th><th>Preço</th></tr></thead>
              <tbody>
                <tr v-for="item in stockAlerts" :key="item.id"><td>{{ item.name }}</td><td>{{ item.stock }}</td><td>{{ formatCurrencyBRL(item.price) }}</td></tr>
                <tr v-if="!stockAlerts.length"><td colspan="3" class="text-muted">Sem alertas.</td></tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
const monthRange = () => { const now = new Date(); return [toDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))] }
const dateRange = ref(monthRange())
const search = ref('')
const stockFilter = ref('all')
const stockFilterOptions = [{ label: 'Todos', value: 'all' }, { label: 'Baixo', value: 'low' }, { label: 'Sem estoque', value: 'out' }]
const loading = ref(false)
const alerts = useAlertStore()
const summary = ref({ tracked_products: 0, total_units: 0, out_of_stock: 0, low_stock: 0 })
const sales = ref([])
const stockAlerts = ref([])
const emptyStockEntriesSummary = () => ({ entries_total: 0, quantity_total: 0, products_total: 0 })
const stockEntriesSummary = ref(emptyStockEntriesSummary())
const stockEntries = ref([])
const period = computed(() => {
  const values = (Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]).map((v) => toDate(v)).filter(Boolean).sort()
  if (!values.length) return { from: monthRange()[0], to: monthRange()[1] }
  if (values.length === 1) return { from: values[0], to: values[0] }
  return { from: values[0], to: values[values.length - 1] }
})

const periodLabel = computed(() => buildPeriodLabel(period.value.from, period.value.to))
const summaryRows = computed(() => [
  { label: 'Produtos controlados', value: summary.value.tracked_products },
  { label: 'Unidades em estoque', value: summary.value.total_units },
  { label: 'Baixo estoque', value: summary.value.low_stock },
  { label: 'Sem estoque', value: summary.value.out_of_stock },
  { label: 'Entradas no período', value: stockEntriesSummary.value.entries_total },
  { label: 'Unidades de entrada', value: stockEntriesSummary.value.quantity_total },
])

const sections = computed(() => [
  {
    title: 'Top produtos vendidos',
    columns: [
      { label: 'Produto', key: 'name', width: 30 },
      { label: 'Quantidade', key: 'quantity', width: 14 },
      { label: 'Receita', width: 16, value: (row) => formatCurrencyBRL(row.revenue) },
    ],
    rows: sales.value,
  },
  {
    title: 'Entradas de estoque',
    columns: [
      { label: 'Produto', key: 'product_name', width: 28 },
      { label: 'Data', width: 14, value: (row) => formatDate(row.entry_date) },
      { label: 'Fornecedor', key: 'supplier', width: 24 },
      { label: 'Quantidade', key: 'quantity', width: 12 },
      { label: 'Responsável', width: 20, value: (row) => row.created_by_name || 'Sistema' },
    ],
    rows: stockEntries.value,
  },
  {
    title: 'Alertas de estoque',
    columns: [
      { label: 'Produto', key: 'name', width: 28 },
      { label: 'Estoque', key: 'stock', width: 12 },
      { label: 'Preço', width: 14, value: (row) => formatCurrencyBRL(row.price) },
    ],
    rows: stockAlerts.value,
  },
])

const reportFileName = computed(() => `relatorio_produtos_${period.value.from}_${period.value.to}`)

const downloadExcel = async () => {
  try {
    await exportReportToExcel({
      fileName: reportFileName.value,
      title: 'Relatório de Produtos',
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
      title: 'Relatório de Produtos',
      periodLabel: periodLabel.value,
      summary: summaryRows.value,
      sections: sections.value,
    })
  } catch (error) {
    alerts.error(error?.message || 'Não foi possível exportar o relatório em PDF.')
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('pt-BR')
}
const loadReport = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ from: period.value.from, to: period.value.to, stock_filter: stockFilter.value })
    if (search.value.trim()) params.set('search', search.value.trim())
    const { data } = await api.get(`/api/reports/products?${params.toString()}`)
    summary.value = data?.summary || summary.value
    sales.value = Array.isArray(data?.sales?.items) ? data.sales.items : []
    stockAlerts.value = Array.isArray(data?.stock_alerts?.items) ? data.stock_alerts.items : []
    stockEntriesSummary.value = data?.stock_entries?.summary || emptyStockEntriesSummary()
    stockEntries.value = Array.isArray(data?.stock_entries?.items) ? data.stock_entries.items : []
  } finally { loading.value = false }
}
onMounted(loadReport)
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.chips-row { display: flex; gap: 8px; flex-wrap: wrap; }
.section-label { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.14em; color: rgba(66,84,97,.74); margin-bottom: 10px; }
</style>
