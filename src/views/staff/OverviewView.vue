<template>
  <v-row class="mb-6">
    <v-col cols="12" lg="7">
      <v-sheet class="hero-panel pa-6">
        <div class="mini-kicker mb-3">Panorama real da operação</div>
        <div class="text-h3 font-weight-black mb-4">
          {{ currentCompanyName }}
        </div>
        <div class="text-body-1 mb-6 text-white">
          Leitura viva do backend: período, desempenho, próximos horários e itens mais vendidos.
        </div>

        <v-row class="mb-2">
          <v-col cols="12" sm="6">
            <v-date-input v-model="filters.from" label="De" class="hero-panel__field" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-date-input v-model="filters.to" label="Até" class="hero-panel__field" />
          </v-col>
          <v-col v-if="auth.isAdmin" cols="12" sm="8">
            <v-select
              v-model="filters.staffId"
              :items="staffOptions"
              item-title="title"
              item-value="value"
              label="Profissional"
              class="hero-panel__field"
            />
          </v-col>
          <v-col :cols="auth.isAdmin ? 12 : 12" :sm="auth.isAdmin ? 4 : 12" class="d-flex align-end mt-n3 mt-sm-0 mb-2 mb-ms-0">
            <v-btn color="secondary" size="large" block :loading="loading" @click="loadDashboard">
              Atualizar painel
            </v-btn>
          </v-col>
        </v-row>

        <div class="hero-chip-row">
          <v-chip class="hero-panel__chip" variant="flat">{{ periodLabel }}</v-chip>
          <v-chip class="hero-panel__chip" variant="flat">{{ nextAppointments.length }} próximos agendamentos</v-chip>
          <v-chip class="hero-panel__chip" variant="flat">{{ topServices.length }} serviços em destaque</v-chip>
        </div>
      </v-sheet>
    </v-col>

    <v-col cols="12" lg="5">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="accent" variant="tonal">
              <v-icon icon="mdi-timeline-clock-outline" />
            </v-avatar>
          </template>
          <v-card-title>Evolução do período</v-card-title>
          <v-card-subtitle>O backend já entrega a série diária consolidada.</v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-list v-if="daily.length" class="bg-transparent">
            <v-list-item
              v-for="item in daily"
              :key="item.date"
              :title="formatDate(item.date)"
              :subtitle="`${item.done_count} concluídos · ${item.scheduled_count} agendados`"
            >
              <template #append>
                <v-chip color="secondary" variant="tonal">
                  {{ formatCurrencyBRL(item.revenue_realized) }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else icon="mdi-chart-line" color="warning">
            Não há dados suficientes no período selecionado.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mb-6">
    <v-col v-for="metric in metrics" :key="metric.title" cols="12" md="6" xl="4">
      <metric-card v-bind="metric" />
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12" xl="8">
      <v-card class="glass-panel">
        <v-card-item>
          <template #prepend>
            <v-avatar color="primary" variant="tonal">
              <v-icon icon="mdi-layers-triple-outline" />
            </v-avatar>
          </template>
          <v-card-title>Leitura operacional</v-card-title>
          <v-card-subtitle>Próximos horários, serviços e produtos saindo melhor.</v-card-subtitle>
          <template #append>
            <v-tabs v-model="panel" align-tabs="end">
              <v-tab value="appointments">Agenda</v-tab>
              <v-tab value="services">Serviços</v-tab>
              <v-tab value="products">Produtos</v-tab>
            </v-tabs>
          </template>
        </v-card-item>

        <v-card-text>
          <v-window v-model="panel">
            <v-window-item value="appointments">
              <v-list v-if="nextAppointments.length" lines="two" class="bg-transparent">
                <v-list-item
                  v-for="appointment in nextAppointments"
                  :key="appointment.id"
                  :title="appointment.client?.name || 'Cliente'"
                  :subtitle="appointment.services?.map((service) => service.name).join(', ')"
                >
                  <template #prepend>
                    <v-chip color="primary" variant="tonal">{{ formatDateTime(appointment.start_at) }}</v-chip>
                  </template>
                  <template #append>
                    <v-chip color="secondary" variant="tonal">{{ formatCurrencyBRL(appointment.total_price) }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else icon="mdi-calendar-blank-outline" color="warning">
                Nenhum agendamento futuro encontrado para este contexto.
              </v-alert>
            </v-window-item>

            <v-window-item value="services">
              <v-list v-if="topServices.length" class="bg-transparent">
                <v-list-item
                  v-for="service in topServices"
                  :key="service.id"
                  :title="service.name"
                  :subtitle="`${service.total} vendas no período`"
                >
                  <template #append>
                    <v-chip color="success" variant="tonal">{{ service.total }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else icon="mdi-scissors-cutting" color="warning">
                Nenhum serviço apareceu no período.
              </v-alert>
            </v-window-item>

            <v-window-item value="products">
              <v-list v-if="topProducts.length" class="bg-transparent">
                <v-list-item
                  v-for="product in topProducts"
                  :key="product.id"
                  :title="product.name"
                  :subtitle="`${product.quantity} unidades vendidas`"
                >
                  <template #append>
                    <v-chip color="accent" variant="tonal">{{ formatCurrencyBRL(product.revenue) }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else icon="mdi-package-variant-closed" color="warning">
                Nenhum produto vendido no período.
              </v-alert>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" xl="4">
      <v-card class="glass-panel mb-6">
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-trophy-outline" />
            </v-avatar>
          </template>
          <v-card-title>Ranking da equipe</v-card-title>
          <v-card-subtitle>Baseado em agendamentos concluídos no período.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <v-list v-if="staffRanking.length" class="bg-transparent">
            <v-list-item
              v-for="(person, index) in staffRanking"
              :key="person.id"
              :title="`${index + 1}. ${person.name}`"
              :subtitle="`${person.done_count} agendamentos concluídos`"
            >
              <template #append>
                <v-chip color="secondary" variant="tonal">{{ person.done_count }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else icon="mdi-account-star-outline" color="warning">
            Sem ranking disponível para o filtro atual.
          </v-alert>
        </v-card-text>
      </v-card>

      <v-card class="glass-panel">
        <v-card-item>
          <template #prepend>
            <v-avatar color="success" variant="tonal">
              <v-icon icon="mdi-information-outline" />
            </v-avatar>
          </template>
          <v-card-title>Leituras úteis</v-card-title>
          <v-card-subtitle>Sem dado fabricado: tudo deriva do payload atual.</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-3">
          <v-alert icon="mdi-cash-multiple" color="secondary">
            Receita esperada: {{ formatCurrencyBRL(totals.revenue_expected) }}.
          </v-alert>
          <v-alert icon="mdi-account-check-outline" color="success">
            Taxa de presença: {{ percentLabel(totals.attendance_rate) }}.
          </v-alert>
          <v-alert icon="mdi-cancel" color="warning">
            Cancelamentos no período: {{ percentLabel(totals.cancel_rate) }}.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatDate, formatDateTime, toApiDate } from '@/lib/dates'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'

const auth = useAuthStore()
const company = useCompanyStore()

const today = new Date()
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(today.getDate() - 6)

const loading = ref(false)
const panel = ref('appointments')
const staff = ref([])
const dashboard = ref(null)
const filters = ref({
  from: sevenDaysAgo,
  to: today,
  staffId: null,
})

const clampPercentage = (value) => Math.max(0, Math.min(100, Math.round(Number(value || 0))))
const percentLabel = (value) => `${clampPercentage(value)}%`

const totals = computed(() => dashboard.value?.totals || {})
const daily = computed(() => dashboard.value?.daily || [])
const nextAppointments = computed(() => dashboard.value?.next_appointments || [])
const topServices = computed(() => dashboard.value?.top_services || [])
const topProducts = computed(() => dashboard.value?.top_products || [])
const staffRanking = computed(() => dashboard.value?.staff_ranking_done || [])
const currentCompanyName = computed(() => company.currentCompany?.name || auth.user?.company?.name || 'Empresa atual')
const periodLabel = computed(() => `${formatDate(filters.value.from)} a ${formatDate(filters.value.to)}`)

const metrics = computed(() => [
  {
    title: 'Receita prevista',
    value: formatCurrencyBRL(totals.value.revenue_expected),
    subtitle: 'Somando agendados e concluídos',
    icon: 'mdi-cash-multiple',
    color: 'secondary',
    progress: clampPercentage((Number(totals.value.revenue_realized || 0) / Math.max(Number(totals.value.revenue_expected || 1), 1)) * 100),
  },
  {
    title: 'Receita realizada',
    value: formatCurrencyBRL(totals.value.revenue_realized),
    subtitle: 'Valor já consolidado como concluído',
    icon: 'mdi-cash-check',
    color: 'success',
    progress: clampPercentage((Number(totals.value.done_count || 0) / Math.max(Number(totals.value.appointments_total || 1), 1)) * 100),
  },
  {
    title: 'Ticket médio',
    value: formatCurrencyBRL(totals.value.average_ticket_done),
    subtitle: `${totals.value.done_count || 0} concluídos`,
    icon: 'mdi-chart-box-outline',
    color: 'primary',
    progress: clampPercentage((Number(totals.value.average_ticket_done || 0) / 200) * 100),
  },
  {
    title: 'Taxa de presença',
    value: percentLabel(totals.value.attendance_rate),
    subtitle: 'Base entre concluídos e faltas',
    icon: 'mdi-account-check-outline',
    color: 'success',
    progress: clampPercentage(totals.value.attendance_rate),
  },
  {
    title: 'Taxa de cancelamento',
    value: percentLabel(totals.value.cancel_rate),
    subtitle: `${totals.value.canceled_count || 0} cancelados`,
    icon: 'mdi-cancel',
    color: 'warning',
    progress: clampPercentage(totals.value.cancel_rate),
  },
  {
    title: 'Produtos vendidos',
    value: `${totals.value.products_sold_quantity || 0}`,
    subtitle: formatCurrencyBRL(totals.value.products_revenue_realized),
    icon: 'mdi-package-variant-closed',
    color: 'accent',
    progress: clampPercentage((Number(totals.value.products_revenue_realized || 0) / 1000) * 100),
  },
])

const staffOptions = computed(() => [
  { title: 'Toda a equipe', value: null },
  ...staff.value.map((item) => ({ title: item.name, value: item.id })),
])

const loadStaff = async () => {
  if (!auth.isAdmin) return
  const { data } = await api.get('/api/staff', { params: { limit: 200 } })
  staff.value = Array.isArray(data) ? data : []
}

const loadDashboard = async () => {
  loading.value = true

  try {
    const params = {
      from: toApiDate(filters.value.from),
      to: toApiDate(filters.value.to),
    }
    if (filters.value.staffId) {
      params.staff_id = filters.value.staffId
    }

    const { data } = await api.get('/api/dashboard', { params })
    dashboard.value = data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadStaff(),
    loadDashboard(),
  ])
})
</script>

<style scoped>
.hero-panel__chip {
  background: rgba(122, 149, 176, 0.2) !important;
  color: rgba(255, 255, 255, 0.96) !important;
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
}

.hero-panel__field :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.206);
  border-radius: 18px;
  color: #173133;
}

.hero-panel__field :deep(.v-field__overlay) {
  background: transparent;
  opacity: 0;
}

.hero-panel__field :deep(.v-field__input),
.hero-panel__field :deep(input),
.hero-panel__field :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.96) !important;
  font-weight: 500;
}

.hero-panel__field :deep(.v-field--dirty .v-label),
.hero-panel__field :deep(.v-field--focused .v-label),
.hero-panel__field :deep(.v-field--active .v-label) {
  color: rgba(255, 255, 255, 0.96) !important;
  font-weight: 700;
  opacity: 1 !important;
  text-shadow: 0 1px 20px rgba(17, 24, 31, 0.28);
}
</style>
