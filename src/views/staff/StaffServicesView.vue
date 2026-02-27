<template>
  <v-container>
    <div class="section-title">
      <h2>Serviços</h2>
    </div>

    <v-card class="staff-toolbar-card" elevation="0">
      <v-card-text class="toolbar">
        <v-text-field v-model="search" label="Buscar serviço" variant="outlined" prepend-inner-icon="mdi-magnify"
          density="compact" hide-details="auto" />
        <div class="toolbar-actions">
          <v-btn color="secondary" size="large" :block="smAndDown" @click="openCreate">Novo serviço</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <template v-if="loading">
          <template v-if="!smAndDown">
            <v-table class="staff-table">
              <thead>
                <tr>
                  <th class="text-left">Foto</th>
                  <th class="text-left">Serviço</th>
                  <th class="text-left">Duração</th>
                  <th class="text-left">Preço</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="6">
                    <app-list-skeleton mode="table" :rows="6" :columns="6" />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
          <template v-else>
            <app-list-skeleton mode="cards" :rows="6" :columns="1" />
          </template>
        </template>
        <template v-else>
          <template v-if="!smAndDown">
            <v-table class="staff-table">
              <thead>
                <tr>
                  <th class="text-left">Foto</th>
                  <th class="text-left">Serviço</th>
                  <th class="text-left">Duração</th>
                  <th class="text-left">Preço</th>
                  <th class="text-left">Status</th>
                  <th class="text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in filteredServices" :key="service.id">
                  <td>
                    <div class="cell-avatar">
                      <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover
                        class="cell-avatar__img" />
                      <div v-else class="cell-avatar__initials">
                        {{ service.name?.slice(0, 1) || '?' }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="cell-title">{{ service.name }}</div>
                    <div class="text-muted line-clamp">
                      {{ service.description || 'Sem descrição' }}
                    </div>
                  </td>
                  <td>{{ service.duration_minutes }} min</td>
                  <td>{{ formatCurrencyBRL(service.price) }}</td>
                  <td>
                    <v-chip size="small" :color="service.active ? 'success' : 'warning'" variant="tonal">
                      {{ service.active ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                  </td>
                  <td>
                    <div class="row-actions">
                      <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(service)" />
                      <v-btn icon="mdi-delete-outline" variant="text" color="error" @click="askDelete(service)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
          <template v-else>
            <v-row dense>
              <v-col v-for="service in filteredServices" :key="service.id" cols="12">
                <v-card variant="outlined" class="mobile-row-card">
                  <v-card-item>
                    <template #prepend>
                      <div class="cell-avatar me-3">
                        <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover
                          class="cell-avatar__img" />
                        <div v-else class="cell-avatar__initials">
                          {{ service.name?.slice(0, 1) || '?' }}
                        </div>
                      </div>
                    </template>
                    <v-card-title class="text-body-1">{{ service.name }}</v-card-title>
                    <v-card-subtitle class="text-wrap">{{ service.description || 'Sem descrição' }}</v-card-subtitle>
                  </v-card-item>
                  <v-card-text class="pt-0">
                    <div class="mobile-meta">
                      <v-chip size="small" color="secondary" variant="tonal">{{ service.duration_minutes }} min</v-chip>
                      <v-chip size="small" color="primary" variant="tonal">{{ formatCurrencyBRL(service.price) }}</v-chip>
                      <v-chip size="small" :color="service.active ? 'success' : 'warning'" variant="tonal">
                        {{ service.active ? 'Ativo' : 'Inativo' }}
                      </v-chip>
                    </div>
                    <div class="mobile-actions">
                      <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit(service)">
                        Editar
                      </v-btn>
                      <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline"
                        @click="askDelete(service)">
                        Excluir
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <div v-if="!filteredServices.length" class="empty-state">
            Nenhum serviço encontrado.
          </div>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="640">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ editing ? 'Editar serviço' : 'Novo serviço' }}</div>
            <div class="modal-subtitle">Mantenha o catálogo sempre atualizado.</div>
          </div>
          <v-icon icon="mdi-scissors-cutting" />
        </div>
        <v-card-text class="form-grid">
          <v-text-field v-model="form.name" label="Nome" variant="outlined" />
          <v-textarea v-model="form.description" label="Descrição" variant="outlined" rows="3" />
          <div class="form-row">
            <v-text-field v-model.number="form.duration_minutes" type="number" min="1" label="Duração (min)"
              variant="outlined" />
            <v-text-field
              v-model="priceInput"
              label="Preço"
              variant="outlined"
              placeholder="0,00"
              prefix="R$"
              inputmode="numeric"
            />
          </div>
          <v-file-input v-model="photoFile" label="Foto do serviço" accept="image/*" prepend-icon="mdi-image-outline"
            variant="outlined" />
          <div class="modal-switch-row">
            <v-switch v-model="form.active" color="secondary" label="Ativo" />
            <v-card-actions class="dialog-actions">
              <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
              <v-btn color="secondary" variant="flat" :loading="saving" @click="saveService">
                Salvar
              </v-btn>
            </v-card-actions>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card>
        <v-card-title>Excluir serviço</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="confirmDelete = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deletingLoading" @click="deleteService">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { useAlertStore } from '@/stores/alerts'
import { formatCurrencyBRL, formatCurrencyInput, parseCurrencyInputToNumber } from '@/lib/currency'
import AppListSkeleton from '@/components/AppListSkeleton.vue'

const services = ref([])
const search = ref('')
const loading = ref(false)
const dialog = ref(false)
const confirmDelete = ref(false)
const saving = ref(false)
const deletingLoading = ref(false)
const editing = ref(null)
const deleting = ref(null)
const photoFile = ref(null)
const alerts = useAlertStore()
const { smAndDown } = useDisplay()

const form = ref({
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  active: true,
})

const priceInput = computed({
  get: () => formatCurrencyInput(form.value.price),
  set: (value) => {
    form.value.price = parseCurrencyInputToNumber(value)
  },
})

const filteredServices = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return services.value
  return services.value.filter((service) => {
    return (
      service.name?.toLowerCase().includes(term) ||
      service.description?.toLowerCase().includes(term)
    )
  })
})

const loadServices = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/services?include_inactive=1')
    services.value = data
  } finally {
    loading.value = false
  }
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

const openCreate = () => {
  editing.value = null
  resetForm()
  dialog.value = true
}

const openEdit = (service) => {
  editing.value = service
  form.value = {
    name: service.name,
    description: service.description || '',
    duration_minutes: service.duration_minutes,
    price: Number(service.price),
    active: Boolean(service.active),
  }
  photoFile.value = null
  dialog.value = true
}

const saveService = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      duration_minutes: Number(form.value.duration_minutes),
      price: Number(form.value.price),
    }

    let serviceId = editing.value?.id
    if (editing.value) {
      await api.put(`/api/services/${serviceId}`, payload)
    } else {
      const { data } = await api.post('/api/services', payload)
      serviceId = data.id
    }

    if (photoFile.value && serviceId) {
      const file = Array.isArray(photoFile.value) ? photoFile.value[0] : photoFile.value
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        await api.post(`/api/services/${serviceId}/photo`, formData)
      }
    }

    alerts.success('Serviço salvo com sucesso.')
    dialog.value = false
    await loadServices()
  } finally {
    saving.value = false
  }
}

const askDelete = (service) => {
  deleting.value = service
  confirmDelete.value = true
}

const deleteService = async () => {
  if (!deleting.value) return
  deletingLoading.value = true
  try {
    await api.delete(`/api/services/${deleting.value.id}`)
    alerts.success('Serviço removido.')
    confirmDelete.value = false
    await loadServices()
  } finally {
    deletingLoading.value = false
  }
}

onMounted(loadServices)
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-actions {
  margin-left: auto;
  display: flex;
  align-items: stretch;
}

.toolbar :deep(.v-input) {
  min-width: 260px;
}

.toolbar-actions .v-btn {
  height: 40px;
}

.staff-table :deep(th) {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.cell-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(35, 58, 74, 0.08);
  display: grid;
  place-items: center;
  font-weight: 600;
}

.cell-avatar__img {
  width: 100%;
  height: 100%;
}

.cell-avatar__initials {
  font-size: 1rem;
}

.cell-title {
  font-weight: 600;
}

.line-clamp {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: 4px;
}

.mobile-row-card {
  border-radius: 14px;
}

.mobile-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.mobile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-grid {
  display: grid;
}

.form-row {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  align-items: end;
}

.dialog-actions {
  margin-left: auto;
  padding: 0;
  justify-content: flex-end;
  gap: 12px;
}

.modal-switch-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.modal-card {
  border-radius: 20px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 24px;
  background: linear-gradient(145deg, rgba(126, 151, 170, 0.16), rgba(109, 128, 142, 0.12));
  color: #2a3c4a;
  border-bottom: 1px solid rgba(74, 97, 114, 0.12);
}

.modal-title {
  font-family: var(--display-font);
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2a3c4a;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: rgba(42, 60, 74, 0.62);
  margin-top: 4px;
}

.modal-card :deep(.v-card-text) {
  padding: 20px 24px 8px;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: rgba(35, 58, 74, 0.6);
}
</style>
