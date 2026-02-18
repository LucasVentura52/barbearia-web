<template>
  <v-container>
    <div class="section-title">
      <h2>Colaboradores</h2>
    </div>

    <v-card class="staff-toolbar-card" elevation="0">
      <v-card-text class="toolbar">
        <v-text-field v-model="search" label="Buscar colaborador" variant="outlined" prepend-inner-icon="mdi-magnify"
          density="compact" hide-details="auto" />
        <v-select v-model="filterStatus" :items="statusOptions" item-title="label" item-value="value" label="Status"
          variant="outlined" density="compact" class="status-filter" hide-details="auto" />
        <v-btn color="secondary" size="large" :block="smAndDown" @click="openCreate">Novo colaborador</v-btn>
      </v-card-text>
    </v-card>

    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <template v-if="!smAndDown">
          <v-table class="staff-table">
            <thead>
              <tr>
                <th class="text-left">Nome</th>
                <th class="text-left">Telefone</th>
                <th class="text-left">Funcao</th>
                <th class="text-left">Servicos</th>
                <th class="text-left">Status</th>
                <th class="text-left">Acoes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in filteredStaff" :key="member.id">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar">
                      <v-img v-if="member.avatar_url" :src="resolveMediaUrl(member.avatar_url)" cover />
                      <span v-else>{{ member.name?.slice(0, 1) || '?' }}</span>
                    </div>
                    <div>
                      <div class="cell-title">{{ member.name }}</div>
                      <div class="text-muted">{{ member.email || 'Sem e-mail' }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ formatPhoneFromE164(member.phone) || 'Telefone não informado' }}</td>
                <td>
                  <v-chip size="small" :color="member.role === 'admin' ? 'primary' : 'secondary'" variant="tonal">
                    {{ member.role === 'admin' ? 'Admin' : 'Staff' }}
                  </v-chip>
                </td>
                <td>
                  <div class="service-chips">
                    <v-chip v-for="service in member.services" :key="service.id" size="x-small" color="secondary"
                      variant="tonal">
                      {{ service.name }}
                    </v-chip>
                    <span v-if="!member.services.length" class="text-muted">Sem servicos</span>
                  </div>
                </td>
                <td>
                  <v-chip size="small" :color="member.profile?.active ? 'success' : 'warning'" variant="tonal">
                    {{ member.profile?.active ? 'Ativo' : 'Inativo' }}
                  </v-chip>
                </td>
                <td>
                  <div class="row-actions">
                    <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(member)" />
                    <v-btn icon="mdi-power" variant="text" color="warning" @click="toggleActive(member)" />
                    <v-btn icon="mdi-delete-outline" variant="text" color="error" @click="askDelete(member)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
        <template v-else>
          <v-row dense>
            <v-col v-for="member in filteredStaff" :key="member.id" cols="12">
              <v-card variant="outlined" class="mobile-row-card">
                <v-card-item>
                  <template #prepend>
                    <div class="member-avatar me-3">
                      <v-img v-if="member.avatar_url" :src="resolveMediaUrl(member.avatar_url)" cover />
                      <span v-else>{{ member.name?.slice(0, 1) || '?' }}</span>
                    </div>
                  </template>
                  <v-card-title class="text-body-1">{{ member.name }}</v-card-title>
                  <v-card-subtitle>{{ member.email || formatPhoneFromE164(member.phone) || 'Telefone não informado' }}</v-card-subtitle>
                </v-card-item>
                <v-card-text class="pt-0">
                  <div class="mobile-meta">
                    <v-chip size="small" :color="member.role === 'admin' ? 'primary' : 'secondary'" variant="tonal">
                      {{ member.role === 'admin' ? 'Admin' : 'Staff' }}
                    </v-chip>
                    <v-chip size="small" :color="member.profile?.active ? 'success' : 'warning'" variant="tonal">
                      {{ member.profile?.active ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                  </div>
                  <div class="service-chips mb-3">
                    <v-chip v-for="service in member.services" :key="service.id" size="x-small" color="secondary"
                      variant="tonal">
                      {{ service.name }}
                    </v-chip>
                    <span v-if="!member.services.length" class="text-muted">Sem serviços</span>
                  </div>
                  <div class="mobile-actions">
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit(member)">
                      Editar
                    </v-btn>
                    <v-btn size="small" variant="text" color="warning" prepend-icon="mdi-power"
                      @click="toggleActive(member)">
                      Status
                    </v-btn>
                    <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline"
                      @click="askDelete(member)">
                      Excluir
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>

        <div v-if="!filteredStaff.length" class="empty-state">
          Nenhum colaborador encontrado.
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="720">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ editing ? 'Editar colaborador' : 'Novo colaborador' }}</div>
            <div class="modal-subtitle">Gerencie equipe e permissoes.</div>
          </div>
          <v-icon icon="mdi-account-group" />
        </div>
        <v-card-text class="form-grid">
          <v-text-field v-model="form.name" label="Nome" variant="outlined" />
          <div class="phone-row">
            <v-select v-model="form.country" :items="countryOptions" item-title="label" item-value="code" label="Pais"
              variant="outlined" class="phone-country" />
            <v-text-field v-model="phoneInput" label="Telefone" placeholder="(11) 99999-9999" variant="outlined"
              type="tel" class="phone-input" maxlength="15" />
          </div>
          <v-text-field v-model="form.email" label="E-mail" variant="outlined" />
          <v-text-field v-model="form.password" label="Senha" type="password" variant="outlined"
            :hint="editing ? 'Deixe vazio para manter.' : ''" persistent-hint />
          <div class="form-row">
            <v-select v-model="form.role" :items="roleOptions" item-title="label" item-value="value" label="Permissao"
              variant="outlined" />
          </div>
          <v-textarea v-model="form.bio" label="Bio" variant="outlined" rows="2" />
          <v-text-field v-model="form.instagram" label="Instagram" variant="outlined" />
          <v-select v-model="form.service_ids" :items="serviceOptions" item-title="name" item-value="id"
            label="Servicos" multiple chips variant="outlined" />
          <div class="modal-switch-row">
            <v-switch v-model="form.active" color="secondary" label="Ativo" />
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" :loading="saving" @click="saveMember">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card>
        <v-card-title>Excluir colaborador</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="confirmDelete = false">Cancelar</v-btn>
          <v-btn color="error" :loading="saving" @click="deleteMember">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { useAlertStore } from '@/stores/alerts'
import { formatPhone, normalizePhone, buildE164, formatPhoneFromE164 } from '@/lib/phone'

const alerts = useAlertStore()

const staff = ref([])
const services = ref([])
const search = ref('')
const filterStatus = ref('all')
const dialog = ref(false)
const confirmDelete = ref(false)
const saving = ref(false)
const editing = ref(null)
const deleting = ref(null)
const { smAndDown } = useDisplay()

const countryOptions = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '1', label: 'EUA (+1)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '34', label: 'Espanha (+34)' },
]

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

const form = ref({
  name: '',
  country: '55',
  phone: '',
  email: '',
  password: '',
  role: 'staff',
  active: true,
  bio: '',
  instagram: '',
  service_ids: [],
})

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

const serviceOptions = computed(() => services.value.filter((service) => service.active))

const filteredStaff = computed(() => {
  const term = search.value.trim().toLowerCase()
  return staff.value.filter((member) => {
    const matchesTerm = !term ||
      member.name?.toLowerCase().includes(term) ||
      member.phone?.includes(term) ||
      member.email?.toLowerCase().includes(term)

    const isActive = member.profile?.active
    const matchesStatus =
      filterStatus.value === 'all' ||
      (filterStatus.value === 'active' && isActive) ||
      (filterStatus.value === 'inactive' && !isActive)

    return matchesTerm && matchesStatus
  })
})

const loadStaff = async () => {
  const { data } = await api.get('/api/admin/staff?include_inactive=1')
  staff.value = data
}

const loadServices = async () => {
  const { data } = await api.get('/api/services?include_inactive=1')
  services.value = data
}

const resetForm = () => {
  form.value = {
    name: '',
    country: '55',
    phone: '',
    email: '',
    password: '',
    role: 'staff',
    active: true,
    bio: '',
    instagram: '',
    service_ids: [],
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

const openCreate = () => {
  editing.value = null
  resetForm()
  dialog.value = true
}

const openEdit = (member) => {
  editing.value = member
  const phoneParts = splitPhone(member.phone)
  form.value = {
    name: member.name || '',
    country: phoneParts.country,
    phone: phoneParts.phone,
    email: member.email || '',
    password: '',
    role: member.role || 'staff',
    active: Boolean(member.profile?.active),
    bio: member.profile?.bio || '',
    instagram: member.profile?.instagram || '',
    service_ids: member.services?.map((service) => service.id) || [],
  }
  dialog.value = true
}

const saveMember = async () => {
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      phone: buildE164(form.value.country, form.value.phone),
      email: form.value.email || null,
      role: form.value.role,
      active: form.value.active,
      bio: form.value.bio || null,
      instagram: form.value.instagram || null,
      service_ids: form.value.service_ids,
    }

    if (form.value.password) {
      payload.password = form.value.password
    }

    if (editing.value) {
      await api.put(`/api/admin/staff/${editing.value.id}`, payload)
      alerts.success('Colaborador atualizado.')
    } else {
      if (!payload.password) {
        alerts.warning('Informe uma senha para o novo colaborador.')
        return
      }
      await api.post('/api/admin/staff', payload)
      alerts.success('Colaborador criado.')
    }

    dialog.value = false
    await loadStaff()
  } finally {
    saving.value = false
  }
}

const toggleActive = async (member) => {
  saving.value = true
  try {
    await api.put(`/api/admin/staff/${member.id}`, {
      active: !member.profile?.active,
    })
    await loadStaff()
    alerts.success('Status atualizado.')
  } finally {
    saving.value = false
  }
}

const askDelete = (member) => {
  deleting.value = member
  confirmDelete.value = true
}

const deleteMember = async () => {
  if (!deleting.value) return
  saving.value = true
  try {
    await api.delete(`/api/admin/staff/${deleting.value.id}`)
    confirmDelete.value = false
    await loadStaff()
    alerts.success('Colaborador excluido.')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadStaff(), loadServices()])
})
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.status-filter {
  min-width: 180px;
}

.toolbar :deep(.v-input) {
  min-width: 220px;
  margin: 0;
}

.toolbar :deep(.v-btn) {
  height: 40px;
}

.service-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(126, 151, 170, 0.24), rgba(126, 151, 170, 0.14));
  color: #314654;
  font-weight: 700;
}

.member-avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.mobile-row-card {
  border-radius: 14px;
}

.mobile-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.mobile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  font-size: 1.2rem;
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

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.phone-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.phone-country {
  min-width: 180px;
}

.phone-input {
  flex: 1;
  min-width: 200px;
}

.dialog-actions {
  padding: 0 24px 20px;
}
</style>
