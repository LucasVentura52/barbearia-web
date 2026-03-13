<template>
  <v-row>
    <v-col cols="12" xl="8">
      <v-card class="booking-panel">
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-calendar-star" />
            </v-avatar>
          </template>
          <v-card-title>Novo agendamento</v-card-title>
          <v-card-subtitle>Fluxo real usando serviços, equipe, clientes e disponibilidade da API.</v-card-subtitle>
        </v-card-item>

        <v-divider />

        <v-card-text>
          <v-stepper v-model="step" flat class="bg-transparent">
            <v-stepper-header>
              <v-stepper-item :complete="step > 1" :value="1" title="Serviços" subtitle="Monte o atendimento" />
              <v-divider />
              <v-stepper-item :complete="step > 2" :value="2" title="Agenda" subtitle="Cliente e horário" />
              <v-divider />
              <v-stepper-item :value="3" title="Confirmar" subtitle="Enviar para a API" />
            </v-stepper-header>

            <v-stepper-window>
              <v-stepper-window-item :value="1">
                <div class="mt-4">
                  <v-row>
                    <v-col v-for="service in services" :key="service.id" cols="12" md="6">
                      <v-card
                        :class="['package-card booking-service-card h-100', { 'booking-service-card--selected': selectedServiceIds.includes(service.id) }]"
                        @click="toggleService(service.id)"
                      >
                        <div v-if="service.photo_url" class="booking-service-media">
                          <v-img :src="resolveMediaUrl(service.photo_url)" :alt="service.name" cover class="booking-service-media__img" />
                        </div>
                        <div v-else class="booking-service-media booking-service-media--placeholder">
                          <v-icon icon="mdi-content-cut" size="28" />
                        </div>

                        <v-card-item>
                          <template #prepend>
                            <v-avatar color="secondary" variant="tonal">
                              <v-icon icon="mdi-content-cut" />
                            </v-avatar>
                          </template>
                          <v-card-title>{{ service.name }}</v-card-title>
                          <v-card-subtitle>{{ service.duration_minutes }} min</v-card-subtitle>
                        </v-card-item>
                        <v-card-text>
                          <div class="text-body-2 text-medium-emphasis mb-4">
                            {{ service.description || 'Serviço disponível para compor o atendimento.' }}
                          </div>
                          <v-chip color="secondary" variant="tonal">
                            {{ formatCurrencyBRL(service.price) }}
                          </v-chip>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <div class="d-flex justify-space-between mt-6">
                    <v-sheet color="surface-variant" class="pa-4" border>
                      <div class="text-body-2 text-medium-emphasis">Total selecionado</div>
                      <div class="text-h6 font-weight-black">{{ formatCurrencyBRL(totalPrice) }}</div>
                      <div class="text-caption">{{ totalDuration }} minutos</div>
                    </v-sheet>
                    <v-btn color="secondary" :disabled="!selectedServiceIds.length" @click="step = 2">Continuar</v-btn>
                  </div>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="2">
                <div class="mt-4 d-flex flex-column ga-5">
                  <v-row>
                    <v-col v-if="auth.isAdmin" cols="12" md="6">
                      <v-select
                        v-model="selectedStaffId"
                        :items="staffOptions"
                        item-title="title"
                        item-value="value"
                        label="Profissional"
                      />
                    </v-col>
                    <v-col :cols="auth.isAdmin ? 12 : 6" md="6">
                      <v-date-input v-model="selectedDate" label="Data" />
                    </v-col>
                  </v-row>

                  <v-autocomplete
                    v-model="selectedClientId"
                    v-model:search="clientSearch"
                    :items="clientOptions"
                    item-title="name"
                    item-value="id"
                    label="Cliente"
                    :loading="clientsLoading"
                    no-data-text="Nenhum cliente encontrado"
                  >
                    <template #item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.raw.name"
                        :subtitle="formatPhoneFromE164(item.raw.phone) || item.raw.email || 'Sem contato'"
                      />
                    </template>
                  </v-autocomplete>

                  <div>
                    <div class="text-subtitle-2 mb-3">Horários disponíveis</div>
                    <v-chip-group v-model="selectedSlot" selected-class="text-secondary" mandatory>
                      <v-chip
                        v-for="slot in slots"
                        :key="slot"
                        :value="slot"
                        filter
                        variant="outlined"
                      >
                        {{ formatTime(slot) }}
                      </v-chip>
                    </v-chip-group>
                    <v-alert v-if="availabilityReady && !slots.length" icon="mdi-clock-alert-outline" color="warning" class="mt-4">
                      Nenhum horário disponível para essa combinação.
                    </v-alert>
                  </div>

                  <div class="d-flex justify-space-between">
                    <v-btn variant="text" @click="step = 1">Voltar</v-btn>
                    <v-btn
                      color="secondary"
                      :disabled="!selectedClientId || !selectedSlot"
                      @click="step = 3"
                    >
                      Revisar
                    </v-btn>
                  </div>
                </div>
              </v-stepper-window-item>

              <v-stepper-window-item :value="3">
                <div class="mt-4 d-flex flex-column ga-5">
                  <v-alert icon="mdi-check-decagram-outline" color="success">
                    O envio vai usar `POST /api/staff/appointments` com cliente, profissional, início e serviços.
                  </v-alert>

                  <v-sheet color="surface-variant" class="pa-5" border>
                    <v-list class="bg-transparent">
                      <v-list-item title="Cliente" :subtitle="selectedClient?.name || 'Não selecionado'" prepend-icon="mdi-account-outline" />
                      <v-list-item title="Profissional" :subtitle="selectedStaff?.name || 'Não selecionado'" prepend-icon="mdi-account-tie-outline" />
                      <v-list-item title="Data" :subtitle="formattedDate" prepend-icon="mdi-calendar-month-outline" />
                      <v-list-item title="Horário" :subtitle="selectedSlot ? formatTime(selectedSlot) : 'Não selecionado'" prepend-icon="mdi-clock-outline" />
                      <v-list-item title="Serviços" :subtitle="selectedServicesLabel" prepend-icon="mdi-content-cut" />
                    </v-list>
                  </v-sheet>

                  <div class="d-flex justify-space-between">
                    <v-btn variant="text" @click="step = 2">Voltar</v-btn>
                    <v-btn color="secondary" :loading="creating" @click="createAppointment">
                      Criar agendamento
                    </v-btn>
                  </div>
                </div>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" xl="4">
      <v-card class="glass-panel mb-6 overflow-hidden">
        <v-card-item>
          <template #prepend>
            <v-avatar color="accent" variant="tonal">
              <v-icon icon="mdi-account-group-outline" />
            </v-avatar>
          </template>
          <v-card-title>Equipe disponível</v-card-title>
          <v-card-subtitle>Carousel real usando o payload de `/api/staff`.</v-card-subtitle>
        </v-card-item>

        <v-carousel v-model="staffCarouselIndex" height="280" hide-delimiters show-arrows="hover">
          <v-carousel-item v-for="(person, index) in staff" :key="person.id" :value="index">
            <div class="carousel-slide h-100">
              <div class="booking-staff-slide">
                <div class="booking-staff-copy">
                  <div class="mini-kicker mb-1">{{ person.role === 'admin' ? 'Administrador' : 'Profissional' }}</div>
                  <div class="text-h4 font-weight-black mb-2">{{ person.name }}</div>
                  <div class="text-body-1 mb-4">
                    {{ person.services?.length || 0 }} serviço(s) habilitado(s).
                  </div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip
                      v-for="service in (person.services || []).slice(0, 3)"
                      :key="`${person.id}-${service.id}`"
                      color="white"
                      variant="tonal"
                    >
                      {{ service.name }}
                    </v-chip>
                  </div>
                </div>

                <div class="booking-staff-portrait">
                  <v-avatar size="112" rounded="xl" class="booking-staff-avatar">
                    <v-img v-if="person.avatar_url" :src="resolveMediaUrl(person.avatar_url)" cover />
                    <span v-else>{{ initials(person.name) }}</span>
                  </v-avatar>
                </div>
              </div>
            </div>
          </v-carousel-item>
        </v-carousel>
      </v-card>

      <v-card class="glass-panel">
        <v-card-item>
          <template #prepend>
            <v-avatar color="primary" variant="tonal">
              <v-icon icon="mdi-help-circle-outline" />
            </v-avatar>
          </template>
          <v-card-title>Regras reais do fluxo</v-card-title>
          <v-card-subtitle>Explicações que refletem o comportamento atual da API.</v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="Como a duração é calculada?" text="A disponibilidade usa a soma da duração dos serviços selecionados." />
            <v-expansion-panel title="Por que um horário some?" text="A API cruza expediente, folgas e conflitos de agendamento do profissional." />
            <v-expansion-panel title="Quem escolhe o profissional?" text="Staff usa a própria agenda. Admin pode escolher qualquer profissional ativo." />
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatTime, toApiDate } from '@/lib/dates'
import { resolveMediaUrl } from '@/lib/media'
import { formatPhoneFromE164 } from '@/lib/phone'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const step = ref(1)
const creating = ref(false)
const clientsLoading = ref(false)
const services = ref([])
const staff = ref([])
const slots = ref([])
const clientOptions = ref([])
const clientSearch = ref('')
const selectedServiceIds = ref([])
const selectedClientId = ref(null)
const selectedSlot = ref(null)
const selectedDate = ref(new Date())
const selectedStaffId = ref(null)

const totalDuration = computed(() =>
  selectedServices.value.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0)
)
const totalPrice = computed(() =>
  selectedServices.value.reduce((sum, service) => sum + Number(service.price || 0), 0)
)
const selectedServices = computed(() =>
  services.value.filter((service) => selectedServiceIds.value.includes(service.id))
)
const selectedClient = computed(() => clientOptions.value.find((client) => client.id === selectedClientId.value) || null)
const selectedStaff = computed(() => staff.value.find((person) => person.id === selectedStaffId.value) || auth.user || null)
const selectedServicesLabel = computed(() => selectedServices.value.map((service) => service.name).join(', ') || 'Nenhum')
const formattedDate = computed(() => (selectedDate.value ? new Date(selectedDate.value).toLocaleDateString('pt-BR') : 'Sem data'))
const availabilityReady = computed(() => Boolean(selectedStaffId.value && selectedDate.value && selectedServiceIds.value.length))
const staffCarouselIndex = ref(0)

const staffOptions = computed(() => staff.value.map((person) => ({
  title: person.name,
  value: person.id,
})))

const toggleService = (serviceId) => {
  if (selectedServiceIds.value.includes(serviceId)) {
    selectedServiceIds.value = selectedServiceIds.value.filter((id) => id !== serviceId)
    return
  }
  selectedServiceIds.value = [...selectedServiceIds.value, serviceId]
}

const initials = (value = '') =>
  String(value)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'SB'

const loadCatalog = async () => {
  const [servicesResponse, staffResponse] = await Promise.all([
    api.get('/api/services', { params: { limit: 200 } }),
    api.get('/api/staff', { params: { limit: 200 } }),
  ])

  services.value = Array.isArray(servicesResponse.data) ? servicesResponse.data : []
  staff.value = Array.isArray(staffResponse.data) ? staffResponse.data : []

  if (auth.isAdmin) {
    selectedStaffId.value = staff.value[0]?.id || null
  } else {
    selectedStaffId.value = auth.user?.id || null
  }
}

const loadClients = async (search = '') => {
  clientsLoading.value = true
  try {
    const { data } = await api.get('/api/staff/clients/options', {
      params: {
        search: search || undefined,
        limit: 60,
      },
    })
    clientOptions.value = Array.isArray(data) ? data : []
  } finally {
    clientsLoading.value = false
  }
}

const loadAvailability = async () => {
  if (!availabilityReady.value) {
    slots.value = []
    selectedSlot.value = null
    return
  }

  const { data } = await api.get('/api/availability', {
    params: {
      staff_id: selectedStaffId.value,
      date: toApiDate(selectedDate.value),
      service_ids: selectedServiceIds.value,
    },
  })

  slots.value = Array.isArray(data?.slots) ? data.slots : []
  if (!slots.value.includes(selectedSlot.value)) {
    selectedSlot.value = null
  }
}

const createAppointment = async () => {
  if (!selectedClientId.value || !selectedSlot.value || !selectedServiceIds.value.length) {
    ui.notify('Selecione cliente, serviços e horário antes de criar.', 'warning')
    return
  }

  creating.value = true
  try {
    await api.post('/api/staff/appointments', {
      client_user_id: selectedClientId.value,
      staff_id: selectedStaffId.value,
      start_at: selectedSlot.value,
      service_ids: selectedServiceIds.value,
    })
    ui.notify('Agendamento criado com sucesso.', 'success')
    router.push({ name: 'operations' })
  } finally {
    creating.value = false
  }
}

let searchTimer = null
watch(clientSearch, (value) => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    loadClients(value)
  }, 300)
})

watch(
  [selectedStaffId, selectedDate, selectedServiceIds],
  () => {
    loadAvailability()
  },
  { deep: true }
)

watch(staff, (items) => {
  if (!items.length) {
    staffCarouselIndex.value = 0
    return
  }

  if (staffCarouselIndex.value >= items.length) {
    staffCarouselIndex.value = 0
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})

onMounted(async () => {
  await Promise.all([
    loadCatalog(),
    loadClients(),
  ])
  await loadAvailability()
})
</script>

<style scoped>
.booking-service-card {
  border: 1px solid var(--ab-card-border) !important;
  background: var(--ab-card-surface) !important;
  color: var(--ab-ink);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.booking-service-card:hover {
  transform: translateY(-2px);
  border-color: var(--ab-card-border-hover) !important;
  box-shadow: var(--ab-card-shadow-soft);
}

.booking-service-card--selected {
  border-color: var(--ab-card-border-selected) !important;
  background: var(--ab-card-surface-selected) !important;
  box-shadow: var(--ab-card-shadow-strong);
}

.booking-service-media {
  height: 156px;
  overflow: hidden;
  border-bottom: 1px solid var(--ab-border-soft);
  background: var(--ab-soft-surface);
}

.booking-service-media--placeholder {
  display: grid;
  place-items: center;
  color: var(--ab-soft-surface-strong);
}

.booking-service-media__img {
  width: 100%;
  height: 100%;
}

.booking-staff-slide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-height: 100%;
}

.booking-staff-copy {
  min-width: 0;
}

.booking-staff-portrait {
  display: flex;
  justify-content: flex-end;
}

.booking-staff-avatar {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #fffdf8;
  font-size: 1.8rem;
  font-weight: 800;
  box-shadow: 0 18px 44px rgba(17, 24, 31, 0.22);
}

@media (max-width: 640px) {
  .booking-staff-slide {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .booking-staff-portrait {
    justify-content: flex-start;
  }
}
</style>
