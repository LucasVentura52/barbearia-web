<template>
  <v-container>
    <div class="section-title"><h2>Relatório Financeiro</h2></div>
    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-date-input v-model="dateRange" label="Período" multiple="range" hide-details />
        <v-btn color="secondary" :loading="loading" @click="loadReport">Atualizar</v-btn>
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
const pad = (v) => String(v).padStart(2, '0')
const toDate = (value) => { if (!value) return ''; if (typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return value; const d = value instanceof Date ? value : new Date(value); if (Number.isNaN(d.getTime())) return ''; return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const monthRange = () => { const now = new Date(); return [toDate(new Date(now.getFullYear(), now.getMonth(), 1)), toDate(new Date(now.getFullYear(), now.getMonth()+1, 0))] }
const dateRange = ref(monthRange())
const loading = ref(false)
const summary = ref({ revenue_expected: 0, revenue_realized: 0, revenue_canceled: 0, services_revenue_realized: 0, products_revenue_realized: 0, receivable: 0, average_ticket_done: 0 })
const daily = ref([])
const period = computed(() => { const values = (Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]).map((v) => toDate(v)).filter(Boolean).sort(); if (!values.length) return { from: monthRange()[0], to: monthRange()[1] }; if (values.length === 1) return { from: values[0], to: values[0] }; return { from: values[0], to: values[values.length-1] } })
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
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.chips-row { display: flex; gap: 8px; flex-wrap: wrap; }
.card-label { font-size: .84rem; color: rgba(66,84,97,.74); margin-bottom: 6px; }
.card-value { font-size: 1.35rem; font-weight: 700; color: #2c4552; }
</style>
