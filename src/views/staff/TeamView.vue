<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Equipe ativa"
          :value="`${activeMembersCount}`"
          subtitle="Colaboradores habilitados na empresa"
          icon="mdi-account-check-outline"
          color="secondary"
          :progress="staff.length ? Math.round((activeMembersCount / staff.length) * 100) : 0"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Administradores"
          :value="`${adminsCount}`"
          subtitle="Usuários com permissão administrativa local"
          icon="mdi-shield-account-outline"
          color="primary"
          :progress="staff.length ? Math.round((adminsCount / staff.length) * 100) : 0"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Cobertura média"
          :value="`${averageServicesPerMember} serv.`"
          subtitle="Serviços atribuídos por colaborador"
          icon="mdi-briefcase-account-outline"
          color="success"
          :progress="Math.min(100, Math.round((averageServicesPerMember / 6) * 100))"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" xl="8">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal">
                <v-icon icon="mdi-account-group" />
              </v-avatar>
            </template>
            <v-card-title>Gestão da equipe</v-card-title>
            <v-card-subtitle>Administre cadastro, serviços, foto e status da operação.</v-card-subtitle>
            <template #append>
              <div class="d-flex flex-wrap ga-2 justify-end">
                <v-btn variant="tonal" :loading="loading" @click="loadAll">Atualizar</v-btn>
                <v-btn color="secondary" @click="openCreate">Novo colaborador</v-btn>
              </div>
            </template>
          </v-card-item>

          <v-card-text class="d-flex flex-column ga-4">
            <v-row>
              <v-col cols="12" md="7">
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Buscar por nome, telefone ou e-mail"
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
                    <th>Colaborador</th>
                    <th>Contato</th>
                    <th>Papel</th>
                    <th>Serviços</th>
                    <th>Status</th>
                    <th class="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in filteredStaff" :key="member.id">
                    <td>
                      <div class="d-flex align-center ga-3">
                        <v-avatar color="secondary" variant="tonal" size="44" rounded="lg">
                          <v-img v-if="member.avatar_url" :src="resolveMediaUrl(member.avatar_url)" cover />
                          <span v-else>{{ initials(member.name) }}</span>
                        </v-avatar>
                        <div>
                          <div class="font-weight-bold">{{ member.name }}</div>
                          <div class="text-caption text-medium-emphasis">{{ member.email || 'Sem e-mail' }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ formatPhoneFromE164(member.phone) || 'Sem telefone' }}</td>
                    <td>
                      <v-chip
                        :color="member.role === 'admin' ? 'primary' : 'secondary'"
                        variant="tonal"
                        size="small"
                      >
                        {{ member.role === 'admin' ? 'Admin' : 'Staff' }}
                      </v-chip>
                    </td>
                    <td>
                      <div class="d-flex flex-wrap ga-1">
                        <v-chip
                          v-for="service in member.services.slice(0, 3)"
                          :key="service.id"
                          size="x-small"
                          color="secondary"
                          variant="tonal"
                        >
                          {{ service.name }}
                        </v-chip>
                        <v-chip v-if="member.services.length > 3" size="x-small" color="primary" variant="tonal">
                          +{{ member.services.length - 3 }}
                        </v-chip>
                        <span v-if="!member.services.length" class="text-caption text-medium-emphasis">
                          Sem serviços
                        </span>
                      </div>
                    </td>
                    <td>
                      <v-chip
                        :color="member.profile?.active ? 'success' : 'warning'"
                        variant="tonal"
                        size="small"
                      >
                        {{ member.profile?.active ? 'Ativo' : 'Inativo' }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <v-btn icon variant="text" size="small" @click="openEdit(member)">
                        <v-icon icon="mdi-pencil-outline" />
                      </v-btn>
                      <v-btn icon variant="text" size="small" color="warning" @click="toggleActive(member)">
                        <v-icon icon="mdi-power" />
                      </v-btn>
                      <v-btn icon variant="text" size="small" color="error" @click="askDelete(member)">
                        <v-icon icon="mdi-delete-outline" />
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-expansion-panels v-else variant="accordion">
                <v-expansion-panel
                  v-for="member in filteredStaff"
                  :key="member.id"
                  rounded="xl"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-3">
                      <v-avatar color="secondary" variant="tonal" size="42" rounded="lg">
                        <v-img v-if="member.avatar_url" :src="resolveMediaUrl(member.avatar_url)" cover />
                        <span v-else>{{ initials(member.name) }}</span>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold">{{ member.name }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ member.role === 'admin' ? 'Admin' : 'Staff' }} ·
                          {{ member.profile?.active ? 'Ativo' : 'Inativo' }}
                        </div>
                      </div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="d-flex flex-column ga-3">
                    <div class="text-body-2 text-medium-emphasis">
                      {{ member.email || formatPhoneFromE164(member.phone) || 'Sem contato cadastrado.' }}
                    </div>
                    <div class="d-flex flex-wrap ga-1">
                      <v-chip
                        v-for="service in member.services"
                        :key="service.id"
                        size="x-small"
                        color="secondary"
                        variant="tonal"
                      >
                        {{ service.name }}
                      </v-chip>
                      <span v-if="!member.services.length" class="text-caption text-medium-emphasis">
                        Sem serviços atribuídos
                      </span>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                      <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit(member)">
                        Editar
                      </v-btn>
                      <v-btn variant="text" color="warning" prepend-icon="mdi-power" @click="toggleActive(member)">
                        Status
                      </v-btn>
                      <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDelete(member)">
                        Excluir
                      </v-btn>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-alert
                v-if="!filteredStaff.length"
                color="warning"
                icon="mdi-information-outline"
                variant="tonal"
              >
                Nenhum colaborador encontrado para o filtro atual.
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
                  <v-icon icon="mdi-chart-timeline-variant" />
                </v-avatar>
              </template>
              <v-card-title>Cobertura por serviço</v-card-title>
              <v-card-subtitle>Quantas pessoas conseguem executar cada item do catálogo.</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <v-timeline
                v-if="serviceCoverage.length"
                density="compact"
                side="end"
                truncate-line="start"
                class="timeline-compact"
              >
                <v-timeline-item
                  v-for="entry in serviceCoverage.slice(0, 6)"
                  :key="entry.id"
                  dot-color="secondary"
                  size="small"
                >
                  <div class="d-flex align-center justify-space-between ga-3">
                    <div>
                      <div class="font-weight-bold">{{ entry.name }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ entry.count }} profissional(is) habilitado(s)
                      </div>
                    </div>
                    <v-chip color="secondary" variant="tonal" size="small">{{ entry.count }}</v-chip>
                  </div>
                </v-timeline-item>
              </v-timeline>
              <v-alert v-else color="warning" variant="tonal" icon="mdi-briefcase-outline">
                Cadastre serviços e faça a vinculação para enxergar a cobertura.
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-shield-alert-outline" />
                </v-avatar>
              </template>
              <v-card-title>Regras do módulo</v-card-title>
              <v-card-subtitle>Essa tela usa os endpoints administrativos da empresa atual.</v-card-subtitle>
            </v-card-item>
            <v-card-text class="d-flex flex-column ga-3">
              <v-alert color="secondary" variant="tonal" icon="mdi-camera-outline">
                Fotos de colaboradores são enviadas para `/api/staff/{id}/photo` após salvar o cadastro.
              </v-alert>
              <v-alert color="info" variant="tonal" icon="mdi-link-variant">
                Usuários com múltiplas empresas podem ter restrições de edição global e foto, conforme a API.
              </v-alert>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="840">
      <v-card>
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-account-cog-outline" />
            </v-avatar>
          </template>
          <v-card-title>{{ editing ? 'Editar colaborador' : 'Novo colaborador' }}</v-card-title>
          <v-card-subtitle>Dados pessoais, permissão, serviços e foto operacional.</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4">
          <v-tabs v-model="formTab" color="secondary" grow>
            <v-tab value="identity">Identidade</v-tab>
            <v-tab value="operations">Operação</v-tab>
          </v-tabs>

          <v-window v-model="formTab">
            <v-window-item value="identity">
              <div class="d-flex flex-column ga-4 pt-4">
                <div class="d-flex align-center ga-4">
                  <v-avatar color="secondary" variant="tonal" size="72" rounded="lg">
                    <v-img
                      v-if="editing?.avatar_url && !photoPreviewName"
                      :src="resolveMediaUrl(editing.avatar_url)"
                      cover
                    />
                    <span v-else>{{ initials(form.name || 'CL') }}</span>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <v-file-input
                      v-model="photoFile"
                      label="Foto do colaborador"
                      accept="image/*"
                      prepend-icon="mdi-camera-outline"
                      chips
                      show-size
                      hide-details
                    />
                    <div v-if="photoPreviewName" class="text-caption text-medium-emphasis mt-2">
                      Novo arquivo selecionado: {{ photoPreviewName }}
                    </div>
                  </div>
                </div>

                <v-text-field v-model="form.name" label="Nome completo" />

                <v-row>
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="form.country"
                      :items="countryOptions"
                      item-title="label"
                      item-value="code"
                      label="País"
                    />
                  </v-col>
                  <v-col cols="12" sm="8">
                    <v-text-field
                      v-model="phoneInput"
                      label="Telefone"
                      maxlength="15"
                      type="tel"
                    />
                  </v-col>
                </v-row>

                <v-text-field v-model="form.email" label="E-mail" />
                <v-text-field
                  v-model="form.password"
                  :label="editing ? 'Nova senha (opcional)' : 'Senha inicial'"
                  type="password"
                />
              </div>
            </v-window-item>

            <v-window-item value="operations">
              <div class="d-flex flex-column ga-4 pt-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="form.role"
                      :items="roleOptions"
                      item-title="label"
                      item-value="value"
                      label="Papel"
                    />
                  </v-col>
                  <v-col cols="12" md="6" class="d-flex align-center">
                    <v-switch v-model="form.active" color="secondary" label="Colaborador ativo" inset hide-details />
                  </v-col>
                </v-row>
                <v-textarea v-model="form.bio" label="Bio" rows="3" auto-grow />
                <v-text-field v-model="form.instagram" label="Instagram" />
                <v-select
                  v-model="form.service_ids"
                  :items="serviceOptions"
                  item-title="name"
                  item-value="id"
                  label="Serviços habilitados"
                  multiple
                  chips
                />
                <v-alert color="secondary" variant="tonal" icon="mdi-information-outline">
                  Os serviços selecionados definem onde esse colaborador pode ser escalado na operação.
                </v-alert>
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveMember">Salvar colaborador</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-item>
          <v-card-title>Excluir colaborador</v-card-title>
          <v-card-subtitle>Essa ação remove o vínculo da empresa atual quando permitido.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deletingLoading" @click="deleteMember">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { buildE164, formatPhone, formatPhoneFromE164, normalizePhone } from '@/lib/phone'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const { mdAndUp } = useDisplay()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const staff = ref([])
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
const formTab = ref('identity')

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

const activeMembersCount = computed(() => staff.value.filter((member) => member.profile?.active).length)
const adminsCount = computed(() => staff.value.filter((member) => member.role === 'admin').length)
const averageServicesPerMember = computed(() => {
  if (!staff.value.length) return 0
  const total = staff.value.reduce((sum, member) => sum + (member.services?.length || 0), 0)
  return Number((total / staff.value.length).toFixed(1))
})
const serviceOptions = computed(() => services.value)
const serviceCoverage = computed(() =>
  services.value
    .map((service) => ({
      id: service.id,
      name: service.name,
      count: staff.value.filter((member) => member.services?.some((item) => item.id === service.id)).length,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
)
const filteredStaff = computed(() => {
  const term = search.value.trim().toLowerCase()

  return staff.value.filter((member) => {
    const matchesTerm =
      !term ||
      String(member.name || '').toLowerCase().includes(term) ||
      String(member.phone || '').includes(term) ||
      String(member.email || '').toLowerCase().includes(term)

    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && member.profile?.active) ||
      (statusFilter.value === 'inactive' && !member.profile?.active)

    return matchesTerm && matchesStatus
  })
})
const phoneInput = computed({
  get: () => formatPhone(form.value.phone, form.value.country),
  set: (value) => {
    form.value.phone = normalizePhone(value, form.value.country)
  },
})
const photoPreviewName = computed(() => {
  const file = resolveSelectedFile(photoFile.value)
  return file?.name || ''
})

watch(
  () => form.value.country,
  (countryCode) => {
    form.value.phone = normalizePhone(form.value.phone, countryCode)
  }
)

const initials = (value) =>
  String(value || 'EQ')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

const resolveSelectedFile = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const splitPhone = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) {
    return { country: '55', phone: '' }
  }

  const supportedCodes = countryOptions
    .map((country) => country.code)
    .sort((left, right) => right.length - left.length)

  const detectedCountry = supportedCodes.find((code) => digits.startsWith(code) && digits.length > code.length)
  if (detectedCountry) {
    return {
      country: detectedCountry,
      phone: normalizePhone(digits.slice(detectedCountry.length), detectedCountry),
    }
  }

  return {
    country: '55',
    phone: normalizePhone(digits, '55'),
  }
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
  photoFile.value = null
  formTab.value = 'identity'
}

const loadStaff = async () => {
  const { data } = await api.get('/api/admin/staff', {
    params: {
      include_inactive: 1,
    },
  })
  staff.value = Array.isArray(data) ? data : []
}

const loadServices = async () => {
  const { data } = await api.get('/api/services', {
    params: {
      include_inactive: 1,
    },
  })
  services.value = Array.isArray(data) ? data : []
}

const loadAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadStaff(), loadServices()])
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = null
  resetForm()
  dialog.value = true
}

const openEdit = (member) => {
  editing.value = member
  const parsedPhone = splitPhone(member.phone)
  form.value = {
    name: member.name || '',
    country: parsedPhone.country,
    phone: parsedPhone.phone,
    email: member.email || '',
    password: '',
    role: member.role || 'staff',
    active: Boolean(member.profile?.active),
    bio: member.profile?.bio || '',
    instagram: member.profile?.instagram || '',
    service_ids: member.services?.map((service) => service.id) || [],
  }
  photoFile.value = null
  formTab.value = 'identity'
  dialog.value = true
}

const askDelete = (member) => {
  deleting.value = member
  deleteDialog.value = true
}

const uploadPhoto = async (userId) => {
  const file = resolveSelectedFile(photoFile.value)
  if (!file || !userId) return

  const formData = new FormData()
  formData.append('file', file)
  await api.post(`/api/staff/${userId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

const refreshSessionIfCurrentUser = async (userId) => {
  if (Number(userId) === Number(auth.user?.id)) {
    await auth.loadMe(true)
  }
}

const saveMember = async () => {
  if (!String(form.value.name || '').trim()) {
    ui.notify('Informe o nome do colaborador.', 'warning')
    formTab.value = 'identity'
    return
  }

  if (!String(form.value.phone || '').trim()) {
    ui.notify('Informe o telefone do colaborador.', 'warning')
    formTab.value = 'identity'
    return
  }

  if (!editing.value && !String(form.value.password || '').trim()) {
    ui.notify('Informe a senha inicial do colaborador.', 'warning')
    formTab.value = 'identity'
    return
  }

  saving.value = true
  try {
    const payload = {
      name: String(form.value.name).trim(),
      phone: buildE164(form.value.country, form.value.phone),
      email: String(form.value.email || '').trim() || null,
      role: form.value.role,
      active: Boolean(form.value.active),
      bio: String(form.value.bio || '').trim() || null,
      instagram: String(form.value.instagram || '').trim() || null,
      service_ids: form.value.service_ids,
    }

    if (String(form.value.password || '').trim()) {
      payload.password = String(form.value.password).trim()
    }

    let userId = editing.value?.id

    if (editing.value) {
      await api.put(`/api/admin/staff/${editing.value.id}`, payload)
    } else {
      const { data } = await api.post('/api/admin/staff', payload)
      userId = data?.id
    }

    await uploadPhoto(userId)
    await refreshSessionIfCurrentUser(userId)
    dialog.value = false
    ui.notify(editing.value ? 'Colaborador atualizado.' : 'Colaborador criado.', 'success')
    await loadAll()
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
    await refreshSessionIfCurrentUser(member.id)
    ui.notify(`Colaborador ${member.profile?.active ? 'inativado' : 'reativado'}.`, 'success')
    await loadAll()
  } finally {
    saving.value = false
  }
}

const deleteMember = async () => {
  if (!deleting.value?.id) return

  deletingLoading.value = true
  try {
    await api.delete(`/api/admin/staff/${deleting.value.id}`)

    if (Number(deleting.value.id) === Number(auth.user?.id)) {
      await auth.logout()
      router.replace({ name: 'login' })
      return
    }

    deleteDialog.value = false
    ui.notify('Colaborador excluído.', 'success')
    await loadAll()
  } finally {
    deletingLoading.value = false
  }
}

onMounted(loadAll)
</script>
