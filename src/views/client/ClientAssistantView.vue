<template>
  <div class="client-chat-page">
    <div class="chat-shell">
      <header class="chat-header">
        <div class="chat-header-inner">
          <div class="chat-agent">
            <div class="agent-title">Assistente do {{ companyName }}</div>
            <div class="agent-subtitle">Agende, reagende, cancele e acompanhe seus horários por aqui.</div>
          </div>

          <div class="header-actions">
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="outlined" color="secondary" size="x-small" class="options-btn">
                  <v-icon icon="mdi-dots-vertical" size="16" />
                </v-btn>
              </template>

              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="mdi-refresh" title="Reiniciar conversa" @click="beginConversation" />
                <v-list-item prepend-icon="mdi-logout" title="Sair" @click="leaveChat" />
              </v-list>
            </v-menu>
          </div>
        </div>
      </header>

      <div ref="chatBodyRef" class="chat-body">
        <div ref="chatContentRef" class="chat-content">
          <transition-group name="bubble">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-row"
              :class="`message-row--${message.role}`"
            >
              <div
                class="message-bubble"
                :class="[`message-bubble--${message.role}`, { 'message-bubble--gif': message.type === 'gif' }]"
              >
                <template v-if="message.type === 'gif' && message.mediaUrl">
                  <img :src="message.mediaUrl" :alt="message.alt || 'GIF'" class="message-gif" loading="lazy" />
                </template>
                <template v-else>
                  {{ message.text }}
                </template>
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

          <div v-if="showInlineOptionsPanel" class="message-row message-row--bot inline-options-row">
            <div class="message-bubble message-bubble--bot inline-options-card">
              <div class="inline-options-title">{{ panelTitle }}</div>

              <template v-if="state === 'menu'">
                <div class="action-grid">
                  <v-btn color="secondary" size="large" prepend-icon="mdi-calendar-check-outline" @click="startBooking()">
                    Novo agendamento
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    color="secondary"
                    size="large"
                    prepend-icon="mdi-content-cut"
                    class="services-action-btn"
                    @click="openServices()"
                  >
                    Ver serviços
                  </v-btn>
                  <v-btn variant="outlined" color="secondary" size="large" prepend-icon="mdi-calendar-clock-outline" @click="openAppointments()">
                    Meus horários
                  </v-btn>
                  <v-btn variant="outlined" color="secondary" size="large" prepend-icon="mdi-account-outline" @click="openProfile()">
                    Meu perfil
                  </v-btn>
                </div>

                <v-alert v-if="profileNeedsAttention" type="warning" class="mt-3 profile-warning-alert">
                  <div>Seu perfil está sem e-mail. Adicione um endereço para receber confirmações e lembretes.</div>
                  <div class="profile-warning-actions">
                    <v-btn size="small" variant="text" color="warning" @click="openProfile({ announceUser: false })">
                      Completar
                    </v-btn>
                  </div>
                </v-alert>
              </template>

              <template v-else-if="state === 'booking-staff'">
                <div v-if="loadingCatalog" class="loading-box">
                  <v-progress-circular indeterminate color="secondary" />
                </div>

                <div v-else-if="catalogLoadError" class="empty-note">
                  Não consegui carregar os profissionais agora.
                  <div class="mt-3">
                    <v-btn size="small" color="secondary" variant="outlined" @click="loadCatalog({ force: true })">
                      Tentar novamente
                    </v-btn>
                  </div>
                </div>

                <template v-else>
                  <div class="choice-grid">
                    <button
                      v-for="staff in staffOptions"
                      :key="staff.id"
                      type="button"
                      class="choice-card choice-card--staff"
                      :class="{ 'choice-card--selected': booking.staffId === staff.id }"
                      @click="chooseStaff(staff)"
                    >
                      <div class="choice-card__body">
                        <div class="choice-copy">
                          <div class="choice-title">{{ staff.name }}</div>
                          <div class="choice-subtitle">{{ staff.services?.length || 0 }} serviço(s)</div>
                        </div>

                        <v-avatar size="56" class="choice-avatar">
                          <v-img v-if="staff.avatar_url" :src="resolveMediaUrl(staff.avatar_url)" cover />
                          <span v-else>{{ initials(staff.name) }}</span>
                        </v-avatar>
                      </div>
                    </button>
                  </div>

                  <div class="panel-actions">
                    <v-btn variant="text" color="secondary" prepend-icon="mdi-arrow-left" @click="goToMenu()">
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
                      <img
                        v-if="servicePhotoSrc(service)"
                        :src="servicePhotoSrc(service)"
                        :alt="service.name"
                        class="service-media__img"
                        loading="lazy"
                      />
                      <v-icon v-else icon="mdi-content-cut" size="24" />
                    </div>
                    <div class="choice-title">{{ service.name }}</div>
                    <div class="choice-subtitle">{{ Number(service.duration_minutes || 0) }} min</div>
                    <div class="choice-price">{{ formatCurrencyBRL(service.price) }}</div>
                  </button>
                </div>

                <div class="panel-summary">
                  <div><strong>{{ booking.serviceIds.length }}</strong> serviço(s)</div>
                  <div>{{ totalDuration }} min</div>
                  <div>{{ formatCurrencyBRL(totalPrice) }}</div>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="text" color="secondary" prepend-icon="mdi-arrow-left" @click="backToStaffSelection">
                    Trocar profissional
                  </v-btn>
                  <v-btn color="secondary" :disabled="!booking.serviceIds.length" @click="continueToDateStep">
                    Continuar
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'booking-date'">
                <div class="date-tools">
                  <v-date-input
                    v-model="booking.date"
                    label="Data"
                    :min="todayDate"
                    :allowed-dates="isBookingDateAllowed"
                    :disabled="loadingCalendarAvailability"
                  />
                  <v-btn
                    color="secondary"
                    size="large"
                    :loading="booking.loadingSlots"
                    :disabled="loadingCalendarAvailability || !isBookingDateAllowed(booking.date)"
                    @click="fetchAvailability"
                  >
                    Buscar horários
                  </v-btn>
                </div>

                <v-alert v-if="loadingCalendarAvailability" type="info" class="mt-3">
                  Verificando os dias disponíveis para este profissional...
                </v-alert>

                <v-alert v-else-if="bookingCalendarLoaded && !availableBookingDates.length" type="warning" class="mt-3">
                  Não há datas disponíveis no período atual para este profissional e serviços.
                </v-alert>

                <v-alert v-if="booking.availabilityError" type="warning" class="mt-3">
                  {{ booking.availabilityError }}
                </v-alert>

                <div class="panel-summary">
                  <div>{{ selectedStaff?.name || 'Profissional' }}</div>
                  <div>{{ selectedServicesLabel || 'Serviços não selecionados' }}</div>
                  <div>{{ formatCurrencyBRL(totalPrice) }}</div>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="text" color="secondary" prepend-icon="mdi-arrow-left" @click="backToServiceSelection">
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
                    color="secondary"
                    class="slot-btn"
                    @click="selectSlot(slot)"
                  >
                    {{ formatTime(slot) }}
                  </v-btn>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="text" color="secondary" prepend-icon="mdi-arrow-left" @click="backToDateSelection">
                    Trocar data
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'booking-confirm'">
                <v-card class="confirm-card">
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

                <v-alert type="info" class="mt-3">
                  Cancelamentos com até 2h de antecedência não impactam prioridade para novos encaixes.
                </v-alert>

                <div class="panel-actions panel-actions--confirm">
                  <v-btn variant="text" color="secondary" prepend-icon="mdi-arrow-left" @click="backToSlotSelection">
                    Trocar
                  </v-btn>
                  <v-btn color="secondary" :loading="booking.saving" @click="confirmBooking">
                    Confimar
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'appointments'">
                <div v-if="loadingAppointments" class="loading-box">
                  <v-skeleton-loader type="article, article, article" class="appointments-skeleton" />
                </div>

                <div v-else-if="!appointments.length" class="empty-note">
                  Você ainda não possui agendamentos.
                </div>

                <div v-else class="appointment-list">
                  <div v-if="upcomingReminders.length" class="reminders-box">
                    <div class="field-label mb-1">Lembretes automáticos</div>
                    <v-alert
                      v-for="reminder in upcomingReminders"
                      :key="reminder.id"
                      density="compact"
                      type="info"
                      class="mb-2"
                    >
                      {{ reminder.text }}
                    </v-alert>
                  </div>

                  <div class="appointments-filters">
                    <v-text-field
                      v-model="appointmentFilters.search"
                      class="appointments-filter-control"
                      placeholder="Buscar serviço ou profissional"
                      prepend-inner-icon="mdi-magnify"
                    />
                    <v-select
                      v-model="appointmentFilters.status"
                      class="appointments-filter-control"
                      :items="statusFilterOptions"
                      item-title="label"
                      item-value="value"
                    />
                    <v-select
                      v-model="appointmentFilters.period"
                      class="appointments-filter-control"
                      :items="periodFilterOptions"
                      item-title="label"
                      item-value="value"
                    />
                  </div>

                  <div v-if="appointmentsLoadError" class="empty-note">
                    Não consegui carregar seus agendamentos agora.
                    <div class="mt-3">
                      <v-btn size="small" color="secondary" variant="outlined" @click="loadAppointments()">
                        Tentar novamente
                      </v-btn>
                    </div>
                  </div>

                  <div v-else-if="!filteredAppointments.length" class="empty-note">
                    Nenhum agendamento encontrado com os filtros atuais.
                  </div>

                  <v-card v-for="appointment in filteredAppointments" :key="appointment.id" class="appointment-card">
                    <v-card-text>
                      <div class="appointment-head">
                        <div class="appointment-main">
                          <div class="appointment-summary">
                            <div class="appointment-title">
                              <v-icon icon="mdi-calendar" size="16" class="appointment-title-icon" />
                              {{ formatDate(appointment.start_at) }}
                            </div>
                            <div class="appointment-time">
                              {{ formatTime(appointment.start_at) }} - {{ formatTime(appointment.end_at) }}
                            </div>
                            <div class="appointment-badges">
                              <v-chip size="small" variant="flat" color="info" prepend-icon="mdi-calendar-week">
                                {{ formatWeekday(appointment.start_at) }}
                              </v-chip>
                              <v-chip size="x-small" variant="tonal" color="secondary">
                                {{ appointmentDurationMinutes(appointment) }} min
                              </v-chip>
                              <v-chip size="x-small" variant="tonal" color="secondary">
                                {{ appointmentServiceCount(appointment) }} serviço(s)
                              </v-chip>
                            </div>
                          </div>
                        </div>

                        <div class="appointment-status">
                          <v-chip
                            size="small"
                            class="appointment-status-chip"
                            :class="statusChipClass(appointment.status)"
                            :prepend-icon="statusIcon(appointment.status)"
                            variant="flat"
                          >
                            {{ statusLabel(appointment.status) }}
                          </v-chip>
                        </div>
                      </div>

                      <div class="appointment-meta">
                        <v-avatar size="28" class="appointment-staff-avatar">
                          <v-img
                            v-if="appointment.staff?.avatar_url"
                            :src="resolveMediaUrl(appointment.staff.avatar_url)"
                            cover
                          />
                          <span v-else>{{ initials(appointment.staff?.name || 'Equipe') }}</span>
                        </v-avatar>
                        <div class="appointment-meta-text">
                          Profissional: <strong>{{ appointment.staff?.name || 'Equipe' }}</strong>
                        </div>
                      </div>

                      <div v-if="appointment.status === 'canceled' && appointment.cancel_reason" class="appointment-cancel-reason">
                        Motivo do cancelamento: {{ appointment.cancel_reason }}
                      </div>

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
                        <div class="appointment-actions">
                          <v-btn
                            v-if="appointment.status === 'scheduled'"
                            variant="elevated"
                            color="secondary"
                            prepend-icon="mdi-calendar-refresh"
                            @click="startReschedule(appointment)"
                          >
                            Reagendar
                          </v-btn>
                          <v-btn
                            v-if="appointment.status === 'scheduled'"
                            variant="elevated"
                            color="error"
                            prepend-icon="mdi-close-circle-outline"
                            @click="startCancellationFlow(appointment)"
                          >
                            Cancelar
                          </v-btn>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>

                <div class="panel-actions">
                  <v-btn variant="outlined" color="secondary" prepend-icon="mdi-arrow-left" @click="goToMenu()">
                    Voltar ao menu
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'services'">
                <div v-if="loadingCatalog" class="loading-box">
                  <v-progress-circular indeterminate color="secondary" />
                </div>

                <div v-else-if="catalogLoadError || !servicesCatalog.length" class="empty-note">
                  Catálogo indisponível no momento.
                  <div class="mt-3">
                    <v-btn size="small" color="secondary" variant="outlined" @click="loadCatalog({ force: true })">
                      Tentar novamente
                    </v-btn>
                  </div>
                </div>

                <div v-else class="choice-grid choice-grid--services">
                  <div v-for="service in servicesCatalog" :key="service.id" class="choice-card choice-card--service">
                    <div class="service-media">
                      <img
                        v-if="servicePhotoSrc(service)"
                        :src="servicePhotoSrc(service)"
                        :alt="service.name"
                        class="service-media__img"
                        loading="lazy"
                      />
                      <v-icon v-else icon="mdi-content-cut" size="24" />
                    </div>
                    <div class="choice-title">{{ service.name }}</div>
                    <div class="choice-subtitle">{{ Number(service.duration_minutes || 0) }} min</div>
                    <div class="choice-price">{{ formatCurrencyBRL(service.price) }}</div>
                  </div>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="outlined" color="secondary" prepend-icon="mdi-arrow-left" @click="goToMenu()">
                    Voltar
                  </v-btn>
                  <v-btn color="secondary" prepend-icon="mdi-calendar-check-outline" @click="startBooking({ announceUser: false })">
                    Agendar agora
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'profile'">
                <div class="profile-card">
                  <div class="profile-photo-block">
                    <v-avatar size="72" class="profile-avatar">
                      <v-img v-if="auth.user?.avatar_url" :src="resolveMediaUrl(auth.user.avatar_url)" cover />
                      <span v-else>{{ initials(auth.user?.name || 'Cliente') }}</span>
                    </v-avatar>
                  </div>

                  <v-row dense class="profile-editor-grid">
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="profileForm.name"
                        label="Nome"
                        prepend-inner-icon="mdi-account-outline"
                        :error-messages="profileErrors.name"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="profilePhoneInput"
                        label="Telefone"
                        prepend-inner-icon="mdi-phone-outline"
                        :error-messages="profileErrors.phone"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="profileForm.email"
                        label="Email"
                        type="email"
                        prepend-inner-icon="mdi-email-outline"
                        :error-messages="profileErrors.email"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-file-input
                        v-model="profilePhotoFile"
                        class="profile-upload-field"
                        label="Selecionar nova foto"
                        accept="image/*"
                        prepend-icon="mdi-camera"
                        show-size
                        chips
                      />
                    </v-col>
                  </v-row>

                  <div class="profile-action-row">
                    <v-btn
                      color="secondary"
                      variant="tonal"
                      prepend-icon="mdi-image-edit-outline"
                      :loading="uploadingProfilePhoto"
                      @click="uploadProfilePhoto"
                    >
                      Atualizar foto
                    </v-btn>
                    <v-btn
                      color="secondary"
                      prepend-icon="mdi-content-save-outline"
                      :loading="savingProfile"
                      @click="saveProfile"
                    >
                      Salvar dados
                    </v-btn>
                  </div>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="outlined" color="secondary" prepend-icon="mdi-arrow-left" @click="goToMenu()">
                    Voltar
                  </v-btn>
                  <v-btn color="secondary" prepend-icon="mdi-calendar-check-outline" @click="startBooking({ announceUser: false })">
                    Novo agendamento
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'appointments-cancel-reason'">
                <div class="panel-summary">
                  <div>Cancelando: {{ formatDateTime(cancelContext.startAt) }}</div>
                  <div>{{ cancelContext.staffName || 'Equipe' }}</div>
                </div>

                <v-textarea
                  v-model="cancelContext.reason"
                  class="mt-3"
                  label="Conte o motivo do cancelamento"
                  placeholder="Ex.: surgiu um imprevisto no trabalho."
                  rows="3"
                  auto-grow
                />

                <div class="panel-actions panel-actions--split mt-3">
                  <v-btn variant="text" color="secondary" prepend-icon="mdi-arrow-left" @click="cancelReasonStepBack">
                    Voltar
                  </v-btn>
                  <v-btn color="secondary" :loading="cancelContext.saving" @click="submitCancellationReason">
                    Enviar e cancelar
                  </v-btn>
                </div>
              </template>
            </div>
          </div>

          <div ref="chatBottomRef" class="chat-bottom-anchor" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { cachedGet } from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { buildE164, formatPhone, normalizePhone } from '@/lib/phone'
import { resolveMediaUrl } from '@/lib/media'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const BOOKING_SUCCESS_GIF_URL = 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif'
const BOOKING_CANCEL_SAD_GIF_URL = 'https://media.giphy.com/media/BEob5qwFkSJ7G/giphy.gif'
const BOOKING_RESCHEDULE_GIF_URL = 'https://media.giphy.com/media/l3vR85PnGsBwu1PFK/giphy.gif'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const chatBodyRef = ref(null)
const chatContentRef = ref(null)
const chatBottomRef = ref(null)
const messages = ref([])
const assistantTypingByRequest = ref(false)
const botQueuePendingCount = ref(0)
const assistantTypingByQueue = computed(() => botQueuePendingCount.value > 0)
const assistantTyping = computed(() => assistantTypingByRequest.value || assistantTypingByQueue.value)

const state = ref('menu')
const loadingCatalog = ref(false)
const catalogLoadError = ref(false)
const loadingAppointments = ref(false)
const appointmentsLoadError = ref(false)
const loadingCalendarAvailability = ref(false)
const bookingCalendarLoaded = ref(false)
const routePanelReady = ref(false)

const staffOptions = ref([])
const servicesCatalog = ref([])
const appointments = ref([])
const availableBookingDates = ref([])
const rescheduleSource = ref(null)
const profileErrors = ref({})
const profilePhotoFile = ref(null)
const savingProfile = ref(false)
const uploadingProfilePhoto = ref(false)

const appointmentFilters = reactive({
  search: '',
  status: 'all',
  period: 'all',
})

const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
})

const cancelContext = reactive({
  appointmentId: null,
  startAt: '',
  staffName: '',
  reason: '',
  saving: false,
})

const booking = reactive({
  staffId: null,
  serviceIds: [],
  date: '',
  slots: [],
  selectedSlot: null,
  availabilityError: '',
  loadingSlots: false,
  saving: false,
})

const routePanel = computed(() => String(route.meta.clientPanel || 'menu'))
const companyName = computed(() => auth.user?.company?.name || 'Barbearia')
const profileNeedsAttention = computed(() => auth.isAuthenticated && !String(auth.user?.email || '').trim())

const statusFilterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendado', value: 'scheduled' },
  { label: 'Finalizado', value: 'done' },
  { label: 'Cancelado', value: 'canceled' },
  { label: 'Não compareceu', value: 'no_show' },
]

const periodFilterOptions = [
  { label: 'Tudo', value: 'all' },
  { label: 'Próximos 7 dias', value: 'next_7' },
  { label: 'Próximos 30 dias', value: 'next_30' },
  { label: 'Últimos 30 dias', value: 'past_30' },
]

const availableBookingDateSet = computed(() => new Set(availableBookingDates.value))

const panelTitle = computed(() => {
  const labels = {
    menu: 'Escolha sua próxima ação',
    'booking-staff': 'Passo 1: profissional',
    'booking-services': 'Passo 2: serviços',
    'booking-date': 'Passo 3: data',
    'booking-slot': 'Passo 4: horário',
    'booking-confirm': 'Passo 5: confirmar',
    appointments: 'Seus agendamentos',
    'appointments-cancel-reason': 'Motivo do cancelamento',
    services: 'Catálogo de serviços',
    profile: 'Seu perfil',
  }

  return labels[state.value] || 'Atendimento'
})

const profilePhoneInput = computed({
  get: () => formatPhone(profileForm.phone, '55'),
  set: (value) => {
    profileForm.phone = normalizePhone(value, '55')
  },
})

const normalizeServiceLookup = (value) => String(value ?? '').trim().toLowerCase()

const servicesCatalogById = computed(
  () => new Map(servicesCatalog.value.map((service) => [normalizeServiceLookup(service.id), service]))
)
const servicesCatalogByName = computed(
  () => new Map(servicesCatalog.value.map((service) => [normalizeServiceLookup(service.name), service]))
)

const mergeServiceWithCatalog = (service) => {
  const catalogService =
    servicesCatalogById.value.get(normalizeServiceLookup(service?.id)) ||
    servicesCatalogByName.value.get(normalizeServiceLookup(service?.name))

  if (!catalogService) {
    return service
  }

  return {
    ...catalogService,
    ...service,
    id: service?.id ?? catalogService.id,
    photo_url: service?.photo_url || catalogService.photo_url || '',
  }
}

const selectedStaff = computed(() => staffOptions.value.find((staff) => staff.id === booking.staffId) || null)
const availableServices = computed(() =>
  (selectedStaff.value?.services || []).map((service) => mergeServiceWithCatalog(service))
)
const selectedServices = computed(() =>
  availableServices.value.filter((service) => booking.serviceIds.includes(service.id))
)

const servicePhotoSrc = (service) => {
  const photoUrl = String(mergeServiceWithCatalog(service)?.photo_url || '').trim()
  return photoUrl ? resolveMediaUrl(photoUrl) : ''
}

const showInlineOptionsPanel = computed(() => {
  const statesWithPanel = [
    'menu',
    'booking-staff',
    'booking-services',
    'booking-date',
    'booking-slot',
    'booking-confirm',
    'appointments',
    'appointments-cancel-reason',
    'services',
    'profile',
  ]

  if (!statesWithPanel.includes(String(state.value || ''))) return false
  if (!messages.value.length) return false
  return !assistantTypingByQueue.value
})

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

const filteredAppointments = computed(() => {
  const term = String(appointmentFilters.search || '').trim().toLowerCase()
  const now = new Date()

  return appointments.value.filter((appointment) => {
    if (appointmentFilters.status !== 'all' && appointment.status !== appointmentFilters.status) {
      return false
    }

    const start = new Date(appointment.start_at)
    if (appointmentFilters.period === 'next_7') {
      const limit = new Date(now)
      limit.setDate(limit.getDate() + 7)
      if (!(start >= now && start <= limit)) return false
    }

    if (appointmentFilters.period === 'next_30') {
      const limit = new Date(now)
      limit.setDate(limit.getDate() + 30)
      if (!(start >= now && start <= limit)) return false
    }

    if (appointmentFilters.period === 'past_30') {
      const limit = new Date(now)
      limit.setDate(limit.getDate() - 30)
      if (!(start <= now && start >= limit)) return false
    }

    if (!term) return true

    const staffName = String(appointment.staff?.name || '').toLowerCase()
    const services = Array.isArray(appointment.services) ? appointment.services : []
    const serviceText = services.map((service) => String(service.name || '').toLowerCase()).join(' ')

    return staffName.includes(term) || serviceText.includes(term)
  })
})

const upcomingReminders = computed(() => {
  const now = new Date()
  const in2Hours = now.getTime() + 2 * 60 * 60 * 1000
  const in24Hours = now.getTime() + 24 * 60 * 60 * 1000

  return appointments.value
    .filter((appointment) => appointment.status === 'scheduled')
    .map((appointment) => {
      const start = new Date(appointment.start_at)
      const time = start.getTime()
      if (Number.isNaN(time) || time < now.getTime() || time > in24Hours) return null

      if (time <= in2Hours) {
        return {
          id: `${appointment.id}-2h`,
          text: `Seu horário de ${formatTime(appointment.start_at)} é hoje. Saia com antecedência.`,
        }
      }

      return {
        id: `${appointment.id}-24h`,
        text: `Lembrete: você tem horário em ${formatDateTime(appointment.start_at)}.`,
      }
    })
    .filter(Boolean)
})

const hasAppointmentHistory = computed(() => appointments.value.length > 0)
const nextScheduledAppointment = computed(() => {
  const now = Date.now()

  return appointments.value
    .filter((appointment) => appointment?.status === 'scheduled')
    .map((appointment) => ({
      appointment,
      timestamp: new Date(appointment.start_at).getTime(),
    }))
    .filter((item) => Number.isFinite(item.timestamp) && item.timestamp >= now)
    .sort((left, right) => left.timestamp - right.timestamp)[0]?.appointment || null
})

let nextMessageId = 1
let pendingScrollFrame = null
let contentResizeObserver = null
let isChatActive = true
let botMessageQueue = Promise.resolve()
let botMessageQueueVersion = 0
const activeTimeouts = new Set()

const BOT_MESSAGE_GAP_MS = 80
const BOT_MIN_TYPING_MS = 180
const BOT_MAX_TYPING_MS = 780

const notify = (text, color = 'secondary') => {
  ui.notify(text, color)
}

const toLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
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

const todayDate = toLocalDateString(new Date())
const calendarRangeEndDate = toLocalDateString(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
booking.date = todayDate

const pushMessage = (role, text, options = {}) => {
  messages.value.push({
    id: nextMessageId++,
    role,
    text,
    type: options.type || 'text',
    mediaUrl: options.mediaUrl || '',
    alt: options.alt || '',
    sentAt: new Date(),
  })
  scrollChatToBottom()
}

const wait = (ms) =>
  new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      activeTimeouts.delete(timeoutId)
      resolve()
    }, ms)
    activeTimeouts.add(timeoutId)
  })

const estimateBotTypingMs = ({ text = '', type = 'text' } = {}) => {
  if (type === 'gif') return 320
  const length = String(text || '').trim().length
  const estimated = 130 + length * 14
  return Math.max(BOT_MIN_TYPING_MS, Math.min(BOT_MAX_TYPING_MS, estimated))
}

const resetBotMessageQueue = () => {
  botMessageQueueVersion += 1
  botMessageQueue = Promise.resolve()
  botQueuePendingCount.value = 0
}

const enqueueBotMessage = ({ text = '', options = {} }) => {
  botQueuePendingCount.value += 1
  const queueVersion = botMessageQueueVersion

  botMessageQueue = botMessageQueue
    .then(async () => {
      if (!isChatActive || queueVersion !== botMessageQueueVersion) return

      await wait(estimateBotTypingMs({ text, type: options.type }))
      if (!isChatActive || queueVersion !== botMessageQueueVersion) return

      pushMessage('bot', text, options)
      await wait(BOT_MESSAGE_GAP_MS)
    })
    .finally(() => {
      botQueuePendingCount.value = Math.max(0, botQueuePendingCount.value - 1)
    })
    .catch(() => {})
}

const sendBotMessage = (text) => enqueueBotMessage({ text })
const sendUserMessage = (text) => pushMessage('user', text)
const sendBotGif = (mediaUrl, alt = 'GIF de confirmação') => {
  enqueueBotMessage({ text: '', options: { type: 'gif', mediaUrl, alt } })
}

const scrollChatToBottomNow = () => {
  const element = chatBodyRef.value
  if (!element) return

  if (chatBottomRef.value?.scrollIntoView) {
    chatBottomRef.value.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
    return
  }

  element.scrollTop = element.scrollHeight
}

const scrollChatToBottom = () => {
  nextTick(() => {
    scrollChatToBottomNow()

    if (pendingScrollFrame !== null) {
      cancelAnimationFrame(pendingScrollFrame)
    }

    pendingScrollFrame = requestAnimationFrame(() => {
      scrollChatToBottomNow()
      pendingScrollFrame = null
    })
  })
}

const runWithTyping = async (request) => {
  assistantTypingByRequest.value = true
  try {
    return await request()
  } finally {
    assistantTypingByRequest.value = false
  }
}

const resetBooking = () => {
  booking.staffId = null
  booking.serviceIds = []
  booking.date = todayDate
  booking.slots = []
  booking.selectedSlot = null
  booking.availabilityError = ''
  booking.loadingSlots = false
  booking.saving = false
  loadingCalendarAvailability.value = false
  bookingCalendarLoaded.value = false
  availableBookingDates.value = []
  rescheduleSource.value = null
  cancelContext.appointmentId = null
  cancelContext.startAt = ''
  cancelContext.staffName = ''
  cancelContext.reason = ''
  cancelContext.saving = false
}

const syncProfileForm = () => {
  profileForm.name = auth.user?.name || ''
  profileForm.email = auth.user?.email || ''
  profileForm.phone = normalizePhone(String(auth.user?.phone || '').replace(/^55/, ''), '55')
  profileErrors.value = {}
}

const buildAssistantSeenStorageKey = () => {
  if (auth.user?.id) {
    return `client_chat_seen:${auth.user.id}`
  }
  return 'client_chat_seen:guest'
}

const hasSeenAssistantBefore = () => localStorage.getItem(buildAssistantSeenStorageKey()) === '1'
const markAssistantAsSeen = () => localStorage.setItem(buildAssistantSeenStorageKey(), '1')

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

const formatSpokenTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'

  const hour = date.getHours()
  const minute = date.getMinutes()
  if (!minute) return `${hour}h`
  return `${hour}h${String(minute).padStart(2, '0')}`
}

const formatWeekday = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('pt-BR', { weekday: 'long' })
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

const startOfLocalDay = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const appointmentServicesList = (appointment) =>
  Array.isArray(appointment?.services) ? appointment.services : []

const appointmentServiceCount = (appointment) => appointmentServicesList(appointment).length

const appointmentDurationMinutes = (appointment) => {
  const start = new Date(appointment?.start_at)
  const end = new Date(appointment?.end_at)
  const hasValidDates = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())

  if (hasValidDates && end > start) {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
  }

  return appointmentServicesList(appointment).reduce(
    (total, service) => total + Number(service?.duration_minutes || 0),
    0
  )
}

const describeNextScheduledAppointment = (appointment) => {
  if (!appointment) return ''

  const appointmentDay = startOfLocalDay(appointment.start_at)
  const today = startOfLocalDay(new Date())
  if (!appointmentDay || !today) return ''

  const diffMs = appointmentDay.getTime() - today.getTime()
  const daysDiff = Math.round(diffMs / 86400000)

  let whenLabel = ''
  if (daysDiff <= 0) {
    whenLabel = 'hoje'
  } else if (daysDiff === 1) {
    whenLabel = 'amanhã'
  } else {
    whenLabel = `daqui ${daysDiff} dias`
  }

  const staffName = appointment.staff?.name || 'Equipe'
  return `Você tem um agendamento marcado para ${whenLabel} às ${formatSpokenTime(appointment.start_at)}, com o colaborador ${staffName}.`
}

const statusLabel = (status) => {
  const labels = {
    scheduled: 'Agendado',
    canceled: 'Cancelado',
    done: 'Finalizado',
    no_show: 'Não compareceu',
  }
  return labels[status] || status
}

const statusIcon = (status) => {
  const icons = {
    scheduled: 'mdi-calendar-clock',
    canceled: 'mdi-close-circle-outline',
    done: 'mdi-check-circle-outline',
    no_show: 'mdi-account-off-outline',
  }
  return icons[status] || 'mdi-information-outline'
}

const statusChipClass = (status) => {
  const allowed = ['scheduled', 'canceled', 'done', 'no_show']
  return allowed.includes(status) ? `appointment-status-chip--${status}` : 'appointment-status-chip--default'
}

const loadCatalog = async ({ force = false } = {}) => {
  if (loadingCatalog.value) return

  loadingCatalog.value = true
  catalogLoadError.value = false

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
    catalogLoadError.value = true
    sendBotMessage('Não consegui atualizar o catálogo agora. Tente novamente em instantes.')
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
  resetBotMessageQueue()
  messages.value = []
  nextMessageId = 1
  state.value = 'menu'
  resetBooking()

  const firstName = auth.user?.name?.split(' ')[0]
  const seenBefore = hasSeenAssistantBefore()
  const isFirstAccess = auth.isAuthenticated && !seenBefore && !hasAppointmentHistory.value

  if (isFirstAccess) {
    sendBotMessage(firstName ? `Bem-vindo, ${firstName}. Esse é seu primeiro acesso por aqui.` : 'Bem-vindo. Esse é seu primeiro acesso por aqui.')
    sendBotMessage('Posso te guiar no seu primeiro agendamento: escolha profissional, serviços, data e horário.')
    sendBotMessage('Quando confirmar, você acompanha seus horários na opção "Meus agendamentos".')
  } else if (auth.isAuthenticated && hasAppointmentHistory.value) {
    sendBotMessage(firstName ? `Que bom te ver de novo, ${firstName}.` : 'Que bom te ver de novo.')
    const nextAppointmentMessage = describeNextScheduledAppointment(nextScheduledAppointment.value)
    if (nextAppointmentMessage) {
      sendBotMessage(nextAppointmentMessage)
    } else {
      sendBotMessage('Vi que você já tem histórico de agendamentos. Posso acelerar seu próximo atendimento.')
    }
  } else {
    sendBotMessage(firstName ? `Olá, ${firstName}. Vou te ajudar a agendar em poucos passos.` : 'Olá. Sou sua assistente de agendamento.')
    sendBotMessage('Sua conta está conectada. Podemos criar, revisar ou cancelar horários por aqui.')
  }

  sendBotMessage('Escolha uma opção abaixo para continuar.')
  markAssistantAsSeen()
}

const goToMenu = ({ announceUser = true, announceBot = true } = {}) => {
  if (announceUser) sendUserMessage('Voltar ao menu.')
  state.value = 'menu'
  if (announceBot) sendBotMessage('Perfeito. O que você quer fazer agora?')
}

const leaveChat = async () => {
  await auth.logout()
  router.replace({ name: 'login' })
}

const startBooking = async ({ announceUser = true, announceBot = true } = {}) => {
  if (announceUser) sendUserMessage('Quero fazer um novo agendamento.')

  const ready = await ensureCatalogLoaded()
  if (!ready) {
    state.value = 'menu'
    if (announceBot) sendBotMessage('Não encontrei profissionais disponíveis neste momento.')
    return
  }

  resetBooking()
  state.value = 'booking-staff'
  if (announceBot) sendBotMessage('Perfeito. Primeiro, escolha o profissional.')
}

const backToStaffSelection = () => {
  if (rescheduleSource.value) {
    sendUserMessage('Quero voltar para meus agendamentos.')
    resetBooking()
    state.value = 'appointments'
    sendBotMessage('Sem problema. Voltei para seus agendamentos.')
    return
  }

  sendUserMessage('Quero trocar o profissional.')
  state.value = 'booking-staff'
  sendBotMessage('Sem problema. Escolha outro profissional.')
}

const backToServiceSelection = () => {
  if (rescheduleSource.value) {
    sendUserMessage('Quero voltar para meus agendamentos.')
    resetBooking()
    state.value = 'appointments'
    sendBotMessage('Sem problema. Voltei para seus agendamentos.')
    return
  }

  sendUserMessage('Quero ajustar os serviços.')
  state.value = 'booking-services'
  sendBotMessage('Claro. Atualize os serviços que você deseja.')
}

const backToDateSelection = () => {
  sendUserMessage('Quero escolher outra data.')
  state.value = 'booking-date'
  sendBotMessage('Perfeito. Selecione outra data para buscar horários.')
}

const backToSlotSelection = () => {
  sendUserMessage('Quero escolher outro horário.')
  state.value = 'booking-slot'
  sendBotMessage('Sem problema. Escolha outro horário disponível.')
}

const chooseStaff = (staff) => {
  booking.staffId = staff.id
  if (!rescheduleSource.value) {
    booking.serviceIds = []
  }
  booking.slots = []
  booking.selectedSlot = null
  booking.availabilityError = ''
  bookingCalendarLoaded.value = false
  availableBookingDates.value = []
  continueToServiceStep()
}

const continueToServiceStep = () => {
  if (!booking.staffId) {
    notify('Selecione um profissional para continuar.', 'warning')
    return
  }

  sendUserMessage(`Quero ser atendido por ${selectedStaff.value?.name || 'esse profissional'}.`)
  state.value = 'booking-services'
  sendBotMessage(`Ótimo. Agora selecione os serviços com ${selectedStaff.value?.name || 'esse profissional'}.`)
}

const toggleService = (serviceId) => {
  if (booking.serviceIds.includes(serviceId)) {
    booking.serviceIds = booking.serviceIds.filter((id) => id !== serviceId)
    return
  }

  booking.serviceIds = [...booking.serviceIds, serviceId]
  bookingCalendarLoaded.value = false
  availableBookingDates.value = []
}

const continueToDateStep = async () => {
  if (!booking.serviceIds.length) {
    notify('Selecione pelo menos um serviço.', 'warning')
    return
  }

  sendUserMessage(`Serviços escolhidos: ${selectedServicesLabel.value}.`)
  state.value = 'booking-date'
  sendBotMessage('Boa escolha. Agora selecione a data e eu busco os horários livres.')
  await loadBookingCalendarAvailability()
}

const loadBookingCalendarAvailability = async () => {
  if (!booking.staffId || !booking.serviceIds.length) {
    bookingCalendarLoaded.value = false
    availableBookingDates.value = []
    return
  }

  loadingCalendarAvailability.value = true
  bookingCalendarLoaded.value = false
  booking.availabilityError = ''

  try {
    const params = new URLSearchParams()
    params.append('staff_id', String(booking.staffId))
    params.append('start_date', todayDate)
    params.append('end_date', calendarRangeEndDate)
    params.append('step_minutes', '30')
    booking.serviceIds.forEach((serviceId) => params.append('service_ids[]', String(serviceId)))

    const { data } = await api.get(`/api/availability/calendar?${params.toString()}`)
    const dates = Array.isArray(data?.available_dates)
      ? data.available_dates.filter((item) => typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item))
      : []

    availableBookingDates.value = dates
    bookingCalendarLoaded.value = true

    if (!dates.length) {
      booking.date = todayDate
      return
    }

    const currentDate = toDateString(booking.date)
    if (!currentDate || !dates.includes(currentDate)) {
      booking.date = dates[0]
    }
  } catch {
    availableBookingDates.value = []
    bookingCalendarLoaded.value = false
    booking.availabilityError = 'Não consegui validar os dias disponíveis agora. Tente novamente em instantes.'
  } finally {
    loadingCalendarAvailability.value = false
  }
}

const isBookingDateAllowed = (value) => {
  const date = toDateString(value)
  if (!date) return false
  if (date < todayDate) return false
  if (!booking.serviceIds.length || !booking.staffId) return false
  return availableBookingDateSet.value.has(date)
}

const fetchAvailability = async () => {
  if (!booking.staffId || !booking.serviceIds.length) {
    notify('Selecione profissional e serviços antes de buscar horários.', 'warning')
    return
  }

  const dateParam = toDateString(booking.date)
  if (!dateParam) {
    notify('Selecione uma data válida.', 'warning')
    return
  }

  if (!isBookingDateAllowed(dateParam)) {
    notify('Este dia está indisponível para o profissional selecionado.', 'warning')
    return
  }

  booking.loadingSlots = true
  booking.selectedSlot = null
  booking.slots = []
  booking.availabilityError = ''

  sendUserMessage(`Quero agendar para ${formatDate(dateParam)}.`)

  try {
    const params = new URLSearchParams()
    params.append('staff_id', String(booking.staffId))
    params.append('date', dateParam)
    params.append('step_minutes', '30')
    booking.serviceIds.forEach((serviceId) => params.append('service_ids[]', String(serviceId)))

    const { data } = await runWithTyping(() => api.get(`/api/availability?${params.toString()}`))
    const now = Date.now()
    const apiSlots = Array.isArray(data?.slots) ? data.slots : []
    booking.slots = apiSlots.filter((slot) => {
      const timestamp = new Date(slot).getTime()
      return Number.isFinite(timestamp) && timestamp > now
    })

    if (!booking.slots.length) {
      state.value = 'booking-date'
      sendBotMessage('Não encontrei horários para essa data. Escolha outro dia para tentar novamente.')
      return
    }

    state.value = 'booking-slot'
    sendBotMessage(`Encontrei ${booking.slots.length} horário(s). Escolha o que preferir.`)
  } catch {
    booking.availabilityError = 'Falha ao buscar horários. Toque em "Buscar horários" para tentar de novo.'
    sendBotMessage('Não consegui buscar horários agora. Vamos tentar novamente.')
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
    notify('Selecione um horário para confirmar.', 'warning')
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

    const isReschedule = Boolean(rescheduleSource.value?.id)

    if (isReschedule) {
      sendBotMessage(
        `Reagendamento confirmado para ${formatDateTime(data?.start_at)} com ${data?.staff?.name || selectedStaff.value?.name || 'equipe'}. Total confirmado: ${formatCurrencyBRL(data?.total_price || totalPrice.value)}.`
      )
      sendBotGif(BOOKING_RESCHEDULE_GIF_URL, 'Reagendamento confirmado')

      try {
        await api.post(`/api/appointments/${rescheduleSource.value.id}/cancel`, {
          reason: 'Reagendado pelo cliente (chat)',
        })
      } catch {
        sendBotMessage('Consegui criar o novo horário, mas não cancelou o anterior. Cancele em "Meus horários".')
      }

      notify('Reagendamento confirmado com sucesso.', 'success')
    } else {
      sendBotMessage(
        `Agendamento confirmado para ${formatDateTime(data?.start_at)} com ${data?.staff?.name || selectedStaff.value?.name || 'equipe'}. Total confirmado: ${formatCurrencyBRL(data?.total_price || totalPrice.value)}.`
      )
      sendBotMessage('Perfeito. Seu horário já está reservado e te aguardo no dia marcado.')
      sendBotGif(BOOKING_SUCCESS_GIF_URL, 'Agendamento confirmado')
      notify('Agendamento confirmado com sucesso.', 'success')
    }

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

const normalizeAppointmentsPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const loadAppointments = async ({ silent = false } = {}) => {
  loadingAppointments.value = true
  appointmentsLoadError.value = false

  try {
    const { data } = await runWithTyping(() => api.get('/api/appointments'))
    appointments.value = normalizeAppointmentsPayload(data)

    if (!silent) {
      state.value = 'appointments'
      if (!appointments.value.length) {
        sendBotMessage('Você ainda não possui agendamentos cadastrados.')
      } else {
        sendBotMessage(`Aqui estão seus ${appointments.value.length} agendamento(s).`)
      }
    }
  } catch {
    appointmentsLoadError.value = true
    if (!silent) {
      state.value = 'appointments'
      sendBotMessage('Não consegui carregar seus agendamentos agora.')
    }
  } finally {
    loadingAppointments.value = false
  }
}

const openAppointments = async ({ announceUser = true, announceBot = true } = {}) => {
  if (announceUser) sendUserMessage('Quero ver meus agendamentos.')
  await loadAppointments({ silent: !announceBot })
}

const startCancellationFlow = (appointment) => {
  if (appointment.status !== 'scheduled') return

  sendUserMessage(`Cancelar horário de ${formatDateTime(appointment.start_at)}.`)
  cancelContext.appointmentId = appointment.id
  cancelContext.startAt = appointment.start_at
  cancelContext.staffName = appointment.staff?.name || 'Equipe'
  cancelContext.reason = ''
  cancelContext.saving = false
  state.value = 'appointments-cancel-reason'
  sendBotMessage('Entendi. Me conte o motivo do cancelamento para eu registrar corretamente.')
}

const cancelReasonStepBack = () => {
  cancelContext.reason = ''
  cancelContext.saving = false
  state.value = 'appointments'
  sendBotMessage('Sem problemas. Você pode manter ou escolher outro horário.')
}

const submitCancellationReason = async () => {
  if (!cancelContext.appointmentId) {
    state.value = 'appointments'
    return
  }

  const reason = String(cancelContext.reason || '').trim()
  if (!reason) {
    notify('Informe o motivo do cancelamento.', 'warning')
    return
  }

  sendUserMessage(`Motivo: ${reason}`)
  cancelContext.saving = true

  try {
    await runWithTyping(() =>
      api.post(`/api/appointments/${cancelContext.appointmentId}/cancel`, {
        reason,
      })
    )

    notify('Agendamento cancelado.', 'success')
    sendBotMessage('Agendamento cancelado com sucesso. Sinto muito pelo imprevisto.')
    sendBotGif(BOOKING_CANCEL_SAD_GIF_URL, 'Cancelamento confirmado')
    await loadAppointments({ silent: true })
    state.value = 'menu'
  } catch {
    sendBotMessage('Não consegui cancelar esse horário agora. Tente novamente em instantes.')
  } finally {
    cancelContext.saving = false
  }
}

const startReschedule = async (appointment) => {
  if (!appointment || appointment.status !== 'scheduled') return

  const ready = await ensureCatalogLoaded()
  if (!ready) return

  const staff = staffOptions.value.find((item) => item.id === appointment.staff?.id)
  if (!staff) {
    sendBotMessage('Esse profissional não está disponível agora. Escolha outro para reagendar.')
    state.value = 'booking-staff'
    return
  }

  resetBooking()
  rescheduleSource.value = appointment
  booking.staffId = staff.id
  booking.serviceIds = (appointment.services || [])
    .map((service) => service.id)
    .filter((serviceId) => staff.services?.some((service) => service.id === serviceId))
  booking.date = toDateString(appointment.start_at) || todayDate

  sendUserMessage(`Quero reagendar ${formatDateTime(appointment.start_at)}.`)
  if (!booking.serviceIds.length) {
    state.value = 'booking-services'
    sendBotMessage('Os serviços antigos não estão mais disponíveis. Escolha novos serviços para reagendar.')
    return
  }

  state.value = 'booking-date'
  sendBotMessage('Vamos reagendar. Escolha a data e busque os horários disponíveis.')
  await loadBookingCalendarAvailability()
}

const openServices = async ({ announceUser = true, announceBot = true } = {}) => {
  if (announceUser) sendUserMessage('Quero ver os serviços.')
  await ensureCatalogLoaded()
  state.value = 'services'
  if (announceBot) sendBotMessage('Segue o catálogo atualizado de serviços.')
}

const openProfile = ({ announceUser = true, announceBot = true } = {}) => {
  if (announceUser) sendUserMessage('Quero ver meu perfil.')
  syncProfileForm()
  profilePhotoFile.value = null
  state.value = 'profile'
  if (announceBot) sendBotMessage('Você pode atualizar seu nome, telefone, email e foto por aqui.')
}

const saveProfile = async () => {
  const name = String(profileForm.name || '').trim()
  const email = String(profileForm.email || '').trim()
  const phone = normalizePhone(profileForm.phone, '55')

  if (!name) {
    profileErrors.value = { name: ['Informe seu nome.'] }
    notify('Informe seu nome para salvar o perfil.', 'warning')
    return
  }

  if (phone.length < 10) {
    profileErrors.value = { phone: ['Informe um telefone valido.'] }
    notify('Informe um telefone valido para salvar o perfil.', 'warning')
    return
  }

  savingProfile.value = true
  profileErrors.value = {}

  try {
    const { data } = await api.put('/api/me', {
      name,
      phone: buildE164('55', phone),
      email: email || null,
    })

    if (data?.user) {
      auth.user = data.user
    }

    await auth.loadMe(true)
    syncProfileForm()
    notify('Perfil atualizado com sucesso.', 'success')
  } catch (error) {
    profileErrors.value = error?.response?.data?.errors || {}
    if (!Object.keys(profileErrors.value).length) {
      notify(error?.response?.data?.message || 'Não foi possível atualizar seu perfil.', 'error')
    } else if (error?.response?.data?.message) {
      notify(error.response.data.message, 'warning')
    }
  } finally {
    savingProfile.value = false
  }
}

const uploadProfilePhoto = async () => {
  const selectedFile = Array.isArray(profilePhotoFile.value) ? profilePhotoFile.value[0] : profilePhotoFile.value
  if (!selectedFile) {
    notify('Selecione uma foto antes de enviar.', 'warning')
    return
  }

  uploadingProfilePhoto.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile)

    const { data } = await api.post('/api/me/photo', formData)
    if (data?.user) {
      auth.user = data.user
    }

    await auth.loadMe(true)
    profilePhotoFile.value = null
    notify('Foto atualizada com sucesso.', 'success')
  } catch (error) {
    notify(error?.response?.data?.message || 'Não foi possível atualizar a foto.', 'error')
  } finally {
    uploadingProfilePhoto.value = false
  }
}

const currentPanelGroup = computed(() => {
  if (state.value === 'appointments' || state.value === 'appointments-cancel-reason') return 'appointments'
  if (state.value === 'services') return 'services'
  if (state.value === 'profile') return 'profile'
  if (['booking-staff', 'booking-services', 'booking-date', 'booking-slot', 'booking-confirm'].includes(state.value)) {
    return 'booking'
  }
  return 'menu'
})

const applyPanelFromRoute = async (panel, { initial = false } = {}) => {
  const target = String(panel || 'menu')
  if (!initial && target === currentPanelGroup.value) return

  if (target === 'appointments') {
    await openAppointments({ announceUser: false, announceBot: true })
    return
  }

  if (target === 'services') {
    await openServices({ announceUser: false, announceBot: true })
    return
  }

  if (target === 'profile') {
    openProfile({ announceUser: false, announceBot: true })
    return
  }

  if (target === 'booking') {
    await startBooking({ announceUser: false, announceBot: true })
    return
  }

  if (!initial) {
    goToMenu({ announceUser: false, announceBot: true })
  }
}

watch(state, () => {
  scrollChatToBottom()
})

watch(
  () => [
    booking.loadingSlots,
    booking.slots.length,
    booking.availabilityError,
    booking.saving,
    loadingCatalog.value,
    loadingAppointments.value,
    appointmentsLoadError.value,
    appointments.value.length,
    savingProfile.value,
    uploadingProfilePhoto.value,
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
      syncProfileForm()
      sendBotMessage(`Login confirmado, ${auth.user?.name?.split(' ')[0] || 'cliente'}.`)
      state.value = 'menu'
    }

    if (!current && previous) {
      syncProfileForm()
      profilePhotoFile.value = null
      appointments.value = []
      state.value = 'menu'
      sendBotMessage('Sua sessão foi encerrada.')
    }
  }
)

watch(
  () => routePanel.value,
  async (panel, previous) => {
    if (!routePanelReady.value) return
    if (panel === previous) return
    await applyPanelFromRoute(panel)
  }
)

onMounted(async () => {
  if (typeof ResizeObserver !== 'undefined') {
    contentResizeObserver = new ResizeObserver(() => {
      scrollChatToBottom()
    })

    if (chatContentRef.value) {
      contentResizeObserver.observe(chatContentRef.value)
    }
  }

  await loadCatalog()
  await loadAppointments({ silent: true })
  syncProfileForm()
  beginConversation()
  routePanelReady.value = true

  if (routePanel.value !== 'menu') {
    await applyPanelFromRoute(routePanel.value, { initial: true })
  }
})

onBeforeUnmount(() => {
  isChatActive = false
  resetBotMessageQueue()
  activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId))
  activeTimeouts.clear()

  if (pendingScrollFrame !== null) {
    cancelAnimationFrame(pendingScrollFrame)
    pendingScrollFrame = null
  }

  if (contentResizeObserver) {
    contentResizeObserver.disconnect()
    contentResizeObserver = null
  }
})
</script>

<style scoped>
.client-chat-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0;
}

.chat-shell {
  --chat-bot-bubble-bg: linear-gradient(180deg, rgba(236, 244, 248, 0.96), rgba(218, 228, 233, 0.92));
  display: grid;
  grid-template-rows: auto minmax(320px, 1fr);
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, #111821 0%, #1a232d 58%, #202b35 100%);
  color: #edf4f7;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid rgba(88, 116, 130, 0.24);
  box-shadow: 0 28px 64px rgba(17, 24, 31, 0.28);
}

.chat-header {
  padding: 12px 18px;
  border-bottom: 1px solid rgba(180, 208, 221, 0.18);
  background: linear-gradient(148deg, rgba(25, 34, 43, 0.96), rgba(17, 24, 31, 0.92));
}

.chat-header-inner {
  width: min(980px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.chat-agent {
  flex: 1;
  min-width: 0;
}

.agent-title {
  font-family: var(--display-font, 'Avenir Next');
  font-size: 1rem;
  font-weight: 700;
  color: #edf4f7;
}

.agent-subtitle {
  font-size: 0.84rem;
  color: rgba(237, 244, 247, 0.68);
  margin-top: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}

.options-btn {
  width: 25px;
  min-width: 25px;
  height: 25px !important;
}

.chat-body {
  overflow-y: auto;
  padding: 24px 14px 28px;
}

.chat-content {
  width: min(980px, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-row {
  display: flex;
  flex-direction: column;
  max-width: 100%;
}

.message-row--bot {
  align-items: flex-start;
}

.message-row--user {
  align-items: flex-end;
}

.message-bubble {
  max-width: min(760px, 100%);
  padding: 14px 16px;
  border-radius: 22px;
  line-height: 1.45;
  font-size: 0.96rem;
  box-shadow: 0 18px 34px rgba(11, 16, 21, 0.2);
  white-space: pre-line;
}

.message-bubble--bot {
  background: var(--chat-bot-bubble-bg);
  color: #173133;
  border-top-left-radius: 8px;
}

.message-bubble--user {
  background: linear-gradient(135deg, rgba(182, 119, 49, 0.98), rgba(206, 147, 74, 0.94));
  color: #fff8f0;
  border-top-right-radius: 8px;
}

.message-bubble--gif {
  padding: 6px;
}

.message-gif {
  display: block;
  width: min(320px, 100%);
  border-radius: 18px;
}

.message-time {
  font-size: 0.72rem;
  color: rgba(237, 244, 247, 0.46);
  margin-top: 6px;
  padding: 0 8px;
}

.typing-row {
  display: flex;
  justify-content: flex-start;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 16px;
  border-radius: 22px;
  border-top-left-radius: 8px;
  background: rgba(227, 237, 241, 0.92);
}

.typing-bubble span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(23, 49, 51, 0.55);
  animation: typing 1s infinite ease-in-out;
}

.typing-bubble span:nth-child(2) {
  animation-delay: 0.12s;
}

.typing-bubble span:nth-child(3) {
  animation-delay: 0.24s;
}

.inline-options-row {
  margin-top: 6px;
}

.inline-options-card {
  width: 100%;
  max-width: none;
  border-top-left-radius: 18px;
  background: var(--chat-bot-bubble-bg);
  color: #173133;
}

.inline-options-title {
  font-family: var(--display-font, 'Avenir Next');
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 14px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.services-action-btn {
  background: rgba(var(--v-theme-secondary), 0.12);
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.choice-grid--services {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.choice-card {
  appearance: none;
  border: 1px solid rgba(23, 49, 51, 0.12);
  background: rgba(255, 255, 255, 0.84);
  border-radius: 20px;
  padding: 14px;
  text-align: left;
  color: #173133;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-card:hover {
  transform: translateY(-2px);
  border-color: rgba(182, 119, 49, 0.4);
  box-shadow: 0 18px 30px rgba(17, 24, 31, 0.08);
}

.choice-card--selected {
  border-color: rgba(182, 119, 49, 0.7);
  background: linear-gradient(180deg, rgba(255, 248, 239, 0.98), rgba(249, 238, 224, 0.94));
}

.choice-card--service {
  min-height: 220px;
}

.choice-card--staff {
  justify-content: center;
}

.choice-card__body {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.choice-copy {
  min-width: 0;
  flex: 1;
}

.choice-avatar {
  background: linear-gradient(135deg, rgba(182, 119, 49, 0.22), rgba(23, 49, 51, 0.14));
  color: #173133;
  flex-shrink: 0;
}

.choice-title {
  font-weight: 700;
  font-size: 0.98rem;
}

.choice-subtitle {
  font-size: 0.84rem;
  color: rgba(23, 49, 51, 0.68);
}

.choice-price {
  margin-top: auto;
  font-weight: 700;
  color: #b67731;
}

.service-media {
  height: 98px;
  border-radius: 18px;
  background: rgba(23, 49, 51, 0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.service-media__img {
  width: 100%;
  height: 100%;
}

.panel-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(23, 49, 51, 0.08);
  margin-top: 14px;
  color: rgba(23, 49, 51, 0.9);
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.panel-actions--split {
  justify-content: space-between;
}

.panel-actions--confirm {
  display: grid;
  grid-template-columns: repeat(2, max-content);
  justify-content: space-between;
  align-items: center;
}

.loading-box,
.empty-note {
  padding: 18px;
  border-radius: 18px;
  background: rgba(23, 49, 51, 0.08);
  text-align: center;
}

.date-tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.slot-btn {
  min-height: 48px;
}

.confirm-card {
  background: rgba(255, 255, 255, 0.74);
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(23, 49, 51, 0.14);
}

.confirm-row > span {
  flex-shrink: 0;
}

.confirm-row > strong {
  flex: 1;
  display: block;
  max-width: 72%;
  text-align: right;
  line-height: 1.4;
}

.confirm-row:last-child {
  border-bottom: none;
}

.appointment-list {
  display: grid;
  gap: 14px;
}

.appointments-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.appointment-card {
  background: rgba(255, 255, 255, 0.82);
}

.appointment-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.appointment-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
}

.appointment-time {
  margin-top: 4px;
  font-size: 1.04rem;
  font-weight: 700;
}

.appointment-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.appointment-status-chip--scheduled {
  background: rgba(182, 119, 49, 0.16);
  color: #8b5a22;
}

.appointment-status-chip--done {
  background: rgba(61, 119, 96, 0.16);
  color: #285845;
}

.appointment-status-chip--canceled {
  background: rgba(171, 79, 79, 0.16);
  color: #7d3333;
}

.appointment-status-chip--no_show {
  background: rgba(180, 109, 39, 0.16);
  color: #7d4b17;
}

.appointment-status-chip--default {
  background: rgba(23, 49, 51, 0.12);
  color: #173133;
}

.appointment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.appointment-staff-avatar {
  background: rgba(23, 49, 51, 0.08);
  color: #173133;
}

.appointment-meta-text {
  font-size: 0.92rem;
}

.appointment-cancel-reason {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(171, 79, 79, 0.08);
  color: #7d3333;
  font-size: 0.9rem;
}

.appointment-services {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.appointment-footer {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.appointment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.reminders-box {
  padding: 14px;
  border-radius: 18px;
  background: rgba(23, 49, 51, 0.08);
}

.field-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: rgba(23, 49, 51, 0.62);
}

.profile-card {
  padding: 2px 0 0;
}

.profile-photo-block {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.profile-avatar {
  background: linear-gradient(135deg, rgba(182, 119, 49, 0.22), rgba(23, 49, 51, 0.14));
  color: #173133;
}

.profile-action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.profile-warning-alert {
  display: grid;
  gap: 10px;
}

.profile-warning-actions {
  display: flex;
  justify-content: flex-end;
}

.chat-bottom-anchor {
  width: 100%;
  height: 2px;
}

.bubble-enter-active,
.bubble-leave-active {
  transition: all 0.24s ease;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (min-width: 1280px) {
  .action-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .chat-body {
    padding: 18px 12px 22px;
  }

  .action-grid,
  .appointments-filters,
  .date-tools {
    grid-template-columns: 1fr;
  }

  .panel-actions--split {
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .chat-header {
    padding: 10px 12px;
  }

  .agent-subtitle {
    display: none;
  }

  .chat-header-inner {
    align-items: flex-start;
    flex-direction: row;
  }

  .header-actions {
    width: auto;
    justify-content: flex-end;
  }

  .message-bubble {
    max-width: 100%;
    padding: 13px 14px;
  }

  .inline-options-card {
    padding: 14px;
  }

  .appointment-head,
  .appointment-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .appointment-actions,
  .profile-action-row {
    width: 100%;
  }

  .appointment-actions :deep(.v-btn),
  .profile-action-row :deep(.v-btn) {
    width: 100%;
  }
}
</style>
