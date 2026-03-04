<template>
  <v-container>
    <div class="section-title">
      <h2>Agenda do colaborador</h2>
    </div>

    <v-card class="staff-toolbar-card pb-4" elevation="0">
      <v-card-text class="calendar-toolbar">
        <div class="toolbar-left">
          <v-chip
            size="small"
            :variant="isStatusFilterActive('scheduled') ? 'flat' : 'tonal'"
            class="status-chip status-chip--scheduled"
            :class="{ 'status-chip--active': isStatusFilterActive('scheduled') }"
            @click="toggleStatusFilter('scheduled')"
          >
            Agendados: {{ statusCount('scheduled') }}
          </v-chip>
          <v-chip
            size="small"
            :variant="isStatusFilterActive('done') ? 'flat' : 'tonal'"
            class="status-chip status-chip--done"
            :class="{ 'status-chip--active': isStatusFilterActive('done') }"
            @click="toggleStatusFilter('done')"
          >
            Finalizados: {{ statusCount('done') }}
          </v-chip>
          <v-chip
            size="small"
            :variant="isStatusFilterActive('no_show') ? 'flat' : 'tonal'"
            class="status-chip status-chip--no-show"
            :class="{ 'status-chip--active': isStatusFilterActive('no_show') }"
            @click="toggleStatusFilter('no_show')"
          >
            Não compareceu: {{ statusCount('no_show') }}
          </v-chip>
          <v-chip
            size="small"
            :variant="isStatusFilterActive('canceled') ? 'flat' : 'tonal'"
            class="status-chip status-chip--canceled"
            :class="{ 'status-chip--active': isStatusFilterActive('canceled') }"
            @click="toggleStatusFilter('canceled')"
          >
            Cancelados: {{ statusCount('canceled') }}
          </v-chip>
        </div>
        <div class="toolbar-actions">
          <v-select v-if="isAdmin" v-model="selectedStaffId" :items="staffSelectItems" item-title="name" item-value="id"
            label="Agenda" variant="outlined" density="compact" hide-details class="staff-select" />
          <v-chip v-else-if="auth.user" color="secondary" variant="tonal">
            {{ auth.user.name }}
          </v-chip>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-calendar-plus" :block="smAndDown"
            @click="openCreateDialog">
            Novo agendamento
          </v-btn>
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

    <v-dialog v-model="createDialog" max-width="680">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">Novo agendamento</div>
            <div class="modal-subtitle">Crie um horário em nome do cliente.</div>
          </div>
          <v-icon icon="mdi-calendar-plus" />
        </div>
        <v-card-text class="form-grid">
          <v-select v-if="isAdmin" v-model="createForm.staff_id" :items="createStaffItems" item-title="name"
            item-value="id" label="Profissional" variant="outlined" hide-details="auto" />
          <v-text-field v-else :model-value="selectedCreateStaffLabel" label="Profissional" variant="outlined"
            prepend-inner-icon="mdi-account-tie" readonly />

          <v-autocomplete v-model="createForm.client_user_id" v-model:search="clientSearch" :items="clientOptions"
            item-title="name" item-value="id" label="Cliente" variant="outlined"
            :loading="loadingClientOptions" no-data-text="Nenhum cliente encontrado" hide-details="auto">
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.name"
                :subtitle="formatPhoneFromE164(item.raw.phone) || item.raw.email || 'Sem contato'" />
            </template>
            <template #selection="{ item }">
              {{ item.raw.name }}
            </template>
          </v-autocomplete>

          <v-select v-model="createForm.service_ids" :items="serviceOptions" item-title="name" item-value="id"
            label="Serviços" multiple chips variant="outlined" hide-details="auto" clearable />

          <v-date-input v-model="createForm.date" label="Data" variant="outlined" hide-details="auto" clearable />
          <v-select v-model="createForm.slot" :items="createSlotItems" item-title="label" item-value="value"
            label="Horário disponível" variant="outlined" :loading="loadingCreateSlots"
            no-data-text="Sem horários disponíveis" hide-details="auto" clearable />
          <div class="edit-summary">
            <div class="text-muted">Duração</div>
            <div>{{ createTotals.duration }} min</div>
            <div class="text-muted">Total</div>
            <div>{{ formatCurrencyBRL(createTotals.total) }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="createDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="creating" @click="saveCreate">Criar agendamento</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
        <v-card-text v-if="selectedAppointment" class="detail-content">
          <div class="detail-section detail-section--primary">
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Cliente</div>
                <div class="detail-value">{{ selectedAppointment.client?.name || 'Cliente' }}</div>
                <div class="detail-meta">
                  {{ formatPhoneFromE164(selectedAppointment.client?.phone) || 'Telefone não informado' }}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Horário</div>
                <div class="detail-value">{{ formatDateTime(selectedAppointment.start_at) }}</div>
                <div class="detail-meta">
                  {{ formatTimeRange(selectedAppointment.start_at, selectedAppointment.end_at) }}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total</div>
                <div class="detail-value">{{ formatCurrencyBRL(selectedAppointment.total_price) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">{{ statusLabel(selectedAppointment.status) }}</div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-label">Serviços</div>
            <div v-if="selectedAppointment.services?.length" class="detail-chips">
              <v-chip v-for="service in selectedAppointment.services" :key="service.id" size="small" color="secondary"
                variant="tonal">
                {{ service.name }}
              </v-chip>
            </div>
            <div v-else class="detail-meta">Nenhum serviço vinculado.</div>
          </div>

          <div class="detail-section">
            <div class="detail-label">Produtos adicionados</div>
            <div v-if="selectedAppointment.products?.length" class="detail-chips">
              <v-chip
                v-for="product in selectedAppointment.products"
                :key="`product-${product.id}`"
                size="small"
                color="primary"
                variant="tonal"
              >
                {{ product.name }} x{{ product.pivot?.quantity || 1 }}
              </v-chip>
            </div>
            <div v-else class="detail-meta">Nenhum produto adicional.</div>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions detail-actions">
          <div class="detail-actions-row">
            <v-btn variant="text" prepend-icon="mdi-close" :disabled="saving" @click="detailDialog = false">Fechar</v-btn>
            <v-menu v-if="isScheduledAppointment" v-model="detailOptionsMenu" location="top end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  color="secondary"
                  variant="tonal"
                  prepend-icon="mdi-dots-vertical"
                  :loading="saving"
                  :disabled="saving"
                >
                  Opções
                </v-btn>
              </template>
              <v-list density="compact" nav>
                <v-list-item prepend-icon="mdi-pencil-outline" title="Editar" :disabled="saving" @click="handleDetailOption('edit')" />
                <v-list-item prepend-icon="mdi-check-circle-outline" title="Finalizar" :disabled="saving" @click="handleDetailOption('done')" />
                <v-list-item prepend-icon="mdi-account-off-outline" title="Não compareceu" :disabled="saving" @click="handleDetailOption('no_show')" />
                <v-list-item prepend-icon="mdi-cancel" title="Cancelar" :disabled="saving" @click="handleDetailOption('cancel')" />
                <v-list-item prepend-icon="mdi-delete-outline" title="Deletar" base-color="error" :disabled="saving" @click="handleDetailOption('delete')" />
              </v-list>
            </v-menu>
            <v-btn
              v-else
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete-outline"
              :disabled="saving"
              @click="openDelete(selectedAppointment)"
            >
              Deletar
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="finalizeDialog" max-width="760">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">Finalizar agendamento</div>
            <div class="modal-subtitle">Adicione produtos vendidos para compor o valor final.</div>
          </div>
          <v-icon icon="mdi-check-circle-outline" />
        </div>
        <v-card-text class="form-grid">
          <div class="finalize-add-row">
            <v-autocomplete
              v-model="selectedFinalizeProductId"
              :items="sellableProducts"
              item-title="name"
              item-value="id"
              label="Adicionar produto"
              clearable
              variant="outlined"
              density="compact"
              no-data-text="Nenhum produto disponível"
              class="finalize-add-field"
            >
              <template #item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.raw.name"
                  :subtitle="`Estoque: ${item.raw.stock ?? '—'} · ${formatCurrencyBRL(item.raw.price)}`"
                />
              </template>
            </v-autocomplete>

            <v-btn
              color="secondary"
              variant="tonal"
              prepend-icon="mdi-plus"
              :disabled="!selectedFinalizeProductId"
              class="finalize-add-btn"
              @click="addFinalizeProduct"
            >
              Adicionar produto
            </v-btn>
          </div>

          <div v-if="!finalizeItems.length" class="detail-meta">
            Nenhum produto adicional selecionado.
          </div>

          <div v-else class="finalize-products-list">
            <div v-for="item in finalizeItems" :key="`finalize-${item.product_id}`" class="finalize-product-row">
              <div class="finalize-product-main">
                <div class="detail-value">{{ item.name }}</div>
                <div class="detail-meta">
                  {{ formatCurrencyBRL(item.price) }} · Estoque: {{ item.stock ?? '—' }}
                </div>
              </div>
              <v-text-field
                v-model.number="item.quantity"
                type="number"
                min="1"
                :max="item.stock ?? undefined"
                label="Qtd"
                variant="outlined"
                density="compact"
                hide-details
                class="finalize-qty-input"
              />
              <div class="finalize-product-total">
                {{ formatCurrencyBRL(item.quantity * item.price) }}
              </div>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                color="error"
                @click="removeFinalizeProduct(item.product_id)"
              />
            </div>
          </div>

          <div class="edit-summary">
            <div class="text-muted">Serviços</div>
            <div>{{ formatCurrencyBRL(selectedAppointment?.total_price || 0) }}</div>
            <div class="text-muted">Produtos</div>
            <div>{{ formatCurrencyBRL(finalizeProductsTotal) }}</div>
            <div class="text-muted">Total final</div>
            <div>{{ formatCurrencyBRL((selectedAppointment?.total_price || 0) + finalizeProductsTotal) }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" :disabled="saving" @click="finalizeDialog = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" :loading="isSavingAction('status_done')" :disabled="saving && !isSavingAction('status_done')" @click="confirmFinalize">
            Confirmar finalização
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
          <v-btn variant="text" :disabled="saving" @click="editDialog = false">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" :loading="isSavingAction('edit')" :disabled="saving && !isSavingAction('edit')" @click="saveEdit">Salvar</v-btn>
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
          <v-btn variant="text" :disabled="saving" @click="cancelDialog = false">Voltar</v-btn>
          <v-btn color="secondary" @click="confirmCancel" :loading="isSavingAction('cancel')" :disabled="saving && !isSavingAction('cancel')">
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
          <v-btn variant="text" :disabled="saving" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="isSavingAction('delete')" :disabled="saving && !isSavingAction('delete')" @click="confirmDelete">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import '@/styles/fullcalendar.css'
import api, { cachedGet } from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'
import { useAuthStore } from '@/stores/auth'
import { formatPhoneFromE164 } from '@/lib/phone'
import { formatCurrencyBRL } from '@/lib/currency'

const calendarRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const creating = ref(false)
const appointments = ref([])
const staffOptions = ref([])
const clientOptions = ref([])
const selectedStaffId = ref(null)
const createDialog = ref(false)
const detailDialog = ref(false)
const editDialog = ref(false)
const finalizeDialog = ref(false)
const cancelDialog = ref(false)
const deleteDialog = ref(false)
const cancelReason = ref('')
const clientSearch = ref('')
const loadingClientOptions = ref(false)
const selectedAppointment = ref(null)
const detailOptionsMenu = ref(false)
const serviceOptions = ref([])
const productOptions = ref([])
const finalizeItems = ref([])
const selectedFinalizeProductId = ref(null)
const createSlots = ref([])
const loadingCreateSlots = ref(false)
const hasInitializedStaffSelection = ref(false)
const savingAction = ref('')
const selectedStatusFilter = ref('')
const createForm = ref({
  client_user_id: null,
  staff_id: null,
  date: '',
  slot: '',
  service_ids: [],
})
const alerts = useAlertStore()
const auth = useAuthStore()
const { smAndDown } = useDisplay()
let clientSearchTimer = null
let clientRequestCounter = 0

const isAdmin = computed(() => ['admin', 'super_admin'].includes(auth.user?.role))

const staffSelectItems = computed(() => {
  if (!isAdmin.value) return []
  return [
    { id: 'mine', name: 'Minha agenda' },
    { id: 'all', name: 'Todos os colaboradores' },
    ...staffOptions.value.map((staff) => ({ id: staff.id, name: staff.name })),
  ]
})

const createStaffItems = computed(() => {
  if (!isAdmin.value) return []
  return staffOptions.value.map((staff) => ({ id: staff.id, name: staff.name }))
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

const isStatusFilterActive = (status) => selectedStatusFilter.value === status

const toggleStatusFilter = (status) => {
  selectedStatusFilter.value = selectedStatusFilter.value === status ? '' : status
  refetchEvents()
}

const resolveStaffIdForFilters = (value) => {
  if (value === 'mine') return auth.user?.id || null
  if (value === 'all') return null
  return value || null
}

const selectedCreateStaffLabel = computed(() => {
  const staffId = createForm.value.staff_id
  if (!staffId) return auth.user?.name || 'Colaborador'
  const staff = staffOptions.value.find((item) => item.id === staffId)
  return staff?.name || auth.user?.name || 'Colaborador'
})

const toLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

const toDateString = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return toLocalDateString(date)
}

const toTimeInput = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const buildStartAt = (date, time) => {
  const dateValue = toDateString(date)
  if (!dateValue || !time) return ''
  const safeTime = time.length === 5 ? `${time}:00` : time
  return `${dateValue}T${safeTime}`
}

const formatDateTime = (value) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const formatTimeRange = (start, end) => {
  const startTime = new Date(start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const endTime = new Date(end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${startTime} - ${endTime}`
}

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const canEdit = computed(() => selectedAppointment.value?.status === 'scheduled')
const canCancel = computed(() => selectedAppointment.value?.status === 'scheduled')
const canComplete = computed(() => selectedAppointment.value?.status === 'scheduled')
const isScheduledAppointment = computed(() => selectedAppointment.value?.status === 'scheduled')
const isSavingAction = (action) => saving.value && savingAction.value === action

const handleDetailOption = (action) => {
  detailOptionsMenu.value = false
  if (!selectedAppointment.value) return

  if (action === 'edit' && canEdit.value) {
    openEdit(selectedAppointment.value)
    return
  }
  if (action === 'done' && canComplete.value) {
    openFinalizeDialog(selectedAppointment.value)
    return
  }
  if (action === 'no_show' && canComplete.value) {
    updateStatus(selectedAppointment.value.id, 'no_show')
    return
  }
  if (action === 'cancel' && canCancel.value) {
    openCancel(selectedAppointment.value)
    return
  }
  if (action === 'delete') {
    openDelete(selectedAppointment.value)
  }
}

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

const createTotals = computed(() => {
  const selected = serviceOptions.value.filter((service) => createForm.value.service_ids.includes(service.id))
  return {
    duration: selected.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0),
    total: selected.reduce((sum, service) => sum + Number(service.price || 0), 0),
  }
})

const sellableProducts = computed(() =>
  productOptions.value.filter((product) => product.active !== false)
)

const finalizeProductsTotal = computed(() =>
  finalizeItems.value.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0)
)

const createSlotItems = computed(() =>
  createSlots.value.map((slot) => ({
    value: slot,
    label: formatTime(slot),
  }))
)

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
    let staffId = resolveStaffIdForFilters(selectedStaffId.value)
    if (!staffId && !isAdmin.value) {
      staffId = auth.user?.id
    }
    const params = new URLSearchParams({
      from,
      to,
      include_products: '1',
    })

    if (staffId) {
      params.set('staff_id', String(staffId))
    }

    const { data } = await api.get(`/api/staff/appointments?${params.toString()}`)
    appointments.value = Array.isArray(data) ? data : []
    const filteredAppointments = selectedStatusFilter.value
      ? appointments.value.filter((appointment) => appointment.status === selectedStatusFilter.value)
      : appointments.value
    successCallback(filteredAppointments.map(buildEvent))
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
      right: 'today',
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

const resetCreateForm = () => {
  createForm.value = {
    client_user_id: null,
    staff_id: null,
    date: '',
    slot: '',
    service_ids: [],
  }
  createSlots.value = []
}

const getDefaultCreateStaffId = () => {
  if (!isAdmin.value) return auth.user?.id || null
  const selected = resolveStaffIdForFilters(selectedStaffId.value)
  if (selected && staffOptions.value.some((staff) => staff.id === selected)) {
    return selected
  }
  return staffOptions.value[0]?.id || null
}

const loadClientOptions = async (search = '') => {
  const requestId = ++clientRequestCounter
  loadingClientOptions.value = true
  try {
    const params = { limit: 150 }
    if (search.trim()) {
      params.search = search.trim()
    }

    const { data } = await api.get('/api/staff/clients/options', { params })
    if (requestId !== clientRequestCounter) return
    clientOptions.value = Array.isArray(data) ? data : []
  } finally {
    if (requestId === clientRequestCounter) {
      loadingClientOptions.value = false
    }
  }
}

const loadCreateSlots = async () => {
  const staffId = isAdmin.value ? createForm.value.staff_id : auth.user?.id
  const date = toDateString(createForm.value.date)
  if (!staffId || !date || !createForm.value.service_ids.length) {
    createSlots.value = []
    createForm.value.slot = ''
    return
  }

  loadingCreateSlots.value = true
  try {
    const params = new URLSearchParams()
    params.append('staff_id', String(staffId))
    params.append('date', date)
    params.append('step_minutes', '30')
    createForm.value.service_ids.forEach((serviceId) => params.append('service_ids[]', String(serviceId)))

    const { data } = await api.get(`/api/availability?${params.toString()}`)
    createSlots.value = Array.isArray(data?.slots) ? data.slots : []
    if (!createSlots.value.includes(createForm.value.slot)) {
      createForm.value.slot = ''
    }
  } finally {
    loadingCreateSlots.value = false
  }
}

const openCreateDialog = async () => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
  }

  resetCreateForm()
  createForm.value.staff_id = getDefaultCreateStaffId()

  if (!createForm.value.staff_id) {
    alerts.warning('Nenhum profissional disponível para agendamento.')
    return
  }

  clientSearch.value = ''
  await Promise.all([
    loadClientOptions(),
    loadServiceOptions(createForm.value.staff_id),
  ])

  await loadCreateSlots()

  createDialog.value = true
}

const saveCreate = async () => {
  const staffId = isAdmin.value ? createForm.value.staff_id : auth.user?.id
  const clientUserId = createForm.value.client_user_id
  const startAt = createForm.value.slot

  if (!staffId) {
    alerts.warning('Selecione um profissional para criar o agendamento.')
    return
  }

  if (!clientUserId) {
    alerts.warning('Selecione um cliente para criar o agendamento.')
    return
  }

  if (!startAt) {
    alerts.warning('Selecione um horário disponível.')
    return
  }

  if (!createForm.value.service_ids.length) {
    alerts.warning('Selecione ao menos um serviço.')
    return
  }

  creating.value = true
  try {
    await api.post('/api/staff/appointments', {
      client_user_id: clientUserId,
      staff_id: staffId,
      start_at: startAt,
      service_ids: createForm.value.service_ids,
    })

    createDialog.value = false
    refetchEvents()
    alerts.success('Agendamento criado com sucesso.')
  } catch (error) {
    const status = error?.response?.status
    if (status === 409) {
      alerts.warning('Horário já reservado para esse profissional.')
    } else {
      alerts.error(error?.response?.data?.message || 'Não foi possível criar o agendamento.')
    }
  } finally {
    creating.value = false
  }
}

const openCancel = (appointment) => {
  selectedAppointment.value = appointment
  cancelReason.value = ''
  cancelDialog.value = true
}

const confirmCancel = async () => {
  if (!selectedAppointment.value) return
  savingAction.value = 'cancel'
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
    savingAction.value = ''
  }
}

const resetFinalizeForm = () => {
  finalizeItems.value = []
  selectedFinalizeProductId.value = null
}

const openFinalizeDialog = (appointment) => {
  selectedAppointment.value = appointment
  resetFinalizeForm()
  finalizeDialog.value = true
}

const addFinalizeProduct = () => {
  const productId = selectedFinalizeProductId.value
  if (!productId) return

  const product = sellableProducts.value.find((item) => item.id === productId)
  if (!product) {
    selectedFinalizeProductId.value = null
    return
  }

  const existing = finalizeItems.value.find((item) => item.product_id === product.id)
  if (existing) {
    const nextQuantity = Number(existing.quantity || 1) + 1
    if (product.stock !== null && product.stock !== undefined && nextQuantity > product.stock) {
      alerts.warning(`Estoque insuficiente para ${product.name}.`)
      return
    }
    existing.quantity = nextQuantity
    selectedFinalizeProductId.value = null
    return
  }

  if (product.stock !== null && product.stock !== undefined && Number(product.stock) < 1) {
    alerts.warning(`Sem estoque disponível para ${product.name}.`)
    selectedFinalizeProductId.value = null
    return
  }

  finalizeItems.value.push({
    product_id: product.id,
    name: product.name,
    price: Number(product.price || 0),
    stock: product.stock,
    quantity: 1,
  })
  selectedFinalizeProductId.value = null
}

const removeFinalizeProduct = (productId) => {
  finalizeItems.value = finalizeItems.value.filter((item) => item.product_id !== productId)
}

const normalizeFinalizeItems = () =>
  finalizeItems.value
    .map((item) => {
      const stockLimit = item.stock === null || item.stock === undefined ? null : Number(item.stock)
      const normalizedQty = Math.max(1, Number(item.quantity || 1))
      const quantity = stockLimit !== null ? Math.min(normalizedQty, stockLimit) : normalizedQty

      return {
        product_id: item.product_id,
        quantity,
      }
    })
    .filter((item) => item.product_id && Number(item.quantity) > 0)

const confirmFinalize = async () => {
  if (!selectedAppointment.value) return
  const updated = await updateStatus(selectedAppointment.value.id, 'done', {
    products: normalizeFinalizeItems(),
  })
  if (updated) {
    finalizeDialog.value = false
  }
}

const updateStatus = async (id, status, extraPayload = {}) => {
  savingAction.value = `status_${status}`
  saving.value = true
  try {
    const payload = { status }
    if (status === 'done') {
      payload.products = Array.isArray(extraPayload.products) ? extraPayload.products : normalizeFinalizeItems()
    }

    await api.post(`/api/staff/appointments/${id}/status`, payload)
    detailDialog.value = false
    if (status === 'done') {
      await loadProductOptions()
    }
    refetchEvents()
    alerts.success('Status atualizado.')
    return true
  } catch (error) {
    const validationErrors = error?.response?.data?.errors
    const firstValidationMessage = validationErrors
      ? Object.values(validationErrors).flat().find(Boolean)
      : ''
    alerts.error(firstValidationMessage || error?.response?.data?.message || 'Não foi possível atualizar o status.')
    return false
  } finally {
    saving.value = false
    savingAction.value = ''
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
  savingAction.value = 'edit'
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
    savingAction.value = ''
  }
}

const openDelete = (appointment) => {
  selectedAppointment.value = appointment
  deleteDialog.value = true
}

const confirmDelete = async () => {
  if (!selectedAppointment.value) return
  savingAction.value = 'delete'
  saving.value = true
  try {
    await api.delete(`/api/staff/appointments/${selectedAppointment.value.id}`)
    deleteDialog.value = false
    detailDialog.value = false
    refetchEvents()
    alerts.success('Agendamento excluído.')
  } finally {
    saving.value = false
    savingAction.value = ''
  }
}

const setServiceOptionsForStaff = (staffId) => {
  const staff = staffOptions.value.find((item) => item.id === staffId)
  if (staff) {
    serviceOptions.value = Array.isArray(staff.services) ? staff.services : []
    return true
  }
  return false
}

const loadStaffOptions = async () => {
  const { data } = await cachedGet('/api/staff', {}, { ttl: 20_000 })
  staffOptions.value = data
}

const loadServiceOptions = async (staffId) => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
  }
  if (staffId && setServiceOptionsForStaff(staffId)) {
    return
  }
  const { data } = await cachedGet('/api/services', {}, { ttl: 20_000 })
  serviceOptions.value = data
}

const loadProductOptions = async () => {
  const { data } = await cachedGet('/api/products?include_inactive=1', {}, { ttl: 10_000, force: true })
  productOptions.value = Array.isArray(data) ? data : []
}

onMounted(async () => {
  if (auth.token && !auth.user) {
    await auth.loadMe()
  }
  await Promise.all([loadStaffOptions(), loadProductOptions()])
  if (!selectedStaffId.value) {
    selectedStaffId.value = isAdmin.value ? 'all' : 'mine'
  }
})

onBeforeUnmount(() => {
  if (clientSearchTimer) {
    clearTimeout(clientSearchTimer)
  }
})

watch(
  () => selectedStaffId.value,
  async () => {
    const staffId = resolveStaffIdForFilters(selectedStaffId.value) || auth.user?.id
    if (staffId) {
      await loadServiceOptions(staffId)
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
      selectedStaffId.value = ['admin', 'super_admin'].includes(user.role) ? 'all' : 'mine'
    }
  },
  { immediate: true }
)

watch(
  () => createDialog.value,
  (isOpen) => {
    if (isOpen) return
    resetCreateForm()
    clientSearch.value = ''
  }
)

watch(
  () => createForm.value.staff_id,
  async (staffId, previous) => {
    if (!createDialog.value || staffId === previous) return
    createForm.value.service_ids = []
    createForm.value.slot = ''
    if (!staffId) {
      serviceOptions.value = []
      createSlots.value = []
      return
    }
    await loadServiceOptions(staffId)
    await loadCreateSlots()
  }
)

watch(clientSearch, (value) => {
  if (!createDialog.value) return
  if (clientSearchTimer) {
    clearTimeout(clientSearchTimer)
  }
  clientSearchTimer = setTimeout(() => {
    loadClientOptions(value)
  }, 280)
})

watch(
  () => createForm.value.date,
  async () => {
    if (!createDialog.value) return
    createForm.value.slot = ''
    await loadCreateSlots()
  }
)

watch(
  () => createForm.value.service_ids,
  async () => {
    if (!createDialog.value) return
    createForm.value.slot = ''
    await loadCreateSlots()
  },
  { deep: true }
)

watch(
  () => smAndDown.value,
  (isMobile) => {
    const calendarApi = calendarRef.value?.getApi()
    if (!calendarApi || !isMobile) return
    if (!calendarApi.view?.type?.startsWith('list')) {
      calendarApi.changeView('listWeek')
    }
  }
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
  cursor: pointer;
  font-weight: 600;
  border: 1px solid rgba(35, 58, 74, 0.1);
  color: rgba(32, 50, 65, 0.82);
  transition: all 0.18s ease;
}

.status-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(35, 58, 74, 0.12);
}

.status-chip--active {
  border: 1px solid rgba(35, 58, 74, 0.15);
  color: #203241;
  box-shadow: 0 0 0 2px rgba(35, 58, 74, 0.12);
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

.calendar-card :deep(.fc-list-day-cushion) {
  font-weight: 700;
  color: #2a3b48;
}

.calendar-card :deep(.fc-list-event-time) {
  color: rgba(32, 50, 65, 0.8);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.calendar-card :deep(.fc-list-event-title a) {
  color: #1f3342;
  font-weight: 600;
  line-height: 1.35;
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

.detail-content {
  display: grid;
  gap: 12px;
  padding-top: 14px;
}

.detail-section {
  border: 1px solid rgba(35, 58, 74, 0.14);
  border-radius: 14px;
  background: rgba(35, 58, 74, 0.03);
  padding: 12px 14px;
}

.detail-section--primary {
  background: linear-gradient(172deg, rgba(35, 58, 74, 0.06), rgba(35, 58, 74, 0.03));
}

.detail-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item {
  min-width: 0;
}

.detail-label {
  text-transform: uppercase;
  letter-spacing: 0.14em;
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
  margin-top: 10px;
}

.finalize-products-list {
  display: grid;
  gap: 10px;
}

.finalize-add-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.finalize-add-field {
  min-width: 0;
}

.finalize-add-btn {
  min-height: 40px;
}

.finalize-product-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 90px 130px auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(35, 58, 74, 0.14);
  border-radius: 12px;
  background: rgba(35, 58, 74, 0.03);
}

.finalize-product-main {
  min-width: 0;
}

.finalize-qty-input {
  min-width: 80px;
}

.finalize-product-total {
  font-weight: 600;
  text-align: right;
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

.detail-actions {
  display: flex;
  justify-content: flex-end;
}

.detail-actions-row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
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

  .calendar-card :deep(.fc-list-day-cushion) {
    padding: 10px 8px;
  }

  .calendar-card :deep(.fc-list-event td) {
    padding: 10px 8px;
  }

  .calendar-card :deep(.fc-list-event-graphic) {
    width: 18px;
    min-width: 18px;
    display: table-cell;
    padding-right: 2px;
  }

  .calendar-card :deep(.fc-list-event-dot) {
    border-width: 4px;
  }

  .calendar-card :deep(.fc-list-event-time) {
    min-width: 74px;
    width: 74px;
    font-size: 0.77rem;
    white-space: nowrap;
  }

  .calendar-card :deep(.fc-list-event-title a) {
    display: block;
    white-space: normal;
    word-break: break-word;
    font-size: 0.84rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .finalize-product-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .finalize-add-row {
    grid-template-columns: 1fr;
  }

  .finalize-add-btn {
    width: 100%;
  }

  .finalize-product-total {
    text-align: left;
  }

  .detail-actions-row {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .calendar-card :deep(.fc-list-event td) {
    padding: 9px 6px;
  }

  .calendar-card :deep(.fc-list-event-time) {
    min-width: 66px;
    width: 66px;
    font-size: 0.74rem;
  }

  .calendar-card :deep(.fc-list-event-title a) {
    font-size: 0.8rem;
    line-height: 1.3;
  }
}
</style>
