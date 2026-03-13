<template>
  <v-row class="mb-6">
    <v-col cols="12" lg="8">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="warning" variant="tonal">
              <v-icon icon="mdi-monitor-dashboard" />
            </v-avatar>
          </template>
          <v-card-title>Operação do dia</v-card-title>
          <v-card-subtitle>Agenda real por status, agora com edição e finalização completas.</v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-date-input v-model="selectedDate" label="Data da agenda" />
            </v-col>
            <v-col v-if="auth.isAdmin" cols="12" md="4">
              <v-select
                v-model="selectedStaffId"
                :items="staffOptions"
                item-title="title"
                item-value="value"
                label="Profissional"
              />
            </v-col>
            <v-col cols="12" :md="auth.isAdmin ? 4 : 8" class="d-flex align-end">
              <v-btn color="secondary" block :loading="loading" @click="loadAppointments">
                Atualizar agenda
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" lg="4">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-chart-donut" />
            </v-avatar>
          </template>
          <v-card-title>Resumo do turno</v-card-title>
          <v-card-subtitle>Leitura derivada dos agendamentos carregados.</v-card-subtitle>
        </v-card-item>

        <v-card-text class="d-flex flex-column ga-3">
          <v-alert icon="mdi-calendar-check-outline" color="primary">
            Agendados: {{ columns[0].items.length }}
          </v-alert>
          <v-alert icon="mdi-check-circle-outline" color="success">
            Concluídos: {{ columns[1].items.length }} · {{ formatCurrencyBRL(realizedRevenue) }}
          </v-alert>
          <v-alert icon="mdi-cancel" color="warning">
            Cancelados ou falta: {{ columns[2].items.length + columns[3].items.length }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mb-6">
    <v-col v-for="column in columns" :key="column.status" cols="12" md="6" xl="3">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar :color="column.color" variant="tonal">
              <v-icon :icon="column.icon" />
            </v-avatar>
          </template>
          <v-card-title>{{ column.title }}</v-card-title>
          <v-card-subtitle>{{ column.items.length }} item(ns)</v-card-subtitle>
        </v-card-item>

        <v-card-text class="d-flex flex-column ga-3">
          <v-sheet
            v-for="appointment in column.items"
            :key="appointment.id"
            class="board-ticket"
            color="surface"
            border
            @click="openAppointment(appointment)"
          >
            <div class="d-flex align-center justify-space-between ga-3 mb-3">
              <div class="text-subtitle-1 font-weight-bold">
                {{ appointment.client?.name || 'Cliente' }}
              </div>
              <v-chip :color="column.color" variant="tonal">{{ formatTime(appointment.start_at) }}</v-chip>
            </div>
            <div class="text-body-2 text-medium-emphasis mb-3">
              {{ appointment.services?.map((service) => service.name).join(', ') || 'Sem serviços' }}
            </div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip size="small" variant="outlined">{{ appointment.staff?.name || 'Profissional' }}</v-chip>
              <v-chip size="small" variant="outlined">{{ formatCurrencyBRL(appointment.total_price) }}</v-chip>
            </div>
          </v-sheet>

          <v-alert v-if="!column.items.length" :color="column.color" variant="tonal" density="compact">
            Nenhum registro com status {{ column.title.toLowerCase() }}.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12" lg="7">
      <v-card class="glass-panel">
        <v-card-item>
          <template #prepend>
            <v-avatar color="primary" variant="tonal">
              <v-icon icon="mdi-format-list-bulleted" />
            </v-avatar>
          </template>
          <v-card-title>Timeline da agenda</v-card-title>
          <v-card-subtitle>Ordem cronológica do dia carregado.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <v-timeline v-if="sortedAppointments.length" density="compact" side="end" class="timeline-compact">
            <v-timeline-item
              v-for="appointment in sortedAppointments"
              :key="appointment.id"
              :dot-color="statusMeta(appointment.status).color"
              size="small"
            >
              <template #opposite>
                <div class="text-caption text-medium-emphasis">{{ formatTimeRange(appointment.start_at, appointment.end_at) }}</div>
              </template>
              <div class="text-subtitle-1 font-weight-bold">{{ appointment.client?.name || 'Cliente' }}</div>
              <div class="text-body-2 text-medium-emphasis">
                {{ appointment.services?.map((service) => service.name).join(', ') || 'Sem serviços' }}
              </div>
            </v-timeline-item>
          </v-timeline>
          <v-alert v-else icon="mdi-calendar-blank-outline" color="warning">
            Nenhum agendamento encontrado na data selecionada.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" lg="5">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="accent" variant="tonal">
              <v-icon icon="mdi-lightning-bolt-outline" />
            </v-avatar>
          </template>
          <v-card-title>Ações rápidas</v-card-title>
          <v-card-subtitle>O detalhe do agendamento agora cobre o ciclo operacional inteiro.</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-alert icon="mdi-pencil-outline" color="secondary">
            Agendados podem ser editados com nova data, novo horário e nova composição de serviços.
          </v-alert>
          <v-alert icon="mdi-package-variant-closed" color="success">
            A finalização já aceita produtos adicionais e recalcula o valor final.
          </v-alert>
          <v-btn color="secondary" size="large" :to="{ name: 'booking-studio' }">
            Criar novo agendamento
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="detailDialog" max-width="760">
    <v-card v-if="selectedAppointment">
      <v-card-item>
        <template #prepend>
          <v-avatar :color="statusMeta(selectedAppointment.status).color" variant="tonal">
            <v-icon :icon="statusMeta(selectedAppointment.status).icon" />
          </v-avatar>
        </template>
        <v-card-title>{{ selectedAppointment.client?.name || 'Cliente' }}</v-card-title>
        <v-card-subtitle>{{ statusMeta(selectedAppointment.status).title }}</v-card-subtitle>
      </v-card-item>

      <v-divider />

      <v-card-text class="d-flex flex-column ga-4">
        <v-sheet color="surface-variant" class="pa-4" border>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-overline">Horário</div>
              <div class="text-body-1">{{ formatDateTime(selectedAppointment.start_at) }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ formatTimeRange(selectedAppointment.start_at, selectedAppointment.end_at) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-overline">Profissional</div>
              <div class="text-body-1">{{ selectedAppointment.staff?.name || 'Não informado' }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ formatCurrencyBRL(selectedAppointment.total_price) }}</div>
            </v-col>
          </v-row>
        </v-sheet>

        <div>
          <div class="text-overline mb-2">Serviços</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="service in selectedAppointment.services || []"
              :key="service.id"
              color="secondary"
              variant="tonal"
            >
              {{ service.name }}
            </v-chip>
          </div>
        </div>

        <div v-if="selectedAppointment.products?.length">
          <div class="text-overline mb-2">Produtos</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="product in selectedAppointment.products"
              :key="product.id"
              color="accent"
              variant="tonal"
            >
              {{ product.name }} x{{ product.pivot?.quantity || 1 }}
            </v-chip>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="detailDialog = false">Fechar</v-btn>
        <v-btn
          v-if="selectedAppointment.status === 'scheduled'"
          color="secondary"
          variant="tonal"
          :loading="actionLoading"
          @click="openEditDialog"
        >
          Editar
        </v-btn>
        <v-btn
          v-if="selectedAppointment.status === 'scheduled'"
          color="success"
          variant="tonal"
          :loading="actionLoading"
          @click="openFinalizeDialog"
        >
          Finalizar
        </v-btn>
        <v-btn
          v-if="selectedAppointment.status === 'scheduled'"
          color="warning"
          variant="tonal"
          :loading="actionLoading"
          @click="updateStatus('no_show')"
        >
          Não compareceu
        </v-btn>
        <v-btn
          v-if="selectedAppointment.status === 'scheduled'"
          color="warning"
          variant="outlined"
          :loading="actionLoading"
          @click="cancelDialog = true"
        >
          Cancelar
        </v-btn>
        <v-btn color="error" variant="text" :loading="actionLoading" @click="deleteAppointment">
          Excluir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editDialog" max-width="700">
    <v-card>
      <v-card-item>
        <v-card-title>Editar agendamento</v-card-title>
        <v-card-subtitle>Nova data, novo horário e nova composição de serviços.</v-card-subtitle>
      </v-card-item>
      <v-divider />
      <v-card-text class="d-flex flex-column ga-4">
        <v-row>
          <v-col cols="12" md="6">
            <v-date-input v-model="editForm.date" label="Data" />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="editForm.slot"
              :items="editSlotItems"
              item-title="label"
              item-value="value"
              label="Horário disponível"
              :loading="editSlotsLoading"
              no-data-text="Sem horários disponíveis"
            />
          </v-col>
        </v-row>

        <v-select
          v-model="editForm.serviceIds"
          :items="editServiceOptions"
          item-title="name"
          item-value="id"
          label="Serviços"
          multiple
          chips
        />

        <v-sheet color="surface-variant" class="pa-4" border>
          <div class="d-flex justify-space-between ga-4 mb-2">
            <span class="text-body-2 text-medium-emphasis">Duração</span>
            <strong>{{ editTotals.duration }} min</strong>
          </div>
          <div class="d-flex justify-space-between ga-4">
            <span class="text-body-2 text-medium-emphasis">Total</span>
            <strong>{{ formatCurrencyBRL(editTotals.total) }}</strong>
          </div>
        </v-sheet>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="editDialog = false">Fechar</v-btn>
        <v-btn color="secondary" :loading="actionLoading" @click="saveEdit">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="finalizeDialog" max-width="760">
    <v-card>
      <v-card-item>
        <v-card-title>Finalizar agendamento</v-card-title>
        <v-card-subtitle>Adicione produtos vendidos para compor o valor final.</v-card-subtitle>
      </v-card-item>
      <v-divider />
      <v-card-text class="d-flex flex-column ga-4">
        <div class="d-flex flex-column flex-md-row ga-3">
          <v-autocomplete
            v-model="selectedFinalizeProductId"
            :items="sellableProducts"
            item-title="name"
            item-value="id"
            label="Adicionar produto"
            no-data-text="Nenhum produto disponível"
            class="flex-grow-1"
          >
            <template #item="{ props, item }">
              <v-list-item
                v-bind="props"
                :title="item.raw.name"
                :subtitle="`Estoque: ${item.raw.stock ?? '—'} · ${formatCurrencyBRL(item.raw.price)}`"
              />
            </template>
          </v-autocomplete>
          <v-btn color="secondary" variant="tonal" class="align-self-md-center" @click="addFinalizeProduct">
            Adicionar
          </v-btn>
        </div>

        <v-alert v-if="!finalizeItems.length" icon="mdi-package-variant-closed" color="secondary">
          Nenhum produto adicional selecionado.
        </v-alert>

        <div v-else class="d-flex flex-column ga-3">
          <v-sheet
            v-for="item in finalizeItems"
            :key="item.product_id"
            class="pa-4"
            color="surface-variant"
            border
          >
            <div class="d-flex flex-column flex-md-row align-md-center ga-3">
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-bold">{{ item.name }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ formatCurrencyBRL(item.price) }} · Estoque: {{ item.stock ?? '—' }}
                </div>
              </div>
              <v-text-field
                v-model.number="item.quantity"
                type="number"
                min="1"
                :max="item.stock ?? undefined"
                label="Qtd"
                class="finalize-qty-input"
              />
              <div class="text-subtitle-1 font-weight-bold">
                {{ formatCurrencyBRL(Number(item.quantity || 0) * Number(item.price || 0)) }}
              </div>
              <v-btn icon variant="text" color="error" @click="removeFinalizeProduct(item.product_id)">
                <v-icon icon="mdi-delete-outline" />
              </v-btn>
            </div>
          </v-sheet>
        </div>

        <v-sheet color="surface-variant" class="pa-4" border>
          <div class="d-flex justify-space-between ga-4 mb-2">
            <span class="text-body-2 text-medium-emphasis">Serviços</span>
            <strong>{{ formatCurrencyBRL(selectedAppointment?.total_price || 0) }}</strong>
          </div>
          <div class="d-flex justify-space-between ga-4 mb-2">
            <span class="text-body-2 text-medium-emphasis">Produtos</span>
            <strong>{{ formatCurrencyBRL(finalizeProductsTotal) }}</strong>
          </div>
          <div class="d-flex justify-space-between ga-4">
            <span class="text-body-2 text-medium-emphasis">Total final</span>
            <strong>{{ formatCurrencyBRL((selectedAppointment?.total_price || 0) + finalizeProductsTotal) }}</strong>
          </div>
        </v-sheet>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="finalizeDialog = false">Fechar</v-btn>
        <v-btn color="success" :loading="actionLoading" @click="confirmFinalize">Confirmar finalização</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="cancelDialog" max-width="520">
    <v-card>
      <v-card-item>
        <v-card-title>Cancelar agendamento</v-card-title>
        <v-card-subtitle>Informe o motivo para registrar o cancelamento.</v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-textarea v-model="cancelReason" label="Motivo" rows="3" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancelDialog = false">Fechar</v-btn>
        <v-btn color="warning" :loading="actionLoading" @click="confirmCancel">Confirmar cancelamento</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatDateTime, formatTime, formatTimeRange, toApiDate } from '@/lib/dates'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(false)
const actionLoading = ref(false)
const editSlotsLoading = ref(false)
const selectedDate = ref(new Date())
const selectedStaffId = ref(null)
const staff = ref([])
const appointments = ref([])
const productOptions = ref([])
const detailDialog = ref(false)
const finalizeDialog = ref(false)
const editDialog = ref(false)
const cancelDialog = ref(false)
const cancelReason = ref('')
const selectedAppointment = ref(null)
const selectedFinalizeProductId = ref(null)
const finalizeItems = ref([])
const editSlots = ref([])
const editForm = ref({
  date: null,
  slot: '',
  serviceIds: [],
})

const statusMap = {
  scheduled: { title: 'Agendados', color: 'primary', icon: 'mdi-calendar-clock-outline' },
  done: { title: 'Concluídos', color: 'success', icon: 'mdi-check-circle-outline' },
  canceled: { title: 'Cancelados', color: 'warning', icon: 'mdi-cancel' },
  no_show: { title: 'Faltas', color: 'error', icon: 'mdi-account-off-outline' },
}

const statusMeta = (status) => statusMap[status] || statusMap.scheduled

const buildAvailabilityParams = ({ staffId, date, serviceIds }) => {
  const params = new URLSearchParams()
  params.append('staff_id', String(staffId))
  params.append('date', String(date))
  serviceIds.forEach((serviceId) => params.append('service_ids[]', String(serviceId)))
  return params
}

const staffOptions = computed(() => [
  { title: 'Toda a equipe', value: null },
  ...staff.value.map((item) => ({ title: item.name, value: item.id })),
])

const sortedAppointments = computed(() =>
  [...appointments.value].sort((left, right) => new Date(left.start_at) - new Date(right.start_at))
)

const columns = computed(() =>
  ['scheduled', 'done', 'canceled', 'no_show'].map((status) => ({
    status,
    title: statusMeta(status).title,
    color: statusMeta(status).color,
    icon: statusMeta(status).icon,
    items: sortedAppointments.value.filter((appointment) => appointment.status === status),
  }))
)

const realizedRevenue = computed(() =>
  appointments.value
    .filter((appointment) => appointment.status === 'done')
    .reduce((total, appointment) => total + Number(appointment.total_price || 0), 0)
)

const appointmentStaffId = computed(() => selectedAppointment.value?.staff?.id || selectedAppointment.value?.staff_user_id || null)

const editServiceOptions = computed(() => {
  if (!appointmentStaffId.value) return selectedAppointment.value?.services || []
  return staff.value.find((person) => person.id === appointmentStaffId.value)?.services || selectedAppointment.value?.services || []
})

const editTotals = computed(() => {
  const selectedServices = editServiceOptions.value.filter((service) => editForm.value.serviceIds.includes(service.id))
  return {
    duration: selectedServices.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0),
    total: selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0),
  }
})

const editSlotItems = computed(() => {
  const slots = [...editSlots.value]
  const currentStartAt = selectedAppointment.value?.start_at
  if (
    currentStartAt &&
    toApiDate(editForm.value.date) === toApiDate(currentStartAt) &&
    !slots.includes(currentStartAt)
  ) {
    slots.unshift(currentStartAt)
  }

  return [...new Set(slots)].sort().map((slot) => ({
    value: slot,
    label: formatTime(slot),
  }))
})

const sellableProducts = computed(() =>
  productOptions.value.filter((product) => product.active !== false)
)

const finalizeProductsTotal = computed(() =>
  finalizeItems.value.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0)
)

const loadStaff = async () => {
  const { data } = await api.get('/api/staff', { params: { limit: 200 } })
  staff.value = Array.isArray(data) ? data : []
}

const loadProducts = async () => {
  const { data } = await api.get('/api/products', {
    params: {
      include_inactive: true,
      limit: 200,
    },
  })
  productOptions.value = Array.isArray(data) ? data : []
}

const loadAppointments = async () => {
  loading.value = true

  try {
    const params = {
      date: toApiDate(selectedDate.value),
      include_products: true,
    }
    if (auth.isAdmin && selectedStaffId.value) {
      params.staff_id = selectedStaffId.value
    }

    const { data } = await api.get('/api/staff/appointments', { params })
    appointments.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

const openAppointment = (appointment) => {
  selectedAppointment.value = appointment
  detailDialog.value = true
}

const refreshAfterAction = async () => {
  detailDialog.value = false
  finalizeDialog.value = false
  editDialog.value = false
  cancelDialog.value = false
  cancelReason.value = ''
  finalizeItems.value = []
  selectedFinalizeProductId.value = null
  await Promise.all([
    loadAppointments(),
    loadProducts(),
  ])
}

const updateStatus = async (status, extraPayload = {}) => {
  if (!selectedAppointment.value) return

  actionLoading.value = true
  try {
    const payload = { status }
    if (status === 'done') {
      payload.products = Array.isArray(extraPayload.products) ? extraPayload.products : []
    }

    await api.post(`/api/staff/appointments/${selectedAppointment.value.id}/status`, payload)
    ui.notify('Status do agendamento atualizado.', 'success')
    await refreshAfterAction()
  } finally {
    actionLoading.value = false
  }
}

const openFinalizeDialog = () => {
  finalizeItems.value = []
  selectedFinalizeProductId.value = null
  finalizeDialog.value = true
}

const addFinalizeProduct = () => {
  const product = sellableProducts.value.find((item) => item.id === selectedFinalizeProductId.value)
  if (!product) return

  const existing = finalizeItems.value.find((item) => item.product_id === product.id)
  if (existing) {
    const nextQuantity = Number(existing.quantity || 1) + 1
    if (product.stock !== null && product.stock !== undefined && nextQuantity > Number(product.stock)) {
      ui.notify(`Estoque insuficiente para ${product.name}.`, 'warning')
      return
    }
    existing.quantity = nextQuantity
    selectedFinalizeProductId.value = null
    return
  }

  if (product.stock !== null && product.stock !== undefined && Number(product.stock) < 1) {
    ui.notify(`Sem estoque disponível para ${product.name}.`, 'warning')
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
  await updateStatus('done', { products: normalizeFinalizeItems() })
}

const loadEditAvailability = async () => {
  if (!appointmentStaffId.value || !editForm.value.date || !editForm.value.serviceIds.length) {
    editSlots.value = []
    editForm.value.slot = ''
    return
  }

  editSlotsLoading.value = true
  try {
    const params = buildAvailabilityParams({
      staffId: appointmentStaffId.value,
      date: toApiDate(editForm.value.date),
      serviceIds: editForm.value.serviceIds,
    })

    const { data } = await api.get(`/api/availability?${params.toString()}`)
    editSlots.value = Array.isArray(data?.slots) ? data.slots : []
    if (!editSlotItems.value.some((item) => item.value === editForm.value.slot)) {
      editForm.value.slot = ''
    }
  } finally {
    editSlotsLoading.value = false
  }
}

const openEditDialog = async () => {
  if (!selectedAppointment.value) return

  editForm.value = {
    date: new Date(selectedAppointment.value.start_at),
    slot: selectedAppointment.value.start_at,
    serviceIds: selectedAppointment.value.services?.map((service) => service.id) || [],
  }
  editDialog.value = true
  await loadEditAvailability()
}

const saveEdit = async () => {
  if (!selectedAppointment.value) return
  if (!editForm.value.slot || !editForm.value.serviceIds.length) {
    ui.notify('Selecione horário e serviços válidos.', 'warning')
    return
  }

  actionLoading.value = true
  try {
    await api.put(`/api/staff/appointments/${selectedAppointment.value.id}`, {
      start_at: editForm.value.slot,
      service_ids: editForm.value.serviceIds,
    })
    ui.notify('Agendamento atualizado.', 'success')
    await refreshAfterAction()
  } finally {
    actionLoading.value = false
  }
}

const confirmCancel = async () => {
  if (!selectedAppointment.value || !cancelReason.value.trim()) {
    ui.notify('Informe o motivo do cancelamento.', 'warning')
    return
  }

  actionLoading.value = true
  try {
    await api.post(`/api/staff/appointments/${selectedAppointment.value.id}/cancel`, {
      reason: cancelReason.value.trim(),
    })
    ui.notify('Agendamento cancelado.', 'success')
    await refreshAfterAction()
  } finally {
    actionLoading.value = false
  }
}

const deleteAppointment = async () => {
  if (!selectedAppointment.value) return
  if (!window.confirm('Deseja realmente excluir este agendamento?')) return

  actionLoading.value = true
  try {
    await api.delete(`/api/staff/appointments/${selectedAppointment.value.id}`)
    ui.notify('Agendamento excluído.', 'success')
    await refreshAfterAction()
  } finally {
    actionLoading.value = false
  }
}

watch(
  [() => editForm.value.date, () => editForm.value.serviceIds],
  () => {
    if (!editDialog.value) return
    loadEditAvailability()
  },
  { deep: true }
)

onMounted(async () => {
  await Promise.all([
    loadStaff(),
    loadProducts(),
  ])
  await loadAppointments()
})
</script>
