<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Dias com agenda"
          :value="`${activeWeekdaysCount}`"
          subtitle="Dias da semana com jornada cadastrada"
          icon="mdi-calendar-week-outline"
          color="secondary"
          :progress="Math.min(100, Math.round((activeWeekdaysCount / 7) * 100))"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Horas semanais"
          :value="`${weeklyCoverageHours}h`"
          subtitle="Cobertura total da jornada selecionada"
          icon="mdi-timer-cog-outline"
          color="primary"
          :progress="Math.min(100, Math.round((weeklyCoverageHours / 60) * 100))"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Bloqueios futuros"
          :value="`${upcomingTimeOffCount}`"
          subtitle="Folgas e indisponibilidades a partir de agora"
          icon="mdi-calendar-remove-outline"
          color="warning"
          :progress="Math.min(100, upcomingTimeOffCount * 12)"
        />
      </v-col>
    </v-row>

    <v-card class="glass-panel">
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal">
            <v-icon icon="mdi-calendar-clock-outline" />
          </v-avatar>
        </template>
        <v-card-title>Contexto da agenda</v-card-title>
        <v-card-subtitle>Selecione o colaborador e atualize jornada ou bloqueios.</v-card-subtitle>
        <template #append>
          <v-btn variant="tonal" :loading="loadingWorking || loadingTimeOff" @click="refreshSchedule">
            Atualizar
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-row>
          <v-col v-if="isAdmin" cols="12" md="5">
            <v-select
              v-model="selectedStaffId"
              :items="staffOptions"
              item-title="name"
              item-value="id"
              label="Colaborador"
              prepend-inner-icon="mdi-account-search-outline"
              hide-details
            />
          </v-col>
          <v-col v-else cols="12" md="5">
            <v-chip color="secondary" variant="tonal" size="large">
              {{ selectedStaffName }}
            </v-chip>
          </v-col>
          <v-col cols="12" md="7">
            <v-alert color="info" variant="tonal" icon="mdi-information-outline">
              Admins podem gerenciar qualquer colaborador. Staff gerencia apenas a própria agenda.
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" xl="7">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="mdi-clock-time-eight-outline" />
              </v-avatar>
            </template>
            <v-card-title>Horários de trabalho</v-card-title>
            <v-card-subtitle>{{ selectedStaffName }}</v-card-subtitle>
            <template #append>
              <v-btn color="secondary" :disabled="!canManageSelectedStaff" @click="openWorkingDialog()">
                Novo horário
              </v-btn>
            </template>
          </v-card-item>

          <v-card-text class="d-flex flex-column ga-4">
            <v-alert
              v-if="isAdmin && !selectedStaffId"
              color="warning"
              variant="tonal"
              icon="mdi-account-alert-outline"
            >
              Selecione um colaborador para gerenciar a jornada.
            </v-alert>

            <v-skeleton-loader
              v-else-if="loadingWorking"
              type="list-item-three-line, list-item-three-line, list-item-three-line"
            />

            <template v-else-if="workingHoursByDay.length">
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="day in workingHoursByDay"
                  :key="day.value"
                  rounded="xl"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center justify-space-between w-100 ga-3">
                      <div>
                        <div class="font-weight-bold">{{ day.label }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ day.items.length }} faixa(s) · {{ totalDayHours(day.items) }}h
                        </div>
                      </div>
                      <v-chip color="secondary" variant="tonal" size="small">
                        {{ day.items.length }}
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="d-flex flex-column ga-3">
                    <v-sheet
                      v-for="hour in day.items"
                      :key="hour.id"
                      class="pa-4 schedule-slot"
                      rounded="xl"
                      border
                    >
                      <div class="d-flex align-center justify-space-between ga-3">
                        <div>
                          <div class="font-weight-bold">{{ hour.start_time }} - {{ hour.end_time }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ durationLabel(hour.start_time, hour.end_time) }}
                          </div>
                        </div>
                        <div class="d-flex ga-1">
                          <v-btn icon variant="text" size="small" @click="openWorkingDialog(hour)">
                            <v-icon icon="mdi-pencil-outline" />
                          </v-btn>
                          <v-btn icon variant="text" size="small" color="error" @click="openDeleteDialog('working', hour)">
                            <v-icon icon="mdi-delete-outline" />
                          </v-btn>
                        </div>
                      </div>
                    </v-sheet>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </template>

            <v-alert
              v-else-if="canManageSelectedStaff"
              color="warning"
              variant="tonal"
              icon="mdi-calendar-clock-outline"
            >
              Nenhum horário cadastrado para o contexto atual.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="5">
        <div class="d-flex flex-column ga-6 management-side-card">
          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-calendar-remove-outline" />
                </v-avatar>
              </template>
              <v-card-title>Folgas e bloqueios</v-card-title>
              <v-card-subtitle>Ausências registradas para {{ selectedStaffName }}</v-card-subtitle>
              <template #append>
                <v-btn color="secondary" :disabled="!canManageSelectedStaff" @click="openTimeOffDialog">
                  Nova folga
                </v-btn>
              </template>
            </v-card-item>

            <v-card-text class="d-flex flex-column ga-4">
              <v-skeleton-loader
                v-if="loadingTimeOff"
                type="list-item-three-line, list-item-three-line, list-item-three-line"
              />

              <v-timeline
                v-else-if="timeOffs.length"
                density="compact"
                side="end"
                truncate-line="start"
                class="timeline-compact"
              >
                <v-timeline-item
                  v-for="entry in timeOffs"
                  :key="entry.id"
                  dot-color="warning"
                  size="small"
                >
                  <div class="d-flex align-start justify-space-between ga-3">
                    <div>
                      <div class="font-weight-bold">{{ formatDateTime(entry.start_at) }} - {{ formatDateTime(entry.end_at) }}</div>
                      <div class="text-caption text-medium-emphasis">{{ entry.reason || 'Sem motivo informado' }}</div>
                    </div>
                    <v-btn icon variant="text" size="small" color="error" @click="openDeleteDialog('time_off', entry)">
                      <v-icon icon="mdi-delete-outline" />
                    </v-btn>
                  </div>
                </v-timeline-item>
              </v-timeline>

              <v-alert
                v-else-if="canManageSelectedStaff"
                color="success"
                variant="tonal"
                icon="mdi-check-circle-outline"
              >
                Nenhuma folga cadastrada para o contexto atual.
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="success" variant="tonal">
                  <v-icon icon="mdi-timetable" />
                </v-avatar>
              </template>
              <v-card-title>Leitura rápida</v-card-title>
              <v-card-subtitle>Resumo operacional da jornada selecionada.</v-card-subtitle>
            </v-card-item>
            <v-card-text class="d-flex flex-column ga-3">
              <v-alert color="secondary" variant="tonal" icon="mdi-account-outline">
                Profissional ativo: <strong>{{ selectedStaffName }}</strong>.
              </v-alert>
              <v-alert color="primary" variant="tonal" icon="mdi-clock-outline">
                {{ workingHours.length }} faixa(s) de horário e {{ timeOffs.length }} bloqueio(s) carregados.
              </v-alert>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="workingDialog" max-width="560">
      <v-card>
        <v-card-item>
          <v-card-title>{{ editingWorkingId ? 'Editar horário' : 'Novo horário' }}</v-card-title>
          <v-card-subtitle>{{ selectedStaffName }}</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-select
            v-model="workingForm.weekday"
            :items="weekdays"
            item-title="label"
            item-value="value"
            label="Dia da semana"
          />
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="workingForm.start_time" label="Início" type="time" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="workingForm.end_time" label="Fim" type="time" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="workingDialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="savingWorking" @click="saveWorkingHour">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="timeOffDialog" max-width="620">
      <v-card>
        <v-card-item>
          <v-card-title>Nova folga ou bloqueio</v-card-title>
          <v-card-subtitle>{{ selectedStaffName }}</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field v-model="timeOffForm.start_at" label="Início" type="datetime-local" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="timeOffForm.end_at" label="Fim" type="datetime-local" />
            </v-col>
          </v-row>
          <v-textarea v-model="timeOffForm.reason" label="Motivo" rows="3" auto-grow />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="timeOffDialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="savingTimeOff" @click="saveTimeOff">Registrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-item>
          <v-card-title>{{ deleteTarget.type === 'working' ? 'Excluir horário' : 'Excluir folga' }}</v-card-title>
          <v-card-subtitle>Essa ação remove o registro selecionado.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleteTarget.label || 'este registro' }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="confirmDeleteEntry">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import api, { cachedGet } from '@/lib/api'
import { formatDateTime } from '@/lib/dates'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const weekdays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
]

const auth = useAuthStore()
const ui = useUiStore()

const staffOptions = ref([])
const selectedStaffId = ref(null)
const workingHours = ref([])
const timeOffs = ref([])
const loadingWorking = ref(false)
const loadingTimeOff = ref(false)
const savingWorking = ref(false)
const savingTimeOff = ref(false)
const deleteLoading = ref(false)
const workingDialog = ref(false)
const timeOffDialog = ref(false)
const deleteDialog = ref(false)
const editingWorkingId = ref(null)
const booting = ref(true)
const deleteTarget = ref({
  type: '',
  id: null,
  label: '',
})

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

const isAdmin = computed(() => auth.user?.role === 'admin')
const canManageSelectedStaff = computed(() => !isAdmin.value || Boolean(selectedStaffId.value))
const selectedStaffName = computed(() => {
  if (!isAdmin.value) return auth.user?.name || 'Colaborador'
  return staffOptions.value.find((staff) => Number(staff.id) === Number(selectedStaffId.value))?.name || 'Selecione um colaborador'
})
const workingHoursByDay = computed(() =>
  weekdays
    .map((weekday) => ({
      ...weekday,
      items: workingHours.value.filter((item) => Number(item.weekday) === weekday.value),
    }))
    .filter((weekday) => weekday.items.length)
)
const activeWeekdaysCount = computed(() => workingHoursByDay.value.length)
const upcomingTimeOffCount = computed(() =>
  timeOffs.value.filter((entry) => new Date(entry.end_at).getTime() >= Date.now()).length
)
const weeklyCoverageHours = computed(() => {
  const totalMinutes = workingHours.value.reduce((sum, entry) => sum + minutesBetween(entry.start_time, entry.end_time), 0)
  return Number((totalMinutes / 60).toFixed(1))
})

const weekdayLabel = (value) => weekdays.find((weekday) => weekday.value === Number(value))?.label || ''

const minutesBetween = (start, end) => {
  const [startHour, startMinute] = String(start || '00:00').split(':').map(Number)
  const [endHour, endMinute] = String(end || '00:00').split(':').map(Number)
  const startTotal = (startHour * 60) + startMinute
  const endTotal = (endHour * 60) + endMinute
  return Math.max(0, endTotal - startTotal)
}

const durationLabel = (start, end) => {
  const minutes = minutesBetween(start, end)
  if (!minutes) return 'Sem duracao'
  return `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)} hora(s)`
}

const totalDayHours = (items) => {
  const totalMinutes = items.reduce((sum, entry) => sum + minutesBetween(entry.start_time, entry.end_time), 0)
  return Number((totalMinutes / 60).toFixed(1))
}

const toLocalDateTimeInput = (value) => {
  const date = value ? new Date(value) : new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const contextParams = () => {
  if (!isAdmin.value) return {}
  return selectedStaffId.value ? { staff_id: selectedStaffId.value } : {}
}

const resetWorkingForm = () => {
  workingForm.value = {
    weekday: 1,
    start_time: '09:00',
    end_time: '18:00',
  }
  editingWorkingId.value = null
}

const resetTimeOffForm = () => {
  const start = toLocalDateTimeInput()
  const end = toLocalDateTimeInput(new Date(Date.now() + (2 * 60 * 60 * 1000)))
  timeOffForm.value = {
    start_at: start,
    end_at: end,
    reason: '',
  }
}

const loadStaffOptions = async () => {
  if (!isAdmin.value) return
  const { data } = await cachedGet('/api/staff', {}, { ttl: 20_000, force: true })
  staffOptions.value = Array.isArray(data) ? data : []

  if (!selectedStaffId.value && staffOptions.value.length) {
    selectedStaffId.value = staffOptions.value[0].id
  }
}

const loadWorkingHours = async () => {
  if (!canManageSelectedStaff.value) {
    workingHours.value = []
    return
  }

  loadingWorking.value = true
  try {
    const { data } = await api.get('/api/staff/working-hours', {
      params: contextParams(),
    })
    workingHours.value = Array.isArray(data) ? data : []
  } finally {
    loadingWorking.value = false
  }
}

const loadTimeOffs = async () => {
  if (!canManageSelectedStaff.value) {
    timeOffs.value = []
    return
  }

  loadingTimeOff.value = true
  try {
    const { data } = await api.get('/api/staff/time-off', {
      params: contextParams(),
    })
    timeOffs.value = Array.isArray(data) ? data : []
  } finally {
    loadingTimeOff.value = false
  }
}

const refreshSchedule = async () => {
  await Promise.all([loadWorkingHours(), loadTimeOffs()])
}

const openWorkingDialog = (entry = null) => {
  if (!canManageSelectedStaff.value) {
    ui.notify('Selecione um colaborador.', 'warning')
    return
  }

  if (entry) {
    editingWorkingId.value = entry.id
    workingForm.value = {
      weekday: Number(entry.weekday),
      start_time: entry.start_time,
      end_time: entry.end_time,
    }
  } else {
    resetWorkingForm()
  }

  workingDialog.value = true
}

const openTimeOffDialog = () => {
  if (!canManageSelectedStaff.value) {
    ui.notify('Selecione um colaborador.', 'warning')
    return
  }

  resetTimeOffForm()
  timeOffDialog.value = true
}

const saveWorkingHour = async () => {
  if (!canManageSelectedStaff.value) {
    ui.notify('Selecione um colaborador.', 'warning')
    return
  }

  savingWorking.value = true
  try {
    const payload = {
      weekday: Number(workingForm.value.weekday),
      start_time: workingForm.value.start_time,
      end_time: workingForm.value.end_time,
      ...contextParams(),
    }

    if (editingWorkingId.value) {
      await api.put(`/api/staff/working-hours/${editingWorkingId.value}`, payload)
    } else {
      await api.post('/api/staff/working-hours', payload)
    }

    workingDialog.value = false
    ui.notify(editingWorkingId.value ? 'Horario atualizado.' : 'Horario cadastrado.', 'success')
    resetWorkingForm()
    await loadWorkingHours()
  } finally {
    savingWorking.value = false
  }
}

const saveTimeOff = async () => {
  if (!canManageSelectedStaff.value) {
    ui.notify('Selecione um colaborador.', 'warning')
    return
  }

  savingTimeOff.value = true
  try {
    await api.post('/api/staff/time-off', {
      start_at: timeOffForm.value.start_at,
      end_at: timeOffForm.value.end_at,
      reason: String(timeOffForm.value.reason || '').trim() || null,
      ...contextParams(),
    })
    timeOffDialog.value = false
    ui.notify('Folga registrada.', 'success')
    resetTimeOffForm()
    await loadTimeOffs()
  } finally {
    savingTimeOff.value = false
  }
}

const openDeleteDialog = (type, entry) => {
  deleteTarget.value = {
    type,
    id: entry?.id || null,
    label: type === 'working'
      ? `${weekdayLabel(entry?.weekday)} ${entry?.start_time} - ${entry?.end_time}`
      : `${formatDateTime(entry?.start_at)} - ${formatDateTime(entry?.end_at)}`,
  }
  deleteDialog.value = true
}

const confirmDeleteEntry = async () => {
  if (!deleteTarget.value.id) return

  deleteLoading.value = true
  try {
    if (deleteTarget.value.type === 'working') {
      await api.delete(`/api/staff/working-hours/${deleteTarget.value.id}`)
      await loadWorkingHours()
      ui.notify('Horario removido.', 'success')
    } else {
      await api.delete(`/api/staff/time-off/${deleteTarget.value.id}`)
      await loadTimeOffs()
      ui.notify('Folga removida.', 'success')
    }

    deleteDialog.value = false
  } finally {
    deleteLoading.value = false
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

  resetTimeOffForm()
  await refreshSchedule()
  booting.value = false
})

watch(selectedStaffId, () => {
  if (booting.value) return
  refreshSchedule()
})
</script>

<style scoped>
.schedule-slot {
  background: rgba(255, 255, 255, 0.38);
}
</style>
