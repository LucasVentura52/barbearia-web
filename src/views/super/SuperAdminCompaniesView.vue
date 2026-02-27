<template>
  <v-container>
    <div class="section-title">
      <h2>Empresas e Acessos</h2>
    </div>

    <v-card class="staff-toolbar-card mb-4" elevation="0">
      <v-card-text class="toolbar">
        <v-select
          v-model="selectedCompanyId"
          :items="companyOptions"
          item-title="name"
          item-value="id"
          label="Empresa"
          variant="outlined"
          density="compact"
          class="company-select"
          hide-details="auto"
        />
        <v-btn color="secondary" :block="smAndDown" @click="openCreateCompany">Nova empresa</v-btn>
        <v-btn color="primary" variant="outlined" :block="smAndDown" :disabled="!selectedCompanyId"
          @click="openEditCompany">
          Editar empresa
        </v-btn>
        <v-btn color="error" variant="outlined" :block="smAndDown" :disabled="!selectedCompanyId" @click="deleteCompany">
          Excluir empresa
        </v-btn>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="d-flex justify-space-between align-center flex-wrap ga-2">
            <span>Membros da empresa</span>
            <v-btn color="secondary" size="small" :disabled="!selectedCompanyId" @click="openCreateMembership">
              Novo vínculo
            </v-btn>
          </v-card-title>
          <v-card-text>
            <template v-if="loadingMemberships">
              <template v-if="!smAndDown">
                <v-table class="staff-table">
                  <thead>
                    <tr>
                      <th class="text-left">Nome</th>
                      <th class="text-left">Telefone</th>
                      <th class="text-left">Papel</th>
                      <th class="text-left">Status</th>
                      <th class="text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="5">
                        <app-list-skeleton mode="table" :rows="6" :columns="5" />
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
                      <th class="text-left">Nome</th>
                      <th class="text-left">Telefone</th>
                      <th class="text-left">Papel</th>
                      <th class="text-left">Status</th>
                      <th class="text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="membership in memberships" :key="membership.id">
                      <td>{{ membership.user?.name || '-' }}</td>
                      <td>{{ formatPhoneFromE164(membership.user?.phone) || '-' }}</td>
                      <td>
                        <v-chip size="small" variant="tonal" color="primary">
                          {{ membership.role }}
                        </v-chip>
                      </td>
                      <td>
                        <v-chip size="small" variant="tonal" :color="membership.active ? 'success' : 'warning'">
                          {{ membership.active ? 'Ativo' : 'Inativo' }}
                        </v-chip>
                      </td>
                      <td>
                        <div class="row-actions">
                          <v-btn icon="mdi-pencil-outline" variant="text" @click="openEditMembership(membership)" />
                          <v-btn icon="mdi-delete-outline" variant="text" color="error"
                            @click="deleteMembership(membership)" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </template>
              <template v-else>
                <v-row dense>
                  <v-col v-for="membership in memberships" :key="membership.id" cols="12">
                    <v-card variant="outlined" class="membership-mobile-card">
                      <v-card-item>
                        <v-card-title class="text-body-1">{{ membership.user?.name || '-' }}</v-card-title>
                        <v-card-subtitle>{{ formatPhoneFromE164(membership.user?.phone) || '-' }}</v-card-subtitle>
                      </v-card-item>
                      <v-card-text class="pt-0">
                        <div class="row-actions mb-2">
                          <v-chip size="small" variant="tonal" color="primary">{{ membership.role }}</v-chip>
                          <v-chip size="small" variant="tonal" :color="membership.active ? 'success' : 'warning'">
                            {{ membership.active ? 'Ativo' : 'Inativo' }}
                          </v-chip>
                        </div>
                        <div class="row-actions">
                          <v-btn size="small" variant="tonal" prepend-icon="mdi-pencil-outline"
                            @click="openEditMembership(membership)">
                            Editar
                          </v-btn>
                          <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline"
                            @click="deleteMembership(membership)">
                            Excluir
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </template>

              <div v-if="!memberships.length" class="empty-state">
                Sem vínculos para a empresa selecionada.
              </div>
            </template>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Usuários globais</span>
            <v-btn color="secondary" size="small" @click="openCreateUser">Novo usuário</v-btn>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="userSearch"
              label="Buscar usuário"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            />
            <template v-if="loadingUsers">
              <app-list-skeleton mode="list" :rows="8" />
            </template>
            <template v-else>
              <v-list density="compact" class="user-list">
                <v-list-item v-for="user in users" :key="user.id" :title="user.name" :subtitle="formatPhoneFromE164(user.phone) || '-'">
                  <template #append>
                    <v-chip size="x-small" variant="tonal">{{ user.role }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="companyDialog" max-width="560">
      <v-card class="modal-card">
        <v-card-title>{{ editingCompany ? 'Editar empresa' : 'Nova empresa' }}</v-card-title>
        <v-card-text class="form-grid">
          <v-text-field v-model="companyForm.name" label="Nome" variant="outlined" />
          <v-text-field v-model="companyForm.slug" label="Slug" variant="outlined" hint="Ex.: matriz-sp" persistent-hint />
          <div class="modal-switch-row">
            <v-switch v-model="companyForm.active" label="Ativa" color="secondary" />
            <v-card-actions class="dialog-actions">
              <v-btn variant="text" @click="companyDialog = false">Cancelar</v-btn>
              <v-btn color="secondary" variant="flat" :loading="saving" @click="saveCompany">Salvar</v-btn>
            </v-card-actions>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="membershipDialog" max-width="620">
      <v-card class="modal-card">
        <v-card-title>{{ editingMembership ? 'Editar vínculo' : 'Novo vínculo' }}</v-card-title>
        <v-card-text class="form-grid">
          <v-select
            v-model="membershipForm.user_id"
            :items="userOptions"
            item-title="title"
            item-value="value"
            label="Usuário"
            variant="outlined"
            :disabled="Boolean(editingMembership)"
          />
          <v-select v-model="membershipForm.role" :items="membershipRoleOptions" label="Papel na empresa" variant="outlined" />
          <div class="modal-switch-row">
            <v-switch v-model="membershipForm.active" label="Ativo" color="secondary" />
            <v-card-actions class="dialog-actions">
              <v-btn variant="text" @click="membershipDialog = false">Cancelar</v-btn>
              <v-btn color="secondary" variant="flat" :loading="saving" @click="saveMembership">Salvar</v-btn>
            </v-card-actions>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="userDialog" max-width="620">
      <v-card class="modal-card">
        <v-card-title>Novo usuário global</v-card-title>
        <v-card-text class="form-grid">
          <v-text-field v-model="userForm.name" label="Nome" variant="outlined" />
          <div class="phone-row">
            <v-select v-model="userForm.country" :items="countryOptions" item-title="label" item-value="code" label="País" variant="outlined" />
            <v-text-field
              v-model="userPhone"
              label="Telefone"
              placeholder="(11) 99999-9999"
              variant="outlined"
              type="tel"
              maxlength="15"
            />
          </div>
          <v-text-field v-model="userForm.email" label="E-mail" variant="outlined" />
          <v-text-field v-model="userForm.password" label="Senha" type="password" variant="outlined" />
          <v-select v-model="userForm.role" :items="globalRoleOptions" label="Papel global" variant="outlined" />
          <div class="modal-switch-row">
            <v-card-actions class="dialog-actions">
              <v-btn variant="text" @click="userDialog = false">Cancelar</v-btn>
              <v-btn color="secondary" :loading="saving" @click="saveUser">Criar usuário</v-btn>
            </v-card-actions>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { useAlertStore } from '@/stores/alerts'
import { buildE164, formatPhone, formatPhoneFromE164, normalizePhone } from '@/lib/phone'
import AppListSkeleton from '@/components/AppListSkeleton.vue'

const alerts = useAlertStore()

const companies = ref([])
const memberships = ref([])
const users = ref([])
const selectedCompanyId = ref(null)
const userSearch = ref('')
const saving = ref(false)
const loadingMemberships = ref(false)
const loadingUsers = ref(false)
const { smAndDown } = useDisplay()

const companyDialog = ref(false)
const membershipDialog = ref(false)
const userDialog = ref(false)
let userSearchTimer = null
let usersRequestController = null
let usersRequestCounter = 0
let membershipsRequestController = null
let membershipsRequestCounter = 0

const editingCompany = ref(null)
const editingMembership = ref(null)

const companyForm = ref({
  name: '',
  slug: '',
  active: true,
})

const membershipForm = ref({
  user_id: null,
  role: 'client',
  active: true,
})

const userForm = ref({
  name: '',
  country: '55',
  phone: '',
  email: '',
  password: '',
  role: 'client',
})

const countryOptions = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '1', label: 'EUA (+1)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '34', label: 'Espanha (+34)' },
]

const membershipRoleOptions = ['client', 'staff', 'admin']
const globalRoleOptions = ['client', 'staff', 'admin', 'super_admin']

const userPhone = computed({
  get: () => formatPhone(userForm.value.phone, userForm.value.country),
  set: (value) => {
    userForm.value.phone = normalizePhone(value, userForm.value.country)
  },
})

watch(
  () => userForm.value.country,
  (newCountry) => {
    userForm.value.phone = normalizePhone(userForm.value.phone, newCountry)
  }
)

const companyOptions = computed(() => companies.value)

const userOptions = computed(() => {
  return users.value.map((user) => ({
    value: user.id,
    title: `${user.name} (${formatPhoneFromE164(user.phone) || '-'})`,
  }))
})

const isRequestCanceled = (error) => error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'

const loadCompanies = async () => {
  const { data } = await api.get('/api/super-admin/companies')
  companies.value = data

  if (!companies.value.length) {
    selectedCompanyId.value = null
    memberships.value = []
    return
  }

  if (!selectedCompanyId.value || !companies.value.some((company) => company.id === selectedCompanyId.value)) {
    selectedCompanyId.value = companies.value[0].id
  }
}

const loadMemberships = async () => {
  const companyId = selectedCompanyId.value
  if (!companyId) {
    memberships.value = []
    return
  }

  const requestId = ++membershipsRequestCounter
  membershipsRequestController?.abort()
  const controller = new AbortController()
  membershipsRequestController = controller

  try {
    loadingMemberships.value = true
    const { data } = await api.get(`/api/super-admin/companies/${companyId}/memberships`, {
      signal: controller.signal,
    })
    if (requestId !== membershipsRequestCounter) return
    memberships.value = data
  } catch (error) {
    if (isRequestCanceled(error)) return
    throw error
  } finally {
    if (requestId === membershipsRequestCounter) {
      loadingMemberships.value = false
    }
  }
}

const loadUsers = async () => {
  const requestId = ++usersRequestCounter
  usersRequestController?.abort()
  const controller = new AbortController()
  usersRequestController = controller

  const params = new URLSearchParams()
  params.append('limit', '200')
  if (userSearch.value.trim()) {
    params.append('search', userSearch.value.trim())
  }

  try {
    loadingUsers.value = true
    const { data } = await api.get(`/api/super-admin/users?${params.toString()}`, {
      signal: controller.signal,
    })
    if (requestId !== usersRequestCounter) return
    users.value = data
  } catch (error) {
    if (isRequestCanceled(error)) return
    throw error
  } finally {
    if (requestId === usersRequestCounter) {
      loadingUsers.value = false
    }
  }
}

const openCreateCompany = () => {
  editingCompany.value = null
  companyForm.value = { name: '', slug: '', active: true }
  companyDialog.value = true
}

const openEditCompany = () => {
  const current = companies.value.find((company) => company.id === selectedCompanyId.value)
  if (!current) return

  editingCompany.value = current
  companyForm.value = {
    name: current.name || '',
    slug: current.slug || '',
    active: Boolean(current.active),
  }
  companyDialog.value = true
}

const saveCompany = async () => {
  saving.value = true
  try {
    const payload = {
      name: companyForm.value.name,
      slug: companyForm.value.slug,
      active: companyForm.value.active,
    }

    if (editingCompany.value) {
      await api.put(`/api/super-admin/companies/${editingCompany.value.id}`, payload)
      alerts.success('Empresa atualizada.')
    } else {
      await api.post('/api/super-admin/companies', payload)
      alerts.success('Empresa criada.')
    }

    companyDialog.value = false
    await loadCompanies()
  } finally {
    saving.value = false
  }
}

const deleteCompany = async () => {
  if (!selectedCompanyId.value) return

  saving.value = true
  try {
    await api.delete(`/api/super-admin/companies/${selectedCompanyId.value}`)
    alerts.success('Empresa excluída.')
    await loadCompanies()
  } finally {
    saving.value = false
  }
}

const openCreateMembership = () => {
  editingMembership.value = null
  membershipForm.value = {
    user_id: null,
    role: 'client',
    active: true,
  }
  membershipDialog.value = true
}

const openEditMembership = (membership) => {
  editingMembership.value = membership
  membershipForm.value = {
    user_id: membership.user_id,
    role: membership.role,
    active: Boolean(membership.active),
  }
  membershipDialog.value = true
}

const saveMembership = async () => {
  if (!selectedCompanyId.value) return

  saving.value = true
  try {
    const payload = {
      user_id: membershipForm.value.user_id,
      role: membershipForm.value.role,
      active: membershipForm.value.active,
    }

    if (editingMembership.value) {
      await api.put(
        `/api/super-admin/companies/${selectedCompanyId.value}/memberships/${editingMembership.value.id}`,
        payload
      )
      alerts.success('Vínculo atualizado.')
    } else {
      await api.post(`/api/super-admin/companies/${selectedCompanyId.value}/memberships`, payload)
      alerts.success('Vínculo criado.')
    }

    membershipDialog.value = false
    await loadMemberships()
  } finally {
    saving.value = false
  }
}

const deleteMembership = async (membership) => {
  if (!selectedCompanyId.value) return

  saving.value = true
  try {
    await api.delete(`/api/super-admin/companies/${selectedCompanyId.value}/memberships/${membership.id}`)
    alerts.success('Vínculo excluído.')
    await loadMemberships()
  } finally {
    saving.value = false
  }
}

const openCreateUser = () => {
  userForm.value = {
    name: '',
    country: '55',
    phone: '',
    email: '',
    password: '',
    role: 'client',
  }
  userDialog.value = true
}

const saveUser = async () => {
  saving.value = true
  try {
    await api.post('/api/super-admin/users', {
      name: userForm.value.name,
      phone: buildE164(userForm.value.country, userForm.value.phone),
      email: userForm.value.email || null,
      password: userForm.value.password,
      role: userForm.value.role,
    })

    userDialog.value = false
    alerts.success('Usuário criado.')
    await loadUsers()
  } finally {
    saving.value = false
  }
}

watch(
  () => selectedCompanyId.value,
  () => {
    loadMemberships()
  }
)

watch(userSearch, () => {
  if (userSearchTimer) clearTimeout(userSearchTimer)
  userSearchTimer = setTimeout(() => {
    loadUsers()
  }, 260)
})

onMounted(async () => {
  await Promise.all([loadUsers(), loadCompanies()])
})

onBeforeUnmount(() => {
  if (userSearchTimer) clearTimeout(userSearchTimer)
  usersRequestController?.abort()
  membershipsRequestController?.abort()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.company-select {
  min-width: 260px;
}

.toolbar :deep(.v-input) {
  margin: 0;
}

.row-actions {
  display: flex;
  gap: 4px;
}

.phone-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.user-list {
  max-height: 480px;
  overflow: auto;
}

.membership-mobile-card {
  border-radius: 14px;
}

.modal-switch-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.dialog-actions {
  margin-left: auto;
  padding: 0;
  justify-content: flex-end;
  gap: 8px;
}
</style>
