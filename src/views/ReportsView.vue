<template>
  <div class="d-flex flex-column ga-6">
    <v-card class="glass-panel">
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal">
            <v-icon icon="mdi-tune-variant" />
          </v-avatar>
        </template>
        <v-card-title>Filtros do relatório</v-card-title>
        <v-card-subtitle>Os mesmos filtros alimentam os endpoints reais de relatório.</v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-date-input v-model="filters.from" label="De" />
          </v-col>
          <v-col cols="12" md="3">
            <v-date-input v-model="filters.to" label="Até" />
          </v-col>
          <v-col v-if="canFilterStaff" cols="12" md="3">
            <v-select
              v-model="filters.staffId"
              :items="staffOptions"
              item-title="title"
              item-value="value"
              label="Profissional"
            />
          </v-col>
          <v-col v-if="showSearch" cols="12" md="3">
            <v-text-field v-model="filters.search" label="Buscar" prepend-inner-icon="mdi-magnify" />
          </v-col>
          <v-col v-if="activeTab === 'appointments'" cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Status"
            />
          </v-col>
          <v-col v-if="activeTab === 'products'" cols="12" md="3">
            <v-select
              v-model="filters.stockFilter"
              :items="stockFilterOptions"
              item-title="title"
              item-value="value"
              label="Estoque"
            />
          </v-col>
          <v-col v-if="activeTab === 'clients'" cols="12" md="3">
            <v-text-field v-model="filters.minSpent" label="Gasto mínimo" type="number" />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-end">
            <v-btn color="secondary" block :loading="loading" @click="loadReport">
              Atualizar relatório
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="glass-panel">
      <v-card-text>
        <v-tabs v-model="activeTab" color="secondary">
          <v-tab value="appointments">Agendamentos</v-tab>
          <v-tab value="financial">Financeiro</v-tab>
          <v-tab value="clients">Clientes</v-tab>
          <v-tab value="collaborators">Colaboradores</v-tab>
          <v-tab value="products">Produtos</v-tab>
        </v-tabs>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col v-for="metric in metrics" :key="metric.title" cols="12" md="6" xl="3">
        <metric-card v-bind="metric" />
      </v-col>
    </v-row>

    <v-card class="glass-panel">
      <v-card-item>
        <template #prepend>
          <v-avatar color="primary" variant="tonal">
            <v-icon icon="mdi-table-search" />
          </v-avatar>
        </template>
        <v-card-title>{{ activeSectionTitle }}</v-card-title>
        <v-card-subtitle>{{ activeSectionSubtitle }}</v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <template v-if="activeTab === 'appointments'">
          <v-table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Profissional</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.items || []" :key="item.id">
                <td>{{ formatDateTime(item.start_at) }}</td>
                <td>{{ item.client?.name || '—' }}</td>
                <td>{{ item.staff?.name || '—' }}</td>
                <td>{{ statusLabel(item.status) }}</td>
                <td>{{ formatCurrencyBRL(item.total_price) }}</td>
              </tr>
              <tr v-if="!(report.items || []).length">
                <td colspan="5" class="text-medium-emphasis">Sem dados no período.</td>
              </tr>
            </tbody>
          </v-table>
        </template>

        <template v-else-if="activeTab === 'financial'">
          <v-table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Agendamentos</th>
                <th>Previsto</th>
                <th>Realizado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.daily || []" :key="item.date">
                <td>{{ formatDate(item.date) }}</td>
                <td>{{ item.appointments_total }}</td>
                <td>{{ formatCurrencyBRL(item.revenue_expected) }}</td>
                <td>{{ formatCurrencyBRL(item.revenue_realized) }}</td>
              </tr>
              <tr v-if="!(report.daily || []).length">
                <td colspan="4" class="text-medium-emphasis">Sem dados no período.</td>
              </tr>
            </tbody>
          </v-table>
        </template>

        <template v-else-if="activeTab === 'clients'">
          <v-table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Concluídos</th>
                <th>Total gasto</th>
                <th>Último atendimento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.items || []" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.appointments_done }}</td>
                <td>{{ formatCurrencyBRL(item.total_spent) }}</td>
                <td>{{ formatDateTime(item.last_appointment_at) }}</td>
              </tr>
              <tr v-if="!(report.items || []).length">
                <td colspan="4" class="text-medium-emphasis">Sem dados no período.</td>
              </tr>
            </tbody>
          </v-table>
        </template>

        <template v-else-if="activeTab === 'collaborators'">
          <v-table>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Agendamentos</th>
                <th>Concluídos</th>
                <th>Receita realizada</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in report.items || []" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.appointments_total }}</td>
                <td>{{ item.done_count }}</td>
                <td>{{ formatCurrencyBRL(item.revenue_realized) }}</td>
              </tr>
              <tr v-if="!(report.items || []).length">
                <td colspan="4" class="text-medium-emphasis">Sem dados no período.</td>
              </tr>
            </tbody>
          </v-table>
        </template>

        <template v-else>
          <div class="d-flex flex-column ga-6">
            <div>
              <div class="text-subtitle-1 font-weight-bold mb-3">Vendas de produtos</div>
              <v-table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Receita</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in report.sales?.items || []" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatCurrencyBRL(item.revenue) }}</td>
                  </tr>
                  <tr v-if="!(report.sales?.items || []).length">
                    <td colspan="3" class="text-medium-emphasis">Sem vendas no período.</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <div>
              <div class="text-subtitle-1 font-weight-bold mb-3">Alertas de estoque</div>
              <v-table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Estoque</th>
                    <th>Preço</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in report.stock_alerts?.items || []" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.stock }}</td>
                    <td>{{ formatCurrencyBRL(item.price) }}</td>
                  </tr>
                  <tr v-if="!(report.stock_alerts?.items || []).length">
                    <td colspan="3" class="text-medium-emphasis">Sem alertas para o filtro atual.</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatDate, formatDateTime, toApiDate } from '@/lib/dates'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const activeTab = ref('appointments')
const report = ref({})
const staff = ref([])
const filters = ref({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  to: new Date(),
  staffId: null,
  search: '',
  status: 'all',
  stockFilter: 'all',
  minSpent: '',
})

const canFilterStaff = computed(() => auth.user?.role === 'admin')
const showSearch = computed(() => ['appointments', 'clients', 'collaborators', 'products'].includes(activeTab.value))
const staffOptions = computed(() => [
  { title: 'Toda a equipe', value: null },
  ...staff.value.map((item) => ({ title: item.name, value: item.id })),
])

const statusOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'Agendado', value: 'scheduled' },
  { title: 'Finalizado', value: 'done' },
  { title: 'Cancelado', value: 'canceled' },
  { title: 'Não compareceu', value: 'no_show' },
]

const stockFilterOptions = [
  { title: 'Todos', value: 'all' },
  { title: 'Baixo estoque', value: 'low' },
  { title: 'Sem estoque', value: 'out' },
]

const statusLabel = (status) => ({
  scheduled: 'Agendado',
  done: 'Finalizado',
  canceled: 'Cancelado',
  no_show: 'Não compareceu',
}[status] || status)

const clampPercentage = (value) => Math.max(0, Math.min(100, Math.round(Number(value || 0))))
const percentLabel = (value) => `${clampPercentage(value)}%`

const activeSectionTitle = computed(() => ({
  appointments: 'Lista de agendamentos',
  financial: 'Consolidado financeiro diário',
  clients: 'Clientes do período',
  collaborators: 'Performance de colaboradores',
  products: 'Produtos e alertas de estoque',
}[activeTab.value]))

const activeSectionSubtitle = computed(() => ({
  appointments: 'Dados vindos de `/api/reports/appointments`.',
  financial: 'Dados vindos de `/api/reports/financial`.',
  clients: 'Dados vindos de `/api/reports/clients`.',
  collaborators: 'Dados vindos de `/api/reports/collaborators`.',
  products: 'Dados vindos de `/api/reports/products`.',
}[activeTab.value]))

const metrics = computed(() => {
  if (activeTab.value === 'appointments') {
    const summary = report.value.summary || {}
    return [
      { title: 'Total', value: `${summary.total || 0}`, subtitle: 'Agendamentos no período', icon: 'mdi-calendar-multiple', color: 'primary', progress: clampPercentage(summary.total) },
      { title: 'Concluídos', value: `${summary.done || 0}`, subtitle: `Presença ${percentLabel(summary.attendance_rate)}`, icon: 'mdi-check-circle-outline', color: 'success', progress: clampPercentage(summary.attendance_rate) },
      { title: 'Cancelados', value: `${summary.canceled || 0}`, subtitle: `Taxa ${percentLabel(summary.cancel_rate)}`, icon: 'mdi-cancel', color: 'warning', progress: clampPercentage(summary.cancel_rate) },
      { title: 'No-show', value: `${summary.no_show || 0}`, subtitle: `Taxa ${percentLabel(summary.no_show_rate)}`, icon: 'mdi-account-off-outline', color: 'error', progress: clampPercentage(summary.no_show_rate) },
    ]
  }

  if (activeTab.value === 'financial') {
    const summary = report.value.summary || {}
    return [
      { title: 'Receita prevista', value: formatCurrencyBRL(summary.revenue_expected), subtitle: 'Agendados + concluídos', icon: 'mdi-cash-multiple', color: 'secondary', progress: clampPercentage(summary.revenue_expected / 100) },
      { title: 'Receita realizada', value: formatCurrencyBRL(summary.revenue_realized), subtitle: 'Somente concluídos', icon: 'mdi-cash-check', color: 'success', progress: clampPercentage(summary.revenue_realized / 100) },
      { title: 'A receber', value: formatCurrencyBRL(summary.receivable), subtitle: 'Gap do período', icon: 'mdi-cash-clock', color: 'warning', progress: clampPercentage(summary.receivable / 100) },
      { title: 'Ticket médio', value: formatCurrencyBRL(summary.average_ticket_done), subtitle: 'Base de atendimentos concluídos', icon: 'mdi-chart-box-outline', color: 'primary', progress: clampPercentage(summary.average_ticket_done / 2) },
    ]
  }

  if (activeTab.value === 'clients') {
    const summary = report.value.summary || {}
    return [
      { title: 'Clientes com atendimento', value: `${summary.total_with_appointments || 0}`, subtitle: 'No período', icon: 'mdi-account-group-outline', color: 'primary', progress: clampPercentage(summary.total_with_appointments) },
      { title: 'Novos clientes', value: `${summary.new_clients || 0}`, subtitle: 'Criados no período', icon: 'mdi-account-plus-outline', color: 'success', progress: clampPercentage(summary.new_clients * 10) },
      { title: 'Top clientes', value: `${summary.top_clients_count || 0}`, subtitle: 'Ordenados por gasto total', icon: 'mdi-trophy-outline', color: 'secondary', progress: clampPercentage(summary.top_clients_count * 5) },
    ]
  }

  if (activeTab.value === 'collaborators') {
    const summary = report.value.summary || {}
    return [
      { title: 'Equipe no relatório', value: `${summary.staff_total || 0}`, subtitle: 'Colaboradores encontrados', icon: 'mdi-account-tie-outline', color: 'primary', progress: clampPercentage(summary.staff_total * 10) },
      { title: 'Agendamentos', value: `${summary.appointments_total || 0}`, subtitle: 'Volume consolidado', icon: 'mdi-calendar-clock-outline', color: 'secondary', progress: clampPercentage(summary.appointments_total) },
      { title: 'Concluídos', value: `${summary.done_total || 0}`, subtitle: 'Atendimentos finalizados', icon: 'mdi-check-circle-outline', color: 'success', progress: clampPercentage(summary.done_total) },
      { title: 'Receita', value: formatCurrencyBRL(summary.revenue_realized_total), subtitle: 'Receita realizada pela equipe', icon: 'mdi-currency-brl', color: 'accent', progress: clampPercentage(summary.revenue_realized_total / 100) },
    ]
  }

  const summary = report.value.summary || {}
  const stockEntriesSummary = report.value.stock_entries?.summary || {}
  return [
    { title: 'Produtos monitorados', value: `${summary.tracked_products || 0}`, subtitle: 'Itens ativos com estoque', icon: 'mdi-package-variant-closed', color: 'primary', progress: clampPercentage(summary.tracked_products * 2) },
    { title: 'Sem estoque', value: `${summary.out_of_stock || 0}`, subtitle: 'Reposição urgente', icon: 'mdi-alert-outline', color: 'error', progress: clampPercentage(summary.out_of_stock * 20) },
    { title: 'Baixo estoque', value: `${summary.low_stock || 0}`, subtitle: 'Até 5 unidades', icon: 'mdi-alert-circle-outline', color: 'warning', progress: clampPercentage(summary.low_stock * 12) },
    { title: 'Entradas', value: `${stockEntriesSummary.entries_total || 0}`, subtitle: `${stockEntriesSummary.quantity_total || 0} unidades`, icon: 'mdi-truck-delivery-outline', color: 'secondary', progress: clampPercentage(stockEntriesSummary.entries_total * 10) },
  ]
})

const loadStaff = async () => {
  if (!canFilterStaff.value) return
  const { data } = await api.get('/api/staff', { params: { limit: 200 } })
  staff.value = Array.isArray(data) ? data : []
}

const loadReport = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      from: toApiDate(filters.value.from),
      to: toApiDate(filters.value.to),
    })

    if (filters.value.staffId) {
      params.append('staff_id', String(filters.value.staffId))
    }

    if (showSearch.value && filters.value.search.trim()) {
      params.append('search', filters.value.search.trim())
    }

    if (activeTab.value === 'appointments') {
      params.append('status', filters.value.status)
    }

    if (activeTab.value === 'products') {
      params.append('stock_filter', filters.value.stockFilter)
    }

    if (activeTab.value === 'clients' && filters.value.minSpent) {
      params.append('min_spent', String(filters.value.minSpent))
    }

    const endpointMap = {
      appointments: '/api/reports/appointments',
      financial: '/api/reports/financial',
      clients: '/api/reports/clients',
      collaborators: '/api/reports/collaborators',
      products: '/api/reports/products',
    }

    const { data } = await api.get(`${endpointMap[activeTab.value]}?${params.toString()}`)
    report.value = data || {}
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => {
  loadReport()
})

onMounted(async () => {
  await loadStaff()
  await loadReport()
})
</script>
