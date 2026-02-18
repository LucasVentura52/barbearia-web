<template>
  <v-container>
    <div class="section-title">
      <h2>Novo agendamento</h2>
    </div>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="glass-card" elevation="0">
          <v-card-text class="booking-panel">
            <div class="section-label">Dados principais</div>
            <v-select v-model="selectedStaff" :items="staffOptions" item-title="name" item-value="id"
              label="Escolha o barbeiro" variant="outlined" required />
            <v-select v-model="selectedServices" :items="availableServices" item-title="name" item-value="id"
              label="Serviços" multiple chips variant="outlined" required :disabled="!availableServices.length" />
            <v-date-input v-model="selectedDate" label="Data" variant="outlined" required />
            <v-btn color="primary" size="large" :loading="loading" :block="smAndDown" @click="loadAvailability">
              Buscar horários
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="glass-card mt-6" elevation="0">
          <v-card-text class="summary-card">
            <div class="section-label">Resumo</div>
            <div class="summary-row">
              <div class="text-muted">Serviços</div>
              <div>{{ selectedServices.length }}</div>
            </div>
            <div class="summary-row">
              <div class="text-muted">Tempo total</div>
              <div>{{ totalDuration }} min</div>
            </div>
            <div class="summary-row">
              <div class="text-muted">Total</div>
              <div class="summary-price">{{ formatCurrencyBRL(totalPrice) }}</div>
            </div>
            <v-divider class="my-4" />
            <div class="summary-staff">
              <div class="summary-avatar">
                <v-img v-if="staffAvatarSrc" :src="staffAvatarSrc" cover class="summary-avatar__img" />
                <div v-else>{{ selectedStaffData?.name?.slice(0, 1) || '?' }}</div>
              </div>
              <div>
                <div class="summary-name">{{ selectedStaffData?.name || 'Barbeiro' }}</div>
                <div class="text-muted">{{ selectedStaffData?.profile?.bio || 'Equipe premium' }}</div>
                <div class="summary-phone">
                  {{ staffPhoneText || 'Telefone não informado' }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="slots-header">
              <div>
                <div class="slots-title">Horários disponíveis</div>
                <div class="text-muted">Selecione um horário para confirmar.</div>
              </div>
              <v-chip color="secondary" variant="tonal">
                {{ slots.length }} opções
              </v-chip>
            </div>

            <div v-if="slots.length" class="slots-grid">
              <v-chip v-for="slot in slots" :key="slot" :color="slot === selectedSlot ? 'primary' : 'secondary'"
                :variant="slot === selectedSlot ? 'flat' : 'tonal'" class="slot-chip" @click="selectedSlot = slot">
                {{ formatSlot(slot) }}
              </v-chip>
            </div>
            <v-alert v-else type="info" variant="tonal" class="empty-slots">
              Nenhum horário encontrado. Ajuste a data ou serviços.
            </v-alert>

            <v-divider class="my-6" />

            <v-alert v-if="message" type="success" variant="tonal" class="mb-4">
              {{ message }}
            </v-alert>

            <div class="confirm-row">
              <div class="text-muted">
                Total: <strong>{{ formatCurrencyBRL(totalPrice) }}</strong>
              </div>
              <v-btn color="primary" size="large" :block="smAndDown" :disabled="!selectedSlot" :loading="saving"
                @click="confirmBooking">
                Confirmar
              </v-btn>
            </div>
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
import { resolveMediaUrl } from '@/lib/media'
import { formatPhoneFromE164 } from '@/lib/phone'
import { formatCurrencyBRL } from '@/lib/currency'
import { useAlertStore } from '@/stores/alerts'

const toLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().split('T')[0]
}

const toDateString = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return toLocalDateString(date)
}

const staffOptions = ref([])
const alerts = useAlertStore()
const { smAndDown } = useDisplay()

const selectedStaff = ref(null)
const selectedServices = ref([])
const selectedDate = ref(toLocalDateString(new Date()))
const stepMinutes = 30

const slots = ref([])
const selectedSlot = ref(null)
const loading = ref(false)
const saving = ref(false)
const message = ref('')

const selectedStaffData = computed(() =>
  staffOptions.value.find((staff) => staff.id === selectedStaff.value)
)

const availableServices = computed(() => selectedStaffData.value?.services || [])

const staffAvatarSrc = computed(() => resolveMediaUrl(selectedStaffData.value?.avatar_url))
const staffPhoneText = computed(() => formatPhoneFromE164(selectedStaffData.value?.phone))

const totalPrice = computed(() =>
  availableServices.value
    .filter((service) => selectedServices.value.includes(service.id))
    .reduce((sum, service) => sum + Number(service.price), 0)
)

const totalDuration = computed(() =>
  availableServices.value
    .filter((service) => selectedServices.value.includes(service.id))
    .reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0)
)

const formatSlot = (iso) => {
  const date = new Date(iso)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const loadAvailability = async () => {
  if (!selectedStaff.value || selectedServices.value.length === 0) {
    slots.value = []
    alerts.warning('Selecione um barbeiro e pelo menos um serviço.')
    return
  }
  loading.value = true
  selectedSlot.value = null
  message.value = ''
  try {
    const params = new URLSearchParams()
    params.append('staff_id', selectedStaff.value)
    const dateParam = toDateString(selectedDate.value)
    if (!dateParam) {
      alerts.warning('Selecione uma data válida.')
      return
    }
    params.append('date', dateParam)
    params.append('step_minutes', stepMinutes)
    selectedServices.value.forEach((id) => params.append('service_ids[]', id))

    const { data } = await api.get(`/api/availability?${params.toString()}`)
    slots.value = data.slots || []
    if (!slots.value.length) {
      alerts.info('Nenhum horário disponível para essa data.')
    }
  } finally {
    loading.value = false
  }
}

const confirmBooking = async () => {
  if (!selectedSlot.value) return
  saving.value = true
  try {
    await api.post('/api/appointments', {
      staff_id: selectedStaff.value,
      start_at: selectedSlot.value,
      service_ids: selectedServices.value,
    })
    message.value = 'Agendamento confirmado com sucesso!'
    alerts.success('Agendamento confirmado com sucesso!')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const { data } = await api.get('/api/staff')
  staffOptions.value = data
  if (staffOptions.value.length) {
    selectedStaff.value = staffOptions.value[0].id
  }
})

const resetSlots = () => {
  slots.value = []
  selectedSlot.value = null
  message.value = ''
}

watch(selectedStaff, () => {
  const allowed = new Set(availableServices.value.map((service) => service.id))
  selectedServices.value = selectedServices.value.filter((id) => allowed.has(id))
  resetSlots()
})

watch(
  () => [selectedServices.value, selectedDate.value],
  () => resetSlots(),
  { deep: true }
)
</script>

<style scoped>
.booking-panel {
  display: grid;
  gap: 16px;
}

.summary-card {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-price {
  font-family: var(--display-font);
  font-size: 1.2rem;
}

.summary-staff {
  display: flex;
  gap: 12px;
  align-items: center;
}

.summary-avatar {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(35, 58, 74, 0.08);
  display: grid;
  place-items: center;
  font-weight: 600;
}

.summary-avatar__img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.summary-name {
  font-weight: 600;
}

.summary-phone {
  font-size: 0.85rem;
  color: var(--ink-500);
}

.staff-option {
  padding-block: 8px;
}

.staff-option__avatar {
  background: rgba(35, 58, 74, 0.08);
  font-weight: 600;
  border-radius: 12px;
  overflow: hidden;
}

.staff-option__name {
  font-weight: 600;
}

.staff-option__meta {
  color: var(--ink-500);
}

.staff-selection {
  display: flex;
  align-items: center;
  gap: 10px;
}

.staff-selection__avatar {
  background: rgba(35, 58, 74, 0.08);
  font-weight: 600;
  border-radius: 10px;
  overflow: hidden;
}

.staff-selection__info {
  display: grid;
  line-height: 1.1;
}

.staff-selection__name {
  font-weight: 600;
}

.staff-selection__phone {
  font-size: 0.8rem;
  color: var(--ink-500);
}

.slots-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.slots-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.slots-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.slot-chip {
  cursor: pointer;
}

.empty-slots {
  padding: 32px 0;
  color: var(--ink-500);
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
