<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Serviços ativos"
          :value="`${activeServicesCount}`"
          subtitle="Itens disponíveis no catálogo atual"
          icon="mdi-content-cut"
          color="secondary"
          :progress="services.length ? Math.round((activeServicesCount / services.length) * 100) : 0"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Ticket médio"
          :value="formatCurrencyBRL(averagePrice)"
          subtitle="Preço médio dos serviços cadastrados"
          icon="mdi-currency-brl"
          color="primary"
          :progress="Math.min(100, Math.round(averagePrice))"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Duração média"
          :value="`${averageDuration} min`"
          subtitle="Tempo médio reservado por atendimento"
          icon="mdi-timer-sand"
          color="success"
          :progress="Math.min(100, Math.round((averageDuration / 90) * 100))"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" xl="8">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal">
                <v-icon icon="mdi-scissors-cutting" />
              </v-avatar>
            </template>
            <v-card-title>Catálogo de serviços</v-card-title>
            <v-card-subtitle>CRUD completo com foto, preço, duração e status.</v-card-subtitle>
            <template #append>
              <div class="d-flex flex-wrap ga-2 justify-end">
                <v-btn variant="tonal" :loading="loading" @click="loadServices">Atualizar</v-btn>
                <v-btn color="secondary" @click="openCreate">Novo serviço</v-btn>
              </div>
            </template>
          </v-card-item>

          <v-card-text class="d-flex flex-column ga-4">
            <v-row>
              <v-col cols="12" md="7">
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Buscar por nome ou descrição"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="5">
                <v-chip-group v-model="statusFilter" mandatory color="secondary">
                  <v-chip value="all" filter variant="tonal">Todos</v-chip>
                  <v-chip value="active" filter variant="tonal">Ativos</v-chip>
                  <v-chip value="inactive" filter variant="tonal">Inativos</v-chip>
                </v-chip-group>
              </v-col>
            </v-row>

            <v-skeleton-loader v-if="loading" type="table-heading, table-tbody" />

            <template v-else>
              <v-table v-if="mdAndUp" class="management-table">
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th>Duração</th>
                    <th>Preço</th>
                    <th>Status</th>
                    <th class="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="service in filteredServices" :key="service.id">
                    <td>
                      <div class="d-flex align-center ga-3">
                        <v-avatar color="secondary" variant="tonal" size="44" rounded="lg">
                          <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover />
                          <span v-else>{{ initials(service.name) }}</span>
                        </v-avatar>
                        <div>
                          <div class="font-weight-bold">{{ service.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ service.description || 'Sem descrição comercial.' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{{ Number(service.duration_minutes || 0) }} min</td>
                    <td>{{ formatCurrencyBRL(service.price) }}</td>
                    <td>
                      <v-chip :color="service.active ? 'success' : 'warning'" variant="tonal" size="small">
                        {{ service.active ? 'Ativo' : 'Inativo' }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <v-btn icon variant="text" size="small" @click="openEdit(service)">
                        <v-icon icon="mdi-pencil-outline" />
                      </v-btn>
                      <v-btn icon variant="text" size="small" color="error" @click="askDelete(service)">
                        <v-icon icon="mdi-delete-outline" />
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-expansion-panels v-else variant="accordion">
                <v-expansion-panel
                  v-for="service in filteredServices"
                  :key="service.id"
                  rounded="xl"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-3">
                      <v-avatar color="secondary" variant="tonal" size="42" rounded="lg">
                        <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover />
                        <span v-else>{{ initials(service.name) }}</span>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold">{{ service.name }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ Number(service.duration_minutes || 0) }} min · {{ formatCurrencyBRL(service.price) }}
                        </div>
                      </div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="d-flex flex-column ga-3">
                    <v-chip :color="service.active ? 'success' : 'warning'" variant="tonal" size="small">
                      {{ service.active ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                    <div class="text-body-2 text-medium-emphasis">
                      {{ service.description || 'Sem descrição comercial.' }}
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                      <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit(service)">
                        Editar
                      </v-btn>
                      <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDelete(service)">
                        Excluir
                      </v-btn>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-alert
                v-if="!filteredServices.length"
                color="warning"
                icon="mdi-information-outline"
                variant="tonal"
              >
                Nenhum serviço encontrado para o filtro atual.
              </v-alert>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <div class="d-flex flex-column ga-6 management-side-card">
          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="mdi-star-four-points-outline" />
                </v-avatar>
              </template>
              <v-card-title>Serviços em destaque</v-card-title>
              <v-card-subtitle>Leitura rápida do mix com maior valor.</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <v-carousel
                v-if="featuredServices.length"
                height="220"
                hide-delimiters
                show-arrows="hover"
                cycle
              >
                <v-carousel-item
                  v-for="service in featuredServices"
                  :key="service.id"
                  class="carousel-slide"
                >
                  <div>
                    <div class="mini-kicker">Curadoria do catálogo</div>
                    <div class="text-h5 font-weight-black mb-2">{{ service.name }}</div>
                    <div class="text-body-1 mb-3">{{ service.description || 'Serviço premium pronto para vitrine.' }}</div>
                    <div class="d-flex flex-wrap ga-2">
                      <v-chip color="secondary" variant="flat">{{ formatCurrencyBRL(service.price) }}</v-chip>
                      <v-chip color="surface" variant="outlined">{{ Number(service.duration_minutes || 0) }} min</v-chip>
                    </div>
                  </div>
                </v-carousel-item>
              </v-carousel>
              <v-alert
                v-else
                color="warning"
                variant="tonal"
                icon="mdi-scissors-cutting"
              >
                Cadastre serviços para montar a vitrine do catálogo.
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-eye-off-outline" />
                </v-avatar>
              </template>
              <v-card-title>Itens inativos</v-card-title>
              <v-card-subtitle>Serviços que saíram da vitrine, mas seguem no histórico.</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <v-list v-if="inactiveServices.length" class="bg-transparent">
                <v-list-item
                  v-for="service in inactiveServices.slice(0, 5)"
                  :key="service.id"
                  :title="service.name"
                  :subtitle="`${Number(service.duration_minutes || 0)} min · ${formatCurrencyBRL(service.price)}`"
                />
              </v-list>
              <v-alert v-else color="success" variant="tonal" icon="mdi-check-decagram-outline">
                Nenhum serviço inativo no catálogo atual.
              </v-alert>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="720">
      <v-card>
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-content-cut" />
            </v-avatar>
          </template>
          <v-card-title>{{ editing ? 'Editar serviço' : 'Novo serviço' }}</v-card-title>
          <v-card-subtitle>Preencha dados comerciais e envie uma foto para a vitrine.</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4">
          <v-text-field v-model="form.name" label="Nome do serviço" />
          <v-textarea v-model="form.description" label="Descrição" rows="3" auto-grow />
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.duration_minutes"
                label="Duração em minutos"
                type="number"
                min="1"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.price"
                label="Preço"
                type="number"
                min="0"
                step="0.01"
                prefix="R$"
              />
            </v-col>
          </v-row>
          <v-file-input
            v-model="photoFile"
            label="Foto do serviço"
            accept="image/*"
            prepend-icon="mdi-camera-outline"
            chips
            show-size
          />
          <v-switch v-model="form.active" color="secondary" label="Serviço ativo" inset hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveService">Salvar serviço</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-item>
          <v-card-title>Excluir serviço</v-card-title>
          <v-card-subtitle>Essa ação remove o item do catálogo.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deletingLoading" @click="deleteService">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { resolveMediaUrl } from '@/lib/media'
import { useUiStore } from '@/stores/ui'

const { mdAndUp } = useDisplay()
const ui = useUiStore()

const services = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingLoading = ref(false)
const search = ref('')
const statusFilter = ref('all')
const dialog = ref(false)
const deleteDialog = ref(false)
const editing = ref(null)
const deleting = ref(null)
const photoFile = ref(null)
const form = ref({
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  active: true,
})

const activeServicesCount = computed(() => services.value.filter((service) => service.active).length)
const averagePrice = computed(() => {
  if (!services.value.length) return 0
  const total = services.value.reduce((sum, service) => sum + Number(service.price || 0), 0)
  return total / services.value.length
})
const averageDuration = computed(() => {
  if (!services.value.length) return 0
  const total = services.value.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0)
  return Math.round(total / services.value.length)
})
const inactiveServices = computed(() => services.value.filter((service) => !service.active))
const featuredServices = computed(() =>
  [...services.value]
    .filter((service) => service.active)
    .sort((left, right) => Number(right.price || 0) - Number(left.price || 0))
    .slice(0, 3)
)
const filteredServices = computed(() => {
  const term = search.value.trim().toLowerCase()

  return services.value.filter((service) => {
    const matchesTerm =
      !term ||
      String(service.name || '').toLowerCase().includes(term) ||
      String(service.description || '').toLowerCase().includes(term)

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && service.active) ||
      (statusFilter.value === 'inactive' && !service.active)

    return matchesTerm && matchesStatus
  })
})

const initials = (value) =>
  String(value || 'SV')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

const resolveSelectedFile = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    active: true,
  }
  photoFile.value = null
}

const loadServices = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/services', {
      params: {
        include_inactive: 1,
      },
    })
    services.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = null
  resetForm()
  dialog.value = true
}

const openEdit = (service) => {
  editing.value = service
  form.value = {
    name: service.name || '',
    description: service.description || '',
    duration_minutes: Number(service.duration_minutes || 30),
    price: Number(service.price || 0),
    active: Boolean(service.active),
  }
  photoFile.value = null
  dialog.value = true
}

const askDelete = (service) => {
  deleting.value = service
  deleteDialog.value = true
}

const uploadPhoto = async (serviceId) => {
  const file = resolveSelectedFile(photoFile.value)
  if (!file || !serviceId) return

  const formData = new FormData()
  formData.append('file', file)
  await api.post(`/api/services/${serviceId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

const saveService = async () => {
  if (!String(form.value.name || '').trim()) {
    ui.notify('Informe o nome do serviço.', 'warning')
    return
  }

  if (!Number.isFinite(Number(form.value.duration_minutes)) || Number(form.value.duration_minutes) <= 0) {
    ui.notify('Informe uma duração válida.', 'warning')
    return
  }

  if (!Number.isFinite(Number(form.value.price)) || Number(form.value.price) < 0) {
    ui.notify('Informe um preço válido.', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: String(form.value.name).trim(),
      description: String(form.value.description || '').trim() || null,
      duration_minutes: Number(form.value.duration_minutes),
      price: Number(form.value.price),
      active: Boolean(form.value.active),
    }

    let serviceId = editing.value?.id

    if (editing.value) {
      await api.put(`/api/services/${serviceId}`, payload)
    } else {
      const { data } = await api.post('/api/services', payload)
      serviceId = data?.id
    }

    await uploadPhoto(serviceId)

    dialog.value = false
    ui.notify(editing.value ? 'Serviço atualizado.' : 'Serviço criado.', 'success')
    await loadServices()
  } finally {
    saving.value = false
  }
}

const deleteService = async () => {
  if (!deleting.value?.id) return

  deletingLoading.value = true
  try {
    await api.delete(`/api/services/${deleting.value.id}`)
    deleteDialog.value = false
    ui.notify('Serviço excluído.', 'success')
    await loadServices()
  } finally {
    deletingLoading.value = false
  }
}

onMounted(loadServices)
</script>
