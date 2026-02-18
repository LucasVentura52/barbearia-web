<template>
  <v-container>
    <div class="section-title">
      <h2>Meus agendamentos</h2>
    </div>

    <v-card class="glass-card mb-4" elevation="0">
      <v-card-text class="appointments-toolbar">
        <v-chip-group v-model="statusFilter" class="toolbar-left" selected-class="text-primary" mandatory>
          <v-chip v-for="item in statusOptions" :key="item.value" :value="item.value" color="secondary" variant="tonal">
            {{ item.label }} ({{ item.count }})
          </v-chip>
        </v-chip-group>
        <v-btn variant="outlined" color="primary" :block="smAndDown" @click="loadAppointments">
          Atualizar
        </v-btn>
      </v-card-text>
    </v-card>
    <v-row>
      <v-col v-for="appointment in filteredAppointments" :key="appointment.id" cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="appointment-header">
              <div>
                <div class="appointment-time">{{ formatDate(appointment.start_at) }}</div>
                <div class="text-muted">{{ formatTime(appointment.start_at) }} - {{ formatTime(appointment.end_at) }}
                </div>
              </div>
              <v-chip :color="statusColor(appointment.status)" variant="tonal">
                {{ statusLabel(appointment.status) }}
              </v-chip>
            </div>
            <div class="appointment-meta">
              <div class="text-muted">Barbeiro</div>
              <div>{{ appointment.staff?.name || 'Equipe' }}</div>
            </div>
            <div class="appointment-services">
              <v-chip v-for="service in appointment.services" :key="service.id" size="small" color="secondary"
                variant="tonal">
                {{ service.name }}
              </v-chip>
            </div>
            <div class="appointment-footer">
              <div class="appointment-price">R$ {{ Number(appointment.total_price).toFixed(2) }}</div>
              <v-btn v-if="appointment.status === 'scheduled'" variant="outlined" color="primary" size="small"
                @click="cancelAppointment(appointment.id)">
                Cancelar
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-if="filteredAppointments.length === 0" class="mt-5" type="info" variant="tonal">
      Nenhum agendamento encontrado para este filtro.
    </v-alert>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'

const appointments = ref([])
const statusFilter = ref('all')
const alerts = useAlertStore()
const { smAndDown } = useDisplay()

const loadAppointments = async () => {
  const { data } = await api.get('/api/appointments')
  appointments.value = data
}

const cancelAppointment = async (id) => {
  await api.post(`/api/appointments/${id}/cancel`, { reason: 'Cancelado pelo cliente' })
  await loadAppointments()
  alerts.success('Agendamento cancelado.')
}

const formatDate = (value) =>
  new Date(value).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

const formatTime = (value) =>
  new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const statusLabel = (status) => {
  const map = { scheduled: 'Agendado', canceled: 'Cancelado', done: 'Finalizado', no_show: 'Não compareceu' }
  return map[status] || status
}

const statusColor = (status) => {
  const map = { scheduled: 'primary', canceled: 'error', done: 'success', no_show: 'warning' }
  return map[status] || 'secondary'
}

const statusOptions = computed(() => {
  const counts = appointments.value.reduce(
    (acc, appointment) => {
      acc.all += 1
      acc[appointment.status] = (acc[appointment.status] || 0) + 1
      return acc
    },
    { all: 0 }
  )

  return [
    { value: 'all', label: 'Todos', count: counts.all || 0 },
    { value: 'scheduled', label: 'Agendados', count: counts.scheduled || 0 },
    { value: 'done', label: 'Finalizados', count: counts.done || 0 },
    { value: 'canceled', label: 'Cancelados', count: counts.canceled || 0 },
    { value: 'no_show', label: 'Não compareceu', count: counts.no_show || 0 },
  ]
})

const filteredAppointments = computed(() => {
  if (statusFilter.value === 'all') return appointments.value
  return appointments.value.filter((appointment) => appointment.status === statusFilter.value)
})

onMounted(loadAppointments)
</script>

<style scoped>
.appointments-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.appointment-time {
  font-weight: 600;
  font-size: 1.05rem;
}

.appointment-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.appointment-services {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.appointment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.appointment-price {
  font-family: var(--display-font);
  font-size: 1.1rem;
}
</style>
