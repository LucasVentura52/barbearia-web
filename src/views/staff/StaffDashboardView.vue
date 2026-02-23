<template>
  <v-container>
    <div class="section-title">
      <h2>Dashboard do colaborador</h2>
    </div>

    <v-card class="staff-toolbar-card pb-4" elevation="0">
      <v-card-text class="dashboard-toolbar">
        <v-date-input
          v-model="dateRange"
          label="Período"
          multiple="range"
          hide-details
          class="dashboard-date"
        />
        <v-chip color="secondary" variant="tonal" prepend-icon="mdi-calendar-range">
          {{ periodLabel }}
        </v-chip>
        <v-btn color="secondary" size="large" :block="smAndDown" @click="loadDashboard" :loading="loading">
          Atualizar
        </v-btn>
      </v-card-text>
    </v-card>

    <v-row class="mb-2">
      <v-col cols="12" md="3">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Agendamentos</div>
            <div class="card-value">{{ totals.appointments_total }}</div>
            <div class="card-meta">Total do período</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Receita realizada</div>
            <div class="card-value">{{ formatCurrencyBRL(totals.revenue_realized) }}</div>
            <div class="card-meta">Somente finalizados</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Receita prevista</div>
            <div class="card-value">{{ formatCurrencyBRL(totals.revenue_expected) }}</div>
            <div class="card-meta">Agendados + finalizados</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Ticket médio real</div>
            <div class="card-value">{{ formatCurrencyBRL(totals.average_ticket_done) }}</div>
            <div class="card-meta">Receita realizada por atendimento finalizado</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-2">
      <v-col cols="12" md="4">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Taxa de comparecimento</div>
            <div class="card-value">{{ formatPercent(totals.attendance_rate) }}</div>
            <div class="card-meta">Finalizados / (finalizados + não compareceu)</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Taxa de cancelamento</div>
            <div class="card-value">{{ formatPercent(totals.cancel_rate) }}</div>
            <div class="card-meta">Cancelados / total de agendamentos</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card dashboard-card" elevation="0">
          <v-card-text>
            <div class="card-label">Status</div>
            <div class="status-badges">
              <v-chip size="small" color="primary" variant="tonal">Agendados {{ statusCount('scheduled') }}</v-chip>
              <v-chip size="small" color="success" variant="tonal">Finalizados {{ statusCount('done') }}</v-chip>
              <v-chip size="small" color="error" variant="tonal">Cancelados {{ statusCount('canceled') }}</v-chip>
              <v-chip size="small" color="warning" variant="tonal">Não compareceu {{ statusCount('no_show') }}</v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-2">
      <v-col cols="12">
        <v-card class="glass-card chart-card" elevation="0">
          <v-card-text>
            <div class="section-label">Evolução diária</div>
            <div class="chart-shell">
              <canvas v-if="hasDailyData" ref="dailyChartCanvas"></canvas>
              <div v-else class="chart-empty text-muted">Sem dados diários no período.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <v-card class="glass-card chart-card" elevation="0">
          <v-card-text>
            <div class="section-label">Distribuição de status</div>
            <div class="chart-shell">
              <canvas v-if="hasStatusData" ref="statusChartCanvas"></canvas>
              <div v-else class="chart-empty text-muted">Sem dados de status no período.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="glass-card chart-card" elevation="0">
          <v-card-text>
            <div class="section-label">Top serviços</div>
            <div class="chart-shell">
              <canvas v-if="hasTopServicesData" ref="topServicesChartCanvas"></canvas>
              <div v-else class="chart-empty text-muted">Sem dados de serviços no período.</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="section-label">Próximos agendamentos</div>
            <div v-if="nextAppointments.length" class="list-grid">
              <div class="list-item" v-for="appointment in nextAppointments" :key="appointment.id">
                <div>
                  <div class="list-title">{{ appointment.client?.name || 'Cliente' }}</div>
                  <div class="text-muted">
                    {{ formatDateTime(appointment.start_at) }} · {{ appointment.services.map((s) => s.name).join(', ') }}
                  </div>
                </div>
                <v-chip color="secondary" variant="tonal">{{ formatCurrencyBRL(appointment.total_price) }}</v-chip>
              </div>
            </div>
            <div v-else class="text-muted">Sem próximos agendamentos.</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="section-label">Resumo dos serviços</div>
            <div v-if="topServices.length" class="list-grid">
              <div class="list-item" v-for="service in topServices" :key="service.id">
                <div>
                  <div class="list-title">{{ service.name }}</div>
                  <div class="text-muted">{{ service.total }} vendas</div>
                </div>
                <v-icon icon="mdi-trending-up" color="secondary" />
              </div>
            </div>
            <div v-else class="text-muted">Sem dados para este período.</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'

Chart.register(
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
)

const statusLabelMap = {
  scheduled: 'Agendados',
  done: 'Finalizados',
  canceled: 'Cancelados',
  no_show: 'Não compareceu',
}

const statusColorMap = {
  scheduled: '#5B8C8F',
  done: '#6F917B',
  canceled: '#B37A7A',
  no_show: '#B99363',
}

const pad = (value) => String(value).padStart(2, '0')

const toLocalDateString = (value) => {
  if (!value) return ''

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const formatDateLabel = (value) => {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getCurrentMonthRange = () => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    from: toLocalDateString(monthStart),
    to: toLocalDateString(monthEnd),
  }
}

const currentMonthRange = getCurrentMonthRange()
const dateRange = ref([currentMonthRange.from, currentMonthRange.to])
const loading = ref(false)
const { smAndDown } = useDisplay()

const totals = ref({
  appointments_total: 0,
  appointments_by_status: {},
  revenue_total: 0,
  revenue_expected: 0,
  revenue_realized: 0,
  average_ticket_done: 0,
  attendance_rate: 0,
  cancel_rate: 0,
})
const daily = ref([])
const nextAppointments = ref([])
const topServices = ref([])

const dailyChartCanvas = ref(null)
const statusChartCanvas = ref(null)
const topServicesChartCanvas = ref(null)
let dailyChartInstance = null
let statusChartInstance = null
let topServicesChartInstance = null

const normalizedPeriod = computed(() => {
  const values = Array.isArray(dateRange.value) ? dateRange.value : [dateRange.value]
  const normalized = values
    .map((value) => toLocalDateString(value))
    .filter(Boolean)
    .sort()

  if (!normalized.length) {
    return { from: currentMonthRange.from, to: currentMonthRange.to }
  }

  if (normalized.length === 1) {
    return { from: normalized[0], to: normalized[0] }
  }

  return {
    from: normalized[0],
    to: normalized[normalized.length - 1],
  }
})

const periodLabel = computed(() => {
  const { from, to } = normalizedPeriod.value
  if (from === to) return formatDateLabel(from)
  return `${formatDateLabel(from)} - ${formatDateLabel(to)}`
})

const statusEntries = computed(() => {
  const order = ['scheduled', 'done', 'canceled', 'no_show']
  const entries = Object.entries(totals.value.appointments_by_status || {})
    .map(([status, total]) => ({
      status,
      total: Number(total || 0),
    }))
    .filter((item) => item.total > 0)

  return entries.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
})

const hasStatusData = computed(() => statusEntries.value.length > 0)
const hasDailyData = computed(() =>
  daily.value.some((item) => Number(item.appointments_total || 0) > 0 || Number(item.revenue_expected || 0) > 0)
)
const hasTopServicesData = computed(() => topServices.value.length > 0)

const destroyCharts = () => {
  if (dailyChartInstance) {
    dailyChartInstance.destroy()
    dailyChartInstance = null
  }

  if (statusChartInstance) {
    statusChartInstance.destroy()
    statusChartInstance = null
  }

  if (topServicesChartInstance) {
    topServicesChartInstance.destroy()
    topServicesChartInstance = null
  }
}

const renderStatusChart = () => {
  if (!statusChartCanvas.value || !hasStatusData.value) {
    if (statusChartInstance) {
      statusChartInstance.destroy()
      statusChartInstance = null
    }
    return
  }

  if (statusChartInstance) {
    statusChartInstance.destroy()
  }

  const labels = statusEntries.value.map((item) => statusLabelMap[item.status] || item.status)
  const data = statusEntries.value.map((item) => item.total)
  const colors = statusEntries.value.map((item) => statusColorMap[item.status] || '#8fb0b2')

  statusChartInstance = new Chart(statusChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#425763',
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            padding: 16,
          },
        },
      },
    },
  })
}

const renderTopServicesChart = () => {
  if (!topServicesChartCanvas.value || !hasTopServicesData.value) {
    if (topServicesChartInstance) {
      topServicesChartInstance.destroy()
      topServicesChartInstance = null
    }
    return
  }

  if (topServicesChartInstance) {
    topServicesChartInstance.destroy()
  }

  const labels = topServices.value.map((service) => service.name)
  const data = topServices.value.map((service) => Number(service.total || 0))

  topServicesChartInstance = new Chart(topServicesChartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Vendas',
          data,
          borderRadius: 8,
          borderSkipped: false,
          backgroundColor: '#5B8C8F',
          hoverBackgroundColor: '#4f7d80',
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#637b87',
          },
          grid: {
            color: 'rgba(87, 120, 132, 0.14)',
          },
        },
        y: {
          ticks: {
            color: '#425763',
          },
          grid: {
            display: false,
          },
        },
      },
    },
  })
}

const renderDailyChart = () => {
  if (!dailyChartCanvas.value || !hasDailyData.value) {
    if (dailyChartInstance) {
      dailyChartInstance.destroy()
      dailyChartInstance = null
    }
    return
  }

  if (dailyChartInstance) {
    dailyChartInstance.destroy()
  }

  const labels = daily.value.map((entry) =>
    new Date(`${entry.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  )
  const appointmentsData = daily.value.map((entry) => Number(entry.appointments_total || 0))
  const revenueExpectedData = daily.value.map((entry) => Number(entry.revenue_expected || 0))
  const revenueRealizedData = daily.value.map((entry) => Number(entry.revenue_realized || 0))

  dailyChartInstance = new Chart(dailyChartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Agendamentos',
          data: appointmentsData,
          yAxisID: 'y',
          borderColor: '#5B8C8F',
          backgroundColor: 'rgba(91, 140, 143, 0.2)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        },
        {
          label: 'Receita prevista',
          data: revenueExpectedData,
          yAxisID: 'y1',
          borderColor: '#8AAE88',
          backgroundColor: 'rgba(138, 174, 136, 0.18)',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
        },
        {
          label: 'Receita realizada',
          data: revenueRealizedData,
          yAxisID: 'y1',
          borderColor: '#2F7A4B',
          backgroundColor: 'rgba(47, 122, 75, 0.14)',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#425763',
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            padding: 16,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#637b87',
          },
          grid: {
            color: 'rgba(87, 120, 132, 0.12)',
          },
        },
        y: {
          position: 'left',
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#637b87',
          },
          grid: {
            color: 'rgba(87, 120, 132, 0.14)',
          },
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#637b87',
            callback: (value) => formatCurrencyBRL(value),
          },
        },
      },
    },
  })
}

const syncCharts = async () => {
  await nextTick()
  renderDailyChart()
  renderStatusChart()
  renderTopServicesChart()
}

const loadDashboard = async () => {
  loading.value = true
  try {
    const { from, to } = normalizedPeriod.value
    const { data } = await api.get('/api/dashboard', {
      params: { from, to },
    })

    totals.value = data.totals
    daily.value = Array.isArray(data.daily) ? data.daily : []
    nextAppointments.value = data.next_appointments
    topServices.value = data.top_services

    await syncCharts()
  } finally {
    loading.value = false
  }
}

const statusCount = (status) => totals.value.appointments_by_status?.[status] || 0
const formatPercent = (value) => `${Number(value || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})}%`

const formatDateTime = (value) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

onMounted(loadDashboard)
onBeforeUnmount(destroyCharts)
</script>

<style scoped>
.dashboard-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.dashboard-date {
  min-width: 290px;
}

.dashboard-toolbar :deep(.v-btn) {
  height: 40px;
}

.dashboard-card {
  height: 100%;
}

.chart-card {
  height: 100%;
}

.chart-shell {
  margin-top: 12px;
  height: 290px;
  position: relative;
}

.chart-empty {
  height: 290px;
  display: grid;
  place-items: center;
}

.card-label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: rgba(35, 58, 74, 0.6);
}

.card-value {
  font-family: var(--display-font);
  font-size: 2rem;
  margin: 8px 0;
}

.card-meta {
  color: rgba(35, 58, 74, 0.6);
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.list-grid {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(35, 58, 74, 0.05);
  padding: 12px 14px;
  border-radius: 16px;
}

.list-title {
  font-weight: 600;
}

@media (max-width: 960px) {
  .dashboard-date {
    min-width: 0;
    width: 100%;
  }

  .chart-shell,
  .chart-empty {
    height: 250px;
  }
}
</style>
