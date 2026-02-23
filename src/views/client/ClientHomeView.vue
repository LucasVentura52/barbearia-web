<template>
  <div class="client-chat-page">
    <div class="chat-shell">
      <header class="chat-header">
        <div class="chat-agent">
          <div class="agent-avatar">IA</div>
          <div>
            <div class="agent-title">Assistente de agendamento</div>
            <div class="agent-subtitle">{{ companyName }}</div>
          </div>
        </div>
        <div class="header-actions">
          <v-chip size="small" color="success" variant="tonal" class="agent-chip">
            Online agora
          </v-chip>
          <v-btn variant="outlined" color="primary" size="small" prepend-icon="mdi-refresh" @click="beginConversation">
            Reiniciar
          </v-btn>
        </div>
      </header>

      <div ref="chatBodyRef" class="chat-body">
        <transition-group name="bubble">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-row"
            :class="`message-row--${message.role}`"
          >
            <div class="message-bubble" :class="`message-bubble--${message.role}`">
              {{ message.text }}
            </div>
            <div class="message-time">{{ formatMessageTime(message.sentAt) }}</div>
          </div>
        </transition-group>

        <div v-if="assistantTyping" class="typing-row">
          <div class="typing-bubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div class="message-row message-row--bot inline-options-row">
          <div class="inline-options-card">
            <div class="inline-options-title">{{ panelTitle }}</div>

            <template v-if="state === 'menu'">
              <div class="action-grid">
                <v-btn color="primary" size="large" prepend-icon="mdi-calendar-check-outline" @click="startBooking">
                  Novo agendamento
                </v-btn>
                <v-btn color="secondary" variant="tonal" size="large" prepend-icon="mdi-content-cut" @click="openServices">
                  Ver serviços
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="primary"
                  size="large"
                  prepend-icon="mdi-calendar-clock-outline"
                  @click="openAppointments"
                >
                  Meus horários
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="primary"
                  size="large"
                  prepend-icon="mdi-account-outline"
                  @click="openProfile"
                >
                  Meu perfil
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'auth-required'">
              <v-alert type="info" variant="tonal" class="mb-4">
                Faça login para continuar com essa ação.
              </v-alert>
              <div class="panel-actions">
                <v-btn color="primary" size="large" prepend-icon="mdi-login" @click="goToLogin">
                  Ir para login
                </v-btn>
                <v-btn variant="outlined" color="primary" size="large" prepend-icon="mdi-arrow-left" @click="goToMenu">
                  Voltar ao menu
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'booking-staff'">
              <div v-if="loadingCatalog" class="loading-box">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <template v-else>
                <div class="choice-grid">
                  <button
                    v-for="staff in staffOptions"
                    :key="staff.id"
                    type="button"
                    class="choice-card"
                    @click="chooseStaff(staff)"
                  >
                    <v-avatar size="44" class="choice-avatar">
                      <v-img v-if="staff.avatar_url" :src="resolveMediaUrl(staff.avatar_url)" cover />
                      <span v-else>{{ initials(staff.name) }}</span>
                    </v-avatar>
                    <div class="choice-title">{{ staff.name }}</div>
                    <div class="choice-subtitle">{{ staff.services?.length || 0 }} serviço(s)</div>
                  </button>
                </div>
                <div class="panel-actions">
                  <v-btn variant="outlined" color="primary" prepend-icon="mdi-arrow-left" @click="goToMenu">
                    Voltar
                  </v-btn>
                </div>
              </template>
            </template>

            <template v-else-if="state === 'booking-services'">
              <div v-if="!availableServices.length" class="empty-note">
                Esse profissional não tem serviços disponíveis no momento.
              </div>

              <div v-else class="choice-grid choice-grid--services">
                <button
                  v-for="service in availableServices"
                  :key="service.id"
                  type="button"
                  class="choice-card choice-card--service"
                  :class="{ 'choice-card--selected': booking.serviceIds.includes(service.id) }"
                  @click="toggleService(service.id)"
                >
                  <div class="service-media">
                    <v-img
                      v-if="service.photo_url"
                      :src="resolveMediaUrl(service.photo_url)"
                      cover
                      class="service-media__img"
                    />
                    <v-icon v-else icon="mdi-content-cut" size="26" />
                  </div>
                  <div class="choice-title">{{ service.name }}</div>
                  <div class="choice-subtitle">{{ service.duration_minutes }} min</div>
                  <div class="choice-price">{{ formatCurrencyBRL(service.price) }}</div>
                </button>
              </div>

              <div class="panel-summary">
                <div>
                  <strong>{{ booking.serviceIds.length }}</strong> serviço(s)
                </div>
                <div>{{ totalDuration }} min</div>
                <div>{{ formatCurrencyBRL(totalPrice) }}</div>
              </div>

              <div class="panel-actions panel-actions--split">
                <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="state = 'booking-staff'">
                  Trocar profissional
                </v-btn>
                <v-btn color="primary" :disabled="!booking.serviceIds.length" @click="continueToDateStep">
                  Continuar
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'booking-date'">
              <div class="date-tools">
                <v-text-field
                  v-model="booking.date"
                  label="Data"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :min="todayDate"
                />
                <v-btn color="primary" size="large" :loading="booking.loadingSlots" @click="fetchAvailability">
                  Buscar horários
                </v-btn>
              </div>

              <div class="panel-summary">
                <div>{{ selectedStaff?.name || 'Profissional' }}</div>
                <div>{{ selectedServicesLabel || 'Serviços não selecionados' }}</div>
                <div>{{ formatCurrencyBRL(totalPrice) }}</div>
              </div>

              <div class="panel-actions panel-actions--split">
                <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="state = 'booking-services'">
                  Voltar
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'booking-slot'">
              <div v-if="!booking.slots.length" class="empty-note">
                Nenhum horário disponível para essa data.
              </div>

              <div v-else class="slots-grid">
                <v-btn
                  v-for="slot in booking.slots"
                  :key="slot"
                  variant="outlined"
                  color="primary"
                  class="slot-btn"
                  @click="selectSlot(slot)"
                >
                  {{ formatTime(slot) }}
                </v-btn>
              </div>

              <div class="panel-actions panel-actions--split">
                <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="state = 'booking-date'">
                  Trocar data
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'booking-confirm'">
              <v-card class="confirm-card" elevation="0">
                <v-card-text>
                  <div class="confirm-row">
                    <span>Profissional</span>
                    <strong>{{ selectedStaff?.name || '-' }}</strong>
                  </div>
                  <div class="confirm-row">
                    <span>Serviços</span>
                    <strong>{{ selectedServicesLabel }}</strong>
                  </div>
                  <div class="confirm-row">
                    <span>Data</span>
                    <strong>{{ formatDate(booking.selectedSlot) }}</strong>
                  </div>
                  <div class="confirm-row">
                    <span>Horário</span>
                    <strong>{{ formatTime(booking.selectedSlot) }}</strong>
                  </div>
                  <div class="confirm-row">
                    <span>Total</span>
                    <strong>{{ formatCurrencyBRL(totalPrice) }}</strong>
                  </div>
                </v-card-text>
              </v-card>

              <div class="panel-actions panel-actions--split">
                <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="state = 'booking-slot'">
                  Trocar horário
                </v-btn>
                <v-btn color="primary" :loading="booking.saving" @click="confirmBooking">
                  Confirmar agendamento
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'appointments'">
              <div v-if="loadingAppointments" class="loading-box">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <div v-else-if="!appointments.length" class="empty-note">
                Você ainda não possui agendamentos.
              </div>

              <div v-else class="appointment-list">
                <v-card v-for="appointment in appointments" :key="appointment.id" class="appointment-card" elevation="0">
                  <v-card-text>
                    <div class="appointment-head">
                      <div>
                        <div class="appointment-title">{{ formatDate(appointment.start_at) }}</div>
                        <div class="appointment-time">
                          {{ formatTime(appointment.start_at) }} - {{ formatTime(appointment.end_at) }}
                        </div>
                      </div>
                      <v-chip size="small" :color="statusColor(appointment.status)" variant="tonal">
                        {{ statusLabel(appointment.status) }}
                      </v-chip>
                    </div>

                    <div class="appointment-meta">{{ appointment.staff?.name || 'Equipe' }}</div>

                    <div class="appointment-services">
                      <v-chip
                        v-for="service in appointment.services"
                        :key="service.id"
                        size="x-small"
                        color="secondary"
                        variant="tonal"
                      >
                        {{ service.name }}
                      </v-chip>
                    </div>

                    <div class="appointment-footer">
                      <strong>{{ formatCurrencyBRL(appointment.total_price) }}</strong>
                      <v-btn
                        v-if="appointment.status === 'scheduled'"
                        variant="outlined"
                        color="primary"
                        size="small"
                        @click="cancelAppointment(appointment)"
                      >
                        Cancelar
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </div>

              <div class="panel-actions">
                <v-btn variant="outlined" color="primary" prepend-icon="mdi-arrow-left" @click="goToMenu">
                  Voltar ao menu
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'services'">
              <div v-if="loadingCatalog" class="loading-box">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <div v-else-if="!servicesCatalog.length" class="empty-note">
                Catálogo indisponível no momento.
              </div>

              <div v-else class="service-list">
                <div v-for="service in servicesCatalog" :key="service.id" class="service-item">
                  <div class="service-item-main">
                    <div class="service-media service-media--list">
                      <v-img
                        v-if="service.photo_url"
                        :src="resolveMediaUrl(service.photo_url)"
                        cover
                        class="service-media__img"
                      />
                      <v-icon v-else icon="mdi-content-cut" size="22" />
                    </div>
                    <div>
                      <div class="choice-title">{{ service.name }}</div>
                      <div class="choice-subtitle">{{ service.duration_minutes }} min</div>
                    </div>
                  </div>
                  <div class="choice-price">{{ formatCurrencyBRL(service.price) }}</div>
                </div>
              </div>

              <div class="panel-actions panel-actions--split">
                <v-btn variant="outlined" color="primary" prepend-icon="mdi-arrow-left" @click="goToMenu">
                  Voltar
                </v-btn>
                <v-btn color="primary" prepend-icon="mdi-calendar-check-outline" @click="startBooking">
                  Agendar agora
                </v-btn>
              </div>
            </template>

            <template v-else-if="state === 'profile'">
              <div class="profile-card">
                <div class="profile-top">
                  <v-avatar size="58" class="profile-avatar">
                    <v-img v-if="auth.user?.avatar_url" :src="resolveMediaUrl(auth.user.avatar_url)" cover />
                    <span v-else>{{ initials(auth.user?.name || 'Cliente') }}</span>
                  </v-avatar>
                  <div>
                    <div class="choice-title">{{ auth.user?.name || 'Cliente' }}</div>
                    <div class="choice-subtitle">{{ profileRoleLabel }}</div>
                  </div>
                </div>
                <div class="profile-grid">
                  <div>
                    <div class="field-label">Telefone</div>
                    <div>{{ formatPhoneFromE164(auth.user?.phone) || 'Não informado' }}</div>
                  </div>
                  <div>
                    <div class="field-label">Email</div>
                    <div>{{ auth.user?.email || 'Não informado' }}</div>
                  </div>
                  <div>
                    <div class="field-label">Empresa</div>
                    <div>{{ auth.user?.company?.name || 'Não vinculada' }}</div>
                  </div>
                </div>
              </div>

              <div class="panel-actions panel-actions--split">
                <v-btn variant="outlined" color="primary" prepend-icon="mdi-arrow-left" @click="goToMenu">
                  Voltar
                </v-btn>
                <v-btn color="primary" prepend-icon="mdi-calendar-check-outline" @click="startBooking">
                  Novo agendamento
                </v-btn>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { cachedGet } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alerts'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatPhoneFromE164 } from '@/lib/phone'
import { resolveMediaUrl } from '@/lib/media'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const alerts = useAlertStore()

const chatBodyRef = ref(null)
const messages = ref([])
const assistantTyping = ref(false)
let nextMessageId = 1

const state = ref('menu')
const loadingCatalog = ref(false)
const loadingAppointments = ref(false)
const staffOptions = ref([])
const servicesCatalog = ref([])
const appointments = ref([])

const toLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

const todayDate = toLocalDateString(new Date())

const booking = reactive({
  staffId: null,
  serviceIds: [],
  date: todayDate,
  slots: [],
  selectedSlot: null,
  loadingSlots: false,
  saving: false,
})

const panelTitle = computed(() => {
  const map = {
    menu: 'Escolha sua próxima ação',
    'auth-required': 'Acesso necessário',
    'booking-staff': 'Passo 1: profissional',
    'booking-services': 'Passo 2: serviços',
    'booking-date': 'Passo 3: data',
    'booking-slot': 'Passo 4: horário',
    'booking-confirm': 'Passo 5: confirmar',
    appointments: 'Seus agendamentos',
    services: 'Catálogo de serviços',
    profile: 'Resumo do perfil',
  }
  return map[state.value] || 'Atendimento'
})

const companyName = computed(() => auth.user?.company?.name || 'Barbearia')

const profileRoleLabel = computed(() => {
  if (auth.user?.role === 'super_admin') return 'Super admin'
  if (auth.user?.role === 'admin') return 'Administrador'
  if (auth.user?.role === 'staff') return 'Colaborador'
  return 'Cliente'
})

const selectedStaff = computed(() =>
  staffOptions.value.find((staff) => staff.id === booking.staffId) || null
)

const availableServices = computed(() => selectedStaff.value?.services || [])

const selectedServices = computed(() =>
  availableServices.value.filter((service) => booking.serviceIds.includes(service.id))
)

const selectedServicesLabel = computed(() => {
  if (!selectedServices.value.length) return 'Nenhum serviço selecionado'
  return selectedServices.value.map((service) => service.name).join(', ')
})

const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, service) => sum + Number(service.price || 0), 0)
)

const totalDuration = computed(() =>
  selectedServices.value.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0)
)

const pushMessage = (role, text) => {
  messages.value.push({
    id: nextMessageId++,
    role,
    text,
    sentAt: new Date(),
  })
  scrollChatToBottom()
}

const sendBotMessage = (text) => pushMessage('bot', text)
const sendUserMessage = (text) => pushMessage('user', text)

const scrollChatToBottom = () => {
  nextTick(() => {
    const element = chatBodyRef.value
    if (!element) return
    element.scrollTop = element.scrollHeight
  })
}

const runWithTyping = async (request) => {
  assistantTyping.value = true
  try {
    return await request()
  } finally {
    assistantTyping.value = false
  }
}

const resetBooking = () => {
  booking.staffId = null
  booking.serviceIds = []
  booking.date = todayDate
  booking.slots = []
  booking.selectedSlot = null
  booking.loadingSlots = false
  booking.saving = false
}

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
    scheduled: 'primary',
    canceled: 'error',
    done: 'success',
    no_show: 'warning',
  }
  return map[status] || 'secondary'
}

const formatDate = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMessageTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const initials = (name) => {
  const source = String(name || '').trim()
  if (!source) return '?'
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase()
}

const loadCatalog = async ({ force = false } = {}) => {
  if (loadingCatalog.value) return

  loadingCatalog.value = true
  try {
    const [staffResponse, servicesResponse] = await runWithTyping(() =>
      Promise.all([
        cachedGet('/api/staff', {}, { ttl: 30_000, force }),
        cachedGet('/api/services', {}, { ttl: 30_000, force }),
      ])
    )

    staffOptions.value = Array.isArray(staffResponse.data) ? staffResponse.data : []
    servicesCatalog.value = Array.isArray(servicesResponse.data) ? servicesResponse.data : []
  } catch {
    sendBotMessage('Não consegui atualizar os dados agora. Tente novamente em instantes.')
  } finally {
    loadingCatalog.value = false
  }
}

const ensureCatalogLoaded = async () => {
  if (staffOptions.value.length && servicesCatalog.value.length) return true
  await loadCatalog()
  return staffOptions.value.length > 0
}

const beginConversation = () => {
  messages.value = []
  nextMessageId = 1
  state.value = 'menu'
  resetBooking()

  const firstName = auth.user?.name?.split(' ')[0]
  if (firstName) {
    sendBotMessage(`Olá, ${firstName}. Vou te ajudar a agendar em poucos passos.`)
  } else {
    sendBotMessage('Olá. Sou sua assistente de agendamento.')
  }

  if (auth.isAuthenticated) {
    sendBotMessage('Sua conta está conectada. Podemos criar, revisar ou cancelar horários por aqui.')
  } else {
    sendBotMessage('Você pode explorar serviços agora e fazer login para confirmar agendamentos.')
  }

  sendBotMessage('Escolha uma opção abaixo para continuar.')
}

const goToMenu = () => {
  state.value = 'menu'
  sendBotMessage('Perfeito. O que você quer fazer agora?')
}

const goToLogin = () => {
  sendUserMessage('Quero fazer login.')
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

const startBooking = async () => {
  sendUserMessage('Quero fazer um novo agendamento.')

  if (!auth.isAuthenticated) {
    state.value = 'auth-required'
    sendBotMessage('Para confirmar um horário, preciso que você entre na sua conta.')
    return
  }

  const ready = await ensureCatalogLoaded()
  if (!ready) {
    state.value = 'menu'
    sendBotMessage('Não encontrei profissionais disponíveis neste momento.')
    return
  }

  resetBooking()
  state.value = 'booking-staff'
  sendBotMessage('Perfeito. Primeiro, escolha o profissional.')
}

const chooseStaff = (staff) => {
  booking.staffId = staff.id
  booking.serviceIds = []
  booking.slots = []
  booking.selectedSlot = null

  sendUserMessage(`Quero ser atendido por ${staff.name}.`)
  state.value = 'booking-services'
  sendBotMessage(`Ótimo. Agora selecione os serviços com ${staff.name}.`)
}

const toggleService = (serviceId) => {
  if (booking.serviceIds.includes(serviceId)) {
    booking.serviceIds = booking.serviceIds.filter((id) => id !== serviceId)
    return
  }

  booking.serviceIds = [...booking.serviceIds, serviceId]
}

const continueToDateStep = () => {
  if (!booking.serviceIds.length) {
    alerts.warning('Selecione pelo menos um serviço.')
    return
  }

  sendUserMessage(`Serviços escolhidos: ${selectedServicesLabel.value}.`)
  state.value = 'booking-date'
  sendBotMessage('Boa escolha. Agora selecione a data e eu busco os horários livres.')
}

const fetchAvailability = async () => {
  if (!booking.staffId || !booking.serviceIds.length) {
    alerts.warning('Selecione profissional e serviços antes de buscar horários.')
    return
  }

  if (!booking.date) {
    alerts.warning('Selecione uma data válida.')
    return
  }

  booking.loadingSlots = true
  booking.selectedSlot = null
  booking.slots = []

  sendUserMessage(`Quero agendar para ${formatDate(booking.date)}.`)

  try {
    const params = new URLSearchParams()
    params.append('staff_id', String(booking.staffId))
    params.append('date', booking.date)
    params.append('step_minutes', '30')
    booking.serviceIds.forEach((serviceId) => params.append('service_ids[]', String(serviceId)))

    const { data } = await runWithTyping(() => api.get(`/api/availability?${params.toString()}`))
    booking.slots = Array.isArray(data?.slots) ? data.slots : []

    if (!booking.slots.length) {
      state.value = 'booking-date'
      sendBotMessage('Não encontrei horários para essa data. Escolha outro dia para tentar novamente.')
      return
    }

    state.value = 'booking-slot'
    sendBotMessage(`Encontrei ${booking.slots.length} horário(s). Escolha o que preferir.`)
  } finally {
    booking.loadingSlots = false
  }
}

const selectSlot = (slot) => {
  booking.selectedSlot = slot
  sendUserMessage(`Prefiro às ${formatTime(slot)}.`)
  state.value = 'booking-confirm'
  sendBotMessage('Perfeito. Confira o resumo e confirme o agendamento.')
}

const confirmBooking = async () => {
  if (!booking.selectedSlot) {
    alerts.warning('Selecione um horário para confirmar.')
    return
  }

  booking.saving = true
  sendUserMessage('Confirmar agendamento.')

  try {
    const { data } = await runWithTyping(() =>
      api.post('/api/appointments', {
        staff_id: booking.staffId,
        start_at: booking.selectedSlot,
        service_ids: booking.serviceIds,
      })
    )

    sendBotMessage(
      `Agendamento confirmado para ${formatDateTime(data?.start_at)} com ${data?.staff?.name || selectedStaff.value?.name || 'equipe'}.`
    )

    sendBotMessage(`Total confirmado: ${formatCurrencyBRL(data?.total_price || totalPrice.value)}.`)
    alerts.success('Agendamento confirmado com sucesso.')

    await loadAppointments({ silent: true })
    resetBooking()
    state.value = 'menu'
  } catch (error) {
    if (error?.response?.status === 409) {
      sendBotMessage('Esse horário acabou de ser reservado por outra pessoa. Vamos escolher outro.')
    } else if (error?.response?.status === 422) {
      sendBotMessage('Não foi possível confirmar com esses dados. Vamos tentar outro horário.')
    }
    state.value = 'booking-date'
  } finally {
    booking.saving = false
  }
}

const loadAppointments = async ({ silent = false } = {}) => {
  if (!auth.isAuthenticated) {
    if (!silent) {
      state.value = 'auth-required'
      sendBotMessage('Para ver seus agendamentos, faça login.')
    }
    return
  }

  loadingAppointments.value = true
  try {
    const { data } = await runWithTyping(() => api.get('/api/appointments'))
    appointments.value = Array.isArray(data) ? data : []

    if (!silent) {
      state.value = 'appointments'
      if (!appointments.value.length) {
        sendBotMessage('Você ainda não possui agendamentos cadastrados.')
      } else {
        sendBotMessage(`Aqui estão seus ${appointments.value.length} agendamento(s).`)
      }
    }
  } finally {
    loadingAppointments.value = false
  }
}

const openAppointments = async () => {
  sendUserMessage('Quero ver meus agendamentos.')
  await loadAppointments()
}

const cancelAppointment = async (appointment) => {
  if (appointment.status !== 'scheduled') return

  sendUserMessage(`Cancelar horário de ${formatDateTime(appointment.start_at)}.`)

  try {
    await runWithTyping(() =>
      api.post(`/api/appointments/${appointment.id}/cancel`, {
        reason: 'Cancelado pelo cliente (chat)',
      })
    )

    alerts.success('Agendamento cancelado.')
    sendBotMessage('Agendamento cancelado com sucesso.')
    await loadAppointments({ silent: true })
    state.value = 'appointments'
  } catch {
    sendBotMessage('Não consegui cancelar esse horário agora. Tente novamente em instantes.')
  }
}

const openServices = async () => {
  sendUserMessage('Quero ver os serviços.')
  await ensureCatalogLoaded()
  state.value = 'services'
  sendBotMessage('Segue o catálogo atualizado de serviços.')
}

const openProfile = () => {
  sendUserMessage('Quero ver meu perfil.')

  if (!auth.isAuthenticated) {
    state.value = 'auth-required'
    sendBotMessage('Para visualizar seu perfil, faça login.')
    return
  }

  state.value = 'profile'
  sendBotMessage('Este é o resumo da sua conta.')
}

watch(state, () => {
  scrollChatToBottom()
})

watch(
  () => [
    booking.loadingSlots,
    booking.slots.length,
    booking.saving,
    loadingCatalog.value,
    loadingAppointments.value,
    appointments.value.length,
  ],
  () => {
    scrollChatToBottom()
  }
)

watch(assistantTyping, () => {
  scrollChatToBottom()
})

watch(
  () => auth.user?.id,
  (current, previous) => {
    if (!messages.value.length) return

    if (current && !previous) {
      sendBotMessage(`Login confirmado, ${auth.user?.name?.split(' ')[0] || 'cliente'}.`)
      state.value = 'menu'
    }

    if (!current && previous) {
      appointments.value = []
      state.value = 'menu'
      sendBotMessage('Sua sessão foi encerrada. Você pode continuar navegando como visitante.')
    }
  }
)

onMounted(async () => {
  await loadCatalog()
  if (auth.isAuthenticated) {
    await loadAppointments({ silent: true })
  }
  beginConversation()
})
</script>

<style scoped>
.client-chat-page {
  min-height: calc(100vh - 104px);
  min-height: calc(100dvh - 104px);
}

.chat-shell {
  display: grid;
  grid-template-rows: auto minmax(320px, 1fr);
  min-height: calc(100vh - 128px);
  min-height: calc(100dvh - 128px);
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(88, 116, 130, 0.28);
  box-shadow: 0 24px 56px rgba(22, 33, 40, 0.22);
  background: linear-gradient(178deg, #12171f 0%, #1a212c 48%, #202a34 100%);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(180, 208, 221, 0.2);
  background: linear-gradient(148deg, rgba(26, 36, 45, 0.96), rgba(18, 25, 32, 0.86));
}

.chat-agent {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-family: var(--display-font);
  font-size: 0.84rem;
  letter-spacing: 0.06em;
  color: #f4f9fb;
  background: linear-gradient(142deg, #5a8b8f 0%, #7fa4a8 58%, #c39872 100%);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.26);
}

.agent-title {
  font-family: var(--display-font);
  color: #edf4f7;
  font-size: 1rem;
  font-weight: 700;
}

.agent-subtitle {
  color: rgba(226, 238, 244, 0.68);
  font-size: 0.8rem;
}

.agent-chip {
  border-color: rgba(112, 179, 141, 0.42) !important;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-body {
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow-y: auto;
  background:
    radial-gradient(circle at 8% -8%, rgba(134, 93, 60, 0.24), transparent 36%),
    radial-gradient(circle at 104% 8%, rgba(90, 130, 142, 0.24), transparent 34%),
    linear-gradient(180deg, rgba(16, 21, 27, 0.9), rgba(24, 31, 39, 0.93));
}

.message-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.message-row--bot {
  align-items: flex-start;
}

.message-row--user {
  align-items: flex-end;
}

.message-bubble {
  max-width: min(78ch, 88%);
  border-radius: 16px;
  padding: 11px 14px;
  font-size: 0.95rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.message-bubble--bot {
  color: #f6fafc;
  border: 1px solid rgba(122, 163, 176, 0.24);
  background: linear-gradient(152deg, rgba(82, 118, 131, 0.82), rgba(62, 85, 96, 0.9));
}

.message-bubble--user {
  color: #1f242a;
  border: 1px solid rgba(255, 236, 214, 0.42);
  background: linear-gradient(164deg, rgba(231, 205, 178, 0.96), rgba(204, 167, 136, 0.96));
}

.message-time {
  margin-top: 3px;
  font-size: 0.72rem;
  color: rgba(212, 230, 238, 0.58);
}

.typing-row {
  display: flex;
  margin-top: 8px;
}

.typing-bubble {
  width: 62px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  border-radius: 16px;
  border: 1px solid rgba(122, 163, 176, 0.24);
  background: linear-gradient(152deg, rgba(82, 118, 131, 0.82), rgba(62, 85, 96, 0.9));
}

.typing-bubble span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(247, 252, 255, 0.9);
  animation: pulse 1.1s ease infinite;
}

.typing-bubble span:nth-child(2) {
  animation-delay: 0.14s;
}

.typing-bubble span:nth-child(3) {
  animation-delay: 0.28s;
}

.inline-options-row {
  margin-top: 10px;
  margin-bottom: 0;
  align-items: stretch;
}

.inline-options-card {
  width: 100%;
  border: 1px solid rgba(153, 184, 198, 0.32);
  background: linear-gradient(176deg, rgba(247, 252, 254, 0.96), rgba(237, 246, 250, 0.9));
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 14px 30px rgba(6, 12, 16, 0.2);
}

.inline-options-title {
  font-family: var(--display-font);
  font-size: 0.92rem;
  color: var(--ink-900);
  margin-bottom: 10px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.panel-actions--split {
  justify-content: space-between;
  align-items: center;
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.choice-grid--services {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.choice-card {
  border: 1px solid rgba(87, 120, 132, 0.22);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  text-align: left;
  padding: 11px 12px;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
  cursor: pointer;
}

.choice-card:hover {
  transform: translateY(-1px);
  border-color: rgba(87, 120, 132, 0.46);
  box-shadow: 0 10px 20px rgba(59, 90, 100, 0.16);
}

.choice-card--service {
  display: grid;
  gap: 2px;
}

.service-media {
  width: 100%;
  height: 110px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(35, 58, 74, 0.08);
  display: grid;
  place-items: center;
  color: rgba(35, 58, 74, 0.7);
  margin-bottom: 8px;
}

.service-media__img {
  width: 100%;
  height: 100%;
}

.service-media--list {
  width: 52px;
  height: 52px;
  margin-bottom: 0;
  border-radius: 12px;
  flex-shrink: 0;
}

.choice-card--selected {
  border-color: rgba(91, 140, 143, 0.68);
  background: linear-gradient(154deg, rgba(91, 140, 143, 0.15), rgba(184, 136, 94, 0.12));
}

.choice-avatar {
  margin-bottom: 8px;
  background: rgba(35, 58, 74, 0.1);
}

.choice-title {
  font-weight: 700;
  color: var(--ink-900);
  line-height: 1.3;
}

.choice-subtitle {
  color: var(--ink-500);
  font-size: 0.82rem;
}

.choice-price {
  margin-top: 4px;
  font-family: var(--display-font);
  color: var(--ink-900);
}

.panel-summary {
  margin-top: 10px;
  border: 1px solid rgba(87, 120, 132, 0.18);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}

.date-tools {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(180px, 1fr) auto;
  align-items: center;
}

.slots-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-btn {
  min-width: 88px;
}

.confirm-card {
  border: 1px solid rgba(87, 120, 132, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(87, 120, 132, 0.18);
}

.confirm-row:last-child {
  border-bottom: none;
}

.appointment-list {
  display: grid;
  gap: 10px;
}

.appointment-card {
  border: 1px solid rgba(87, 120, 132, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.appointment-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.appointment-title {
  font-weight: 700;
}

.appointment-time,
.appointment-meta {
  font-size: 0.84rem;
  color: var(--ink-500);
}

.appointment-services {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.appointment-footer {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-list {
  display: grid;
  gap: 8px;
}

.service-item {
  border: 1px solid rgba(87, 120, 132, 0.2);
  background: rgba(255, 255, 255, 0.78);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.service-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.profile-card {
  border: 1px solid rgba(87, 120, 132, 0.2);
  background: rgba(255, 255, 255, 0.78);
  border-radius: 14px;
  padding: 12px;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.profile-avatar {
  background: linear-gradient(136deg, #5b8c8f, #b8885e);
  color: #f2fbfc;
}

.profile-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-500);
}

.loading-box,
.empty-note {
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(87, 120, 132, 0.2);
  background: rgba(255, 255, 255, 0.68);
  text-align: center;
  color: var(--ink-700);
}

.bubble-enter-active,
.bubble-leave-active {
  transition: all 0.25s ease;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 960px) {
  .client-chat-page {
    min-height: calc(100vh - 92px);
    min-height: calc(100dvh - 92px);
  }

  .chat-shell {
    min-height: calc(100vh - 106px);
    min-height: calc(100dvh - 106px);
    border-radius: 18px;
  }

  .chat-header {
    padding: 14px;
  }

  .chat-body {
    padding: 12px;
  }

  .action-grid {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }

  .choice-grid--services {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }

  .header-actions {
    gap: 6px;
  }

  .service-media {
    height: 96px;
  }

  .message-bubble {
    max-width: 94%;
  }

  .date-tools {
    grid-template-columns: 1fr;
  }

  .panel-actions--split {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .client-chat-page {
    min-height: calc(100vh - 84px);
    min-height: calc(100dvh - 84px);
  }

  .chat-shell {
    min-height: calc(100vh - 96px);
    min-height: calc(100dvh - 96px);
    border-radius: 14px;
  }

  .chat-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }

  .chat-agent {
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .header-actions .agent-chip {
    width: 100%;
  }

  .header-actions .agent-chip :deep(.v-chip__content) {
    width: 100%;
    justify-content: center;
  }

  .header-actions :deep(.v-btn) {
    width: 100%;
    min-width: 0;
  }

  .message-row {
    margin-bottom: 9px;
  }

  .message-bubble {
    max-width: 100%;
  }

  .inline-options-card {
    padding: 10px;
    border-radius: 14px;
  }

  .action-grid,
  .choice-grid,
  .choice-grid--services,
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .action-grid :deep(.v-btn),
  .panel-actions :deep(.v-btn),
  .date-tools :deep(.v-btn) {
    width: 100%;
    min-width: 0;
  }

  .panel-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .panel-actions--split {
    justify-content: initial;
    align-items: initial;
  }

  .panel-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .date-tools {
    grid-template-columns: 1fr;
  }

  .service-media {
    height: 118px;
  }

  .confirm-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .appointment-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .appointment-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .service-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .service-item-main {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .agent-avatar {
    width: 36px;
    height: 36px;
    font-size: 0.76rem;
  }

  .agent-title {
    font-size: 0.92rem;
  }

  .agent-subtitle {
    font-size: 0.74rem;
  }

  .message-bubble {
    font-size: 0.9rem;
    padding: 10px 12px;
  }

  .inline-options-title {
    font-size: 0.86rem;
  }
}
</style>
