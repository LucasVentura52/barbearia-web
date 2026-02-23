<template>
  <v-container>
    <div class="section-title">
      <h2>Clientes</h2>
    </div>

    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="clients-toolbar">
        <v-text-field
          v-model="search"
          label="Buscar cliente"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
          class="clients-search"
        />
        <v-chip color="primary" variant="tonal">
          {{ clients.length }} clientes
        </v-chip>
        <v-chip color="secondary" variant="tonal">
          Receita: {{ revenueLabel }}
        </v-chip>
        <v-btn color="secondary" variant="tonal" :loading="loading" @click="loadClients">
          Atualizar
        </v-btn>
      </v-card-text>
    </v-card>

    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <template v-if="!smAndDown">
          <v-table class="staff-table">
            <thead>
              <tr>
                <th class="text-left">Cliente</th>
                <th class="text-left">Telefone</th>
                <th class="text-left">Atendimentos</th>
                <th class="text-left">Último atendimento</th>
                <th class="text-left">Total gasto</th>
                <th class="text-left">Situação</th>
                <th class="text-left">Status</th>
                <th class="text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="client in clients" :key="client.id">
                <td>
                  <div class="client-cell">
                    <v-avatar size="38" class="client-avatar">
                      <v-img v-if="client.avatar_url" :src="resolveMediaUrl(client.avatar_url)" cover />
                      <span v-else>{{ client.name?.slice(0, 1) || '?' }}</span>
                    </v-avatar>
                    <div>
                      <div class="cell-title">{{ client.name || 'Cliente' }}</div>
                      <div class="text-muted">{{ client.email || 'Sem e-mail' }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ formatPhoneFromE164(client.phone) || 'Telefone não informado' }}</td>
                <td>{{ client.appointments_total }}</td>
                <td>{{ formatDateTime(client.last_appointment_at) }}</td>
                <td>{{ formatCurrencyBRL(client.total_spent) }}</td>
                <td>
                  <v-chip size="small" :color="client.active ? 'success' : 'warning'" variant="tonal">
                    {{ client.active ? 'Ativo' : 'Inativo' }}
                  </v-chip>
                </td>
                <td>
                  <div class="status-chips">
                    <v-chip size="x-small" variant="tonal" color="primary">Ag {{ client.scheduled_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="success">Ok {{ client.done_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="error">Can {{ client.canceled_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="warning">Falta {{ client.no_show_count }}</v-chip>
                  </div>
                </td>
                <td>
                  <div class="row-actions">
                    <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(client)" />
                    <v-btn
                      icon="mdi-power"
                      variant="text"
                      color="warning"
                      @click="toggleActive(client)"
                    />
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      color="error"
                      @click="askDelete(client)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>

        <template v-else>
          <v-row dense>
            <v-col v-for="client in clients" :key="client.id" cols="12">
              <v-card variant="outlined" class="mobile-row-card">
                <v-card-item>
                  <template #prepend>
                    <v-avatar size="40" class="client-avatar me-3">
                      <v-img v-if="client.avatar_url" :src="resolveMediaUrl(client.avatar_url)" cover />
                      <span v-else>{{ client.name?.slice(0, 1) || '?' }}</span>
                    </v-avatar>
                  </template>
                  <v-card-title class="text-body-1">{{ client.name || 'Cliente' }}</v-card-title>
                  <v-card-subtitle>{{ formatPhoneFromE164(client.phone) || 'Telefone não informado' }}</v-card-subtitle>
                </v-card-item>
                <v-card-text class="pt-0">
                  <div class="mobile-meta">
                    <v-chip size="small" variant="tonal" :color="client.active ? 'success' : 'warning'">
                      {{ client.active ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                    <v-chip size="small" variant="tonal" color="primary">{{ client.appointments_total }} atendimentos</v-chip>
                    <v-chip size="small" variant="tonal" color="secondary">{{ formatCurrencyBRL(client.total_spent) }}</v-chip>
                  </div>
                  <div class="text-muted mt-2">{{ formatDateTime(client.last_appointment_at) }}</div>
                  <div class="status-chips mt-2">
                    <v-chip size="x-small" variant="tonal" color="primary">Ag {{ client.scheduled_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="success">Ok {{ client.done_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="error">Can {{ client.canceled_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="warning">Falta {{ client.no_show_count }}</v-chip>
                  </div>
                  <div class="mobile-actions mt-3">
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit(client)">
                      Editar
                    </v-btn>
                    <v-btn size="small" variant="text" color="warning" prepend-icon="mdi-power" @click="toggleActive(client)">
                      {{ client.active ? 'Inativar' : 'Ativar' }}
                    </v-btn>
                    <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDelete(client)">
                      Excluir
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>

        <div v-if="!clients.length && !loading" class="empty-state">
          Nenhum cliente encontrado.
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="560">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">Editar cliente</div>
            <div class="modal-subtitle">Atualize os dados do cliente.</div>
          </div>
          <v-icon icon="mdi-account-edit" />
        </div>
        <v-card-text class="form-grid">
          <v-text-field v-model="form.name" label="Nome" variant="outlined" />
          <div class="phone-row">
            <v-select
              v-model="form.country"
              :items="countryOptions"
              item-title="label"
              item-value="code"
              label="País"
              variant="outlined"
              class="phone-country"
            />
            <v-text-field
              v-model="phoneInput"
              label="Telefone"
              placeholder="(11) 99999-9999"
              variant="outlined"
              type="tel"
              class="phone-input"
              maxlength="15"
            />
          </div>
          <v-text-field v-model="form.email" label="E-mail" variant="outlined" />
          <v-file-input
            v-model="form.photo"
            label="Foto do cliente"
            accept="image/*"
            prepend-icon="mdi-camera"
            show-size
            chips
            variant="outlined"
          />
          <v-text-field
            v-model="form.password"
            label="Nova senha"
            type="password"
            variant="outlined"
            hint="Deixe vazio para manter a senha atual."
            persistent-hint
          />
          <v-text-field
            v-model="form.password_confirmation"
            label="Confirmar nova senha"
            type="password"
            variant="outlined"
          />
          <div class="modal-switch-row">
            <v-switch v-model="form.active" color="secondary" label="Ativo" />
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" :loading="saving" @click="saveClient">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card>
        <v-card-title>Excluir cliente</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="confirmDelete = false">Cancelar</v-btn>
          <v-btn color="error" :loading="saving" @click="deleteClient">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { formatPhone, normalizePhone, buildE164, formatPhoneFromE164 } from '@/lib/phone'
import { resolveMediaUrl } from '@/lib/media'
import { formatCurrencyBRL } from '@/lib/currency'
import { useAlertStore } from '@/stores/alerts'

const clients = ref([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const confirmDelete = ref(false)
const editing = ref(null)
const deleting = ref(null)
const { smAndDown } = useDisplay()
const alerts = useAlertStore()

const countryOptions = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '1', label: 'EUA (+1)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '34', label: 'Espanha (+34)' },
]

const form = ref({
  name: '',
  country: '55',
  phone: '',
  email: '',
  photo: null,
  password: '',
  password_confirmation: '',
  active: true,
})

let searchTimer = null
let activeController = null
let requestCounter = 0

const phoneInput = computed({
  get: () => formatPhone(form.value.phone, form.value.country),
  set: (value) => {
    form.value.phone = normalizePhone(value, form.value.country)
  },
})

watch(
  () => form.value.country,
  (newCountry) => {
    form.value.phone = normalizePhone(form.value.phone, newCountry)
  }
)

const isRequestCanceled = (error) => error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'

const resetForm = () => {
  form.value = {
    name: '',
    country: '55',
    phone: '',
    email: '',
    photo: null,
    password: '',
    password_confirmation: '',
    active: true,
  }
}

const splitPhone = (value = '') => {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) {
    return { country: '55', phone: '' }
  }

  const supportedCodes = countryOptions
    .map((country) => country.code)
    .sort((a, b) => b.length - a.length)

  const country = supportedCodes.find((code) => digits.startsWith(code) && digits.length > code.length)
  if (country) {
    return { country, phone: normalizePhone(digits.slice(country.length), country) }
  }

  return { country: '55', phone: normalizePhone(digits, '55') }
}

const loadClients = async () => {
  const requestId = ++requestCounter
  activeController?.abort()
  const controller = new AbortController()
  activeController = controller

  loading.value = true
  try {
    const params = {
      limit: 150,
      include_inactive: 1,
    }

    if (search.value.trim()) {
      params.search = search.value.trim()
    }

    const { data } = await api.get('/api/staff/clients', {
      params,
      signal: controller.signal,
    })

    if (requestId !== requestCounter) return
    clients.value = Array.isArray(data) ? data : []
  } catch (error) {
    if (isRequestCanceled(error)) return
    alerts.error(error?.response?.data?.message || 'Não foi possível carregar os clientes.')
  } finally {
    if (requestId === requestCounter) {
      loading.value = false
    }
  }
}

const openEdit = (client) => {
  editing.value = client
  const phoneParts = splitPhone(client.phone)
  form.value = {
    name: client.name || '',
    country: phoneParts.country,
    phone: phoneParts.phone,
    email: client.email || '',
    photo: null,
    password: '',
    password_confirmation: '',
    active: Boolean(client.active),
  }
  dialog.value = true
}

const saveClient = async () => {
  if (!editing.value) return
  if (!form.value.name.trim()) {
    alerts.warning('Informe o nome do cliente.')
    return
  }

  if (!form.value.phone.trim()) {
    alerts.warning('Informe o telefone do cliente.')
    return
  }

  const wantsPasswordChange = Boolean(form.value.password || form.value.password_confirmation)
  if (wantsPasswordChange && (!form.value.password || !form.value.password_confirmation)) {
    alerts.warning('Preencha a nova senha e a confirmação.')
    return
  }

  if (form.value.password && form.value.password.length < 6) {
    alerts.warning('A nova senha deve ter pelo menos 6 caracteres.')
    return
  }

  if (form.value.password && form.value.password !== form.value.password_confirmation) {
    alerts.warning('As senhas não conferem.')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      phone: buildE164(form.value.country, form.value.phone),
      email: form.value.email ? form.value.email.trim() : null,
      active: form.value.active,
    }

    if (form.value.password) {
      payload.password = form.value.password
      payload.password_confirmation = form.value.password_confirmation
    }

    await api.put(`/api/staff/clients/${editing.value.id}`, payload)

    const selectedFile = Array.isArray(form.value.photo) ? form.value.photo[0] : form.value.photo
    if (selectedFile) {
      const formData = new FormData()
      formData.append('file', selectedFile)
      await api.post(`/api/staff/clients/${editing.value.id}/photo`, formData)
    }

    dialog.value = false
    alerts.success('Cliente atualizado.')
    await loadClients()
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível atualizar o cliente.')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (client) => {
  saving.value = true
  try {
    await api.put(`/api/staff/clients/${client.id}`, {
      active: !client.active,
    })

    alerts.success(client.active ? 'Cliente inativado.' : 'Cliente ativado.')
    await loadClients()
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível atualizar o status do cliente.')
  } finally {
    saving.value = false
  }
}

const askDelete = (client) => {
  deleting.value = client
  confirmDelete.value = true
}

const deleteClient = async () => {
  if (!deleting.value) return

  saving.value = true
  try {
    await api.delete(`/api/staff/clients/${deleting.value.id}`)
    confirmDelete.value = false
    alerts.success('Cliente excluído.')
    await loadClients()
  } catch (error) {
    alerts.error(error?.response?.data?.message || 'Não foi possível excluir o cliente.')
  } finally {
    saving.value = false
  }
}

const revenueLabel = computed(() => {
  const total = clients.value.reduce((sum, client) => sum + Number(client.total_spent || 0), 0)
  return formatCurrencyBRL(total)
})

const formatDateTime = (value) => {
  if (!value) return 'Sem histórico'
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadClients()
  }, 280)
})

watch(
  () => dialog.value,
  (isOpen) => {
    if (isOpen) return
    editing.value = null
    resetForm()
  }
)

watch(
  () => confirmDelete.value,
  (isOpen) => {
    if (isOpen) return
    deleting.value = null
  }
)

onMounted(() => {
  loadClients()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  activeController?.abort()
})
</script>

<style scoped>
.clients-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.clients-search {
  min-width: 280px;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.client-avatar {
  background: rgba(87, 120, 132, 0.14);
  color: var(--ink-900);
  font-weight: 700;
}

.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.row-actions :deep(.v-btn) {
  min-width: 34px;
}

.mobile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
  font-size: 1.12rem;
}

.modal-subtitle {
  color: var(--ink-500);
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}

.modal-switch-row {
  display: flex;
  justify-content: flex-start;
}

.phone-row {
  display: grid;
  grid-template-columns: minmax(130px, 170px) minmax(0, 1fr);
  gap: 10px;
}

.dialog-actions {
  padding: 0 24px 20px;
}

@media (max-width: 960px) {
  .clients-search {
    min-width: 100%;
  }

  .phone-row {
    grid-template-columns: 1fr;
  }
}
</style>
