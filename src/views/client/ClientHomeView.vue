<template>
  <div class="client-chat-page">
    <div class="chat-shell">
      <header class="chat-header">
        <div class="chat-header-inner">
          <div class="chat-agent">
            <div class="agent-title">Assistente do {{ companyName }}</div>
          </div>
          <div class="header-actions">
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="outlined" color="primary" size="small" class="options-btn">
                  <v-icon icon="mdi-dots-vertical" />
                </v-btn>
              </template>
              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="mdi-refresh" title="Reiniciar" @click="beginConversation" />
                <v-list-item prepend-icon="mdi-logout" title="Sair" @click="leaveChat" />
              </v-list>
            </v-menu>
          </div>
        </div>
      </header>

      <div ref="chatBodyRef" class="chat-body">
        <div ref="chatContentRef" class="chat-content">
          <transition-group name="bubble">
            <div v-for="message in messages" :key="message.id" class="message-row"
              :class="`message-row--${message.role}`">
              <div class="message-bubble" :class="`message-bubble--${message.role}`">
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
                  <v-btn color="primary" size="large" prepend-icon="mdi-calendar-check-outline" @click="startBooking">
                    Novo agendamento
                  </v-btn>
                  <v-btn color="secondary" variant="tonal" size="large" prepend-icon="mdi-content-cut" class="menu-btn--services"
                    @click="openServices">
                    Ver serviços
                  </v-btn>
                  <v-btn variant="outlined" color="primary" size="large" prepend-icon="mdi-calendar-clock-outline"
                    @click="openAppointments">
                    Meus horários
                  </v-btn>
                  <v-btn variant="outlined" color="primary" size="large" prepend-icon="mdi-account-outline"
                    @click="openProfile">
                    Meu perfil
                  </v-btn>
                </div>

                <v-alert
                  v-if="profileNeedsAttention"
                  type="warning"
                  variant="tonal"
                  class="mt-3"
                >
                  Seu perfil está incompleto. Adicione um email para receber confirmações e lembretes.
                  <template #append>
                    <v-btn size="small" variant="text" color="warning" @click="openProfile">Completar</v-btn>
                  </template>
                </v-alert>

              </template>

              <template v-else-if="state === 'auth-required'">
                <v-alert type="info" variant="tonal" class="mb-4">
                  Faça login para continuar com essa ação.
                </v-alert>
                <div class="panel-actions">
                  <v-btn color="primary" size="large" prepend-icon="mdi-login" @click="goToLogin">
                    Ir para login
                  </v-btn>
                  <v-btn variant="outlined" color="primary" size="large" prepend-icon="mdi-arrow-left"
                    @click="goToMenu">
                    Voltar ao menu
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'booking-staff'">
                <div v-if="loadingCatalog" class="loading-box">
                  <v-progress-circular indeterminate color="primary" />
                </div>
                <div v-else-if="catalogLoadError" class="empty-note">
                  Não consegui carregar os profissionais agora.
                  <div class="mt-2">
                    <v-btn size="small" color="primary" variant="outlined" @click="loadCatalog({ force: true })">
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
                      class="choice-card"
                      :class="{ 'choice-card--selected': booking.staffId === staff.id }"
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
                  <div class="panel-actions panel-actions--split">
                    <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" @click="goToMenu">
                      Voltar
                    </v-btn>
                    <v-btn color="primary" :disabled="!booking.staffId" @click="continueToServiceStep">
                      Continuar
                    </v-btn>
                  </div>
                </template>
              </template>

              <template v-else-if="state === 'booking-services'">
                <div v-if="!availableServices.length" class="empty-note">
                  Esse profissional não tem serviços disponíveis no momento.
                </div>

                <div v-else class="choice-grid choice-grid--services">
                  <button v-for="service in availableServices" :key="service.id" type="button"
                    class="choice-card choice-card--service"
                    :class="{ 'choice-card--selected': booking.serviceIds.includes(service.id) }"
                    @click="toggleService(service.id)">
                    <div class="service-media">
                      <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover
                        class="service-media__img" />
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
                  <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backToStaffSelection">
                    Trocar profissional
                  </v-btn>
                  <v-btn color="primary" :disabled="!booking.serviceIds.length" @click="continueToDateStep">
                    Continuar
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'booking-date'">
                <div class="date-tools">
                  <v-date-input v-model="booking.date" label="Data" variant="outlined" density="compact" hide-details
                    :min="todayDate" :allowed-dates="isBookingDateAllowed" :disabled="loadingCalendarAvailability" />
                  <v-btn color="primary" size="large" :loading="booking.loadingSlots"
                    :disabled="loadingCalendarAvailability || !isBookingDateAllowed(booking.date)"
                    @click="fetchAvailability">
                    Buscar horários
                  </v-btn>
                </div>

                <v-alert v-if="loadingCalendarAvailability" type="info" variant="tonal" class="mt-3">
                  Verificando os dias disponíveis para este profissional...
                </v-alert>

                <v-alert v-else-if="bookingCalendarLoaded && !availableBookingDates.length" type="warning" variant="tonal"
                  class="mt-3">
                  Não há datas disponíveis no período atual para este profissional e serviços.
                </v-alert>

                <v-alert v-if="booking.availabilityError" type="warning" variant="tonal" class="mt-3">
                  {{ booking.availabilityError }}
                </v-alert>

                <div class="panel-summary">
                  <div>{{ selectedStaff?.name || 'Profissional' }}</div>
                  <div>{{ selectedServicesLabel || 'Serviços não selecionados' }}</div>
                  <div>{{ formatCurrencyBRL(totalPrice) }}</div>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backToServiceSelection">
                    Voltar
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'booking-slot'">
                <div v-if="!booking.slots.length" class="empty-note">
                  Nenhum horário disponível para essa data.
                </div>

                <div v-else class="slots-grid">
                  <v-btn v-for="slot in booking.slots" :key="slot" variant="outlined" color="primary" class="slot-btn"
                    @click="selectSlot(slot)">
                    {{ formatTime(slot) }}
                  </v-btn>
                </div>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backToDateSelection">
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

                <v-alert type="info" variant="tonal" class="mt-3 confirm-policy-alert">
                  Cancelamentos: até 2h antes sem custo. Menor antecedência pode impactar prioridade de novos encaixes.
                </v-alert>

                <div class="panel-actions panel-actions--split">
                  <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="backToSlotSelection">
                    Trocar horário
                  </v-btn>
                  <v-btn color="primary" :loading="booking.saving" @click="confirmBooking">
                    Confirmar agendamento
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'appointments'">
                <div v-if="loadingAppointments" class="loading-box">
                  <v-skeleton-loader
                    type="article, article, article"
                    class="appointments-skeleton"
                  />
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
                      variant="tonal"
                      class="mb-2"
                    >
                      {{ reminder.text }}
                    </v-alert>
                  </div>

                  <div class="appointments-filters">
                    <v-text-field
                      v-model="appointmentFilters.search"
                      class="appointments-filter-control mt-3"
                      placeholder="Buscar serviço/profissional"
                      aria-label="Buscar serviço/profissional"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <v-select
                      v-model="appointmentFilters.status"
                      class="appointments-filter-control"
                      :items="statusFilterOptions"
                      item-title="label"
                      item-value="value"
                      aria-label="Filtrar por status"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <v-select
                      v-model="appointmentFilters.period"
                      class="appointments-filter-control"
                      :items="periodFilterOptions"
                      item-title="label"
                      item-value="value"
                      aria-label="Filtrar por período"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </div>

                  <div v-if="appointmentsLoadError" class="empty-note">
                    Não consegui carregar seus agendamentos agora.
                    <div class="mt-2">
                      <v-btn size="small" color="primary" variant="outlined" @click="loadAppointments()">
                        Tentar novamente
                      </v-btn>
                    </div>
                  </div>

                  <div v-else-if="!filteredAppointments.length" class="empty-note">
                    Nenhum agendamento encontrado com os filtros atuais.
                  </div>

                  <v-card v-for="appointment in filteredAppointments" :key="appointment.id" class="appointment-card"
                    elevation="0">
                    <v-card-text>
                      <div class="appointment-head">
                        <div class="appointment-main">
                          <div class="appointment-photo">
                            <v-img
                              v-if="appointmentPrimaryPhoto(appointment)"
                              :src="resolveMediaUrl(appointmentPrimaryPhoto(appointment))"
                              cover
                            />
                            <v-icon v-else icon="mdi-calendar-star" size="24" />
                          </div>

                          <div class="appointment-summary">
                            <div class="appointment-title">{{ formatDate(appointment.start_at) }}</div>
                            <div class="appointment-time">
                              {{ formatTime(appointment.start_at) }} - {{ formatTime(appointment.end_at) }}
                            </div>
                            <div class="appointment-badges">
                              <v-chip
                                class="appointment-weekday-badge"
                                size="small"
                                variant="flat"
                                color="info"
                                prepend-icon="mdi-calendar-week"
                              >
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
                          <v-chip size="small" :color="statusColor(appointment.status)" variant="tonal">
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

                      <div
                        v-if="appointment.status === 'canceled' && appointment.cancel_reason"
                        class="appointment-cancel-reason"
                      >
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
                            class="appointment-action-btn appointment-action-btn--reschedule"
                            variant="elevated"
                            color="secondary"
                            size="default"
                            prepend-icon="mdi-calendar-refresh"
                            @click="startReschedule(appointment)"
                          >
                            Reagendar
                          </v-btn>
                          <v-btn
                            v-if="appointment.status === 'scheduled'"
                            class="appointment-action-btn appointment-action-btn--cancel"
                            variant="elevated"
                            color="error"
                            size="default"
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
                  <v-btn variant="outlined" color="primary" prepend-icon="mdi-arrow-left" @click="goToMenu">
                    Voltar ao menu
                  </v-btn>
                </div>
              </template>

              <template v-else-if="state === 'services'">
                <div v-if="loadingCatalog" class="loading-box">
                  <v-progress-circular indeterminate color="primary" />
                </div>
                <div v-else-if="catalogLoadError" class="empty-note">
                  Catálogo indisponível no momento.
                  <div class="mt-2">
                    <v-btn size="small" color="primary" variant="outlined" @click="loadCatalog({ force: true })">
                      Tentar novamente
                    </v-btn>
                  </div>
                </div>

                <div v-else-if="!servicesCatalog.length" class="empty-note">
                  Catálogo indisponível no momento.
                </div>

                <div v-else class="choice-grid choice-grid--services">
                  <div v-for="service in servicesCatalog" :key="service.id" class="choice-card choice-card--service">
                    <div class="service-media">
                      <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover
                        class="service-media__img" />
                      <v-icon v-else icon="mdi-content-cut" size="26" />
                    </div>
                    <div class="choice-title">{{ service.name }}</div>
                    <div class="choice-subtitle">{{ service.duration_minutes }} min</div>
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
                      <div class="field-label">Email atual</div>
                      <div>{{ auth.user?.email || 'Não informado' }}</div>
                    </div>
                    <div>
                      <div class="field-label">Empresa</div>
                      <div>{{ auth.user?.company?.name || 'Não vinculada' }}</div>
                    </div>
                  </div>

                  <v-divider class="my-3" />

                  <v-row dense class="profile-editor-grid">
                    <v-col cols="12" md="6">
                      <v-text-field v-model="profileForm.name" label="Nome" variant="outlined" density="compact"
                        prepend-inner-icon="mdi-account-outline" :error-messages="profileErrors.name"
                        hide-details="auto" />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="profileForm.email" label="Email" type="email" variant="outlined"
                        density="compact" prepend-inner-icon="mdi-email-outline"
                        :error-messages="profileErrors.email" hide-details="auto" />
                    </v-col>

                    <v-col cols="12">
                      <v-file-input v-model="profilePhotoFile" class="profile-upload-field" label="Selecionar nova foto"
                        accept="image/*" prepend-icon="mdi-camera" variant="outlined" density="compact" show-size
                        chips hide-details="auto" />
                    </v-col>
                  </v-row>

                  <div class="profile-action-row">
                    <v-btn color="secondary" variant="tonal" prepend-icon="mdi-image-edit-outline"
                      :loading="uploadingProfilePhoto" @click="uploadProfilePhoto">
                      Atualizar foto
                    </v-btn>
                    <v-btn color="primary" prepend-icon="mdi-content-save-outline" :loading="savingProfile"
                      @click="saveProfile">
                      Salvar dados
                    </v-btn>
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
                  variant="outlined"
                  density="compact"
                  rows="3"
                  auto-grow
                  hide-details
                />

                <div class="panel-actions panel-actions--split mt-3">
                  <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="cancelReasonStepBack">
                    Voltar
                  </v-btn>
                  <v-btn color="primary" :loading="cancelContext.saving" @click="submitCancellationReason">
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
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alerts'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatPhoneFromE164 } from '@/lib/phone'
import { resolveMediaUrl } from '@/lib/media'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const alerts = useAlertStore()
const BOOKING_SUCCESS_GIF_URL = 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif'
const BOOKING_CANCEL_SAD_GIF_URL = 'https://media.giphy.com/media/BEob5qwFkSJ7G/giphy.gif'
const BOOKING_RESCHEDULE_GIF_URL = 'https://media.giphy.com/media/l3vR85PnGsBwu1PFK/giphy.gif'

const chatBodyRef = ref(null)
const chatContentRef = ref(null)
const chatBottomRef = ref(null)
const messages = ref([])
const assistantTypingByRequest = ref(false)
const botQueuePendingCount = ref(0)
const assistantTypingByQueue = computed(() => botQueuePendingCount.value > 0)
const assistantTyping = computed(() => assistantTypingByRequest.value || assistantTypingByQueue.value)
let nextMessageId = 1
let pendingScrollFrame = null
let contentResizeObserver = null
let isChatActive = true
let botMessageQueue = Promise.resolve()
let botMessageQueueVersion = 0
const activeTimeouts = new Set()

const state = ref('menu')
const loadingCatalog = ref(false)
const catalogLoadError = ref(false)
const loadingAppointments = ref(false)
const appointmentsLoadError = ref(false)
const loadingCalendarAvailability = ref(false)
const bookingCalendarLoaded = ref(false)
const staffOptions = ref([])
const servicesCatalog = ref([])
const appointments = ref([])
const availableBookingDates = ref([])
const rescheduleSource = ref(null)
const appointmentFilters = reactive({
  search: '',
  status: 'all',
  period: 'all',
})
const profileForm = reactive({
  name: '',
  email: '',
})
const profileErrors = ref({})
const profilePhotoFile = ref(null)
const savingProfile = ref(false)
const uploadingProfilePhoto = ref(false)
const cancelContext = reactive({
  appointmentId: null,
  startAt: '',
  staffName: '',
  reason: '',
  saving: false,
})

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

const booking = reactive({
  staffId: null,
  serviceIds: [],
  date: todayDate,
  slots: [],
  selectedSlot: null,
  availabilityError: '',
  loadingSlots: false,
  saving: false,
})

const availableBookingDateSet = computed(() => new Set(availableBookingDates.value))

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
    'appointments-cancel-reason': 'Motivo do cancelamento',
    services: 'Catálogo de serviços',
    profile: 'Seu perfil',
  }
  return map[state.value] || 'Atendimento'
})

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

const showInlineOptionsPanel = computed(() => {
  const statesWithPanel = [
    'menu',
    'auth-required',
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

const syncProfileForm = () => {
  profileForm.name = auth.user?.name || ''
  profileForm.email = auth.user?.email || ''
  profileErrors.value = {}
}

const buildAssistantSeenStorageKey = () => {
  if (auth.user?.id) {
    return `client_chat_seen:${auth.user.id}`
  }
  return 'client_chat_seen:guest'
}

const hasSeenAssistantBefore = () => {
  return localStorage.getItem(buildAssistantSeenStorageKey()) === '1'
}

const markAssistantAsSeen = () => {
  localStorage.setItem(buildAssistantSeenStorageKey(), '1')
}

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
    .sort((a, b) => a.timestamp - b.timestamp)[0]?.appointment || null
})

const BOT_MESSAGE_GAP_MS = 80
const BOT_MIN_TYPING_MS = 180
const BOT_MAX_TYPING_MS = 780

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
    .catch(() => {
      // No-op: queue accounting is handled in finally.
    })
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

const startOfLocalDay = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
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

const appointmentServicesList = (appointment) =>
  Array.isArray(appointment?.services) ? appointment.services : []

const appointmentServiceCount = (appointment) => appointmentServicesList(appointment).length

const appointmentPrimaryPhoto = (appointment) => {
  const serviceWithPhoto = appointmentServicesList(appointment).find((service) => service?.photo_url)
  if (serviceWithPhoto?.photo_url) return serviceWithPhoto.photo_url
  if (appointment?.staff?.avatar_url) return appointment.staff.avatar_url
  return ''
}

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
  resetBotMessageQueue()
  messages.value = []
  nextMessageId = 1
  state.value = 'menu'
  resetBooking()

  const firstName = auth.user?.name?.split(' ')[0]
  const seenBefore = hasSeenAssistantBefore()
  const isFirstAccess = auth.isAuthenticated && !seenBefore && !hasAppointmentHistory.value

  if (isFirstAccess) {
    if (firstName) {
      sendBotMessage(`Bem-vindo, ${firstName}. Esse é seu primeiro acesso por aqui.`)
    } else {
      sendBotMessage('Bem-vindo. Esse é seu primeiro acesso por aqui.')
    }
    sendBotMessage('Posso te guiar no seu primeiro agendamento: escolha profissional, serviços, data e horário.')
    sendBotMessage('Quando confirmar, você acompanha seus horários na opção "Meus agendamentos".')
  } else if (auth.isAuthenticated && hasAppointmentHistory.value) {
    if (firstName) {
      sendBotMessage(`Que bom te ver de novo, ${firstName}.`)
    } else {
      sendBotMessage('Que bom te ver de novo.')
    }
    const nextAppointmentMessage = describeNextScheduledAppointment(nextScheduledAppointment.value)
    if (nextAppointmentMessage) {
      sendBotMessage(nextAppointmentMessage)
    } else {
      sendBotMessage('Vi que você já tem histórico de agendamentos. Posso acelerar seu próximo atendimento.')
    }
    sendBotMessage(`Você já tem ${appointments.value.length} agendamento(s) registrado(s).`)
  } else if (auth.isAuthenticated) {
    if (firstName) {
      sendBotMessage(`Olá, ${firstName}. Vou te ajudar a agendar em poucos passos.`)
    } else {
      sendBotMessage('Olá. Sou sua assistente de agendamento.')
    }
    sendBotMessage('Sua conta está conectada. Podemos criar, revisar ou cancelar horários por aqui.')
  } else {
    sendBotMessage('Olá. Sou sua assistente de agendamento.')
    sendBotMessage('Você pode explorar serviços agora e fazer login para confirmar agendamentos.')
  }

  sendBotMessage('Escolha uma opção abaixo para continuar.')
  markAssistantAsSeen()
}

const goToMenu = () => {
  sendUserMessage('Voltar ao menu.')
  state.value = 'menu'
  sendBotMessage('Perfeito. O que você quer fazer agora?')
}

const goToLogin = () => {
  sendUserMessage('Quero fazer login.')
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

const leaveChat = async () => {
  if (auth.isAuthenticated) {
    await auth.logout()
  }
  router.replace({ name: 'login' })
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

const backToStaffSelection = () => {
  sendUserMessage('Quero trocar o profissional.')
  state.value = 'booking-staff'
  sendBotMessage('Sem problema. Escolha outro profissional.')
}

const backToServiceSelection = () => {
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
}

const continueToServiceStep = () => {
  if (!booking.staffId) {
    alerts.warning('Selecione um profissional para continuar.')
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
    alerts.warning('Selecione pelo menos um serviço.')
    return
  }

  sendUserMessage(`Serviços escolhidos: ${selectedServicesLabel.value}.`)
  state.value = 'booking-date'
  sendBotMessage('Boa escolha. Agora selecione a data e eu busco os horários livres.')
  await loadBookingCalendarAvailability()
}

const fetchAvailability = async () => {
  if (!booking.staffId || !booking.serviceIds.length) {
    alerts.warning('Selecione profissional e serviços antes de buscar horários.')
    return
  }

  const dateParam = toDateString(booking.date)
  if (!dateParam) {
    alerts.warning('Selecione uma data válida.')
    return
  }

  if (!isBookingDateAllowed(dateParam)) {
    alerts.warning('Este dia está indisponível para o profissional selecionado.')
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
    sendBotMessage('Perfeito. Seu horario ja esta reservado e te aguardo no dia marcado.')
    sendBotGif(BOOKING_SUCCESS_GIF_URL, 'Agendamento confirmado')
    sendBotMessage('Se quiser, posso te ajudar com outro agendamento ou te mostrar seus horarios.')

    if (rescheduleSource.value?.id) {
      try {
        await api.post(`/api/appointments/${rescheduleSource.value.id}/cancel`, {
          reason: 'Reagendado pelo cliente (chat)',
        })
        sendBotMessage('Seu horário anterior foi cancelado automaticamente.')
        sendBotGif(BOOKING_RESCHEDULE_GIF_URL, 'Reagendamento confirmado')
      } catch {
        sendBotMessage('Consegui criar o novo horário, mas não cancelou o anterior. Cancele em "Meus horários".')
      }
    }

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
  appointmentsLoadError.value = false
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

const openAppointments = async () => {
  sendUserMessage('Quero ver meus agendamentos.')
  await loadAppointments()
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
    alerts.warning('Informe o motivo do cancelamento.')
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

    alerts.success('Agendamento cancelado.')
    sendBotMessage('Agendamento cancelado com sucesso. Sinto muito pelo imprevisto.')
    sendBotGif(BOOKING_CANCEL_SAD_GIF_URL, 'Cancelamento confirmado')
    await loadAppointments({ silent: true })
    state.value = 'menu'
    sendBotMessage('Quando quiser, posso te ajudar com um novo agendamento.')
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

const isBookingDateAllowed = (value) => {
  const date = toDateString(value)
  if (!date) return false
  if (date < todayDate) return false
  if (!booking.serviceIds.length || !booking.staffId) return false
  return availableBookingDateSet.value.has(date)
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

  syncProfileForm()
  profilePhotoFile.value = null
  state.value = 'profile'
  sendBotMessage('Você pode atualizar seu nome, email e foto por aqui.')
}

const saveProfile = async () => {
  if (!auth.isAuthenticated) {
    state.value = 'auth-required'
    sendBotMessage('Para editar seu perfil, faça login.')
    return
  }

  const name = String(profileForm.name || '').trim()
  const email = String(profileForm.email || '').trim()

  if (!name) {
    profileErrors.value = { name: ['Informe seu nome.'] }
    alerts.warning('Informe seu nome para salvar o perfil.')
    return
  }

  savingProfile.value = true
  profileErrors.value = {}

  try {
    const { data } = await api.put('/api/me', {
      name,
      email: email || null,
    })

    if (data?.user) {
      auth.user = data.user
    }

    await auth.loadMe(true)
    syncProfileForm()
    alerts.success('Perfil atualizado com sucesso.')
  } catch (error) {
    profileErrors.value = error?.response?.data?.errors || {}
    if (!Object.keys(profileErrors.value).length) {
      alerts.error(error?.response?.data?.message || 'Não foi possível atualizar seu perfil.')
    } else if (error?.response?.data?.message) {
      alerts.warning(error.response.data.message)
    }
  } finally {
    savingProfile.value = false
  }
}

const uploadProfilePhoto = async () => {
  if (!auth.isAuthenticated) {
    state.value = 'auth-required'
    sendBotMessage('Para atualizar sua foto, faça login.')
    return
  }

  const selectedFile = Array.isArray(profilePhotoFile.value) ? profilePhotoFile.value[0] : profilePhotoFile.value
  if (!selectedFile) {
    alerts.warning('Selecione uma foto antes de enviar.')
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
    alerts.success('Foto atualizada com sucesso.')
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível atualizar a foto.')
  } finally {
    uploadingProfilePhoto.value = false
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
      sendBotMessage('Sua sessão foi encerrada. Você pode continuar navegando como visitante.')
    }
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
  if (auth.isAuthenticated) {
    await loadAppointments({ silent: true })
  }
  syncProfileForm()
  beginConversation()
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
}

.chat-shell {
  display: grid;
  grid-template-rows: auto minmax(320px, 1fr);
  min-height: 100vh;
  min-height: 100dvh;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid rgba(88, 116, 130, 0.28);
  box-shadow: 0 24px 56px rgba(22, 33, 40, 0.22);
  background: linear-gradient(178deg, #12171f 0%, #1a212c 48%, #202a34 100%);
}

.chat-header {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(180, 208, 221, 0.2);
  background: linear-gradient(148deg, rgba(26, 36, 45, 0.96), rgba(18, 25, 32, 0.86));
}

.chat-header-inner {
  width: min(980px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.chat-agent {
  display: flex;
  align-items: center;
  min-width: 0;
}

.agent-title {
  font-family: var(--display-font);
  color: #edf4f7;
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  --status-control-height: 28px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
  gap: 8px;
}

.options-btn {
  min-height: var(--status-control-height) !important;
  height: var(--status-control-height) !important;
  min-width: var(--status-control-height) !important;
  width: var(--status-control-height) !important;
  padding: 0 !important;
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

.chat-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: min(980px, 100%);
  margin: 0 auto;
}

.chat-bottom-anchor {
  width: 100%;
  height: 1px;
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

.message-gif {
  display: block;
  width: min(320px, 100%);
  max-width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(205, 229, 237, 0.35);
}

.message-bubble--bot {
  color: #f6fafc;
  border: 1px solid rgba(102, 170, 196, 0.34);
  background: linear-gradient(152deg, rgba(46, 95, 116, 0.9), rgba(30, 64, 80, 0.92));
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
  border: 1px solid rgba(102, 170, 196, 0.34);
  background: linear-gradient(152deg, rgba(46, 95, 116, 0.9), rgba(30, 64, 80, 0.92));
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
  width: min(980px, 100%);
  max-width: 100%;
  border: 1px solid rgba(168, 183, 194, 0.24);
  background: linear-gradient(156deg, rgba(52, 59, 68, 0.9), rgba(37, 43, 51, 0.92));
  border-radius: 16px;
  padding: 12px 12px 14px;
  box-shadow: none;
  color: #f6fafc;
}

.inline-options-title {
  font-family: var(--display-font);
  font-size: 0.92rem;
  color: rgba(236, 247, 252, 0.92);
  margin-bottom: 10px;
}

.inline-options-card :deep(.v-btn) {
  border-radius: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.inline-options-card :deep(.v-btn.v-btn--variant-elevated),
.inline-options-card :deep(.v-btn.v-btn--variant-flat) {
  box-shadow: 0 8px 18px rgba(8, 14, 18, 0.32);
}

.inline-options-card :deep(.v-btn.v-btn--variant-elevated.v-theme--light.bg-primary),
.inline-options-card :deep(.v-btn.v-btn--variant-flat.v-theme--light.bg-primary),
.inline-options-card :deep(.v-btn.v-btn--variant-elevated.bg-primary),
.inline-options-card :deep(.v-btn.v-btn--variant-flat.bg-primary) {
  background: linear-gradient(140deg, #6ea5b0, #3f7480) !important;
  color: #f7fcff !important;
}

.inline-options-card :deep(.v-btn.v-btn--variant-elevated.v-theme--light.bg-secondary),
.inline-options-card :deep(.v-btn.v-btn--variant-flat.v-theme--light.bg-secondary),
.inline-options-card :deep(.v-btn.v-btn--variant-elevated.bg-secondary),
.inline-options-card :deep(.v-btn.v-btn--variant-flat.bg-secondary) {
  background: linear-gradient(140deg, #c08a58, #9b6439) !important;
  color: #fff8f1 !important;
}

.inline-options-card :deep(.v-btn.v-btn--variant-outlined),
.inline-options-card :deep(.v-btn.v-btn--variant-text),
.inline-options-card :deep(.v-btn.v-btn--variant-tonal) {
  border-color: rgba(198, 224, 233, 0.44) !important;
  color: rgba(241, 249, 252, 0.96) !important;
}

.inline-options-card :deep(.menu-btn--services) {
  border: 1px solid rgba(246, 214, 183, 0.72) !important;
}

.inline-options-card :deep(.v-field) {
  background: rgba(12, 22, 28, 0.42) !important;
  color: rgba(238, 249, 253, 0.96) !important;
}

.inline-options-card :deep(.v-field__outline) {
  --v-field-border-opacity: 0.7;
}

.inline-options-card :deep(.v-field-label),
.inline-options-card :deep(.v-field__input),
.inline-options-card :deep(.v-select__selection-text),
.inline-options-card :deep(input),
.inline-options-card :deep(textarea) {
  color: rgba(238, 249, 253, 0.96) !important;
}

.inline-options-card :deep(.v-input__prepend .v-icon),
.inline-options-card :deep(.v-input__append .v-icon),
.inline-options-card :deep(.v-field__clearable .v-icon),
.inline-options-card :deep(.v-field__append-inner .v-icon) {
  color: rgba(205, 229, 237, 0.9) !important;
}

.inline-options-card :deep(.v-input__details),
.inline-options-card :deep(.v-messages__message) {
  color: rgba(198, 221, 230, 0.82) !important;
}

.inline-options-card :deep(.v-alert) {
  border: 1px solid rgba(243, 202, 126, 0.62) !important;
  background: linear-gradient(148deg, rgba(124, 92, 40, 0.54), rgba(92, 66, 28, 0.62)) !important;
  color: rgba(238, 249, 253, 0.96) !important;
}

.inline-options-card :deep(.v-alert .v-alert__content) {
  color: rgba(255, 244, 220, 0.98) !important;
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
  border: 1px solid rgba(139, 184, 206, 0.5);
  background: linear-gradient(158deg, rgba(58, 93, 116, 0.52), rgba(30, 49, 62, 0.68));
  border-radius: 14px;
  text-align: left;
  padding: 11px 12px;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
  cursor: pointer;
}

.choice-card:hover {
  transform: translateY(-1px);
  border-color: rgba(216, 238, 245, 0.72);
  box-shadow: 0 10px 20px rgba(8, 14, 18, 0.34);
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
  background: rgba(10, 19, 25, 0.3);
  display: grid;
  place-items: center;
  color: rgba(222, 239, 246, 0.82);
  margin-bottom: 8px;
}

.service-media__img {
  width: 100%;
  height: 100%;
}

.choice-card--selected {
  border-color: rgba(255, 205, 154, 0.84);
  background: linear-gradient(154deg, rgba(176, 118, 67, 0.54), rgba(76, 121, 144, 0.42));
  box-shadow: 0 0 0 1px rgba(255, 228, 199, 0.35) inset;
}

.choice-avatar {
  margin-bottom: 8px;
  background: rgba(12, 22, 28, 0.42);
}

.choice-title {
  font-weight: 700;
  color: #eef7fb;
  line-height: 1.3;
}

.choice-subtitle {
  color: rgba(214, 231, 238, 0.74);
  font-size: 0.82rem;
}

.choice-price {
  margin-top: 4px;
  font-family: var(--display-font);
  color: #f3fafc;
}

.panel-summary {
  margin-top: 10px;
  border: 1px solid rgba(210, 176, 132, 0.34);
  background: linear-gradient(152deg, rgba(73, 53, 33, 0.54), rgba(52, 38, 25, 0.6));
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  color: rgba(238, 249, 253, 0.96);
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
  color: rgba(238, 249, 253, 0.96) !important;
  border-color: rgba(150, 198, 220, 0.74) !important;
  background: linear-gradient(152deg, rgba(35, 70, 88, 0.58), rgba(24, 49, 62, 0.64)) !important;
}

.confirm-card {
  border: 1px solid rgba(205, 173, 130, 0.4);
  border-radius: 14px;
  background: linear-gradient(152deg, rgba(66, 48, 30, 0.54), rgba(43, 31, 20, 0.62));
}

.confirm-card :deep(.v-card-text) {
  color: rgba(236, 247, 252, 0.92);
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(87, 120, 132, 0.18);
}

.confirm-row span {
  color: rgba(197, 221, 230, 0.78);
}

.confirm-row strong {
  color: #f7fcff;
}

.confirm-policy-alert {
  border: 1px solid rgba(243, 202, 126, 0.7) !important;
  background: linear-gradient(148deg, rgba(124, 92, 40, 0.62), rgba(92, 66, 28, 0.72)) !important;
  color: rgba(255, 244, 220, 0.98) !important;
}

.confirm-policy-alert :deep(.v-alert__content) {
  color: rgba(255, 244, 220, 0.98) !important;
}

.confirm-row:last-child {
  border-bottom: none;
}

.appointment-list {
  display: grid;
  gap: 10px;
}

.appointments-skeleton {
  border-radius: 12px;
}

.reminders-box {
  border: 1px solid rgba(152, 176, 201, 0.34);
  background: linear-gradient(152deg, rgba(44, 56, 72, 0.62), rgba(29, 39, 52, 0.7));
  border-radius: 12px;
  padding: 10px;
}

.appointments-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;
}

.appointments-filter-control {
  width: 100%;
}

.appointments-filter-control :deep(.v-input) {
  height: 100%;
}

.appointments-filter-control :deep(.v-input__control) {
  min-height: 44px;
}

.appointments-filter-control :deep(.v-field) {
  height: 44px;
  min-height: 44px;
}

.appointments-filter-control :deep(.v-field__input) {
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  align-items: center;
}

.appointments-filter-control :deep(.v-field-label) {
  display: none;
}

.appointment-card {
  border: 1px solid rgba(132, 176, 201, 0.34);
  border-radius: 14px;
  background: linear-gradient(154deg, rgba(31, 56, 72, 0.46), rgba(22, 41, 53, 0.52));
}

.appointment-card :deep(.v-card-text) {
  color: rgba(236, 247, 252, 0.94);
}

.appointment-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.appointment-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.appointment-photo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: rgba(224, 239, 247, 0.86);
  border: 1px solid rgba(158, 193, 210, 0.24);
  background: linear-gradient(148deg, rgba(46, 76, 93, 0.64), rgba(30, 50, 63, 0.8));
}

.appointment-summary {
  min-width: 0;
}

.appointment-status {
  flex-shrink: 0;
}

.appointment-title {
  font-weight: 700;
  color: #f2fbff;
}

.appointment-time,
.appointment-meta {
  font-size: 0.84rem;
  color: rgba(198, 219, 230, 0.8);
}

.appointment-badges {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.appointment-weekday-badge {
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.01em;
  border: 1px solid rgba(150, 217, 238, 0.28);
  box-shadow: 0 2px 6px rgba(76, 163, 191, 0.12);
}

.appointment-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.appointment-staff-avatar {
  border: 1px solid rgba(166, 197, 215, 0.32);
  background: linear-gradient(140deg, #4f7d83, #9a7450);
  font-size: 0.72rem;
  font-weight: 700;
  color: #eff9fc;
}

.appointment-meta-text strong {
  color: rgba(236, 247, 252, 0.95);
}

.appointment-cancel-reason {
  margin-top: 10px;
  font-size: 0.82rem;
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(215, 125, 125, 0.4);
  background: rgba(90, 36, 38, 0.3);
  color: rgba(255, 220, 220, 0.94);
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

.appointment-footer strong {
  color: #f5fcff;
}

.appointment-services :deep(.v-chip) {
  color: rgba(236, 247, 252, 0.94) !important;
  border-color: rgba(171, 201, 220, 0.44) !important;
  background: rgba(32, 59, 76, 0.5) !important;
}

.appointment-actions {
  display: flex;
  gap: 8px;
}

.appointment-action-btn {
  font-weight: 700;
  letter-spacing: 0.01em;
  min-width: 126px;
}

.appointment-action-btn--reschedule {
  box-shadow: 0 6px 16px rgba(90, 168, 189, 0.34);
}

.appointment-action-btn--cancel {
  box-shadow: 0 6px 16px rgba(189, 72, 72, 0.34);
}

.profile-card {
  border: 1px solid rgba(143, 183, 196, 0.22);
  background: rgba(19, 31, 38, 0.4);
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

.profile-editor-grid {
  margin-top: 2px;
}

.profile-upload-field {
  margin-top: 2px;
}

.profile-action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.profile-action-row :deep(.v-btn) {
  width: 100%;
  min-width: 0;
}

.field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(198, 221, 230, 0.68);
}

.loading-box,
.empty-note {
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(143, 183, 196, 0.22);
  background: rgba(15, 26, 33, 0.36);
  text-align: center;
  color: rgba(227, 240, 246, 0.9);
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
    min-height: 100vh;
    min-height: 100dvh;
  }

  .chat-shell {
    min-height: 100vh;
    min-height: 100dvh;
  }

  .chat-header {
    padding: 14px;
  }

  .header-actions {
    gap: 6px;
    margin-left: auto;
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

  .appointments-filters {
    grid-template-columns: 1fr 1fr;
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
    min-height: 100vh;
    min-height: 100dvh;
  }

  .chat-shell {
    min-height: 100vh;
    min-height: 100dvh;
  }

  .chat-header {
    padding: 12px;
  }

  .chat-header-inner {
    gap: 8px;
  }

  .chat-agent {
    gap: 0;
  }

  .header-actions {
    width: auto;
    display: flex;
    justify-content: flex-end;
    align-self: auto;
    gap: 8px;
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

  .appointment-main {
    width: 100%;
  }

  .appointment-status {
    width: 100%;
  }

  .appointment-status :deep(.v-chip) {
    width: 100%;
    justify-content: center;
  }

  .appointment-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .appointment-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .appointments-filters {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 420px) {
  .agent-title {
    font-size: 0.92rem;
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
