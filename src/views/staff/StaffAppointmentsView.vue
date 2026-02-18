<template>
  <v-container>
    <div class="section-title">
      <h2>Agenda do colaborador</h2>
    </div>

    <v-card class="staff-toolbar-card pb-4" elevation="0">
      <v-card-text class="calendar-toolbar">
        <div class="toolbar-left">
          <v-chip size="small" variant="flat" class="status-chip status-chip--scheduled">
            Agendados: {{ statusCount('scheduled') }}
          </v-chip>
          <v-chip size="small" variant="flat" class="status-chip status-chip--done">
            Finalizados: {{ statusCount('done') }}
          </v-chip>
          <v-chip size="small" variant="flat" class="status-chip status-chip--no-show">
            Não compareceu: {{ statusCount('no_show') }}
          </v-chip>
          <v-chip size="small" variant="flat" class="status-chip status-chip--canceled">
            Cancelados: {{ statusCount('canceled') }}
          </v-chip>
        </div>
        <div class="toolbar-actions">
          <v-select v-if="isAdmin" v-model="selectedStaffId" :items="staffSelectItems" item-title="name"
            item-value="id" label="Agenda" variant="outlined" density="compact" hide-details class="staff-select" />
          <v-chip v-else-if="auth.user" color="secondary" variant="tonal">
            {{ auth.user.name }}
          </v-chip>
          <v-btn color="secondary" variant="tonal" :loading="loading" :block="smAndDown" @click="refetchEvents">
            Atualizar
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="glass-card calendar-card" elevation="0">
      <v-card-text>
        <FullCalendar ref="calendarRef" :options="calendarOptions" />
      </v-card-text>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="720">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">Detalhes do agendamento</div>
            <div class="modal-subtitle">Gerencie status e ajustes com rapidez.</div>
          </div>
          <v-chip :color="statusColor(selectedAppointment?.status)" variant="tonal">
            {{ statusLabel(selectedAppointment?.status) }}
          </v-chip>
        </div>
        <v-card-text v-if="selectedAppointment" class="detail-grid">
          <div>
            <div class="detail-label">Cliente</div>
            <div class="detail-value">{{ selectedAppointment.client?.name || 'Cliente' }}</div>
            <div class="detail-meta">
              {{ formatPhoneFromE164(selectedAppointment.client?.phone) || 'Telefone não informado' }}
            </div>
          </div>
          <div>
            <div class="detail-label">Horário</div>
            <div class="detail-value">{{ formatDateTime(selectedAppointment.start_at) }}</div>
            <div class="detail-meta">{{ formatTimeRange(selectedAppointment.start_at, selectedAppointment.end_at) }}
            </div>
          </div>
          <div>
            <div class="detail-label">Serviços</div>
            <div class="detail-chips">
              <v-chip v-for="service in selectedAppointment.services" :key="service.id" size="small" color="secondary"
                variant="tonal">
                {{ service.name }}
              </v-chip>
            </div>
          </div>
          <div>
            <div class="detail-label">Total</div>
            <div class="detail-value">{{ formatCurrencyBRL(selectedAppointment.total_price) }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="detailDialog = false">Fechar</v-btn>
          <v-spacer />
          <v-btn v-if="canEdit" color="secondary" variant="tonal" @click="openEdit(selectedAppointment)">
            Editar
          </v-btn>
          <v-btn v-if="canComplete" color="success" variant="tonal"
            @click="updateStatus(selectedAppointment.id, 'done')">
            Finalizar
          </v-btn>
          <v-btn v-if="canComplete" color="warning" variant="tonal"
            @click="updateStatus(selectedAppointment.id, 'no_show')">
            Não compareceu
          </v-btn>
          <v-btn v-if="canCancel" color="secondary" variant="outlined" @click="openCancel(selectedAppointment)">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="text" @click="openDelete(selectedAppointment)">
            Deletar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="640">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">Editar agendamento</div>
            <div class="modal-subtitle">Atualize data, hora e serviços.</div>
          </div>
          <v-icon icon="mdi-calendar-edit" />
        </div>
        <v-card-text class="form-grid">
          <v-date-input v-model="editForm.date" label="Data" variant="outlined" />
          <v-text-field v-model="editForm.time" label="Hora" type="time" variant="outlined" />
          <v-select v-model="editForm.service_ids" :items="serviceOptions" item-title="name" item-value="id"
            label="Serviços" multiple chips variant="outlined" />
          <div class="edit-summary">
            <div class="text-muted">Duração</div>
            <div>{{ editTotals.duration }} min</div>
            <div class="text-muted">Total</div>
            <div>{{ formatCurrencyBRL(editTotals.total) }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="editDialog = false">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" :loading="saving" @click="saveEdit">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cancelDialog" max-width="480">
      <v-card>
        <v-card-title>Cancelar agendamento</v-card-title>
        <v-card-text>
          <v-textarea v-model="cancelReason" label="Motivo" rows="3" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">Voltar</v-btn>
          <v-btn color="secondary" @click="confirmCancel" :loading="saving">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>Excluir agendamento</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir este agendamento? Essa ação é permanente.
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="saving" @click="confirmDelete">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import '@/styles/fullcalendar.css'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'
import { useAuthStore } from '@/stores/auth'
import { formatPhoneFromE164 } from '@/lib/phone'
import { formatCurrencyBRL } from '@/lib/currency'

const calendarRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const appointments = ref([])
const staffOptions = ref([])
const selectedStaffId = ref(null)
const detailDialog = ref(false)
const editDialog = ref(false)
const cancelDialog = ref(false)
const deleteDialog = ref(false)
const cancelReason = ref('')
const selectedAppointment = ref(null)
const serviceOptions = ref([])
const hasInitializedStaffSelection = ref(false)
const alerts = useAlertStore()
const auth = useAuthStore()
const { smAndDown } = useDisplay()

const isAdmin = computed(() => auth.user?.role === 'admin')

const staffSelectItems = computed(() => {
  if (!isAdmin.value) return []
  return [
    { id: 'mine', name: 'Minha agenda' },
    { id: 'all', name: 'Todos os colaboradores' },
    ...staffOptions.value.map((staff) => ({ id: staff.id, name: staff.name })),
  ]
})

const statusLabel = (status) => {
  const map = {
    scheduled: 'Agendado',
    canceled: 'Cancelado',
    done: 'Finalizado',
    no_show: 'Não compareceu',
  }
  return map[status] || status
}

const statusColor = (status) => {
  const map = {
    scheduled: 'secondary',
    canceled: 'error',
    done: 'success',
    no_show: 'warning',
  }
  return map[status] || 'secondary'
}

const statusPalette = {
  scheduled: { background: '#5E7A90', text: '#F3F7FA' },
  done: { background: '#688573', text: '#F3F7FA' },
  no_show: { background: '#9B8062', text: '#1F2B35' },
  canceled: { background: '#93696D', text: '#F3F7FA' },
}

const statusCount = (status) =>
  appointments.value.filter((appointment) => appointment.status === status).length

const toLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

const toTimeInput = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const buildStartAt = (date, time) => {
  if (!date || !time) return ''
  const safeTime = time.length === 5 ? `${time}:00` : time
  return `${date}T${safeTime}`
}

const formatDateTime = (value) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const formatTimeRange = (start, end) => {
  const startTime = new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const endTime = new Date(end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${startTime} - ${endTime}`
}

const canEdit = computed(() => selectedAppointment.value?.status === 'scheduled')
const canCancel = computed(() => selectedAppointment.value?.status === 'scheduled')
const canComplete = computed(() => selectedAppointment.value?.status === 'scheduled')

const editForm = ref({
  date: '',
  time: '',
  service_ids: [],
})

const editTotals = computed(() => {
  const selected = serviceOptions.value.filter((service) => editForm.value.service_ids.includes(service.id))
  return {
    duration: selected.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0),
    total: selected.reduce((sum, service) => sum + Number(service.price || 0), 0),
  }
})

const buildEvent = (appointment) => {
  const palette = statusPalette[appointment.status] || statusPalette.scheduled
  const staffLabel = appointment.staff?.name ? `${appointment.staff.name} · ` : ''
  return {
    id: String(appointment.id),
    title: `${staffLabel}${appointment.client?.name || 'Cliente'} · ${appointment.services
      .map((service) => service.name)
      .join(', ')}`,
    start: appointment.start_at,
    end: appointment.end_at,
    backgroundColor: palette.background,
    borderColor: palette.background,
    textColor: palette.text,
    extendedProps: { appointment },
  }
}

const fetchAppointments = async (info, successCallback, failureCallback) => {
  loading.value = true
  try {
    const from = toLocalDateString(info.start)
    const endDate = new Date(info.end.getTime() - 86400000)
    const to = toLocalDateString(endDate)
    let staffId = selectedStaffId.value
    if (staffId === 'mine') {
      staffId = auth.user?.id
    }
    if (staffId === 'all') {
      staffId = null
    }
    if (!staffId && !isAdmin.value) {
      staffId = auth.user?.id
    }
    const staffParam = staffId ? `&staff_id=${staffId}` : ''
    const { data } = await api.get(`/api/staff/appointments?from=${from}&to=${to}${staffParam}`)
    appointments.value = data
    successCallback(data.map(buildEvent))
  } catch (error) {
    failureCallback(error)
  } finally {
    loading.value = false
  }
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: smAndDown.value ? 'listWeek' : 'dayGridMonth',
  height: 'auto',
  locale: ptBrLocale,
  nowIndicator: true,
  headerToolbar: smAndDown.value
    ? {
        left: 'prev,next',
        center: 'title',
        right: 'timeGridDay,listWeek',
      }
    : {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek',
      },
  events: fetchAppointments,
  eventClick: (info) => {
    selectedAppointment.value = info.event.extendedProps.appointment
    detailDialog.value = true
  },
  eventTimeFormat: { hour: '2-digit', minute: '2-digit' },
}))

const refetchEvents = () => {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.refetchEvents()
  }
}

const openCancel = (appointment) => {
  selectedAppointment.value = appointment
  cancelReason.value = ''
  cancelDialog.value = true
}

const confirmCancel = async () => {
  if (!selectedAppointment.value) return
  saving.value = true
  try {
    await api.post(`/api/staff/appointments/${selectedAppointment.value.id}/cancel`, {
      reason: cancelReason.value || 'Cancelado pelo colaborador',
    })
    cancelDialog.value = false
    detailDialog.value = false
    refetchEvents()
    alerts.success('Agendamento cancelado.')
  } finally {
    saving.value = false
  }
}

const updateStatus = async (id, status) => {
  saving.value = true
  try {
    await api.post(`/api/staff/appointments/${id}/status`, { status })
    detailDialog.value = false
    refetchEvents()
    alerts.success('Status atualizado.')
  } finally {
    saving.value = false
  }
}

const openEdit = (appointment) => {
  selectedAppointment.value = appointment
  editForm.value = {
    date: toLocalDateString(new Date(appointment.start_at)),
    time: toTimeInput(appointment.start_at),
    service_ids: appointment.services.map((service) => service.id),
  }
  const staffId = appointment.staff?.id || appointment.staff_user_id
  if (staffId) {
    setServiceOptionsForStaff(staffId)
  }
  editDialog.value = true
}

const saveEdit = async () => {
  if (!selectedAppointment.value) return
  const startAt = buildStartAt(editForm.value.date, editForm.value.time)
  if (!startAt) {
    alerts.warning('Informe data e hora válidas.')
    return
  }
  saving.value = true
  try {
    await api.put(`/api/staff/appointments/${selectedAppointment.value.id}`,
      {
        start_at: startAt,
        service_ids: editForm.value.service_ids,
      }
    )
    editDialog.value = false
    detailDialog.value = false
    refetchEvents()
    alerts.success('Agendamento atualizado.')
  } finally {
    saving.value = false
  }
}

const openDelete = (appointment) => {
  selectedAppointment.value = appointment
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!selectedAppointment.value) return
  saving.value = true
  try {
    await api.delete(`/api/staff/appointments/${selectedAppointment.value.id}`)
    deleteDialog.value = false
    detailDialog.value = false
    refetchEvents()
    alerts.success('Agendamento excluído.')
  } finally {
    saving.value = false
  }
}

const setServiceOptionsForStaff = (staffId) => {
  const staff = staffOptions.value.find((item) => item.id === staffId)
  if (staff?.services?.length) {
    serviceOptions.value = staff.services
    return true
  }
  return false
}

const loadStaffOptions = async () => {
  const { data } = await api.get('/api/staff')
  staffOptions.value = data
}

const loadServiceOptions = async (staffId) => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
  }
  if (staffId && setServiceOptionsForStaff(staffId)) {
    return
  }
  const { data } = await api.get('/api/services')
  serviceOptions.value = data
}

onMounted(async () => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
  }
  await loadStaffOptions()
  if (!selectedStaffId.value) {
    selectedStaffId.value = isAdmin.value ? 'all' : 'mine'
  }
})

watch(
  () => selectedStaffId.value,
  async () => {
    if (selectedStaffId.value === 'all') {
      await loadServiceOptions(auth.user?.id)
    } else if (selectedStaffId.value === 'mine') {
      await loadServiceOptions(auth.user?.id)
    } else {
      await loadServiceOptions(selectedStaffId.value)
    }

    if (!hasInitializedStaffSelection.value) {
      hasInitializedStaffSelection.value = true
      return
    }

    refetchEvents()
  }
)

watch(
  () => [auth.user, staffOptions.value.length],
  ([user]) => {
    if (!user) return
    if (!selectedStaffId.value) {
      selectedStaffId.value = user.role === 'admin' ? 'all' : 'mine'
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip {
  font-weight: 600;
  border: 1px solid rgba(35, 58, 74, 0.15);
  color: #203241;
}

.status-chip--scheduled {
  background: #e5edf3;
}

.status-chip--done {
  background: #e5efe9;
}

.status-chip--no-show {
  background: #f0e8de;
}

.status-chip--canceled {
  background: #efe2e3;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.staff-select {
  min-width: 220px;
}

.calendar-card {
  overflow: hidden;
}

.calendar-card :deep(.fc) {
  --fc-page-bg-color: rgba(255, 255, 255, 0.95);
  --fc-border-color: rgba(35, 58, 74, 0.12);
  --fc-today-bg-color: rgba(126, 151, 170, 0.14);
  --fc-neutral-bg-color: rgba(35, 58, 74, 0.04);
  color: #203241;
}

.calendar-card :deep(.fc-toolbar-title) {
  font-family: var(--display-font);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.calendar-card :deep(.fc-button) {
  background: rgba(35, 58, 74, 0.08);
  border: none;
  color: #203241;
}

.calendar-card :deep(.fc-button-primary:not(:disabled).fc-button-active),
.calendar-card :deep(.fc-button-primary:not(:disabled):active) {
  background: rgba(35, 58, 74, 0.14);
}

.calendar-card :deep(.fc-list-event) {
  background: transparent;
}

.modal-card {
  border-radius: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-title {
  font-weight: 600;
  font-size: 1.2rem;
}

.modal-subtitle {
  color: var(--ink-500);
  font-size: 0.9rem;
}

.detail-grid {
  display: grid;
  gap: 16px;
}

.detail-label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  color: var(--ink-500);
}

.detail-value {
  font-weight: 600;
  margin-top: 4px;
}

.detail-meta {
  color: var(--ink-500);
  font-size: 0.85rem;
}

.detail-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.form-grid {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.edit-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  align-items: center;
  background: rgba(35, 58, 74, 0.04);
  padding: 12px 14px;
  border-radius: 12px;
}

.dialog-actions {
  padding: 0 24px 20px;
}

@media (max-width: 960px) {
  .calendar-card :deep(.fc-toolbar) {
    gap: 8px;
  }

  .calendar-card :deep(.fc-toolbar-chunk) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .calendar-card :deep(.fc-button) {
    padding: 0.2rem 0.45rem;
    font-size: 0.72rem;
  }
}
</style>
