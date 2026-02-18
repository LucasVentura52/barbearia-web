<template>
  <v-container>
    <div class="section-title">
      <h2>Horários e folgas</h2>
    </div>

    <v-card v-if="isAdmin" class="staff-toolbar-card" elevation="0">
      <v-card-text class="schedule-toolbar">
        <v-select v-model="selectedStaffId" :items="staffOptions" item-title="name" item-value="id" label="Colaborador"
          variant="outlined" class="staff-select" density="compact" hide-details="auto" />
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="section-label">Horários de trabalho</div>
            <v-form @submit.prevent="createWorkingHour" class="form-grid">
              <v-select v-model="workingForm.weekday" :items="weekdays" item-title="label" item-value="value"
                label="Dia da semana" variant="outlined" />
              <v-text-field v-model="workingForm.start_time" label="Início" type="time" variant="outlined" />
              <v-text-field v-model="workingForm.end_time" label="Fim" type="time" variant="outlined" />
              <v-btn color="secondary" type="submit" :loading="loadingWorking" :block="smAndDown">
                Adicionar
              </v-btn>
            </v-form>

            <div class="list-grid" v-if="workingHours.length">
              <div class="list-item" v-for="hour in workingHours" :key="hour.id">
                <div>
                  <div class="list-title">{{ weekdayLabel(hour.weekday) }}</div>
                  <div class="text-muted">{{ hour.start_time }} - {{ hour.end_time }}</div>
                </div>
                <v-btn icon size="small" variant="text" color="error" @click="deleteWorkingHour(hour.id)">
                  <v-icon icon="mdi-delete" />
                </v-btn>
              </div>
            </div>
            <div v-else class="text-muted">Nenhum horário cadastrado.</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="section-label">Folgas e bloqueios</div>
            <v-form @submit.prevent="createTimeOff" class="form-grid">
              <v-text-field v-model="timeOffForm.start_at" label="Início" type="datetime-local" variant="outlined" />
              <v-text-field v-model="timeOffForm.end_at" label="Fim" type="datetime-local" variant="outlined" />
              <v-text-field v-model="timeOffForm.reason" label="Motivo" variant="outlined" />
              <v-btn color="secondary" type="submit" :loading="loadingTimeOff" :block="smAndDown">
                Registrar
              </v-btn>
            </v-form>

            <div class="list-grid" v-if="timeOffs.length">
              <div class="list-item" v-for="off in timeOffs" :key="off.id">
                <div>
                  <div class="list-title">{{ formatDateTime(off.start_at) }} - {{ formatDateTime(off.end_at) }}</div>
                  <div class="text-muted">{{ off.reason || 'Sem motivo' }}</div>
                </div>
                <v-btn icon size="small" variant="text" color="error" @click="deleteTimeOff(off.id)">
                  <v-icon icon="mdi-delete" />
                </v-btn>
              </div>
            </div>
            <div v-else class="text-muted">Nenhuma folga cadastrada.</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'
import { useAuthStore } from '@/stores/auth'

const weekdays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

const workingHours = ref([])
const timeOffs = ref([])
const loadingWorking = ref(false)
const loadingTimeOff = ref(false)
const alerts = useAlertStore()
const auth = useAuthStore()
const { smAndDown } = useDisplay()

const staffOptions = ref([])
const selectedStaffId = ref(null)
const isAdmin = computed(() => auth.user?.role === 'admin')

const workingForm = ref({
  weekday: 1,
  start_time: '09:00',
  end_time: '18:00',
})

const timeOffForm = ref({
  start_at: '',
  end_at: '',
  reason: '',
})

const weekdayLabel = (value) => weekdays.find((w) => w.value === value)?.label || ''

const formatDateTime = (value) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const loadWorkingHours = async () => {
  if (isAdmin.value && !selectedStaffId.value) {
    workingHours.value = []
    return
  }
  const staffParam = isAdmin.value ? `?staff_id=${selectedStaffId.value}` : ''
  const { data } = await api.get(`/api/staff/working-hours${staffParam}`)
  workingHours.value = data
}

const loadTimeOff = async () => {
  if (isAdmin.value && !selectedStaffId.value) {
    timeOffs.value = []
    return
  }
  const staffParam = isAdmin.value ? `?staff_id=${selectedStaffId.value}` : ''
  const { data } = await api.get(`/api/staff/time-off${staffParam}`)
  timeOffs.value = data
}

const createWorkingHour = async () => {
  if (isAdmin.value && !selectedStaffId.value) {
    alerts.warning('Selecione um colaborador.')
    return
  }
  loadingWorking.value = true
  try {
    const payload = {
      ...workingForm.value,
      ...(isAdmin.value ? { staff_id: selectedStaffId.value } : {}),
    }
    await api.post('/api/staff/working-hours', payload)
    await loadWorkingHours()
    alerts.success('Horário cadastrado.')
  } finally {
    loadingWorking.value = false
  }
}

const deleteWorkingHour = async (id) => {
  await api.delete(`/api/staff/working-hours/${id}`)
  await loadWorkingHours()
  alerts.success('Horário removido.')
}

const createTimeOff = async () => {
  if (isAdmin.value && !selectedStaffId.value) {
    alerts.warning('Selecione um colaborador.')
    return
  }
  loadingTimeOff.value = true
  try {
    const payload = {
      ...timeOffForm.value,
      ...(isAdmin.value ? { staff_id: selectedStaffId.value } : {}),
    }
    await api.post('/api/staff/time-off', payload)
    await loadTimeOff()
    alerts.success('Folga registrada.')
  } finally {
    loadingTimeOff.value = false
  }
}

const deleteTimeOff = async (id) => {
  await api.delete(`/api/staff/time-off/${id}`)
  await loadTimeOff()
  alerts.success('Folga removida.')
}

const loadStaffOptions = async () => {
  const { data } = await api.get('/api/staff')
  staffOptions.value = data
  if (!selectedStaffId.value && data.length) {
    selectedStaffId.value = data[0].id
  }
}

onMounted(async () => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
  }
  if (isAdmin.value) {
    await loadStaffOptions()
  } else {
    selectedStaffId.value = auth.user?.id || null
  }
  await Promise.all([loadWorkingHours(), loadTimeOff()])
})

watch(
  () => selectedStaffId.value,
  () => {
    loadWorkingHours()
    loadTimeOff()
  }
)
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 16px;
}

.schedule-toolbar {
  display: flex;
  justify-content: flex-end;
}

.staff-select {
  min-width: 240px;
}

.list-grid {
  display: grid;
  gap: 12px;
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
</style>
