<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Mídias carregadas"
          :value="`${mediaItems.length}`"
          subtitle="Itens trazidos do contexto atual"
          icon="mdi-image-multiple-outline"
          color="secondary"
          :progress="Math.min(100, mediaItems.length)"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Últimos 7 dias"
          :value="`${recentUploadsCount}`"
          subtitle="Uploads recentes dentro da galeria"
          icon="mdi-cloud-upload-outline"
          color="primary"
          :progress="Math.min(100, recentUploadsCount * 10)"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Tipos ativos"
          :value="`${activeOwnerTypesCount}`"
          subtitle="Categorias com mídia no carregamento atual"
          icon="mdi-shape-outline"
          color="success"
          :progress="Math.min(100, activeOwnerTypesCount * 25)"
        />
      </v-col>
    </v-row>

    <v-card class="glass-panel">
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal">
            <v-icon icon="mdi-filter-variant" />
          </v-avatar>
        </template>
        <v-card-title>Filtros da galeria</v-card-title>
        <v-card-subtitle>Combine tipo, dono e busca local para navegar pela mídia.</v-card-subtitle>
        <template #append>
          <v-btn variant="tonal" :loading="loading" @click="loadMedia">Atualizar</v-btn>
        </template>
      </v-card-item>

      <v-card-text class="d-flex flex-column ga-4">
        <v-tabs v-model="activeOwnerType" color="secondary">
          <v-tab value="all">Tudo</v-tab>
          <v-tab value="service">Serviços</v-tab>
          <v-tab value="product">Produtos</v-tab>
          <v-tab value="staff">Equipe</v-tab>
          <v-tab value="user">Conta</v-tab>
        </v-tabs>

        <v-row>
          <v-col cols="12" md="5">
            <v-select
              v-model="filterOwnerId"
              :items="filterOwnerOptions"
              item-title="title"
              item-value="value"
              :label="activeOwnerType === 'all' ? 'Todos os donos' : 'Filtrar por dono'"
              clearable
              :disabled="activeOwnerType === 'all'"
            />
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Buscar por dono, URL ou tipo"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="limit"
              :items="limitOptions"
              label="Limite"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" xl="8">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="mdi-image-area" />
              </v-avatar>
            </template>
            <v-card-title>Galeria da operação</v-card-title>
            <v-card-subtitle>{{ gallerySubtitle }}</v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <v-skeleton-loader
              v-if="loading"
              type="image, article, image, article, image, article"
            />

            <template v-else>
              <v-row v-if="filteredMedia.length">
                <v-col v-for="media in filteredMedia" :key="media.id" cols="12" sm="6" xl="4">
                  <v-card class="media-card h-100">
                    <div class="media-card__image">
                      <v-img
                        :src="resolveMediaUrl(media.url)"
                        height="220"
                        cover
                        @click="openPreview(media)"
                      >
                        <template #placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular indeterminate color="secondary" />
                          </div>
                        </template>
                      </v-img>
                    </div>

                    <v-card-text class="d-flex flex-column ga-3">
                      <div class="d-flex flex-wrap ga-2">
                        <v-chip color="secondary" variant="tonal" size="small">
                          {{ ownerTypeLabel(media.owner_type) }}
                        </v-chip>
                        <v-chip
                          v-if="isPrimaryMedia(media)"
                          color="warning"
                          variant="tonal"
                          size="small"
                        >
                          Foto principal
                        </v-chip>
                      </div>

                      <div>
                        <div class="font-weight-bold">{{ ownerLabel(media) }}</div>
                        <div class="text-caption text-medium-emphasis">{{ formatMediaDate(media.created_at) }}</div>
                      </div>

                      <div class="text-caption text-medium-emphasis text-truncate">
                        {{ media.url }}
                      </div>
                    </v-card-text>

                    <v-card-actions>
                      <v-btn variant="text" @click="openPreview(media)">Visualizar</v-btn>
                      <v-spacer />
                      <v-btn
                        variant="text"
                        color="error"
                        :disabled="isPrimaryMedia(media) || isProtectedUserMedia(media)"
                        @click="openDeleteDialog(media)"
                      >
                        Excluir
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert
                v-else
                color="warning"
                variant="tonal"
                icon="mdi-image-off-outline"
              >
                Nenhuma mídia encontrada para o filtro atual.
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
                <v-avatar color="secondary" variant="tonal">
                  <v-icon icon="mdi-cloud-upload-outline" />
                </v-avatar>
              </template>
              <v-card-title>Novo upload</v-card-title>
              <v-card-subtitle>Envie uma imagem e vincule ao contexto certo.</v-card-subtitle>
            </v-card-item>

            <v-card-text class="d-flex flex-column ga-4">
              <v-select
                v-model="uploadForm.ownerType"
                :items="uploadOwnerTypeOptions"
                item-title="title"
                item-value="value"
                label="Tipo de dono"
              />

              <v-select
                v-if="uploadForm.ownerType !== 'user'"
                v-model="uploadForm.ownerId"
                :items="uploadOwnerOptions"
                item-title="title"
                item-value="value"
                label="Selecionar dono"
              />

              <v-alert
                v-else
                color="secondary"
                variant="tonal"
                icon="mdi-account-circle-outline"
              >
                O upload será associado à sua conta autenticada.
              </v-alert>

              <v-file-input
                v-model="uploadForm.file"
                label="Imagem"
                accept="image/*"
                prepend-icon="mdi-camera-outline"
                chips
                show-size
              />
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn color="secondary" :loading="uploading" @click="uploadMedia">Enviar imagem</v-btn>
            </v-card-actions>
          </v-card>

          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-shield-outline" />
                </v-avatar>
              </template>
              <v-card-title>Regras da galeria</v-card-title>
              <v-card-subtitle>Proteções aplicadas no frontend para evitar quebra visual.</v-card-subtitle>
            </v-card-item>

            <v-card-text class="d-flex flex-column ga-3">
              <v-alert color="info" variant="tonal" icon="mdi-information-outline">
                Fotos principais atuais de serviço, produto e equipe ficam bloqueadas para exclusão por aqui.
              </v-alert>
              <v-alert color="warning" variant="tonal" icon="mdi-account-lock-outline">
                Mídias de contas de outros usuários também ficam protegidas quando não há contexto seguro para remoção.
              </v-alert>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="previewDialog" max-width="980">
      <v-card>
        <v-card-item>
          <v-card-title>{{ previewMedia ? ownerLabel(previewMedia) : 'Visualização' }}</v-card-title>
          <v-card-subtitle>{{ previewMedia ? ownerTypeLabel(previewMedia.owner_type) : '' }}</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <div class="media-preview">
            <v-img
              v-if="previewMedia"
              :src="resolveMediaUrl(previewMedia.url)"
              max-height="72vh"
              contain
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="previewDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-item>
          <v-card-title>Excluir mídia</v-card-title>
          <v-card-subtitle>Essa ação remove o registro e o arquivo associado.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          Tem certeza que deseja excluir esta mídia de <strong>{{ deleteTarget ? ownerLabel(deleteTarget) : 'registro' }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteMedia">Excluir</v-btn>
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
import { resolveMediaUrl } from '@/lib/media'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const mediaItems = ref([])
const services = ref([])
const products = ref([])
const staff = ref([])
const loading = ref(false)
const uploading = ref(false)
const deleting = ref(false)
const previewDialog = ref(false)
const deleteDialog = ref(false)
const previewMedia = ref(null)
const deleteTarget = ref(null)
const search = ref('')
const activeOwnerType = ref('all')
const filterOwnerId = ref(null)
const limit = ref(120)
const limitOptions = [30, 60, 120, 200]
const uploadForm = ref({
  ownerType: 'user',
  ownerId: null,
  file: null,
})

const uploadOwnerTypeOptions = [
  { value: 'user', title: 'Conta autenticada' },
  { value: 'service', title: 'Servico' },
  { value: 'product', title: 'Produto' },
  { value: 'staff', title: 'Equipe' },
]

const ownerTypeCounts = computed(() => {
  const counts = {
    service: 0,
    product: 0,
    staff: 0,
    user: 0,
  }

  mediaItems.value.forEach((item) => {
    if (counts[item.owner_type] !== undefined) {
      counts[item.owner_type] += 1
    }
  })

  return counts
})

const activeOwnerTypesCount = computed(() =>
  Object.values(ownerTypeCounts.value).filter((value) => value > 0).length
)

const recentUploadsCount = computed(() => {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000)
  return mediaItems.value.filter((item) => {
    const date = new Date(item.created_at).getTime()
    return Number.isFinite(date) && date >= cutoff
  }).length
})

const ownerMaps = computed(() => ({
  service: new Map(services.value.map((item) => [Number(item.id), item])),
  product: new Map(products.value.map((item) => [Number(item.id), item])),
  staff: new Map(staff.value.map((item) => [Number(item.id), item])),
  user: new Map([[Number(auth.user?.id), auth.user]]),
}))

const filterOwnerOptions = computed(() => {
  if (activeOwnerType.value === 'service') {
    return services.value.map((item) => ({ value: item.id, title: item.name }))
  }
  if (activeOwnerType.value === 'product') {
    return products.value.map((item) => ({ value: item.id, title: item.name }))
  }
  if (activeOwnerType.value === 'staff') {
    return staff.value.map((item) => ({ value: item.id, title: item.name }))
  }
  if (activeOwnerType.value === 'user') {
    return auth.user ? [{ value: auth.user.id, title: auth.user.name || 'Minha conta' }] : []
  }
  return []
})

const uploadOwnerOptions = computed(() => {
  if (uploadForm.value.ownerType === 'service') {
    return services.value.map((item) => ({ value: item.id, title: item.name }))
  }
  if (uploadForm.value.ownerType === 'product') {
    return products.value.map((item) => ({ value: item.id, title: item.name }))
  }
  if (uploadForm.value.ownerType === 'staff') {
    return staff.value.map((item) => ({ value: item.id, title: item.name }))
  }
  return []
})

const filteredMedia = computed(() => {
  const term = search.value.trim().toLowerCase()

  return mediaItems.value.filter((item) => {
    const matchesType = activeOwnerType.value === 'all' || item.owner_type === activeOwnerType.value
    const matchesOwner = !filterOwnerId.value || Number(item.owner_id) === Number(filterOwnerId.value)
    const label = ownerLabel(item).toLowerCase()
    const matchesSearch =
      !term ||
      label.includes(term) ||
      String(item.url || '').toLowerCase().includes(term) ||
      String(item.owner_type || '').toLowerCase().includes(term)

    return matchesType && matchesOwner && matchesSearch
  })
})

const gallerySubtitle = computed(() => {
  if (activeOwnerType.value === 'all') {
    return `${filteredMedia.value.length} item(ns) visiveis em toda a empresa.`
  }

  return `${filteredMedia.value.length} item(ns) visiveis em ${ownerTypeLabel(activeOwnerType.value).toLowerCase()}.`
})

const ownerTypeLabel = (ownerType) => {
  if (ownerType === 'service') return 'Servico'
  if (ownerType === 'product') return 'Produto'
  if (ownerType === 'staff') return 'Equipe'
  if (ownerType === 'user') return 'Conta'
  return 'Mídia'
}

const ownerLabel = (item) => {
  const owner = ownerMaps.value[item.owner_type]?.get(Number(item.owner_id))
  return owner?.name || `#${item.owner_id}`
}

const formatMediaDate = (value) => {
  if (!value) return 'Data indisponivel'
  return formatDateTime(value)
}

const resolveSelectedFile = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const isPrimaryMedia = (item) => {
  const owner = ownerMaps.value[item.owner_type]?.get(Number(item.owner_id))
  if (!owner) return false

  if (item.owner_type === 'service' || item.owner_type === 'product') {
    return String(owner.photo_url || '') === String(item.url || '')
  }

  if (item.owner_type === 'staff' || item.owner_type === 'user') {
    return String(owner.avatar_url || '') === String(item.url || '')
  }

  return false
}

const isProtectedUserMedia = (item) => item.owner_type === 'user' && Number(item.owner_id) !== Number(auth.user?.id)

const loadOwners = async () => {
  const staffEndpoint = auth.isAdmin ? '/api/admin/staff' : '/api/staff'

  const [servicesResponse, productsResponse, staffResponse] = await Promise.all([
    cachedGet('/api/services', { params: { include_inactive: 1 } }, { ttl: 20_000, force: true }),
    cachedGet('/api/products', { params: { include_inactive: 1 } }, { ttl: 20_000, force: true }),
    cachedGet(staffEndpoint, auth.isAdmin ? { params: { include_inactive: 1 } } : {}, { ttl: 20_000, force: true }),
  ])

  services.value = Array.isArray(servicesResponse.data) ? servicesResponse.data : []
  products.value = Array.isArray(productsResponse.data) ? productsResponse.data : []
  staff.value = Array.isArray(staffResponse.data) ? staffResponse.data : []
}

const loadMedia = async () => {
  loading.value = true
  try {
    const params = {
      limit: limit.value,
    }

    if (activeOwnerType.value !== 'all') {
      params.owner_type = activeOwnerType.value
    }

    if (filterOwnerId.value) {
      params.owner_id = filterOwnerId.value
    }

    const { data } = await api.get('/api/media', { params })
    mediaItems.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

const uploadMedia = async () => {
  const file = resolveSelectedFile(uploadForm.value.file)
  if (!file) {
    ui.notify('Selecione uma imagem para upload.', 'warning')
    return
  }

  if (uploadForm.value.ownerType !== 'user' && !uploadForm.value.ownerId) {
    ui.notify('Selecione o dono da imagem.', 'warning')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('owner_type', uploadForm.value.ownerType)

    if (uploadForm.value.ownerType === 'user') {
      if (auth.user?.id) {
        formData.append('owner_id', String(auth.user.id))
      }
    } else {
      formData.append('owner_id', String(uploadForm.value.ownerId))
    }

    await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    uploadForm.value.file = null
    ui.notify('Imagem enviada.', 'success')
    await loadMedia()
  } finally {
    uploading.value = false
  }
}

const openPreview = (item) => {
  previewMedia.value = item
  previewDialog.value = true
}

const openDeleteDialog = (item) => {
  deleteTarget.value = item
  deleteDialog.value = true
}

const deleteMedia = async () => {
  if (!deleteTarget.value?.id) return

  deleting.value = true
  try {
    await api.delete(`/api/media/${deleteTarget.value.id}`)
    deleteDialog.value = false
    ui.notify('Mídia excluída.', 'success')
    await loadMedia()
  } finally {
    deleting.value = false
  }
}

watch(activeOwnerType, (value) => {
  if (value === 'all') {
    filterOwnerId.value = null
  } else if (value === 'user') {
    filterOwnerId.value = auth.user?.id || null
  } else {
    filterOwnerId.value = null
  }
  loadMedia()
})

watch(filterOwnerId, () => {
  if (activeOwnerType.value !== 'all') {
    loadMedia()
  }
})

watch(limit, () => {
  loadMedia()
})

watch(
  () => uploadForm.value.ownerType,
  (value) => {
    if (value === 'user') {
      uploadForm.value.ownerId = auth.user?.id || null
      return
    }
    uploadForm.value.ownerId = null
  },
  { immediate: true }
)

onMounted(async () => {
  await loadOwners()
  if (activeOwnerType.value === 'user' && auth.user?.id) {
    filterOwnerId.value = auth.user.id
  }
  await loadMedia()
})
</script>
