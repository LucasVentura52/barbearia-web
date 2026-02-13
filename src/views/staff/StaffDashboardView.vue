<template>
  <v-container>
    <div class="section-title">
      <h2>Dashboard do colaborador</h2>
    </div>

    <v-card class="staff-toolbar-card pb-4" elevation="0">
      <v-card-text class="dashboard-toolbar">
        <v-date-input v-model="date" label="Data" variant="outlined" hide-details />
        <v-btn color="secondary" size="large" @click="loadDashboard" :loading="loading">
          Atualizar
        </v-btn>
      </v-card-text>
    </v-card>

    <div class="dashboard-grid">
      <div class="glass-card dashboard-card">
        <div class="card-label">Agendamentos</div>
        <div class="card-value">{{ totals.appointments_total }}</div>
        <div class="card-meta">Total do dia</div>
      </div>
      <div class="glass-card dashboard-card">
        <div class="card-label">Receita prevista</div>
        <div class="card-value">R$ {{ totals.revenue_total.toFixed(2) }}</div>
        <div class="card-meta">Agendamentos + finalizados</div>
      </div>
      <div class="glass-card dashboard-card">
        <div class="card-label">Status</div>
        <div class="status-badges">
          <v-chip size="small" color="primary" variant="tonal">Agendados {{ statusCount('scheduled') }}</v-chip>
          <v-chip size="small" color="success" variant="tonal">Finalizados {{ statusCount('done') }}</v-chip>
          <v-chip size="small" color="error" variant="tonal">Cancelados {{ statusCount('canceled') }}</v-chip>
        </div>
      </div>
    </div>

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
                    {{ formatDateTime(appointment.start_at) }} · {{appointment.services.map(s => s.name).join(', ')}}
                  </div>
                </div>
                <v-chip color="secondary" variant="tonal">R$ {{ Number(appointment.total_price).toFixed(2) }}</v-chip>
              </div>
            </div>
            <div v-else class="text-muted">Sem próximos agendamentos.</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="section-label">Top serviços</div>
            <div v-if="topServices.length" class="list-grid">
              <div class="list-item" v-for="service in topServices" :key="service.id">
                <div>
                  <div class="list-title">{{ service.name }}</div>
                  <div class="text-muted">{{ service.total }} vendas</div>
                </div>
                <v-icon icon="mdi-trending-up" color="secondary" />
              </div>
            </div>
            <div v-else class="text-muted">Sem dados para este dia.</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/lib/api'

const toLocalDateString = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

const date = ref(toLocalDateString(new Date()))
const loading = ref(false)

const totals = ref({
  appointments_total: 0,
  appointments_by_status: {},
  revenue_total: 0,
})
const nextAppointments = ref([])
const topServices = ref([])

const loadDashboard = async () => {
  loading.value = true
  try {
    const dateParam = date.value ? toLocalDateString(date.value) : ''
    const { data } = await api.get(`/api/dashboard?date=${dateParam}`)
    totals.value = data.totals
    nextAppointments.value = data.next_appointments
    topServices.value = data.top_services
  } finally {
    loading.value = false
  }
}

const statusCount = (status) => totals.value.appointments_by_status?.[status] || 0

const formatDateTime = (value) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

loadDashboard()
</script>

<style scoped>
.dashboard-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.dashboard-toolbar :deep(.v-btn) {
  height: 40px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-card {
  padding: 20px;
}

.card-label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: rgba(11, 31, 36, 0.6);
}

.card-value {
  font-family: var(--display-font);
  font-size: 2rem;
  margin: 8px 0;
}

.card-meta {
  color: rgba(11, 31, 36, 0.6);
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
  background: rgba(11, 31, 36, 0.05);
  padding: 12px 14px;
  border-radius: 16px;
}

.list-title {
  font-weight: 600;
}
</style>
