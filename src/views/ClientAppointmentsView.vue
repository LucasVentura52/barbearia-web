<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="glass-panel h-100">
          <v-card-text>
            <div class="text-overline mb-2">Próximos</div>
            <div class="text-h4 font-weight-black">{{ upcomingCount }}</div>
            <div class="text-body-2 text-medium-emphasis">
              Horários futuros aguardando atendimento.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-panel h-100">
          <v-card-text>
            <div class="text-overline mb-2">Concluídos</div>
            <div class="text-h4 font-weight-black">{{ completedCount }}</div>
            <div class="text-body-2 text-medium-emphasis">
              Atendimentos já finalizados nessa empresa.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-panel h-100">
          <v-card-text>
            <div class="text-overline mb-2">Cancelados</div>
            <div class="text-h4 font-weight-black">{{ canceledCount }}</div>
            <div class="text-body-2 text-medium-emphasis">
              Compromissos interrompidos no histórico.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="nextAppointment" class="glass-panel appointment-spotlight">
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal" size="52">
            <v-icon icon="mdi-calendar-star" />
          </v-avatar>
        </template>
        <v-card-title>Seu próximo atendimento</v-card-title>
        <v-card-subtitle>
          {{ formatDateTime(nextAppointment.start_at) }} · {{ formatTimeRange(nextAppointment.start_at, nextAppointment.end_at) }}
        </v-card-subtitle>
      </v-card-item>
      <v-card-text class="d-flex flex-column ga-4 ga-md-0 flex-md-row align-md-center justify-space-between">
        <div class="d-flex align-center ga-3">
          <v-avatar color="secondary" variant="tonal" size="54">
            <v-img v-if="nextAppointment.staff?.avatar_url" :src="resolveMediaUrl(nextAppointment.staff.avatar_url)" cover />
            <span v-else class="text-subtitle-2 font-weight-black">{{ initials(nextAppointment.staff?.name || 'Equipe') }}</span>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ nextAppointment.staff?.name || 'Equipe da barbearia' }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ serviceNames(nextAppointment).join(' · ') || 'Serviço não informado' }}
            </div>
          </div>
        </div>
        <div class="d-flex align-center ga-3 flex-wrap">
          <v-chip color="secondary" variant="tonal">{{ formatCurrencyBRL(nextAppointment.total_price) }}</v-chip>
          <v-btn
            v-if="canCancel(nextAppointment)"
            color="secondary"
            variant="outlined"
            :loading="cancellingId === nextAppointment.id"
            @click="cancelAppointment(nextAppointment)"
          >
            Cancelar horário
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="glass-panel">
      <v-card-item>
        <template #prepend>
          <v-avatar color="primary" variant="tonal">
            <v-icon icon="mdi-filter-variant" />
          </v-avatar>
        </template>
        <v-card-title>Filtrar agenda</v-card-title>
        <v-card-subtitle>Visualize rapidamente o que está agendado, concluído ou cancelado.</v-card-subtitle>
      </v-card-item>
      <v-card-text class="d-flex flex-column ga-4 flex-md-row align-md-center justify-space-between">
        <v-chip-group v-model="statusFilter" selected-class="text-secondary" mandatory>
          <v-chip
            v-for="item in statusOptions"
            :key="item.value"
            :value="item.value"
            color="secondary"
            variant="tonal"
          >
            {{ item.label }} ({{ item.count }})
          </v-chip>
        </v-chip-group>
        <v-btn color="secondary" variant="outlined" :loading="loading" @click="loadAppointments">
          Atualizar agenda
        </v-btn>
      </v-card-text>
    </v-card>

    <v-row v-if="filteredAppointments.length">
      <v-col v-for="appointment in filteredAppointments" :key="appointment.id" cols="12" lg="6">
        <v-card class="glass-panel h-100 appointment-card">
          <v-card-text class="d-flex flex-column ga-4">
            <div class="d-flex align-start justify-space-between ga-3">
              <div>
                <div class="text-overline mb-1">{{ formatDate(appointment.start_at) }}</div>
                <div class="text-h6 font-weight-black">{{ formatTimeRange(appointment.start_at, appointment.end_at) }}</div>
              </div>
              <v-chip :color="statusColor(appointment.status)" variant="tonal">
                {{ statusLabel(appointment.status) }}
              </v-chip>
            </div>

            <div class="d-flex align-center ga-3">
              <v-avatar color="secondary" variant="tonal" size="46">
                <v-img v-if="appointment.staff?.avatar_url" :src="resolveMediaUrl(appointment.staff.avatar_url)" cover />
                <span v-else class="text-caption font-weight-black">{{ initials(appointment.staff?.name || 'Equipe') }}</span>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">{{ appointment.staff?.name || 'Equipe da barbearia' }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ serviceNames(appointment).join(' · ') || 'Serviço não informado' }}
                </div>
              </div>
            </div>

            <div class="d-flex align-center justify-space-between ga-3 flex-wrap">
              <v-chip color="primary" variant="outlined">
                {{ formatCurrencyBRL(appointment.total_price) }}
              </v-chip>
              <v-btn
                v-if="canCancel(appointment)"
                color="secondary"
                variant="text"
                :loading="cancellingId === appointment.id"
                @click="cancelAppointment(appointment)"
              >
                Cancelar
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else class="glass-panel">
      <v-card-text class="py-10 text-center">
        <v-avatar color="secondary" variant="tonal" size="68" class="mb-4">
          <v-icon icon="mdi-calendar-blank-outline" size="32" />
        </v-avatar>
        <div class="text-h6 font-weight-black mb-2">Nenhum agendamento nesse filtro</div>
        <div class="text-body-2 text-medium-emphasis">
          Troque o filtro ou atualize a lista para buscar horários mais recentes.
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/dates'
import { resolveMediaUrl } from '@/lib/media'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const loading = ref(false)
const cancellingId = ref(null)
const appointments = ref([])
const statusFilter = ref('all')

const statusLabel = (status) => {
  const labels = {
    scheduled: 'Agendado',
    canceled: 'Cancelado',
    done: 'Finalizado',
    no_show: 'Nao compareceu',
  }

  return labels[status] || status || 'Sem status'
}

const statusColor = (status) => {
  const colors = {
    scheduled: 'secondary',
    canceled: 'error',
    done: 'success',
    no_show: 'warning',
  }

  return colors[status] || 'primary'
}

const initials = (value) =>
  String(value || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

const serviceNames = (appointment) =>
  Array.isArray(appointment?.services)
    ? appointment.services.map((service) => service?.name).filter(Boolean)
    : []

const normalizeAppointmentsPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const isFutureAppointment = (appointment) => {
  const startAt = new Date(appointment?.start_at || '')
  return !Number.isNaN(startAt.getTime()) && startAt.getTime() > Date.now()
}

const canCancel = (appointment) => appointment?.status === 'scheduled' && isFutureAppointment(appointment)

const sortedAppointments = computed(() =>
  [...appointments.value].sort((left, right) => new Date(right.start_at).getTime() - new Date(left.start_at).getTime())
)

const filteredAppointments = computed(() => {
  if (statusFilter.value === 'all') return sortedAppointments.value
  return sortedAppointments.value.filter((appointment) => appointment.status === statusFilter.value)
})

const nextAppointment = computed(() =>
  [...appointments.value]
    .filter((appointment) => appointment.status === 'scheduled' && isFutureAppointment(appointment))
    .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime())[0] || null
)

const upcomingCount = computed(
  () => appointments.value.filter((appointment) => appointment.status === 'scheduled' && isFutureAppointment(appointment)).length
)
const completedCount = computed(() => appointments.value.filter((appointment) => appointment.status === 'done').length)
const canceledCount = computed(() => appointments.value.filter((appointment) => appointment.status === 'canceled').length)

const statusOptions = computed(() => {
  const counts = appointments.value.reduce(
    (accumulator, appointment) => {
      accumulator.all += 1
      accumulator[appointment.status] = (accumulator[appointment.status] || 0) + 1
      return accumulator
    },
    { all: 0 }
  )

  return [
    { value: 'all', label: 'Todos', count: counts.all || 0 },
    { value: 'scheduled', label: 'Agendados', count: counts.scheduled || 0 },
    { value: 'done', label: 'Finalizados', count: counts.done || 0 },
    { value: 'canceled', label: 'Cancelados', count: counts.canceled || 0 },
    { value: 'no_show', label: 'Nao compareceu', count: counts.no_show || 0 },
  ]
})

const loadAppointments = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/appointments', {
      params: {
        limit: 200,
      },
    })
    appointments.value = normalizeAppointmentsPayload(data)
  } finally {
    loading.value = false
  }
}

const cancelAppointment = async (appointment) => {
  if (!canCancel(appointment)) return

  cancellingId.value = appointment.id
  try {
    await api.post(`/api/appointments/${appointment.id}/cancel`, {
      reason: 'Cancelado pelo cliente',
    })
    ui.notify('Agendamento cancelado.', 'success')
    await loadAppointments()
  } finally {
    cancellingId.value = null
  }
}

onMounted(loadAppointments)
</script>

<style scoped>
.appointment-spotlight {
  background:
    radial-gradient(circle at top right, rgba(176, 125, 82, 0.16), transparent 34%),
    linear-gradient(140deg, rgba(255, 255, 255, 0.92), rgba(247, 251, 250, 0.82));
}

.appointment-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(33, 47, 58, 0.08);
}
</style>
