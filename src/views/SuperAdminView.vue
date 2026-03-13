<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Empresas"
          :value="`${companies.length}`"
          subtitle="Base global cadastrada"
          icon="mdi-domain"
          color="secondary"
          :progress="Math.min(100, companies.length * 10)"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Vínculos"
          :value="`${memberships.length}`"
          subtitle="Empresa selecionada"
          icon="mdi-account-link-outline"
          color="primary"
          :progress="Math.min(100, memberships.length * 8)"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Usuários globais"
          :value="`${users.length}`"
          subtitle="Lista carregada"
          icon="mdi-account-multiple-outline"
          color="success"
          :progress="Math.min(100, users.length * 3)"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" xl="5">
        <v-card class="glass-panel h-100">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal">
                <v-icon icon="mdi-office-building-cog-outline" />
              </v-avatar>
            </template>
            <v-card-title>Empresas</v-card-title>
            <v-card-subtitle>Crie, edite, ative ou desative empresas.</v-card-subtitle>
            <template #append>
              <v-btn color="secondary" size="small" @click="openCreateCompany">Nova empresa</v-btn>
            </template>
          </v-card-item>

          <v-card-text class="d-flex flex-column ga-3">
            <v-sheet
              v-for="company in companies"
              :key="company.id"
              class="pa-4"
              :color="selectedCompanyId === company.id ? 'surface-variant' : 'surface'"
              border
              @click="selectedCompanyId = company.id"
            >
              <div class="d-flex align-center justify-space-between ga-3">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ company.name }}</div>
                  <div class="text-body-2 text-medium-emphasis">{{ company.slug }}</div>
                </div>
                <v-chip :color="company.active ? 'success' : 'warning'" variant="tonal">
                  {{ company.active ? 'Ativa' : 'Inativa' }}
                </v-chip>
              </div>
              <div class="d-flex justify-end ga-2 mt-4">
                <v-btn size="small" variant="tonal" @click.stop="openEditCompany(company)">Editar</v-btn>
                <v-btn size="small" variant="text" color="error" @click.stop="deleteCompany(company)">Excluir</v-btn>
              </div>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" xl="7">
        <v-card class="glass-panel mb-6">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="mdi-account-link-outline" />
              </v-avatar>
            </template>
            <v-card-title>Vínculos da empresa</v-card-title>
            <v-card-subtitle>{{ selectedCompanyName || 'Selecione uma empresa' }}</v-card-subtitle>
            <template #append>
              <v-btn color="secondary" size="small" :disabled="!selectedCompanyId" @click="openCreateMembership">
                Novo vínculo
              </v-btn>
            </template>
          </v-card-item>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="membership in memberships" :key="membership.id">
                  <td>
                    <div class="d-flex align-center ga-3">
                      <v-avatar color="secondary" variant="tonal" size="36">
                        <v-img v-if="membership.user?.avatar_url" :src="resolveMediaUrl(membership.user.avatar_url)" cover />
                        <span v-else>{{ initials(membership.user?.name || 'U') }}</span>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold">{{ membership.user?.name || '-' }}</div>
                        <div class="text-caption text-medium-emphasis">{{ membership.user?.email || membership.user?.phone || '-' }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ membership.role }}</td>
                  <td>
                    <v-chip :color="membership.active ? 'success' : 'warning'" variant="tonal">
                      {{ membership.active ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                  </td>
                  <td class="text-right">
                    <v-btn size="small" variant="tonal" @click="openEditMembership(membership)">Editar</v-btn>
                    <v-btn size="small" variant="text" color="error" @click="deleteMembership(membership)">Excluir</v-btn>
                  </td>
                </tr>
                <tr v-if="!memberships.length">
                  <td colspan="4" class="text-medium-emphasis">Sem vínculos para a empresa selecionada.</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="success" variant="tonal">
                <v-icon icon="mdi-account-multiple-outline" />
              </v-avatar>
            </template>
            <v-card-title>Usuários globais</v-card-title>
            <v-card-subtitle>Base de usuários disponível para novos vínculos.</v-card-subtitle>
            <template #append>
              <v-btn color="secondary" size="small" @click="openCreateUser">Novo usuário</v-btn>
            </template>
          </v-card-item>
          <v-card-text>
            <v-text-field v-model="userSearch" label="Buscar usuário" prepend-inner-icon="mdi-magnify" />
            <v-list class="bg-transparent">
              <v-list-item
                v-for="user in users"
                :key="user.id"
                :title="user.name"
                :subtitle="user.email || user.phone || 'Sem contato'"
              >
                <template #append>
                  <v-chip variant="tonal">{{ user.role }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="companyDialog" max-width="560">
      <v-card>
        <v-card-item>
          <v-card-title>{{ editingCompany ? 'Editar empresa' : 'Nova empresa' }}</v-card-title>
          <v-card-subtitle>Nome, slug e status.</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-text-field v-model="companyForm.name" label="Nome" />
          <v-text-field v-model="companyForm.slug" label="Slug" />
          <v-switch v-model="companyForm.active" label="Empresa ativa" color="secondary" inset hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="companyDialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveCompany">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="membershipDialog" max-width="560">
      <v-card>
        <v-card-item>
          <v-card-title>{{ editingMembership ? 'Editar vínculo' : 'Novo vínculo' }}</v-card-title>
          <v-card-subtitle>Defina papel e status dentro da empresa.</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-select
            v-model="membershipForm.user_id"
            :items="userOptions"
            item-title="title"
            item-value="value"
            label="Usuário"
            :disabled="Boolean(editingMembership)"
          />
          <v-select v-model="membershipForm.role" :items="membershipRoles" label="Papel" />
          <v-switch v-model="membershipForm.active" label="Vínculo ativo" color="secondary" inset hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="membershipDialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveMembership">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="userDialog" max-width="620">
      <v-card>
        <v-card-item>
          <v-card-title>Novo usuário global</v-card-title>
          <v-card-subtitle>Esse usuário poderá ser vinculado a qualquer empresa.</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-text-field v-model="userForm.name" label="Nome" />
          <v-row>
            <v-col cols="12" sm="4">
              <v-select
                v-model="userForm.country"
                :items="countryOptions"
                item-title="label"
                item-value="code"
                label="País"
              />
            </v-col>
            <v-col cols="12" sm="8">
              <v-text-field v-model="phoneInput" label="Telefone" maxlength="15" />
            </v-col>
          </v-row>
          <v-text-field v-model="userForm.email" label="E-mail" />
          <v-text-field v-model="userForm.password" label="Senha" type="password" />
          <v-select v-model="userForm.role" :items="globalRoles" label="Papel global" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="userDialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveUser">Criar usuário</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { buildE164, formatPhone, normalizePhone } from '@/lib/phone'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const loading = ref(false)
const saving = ref(false)
const companies = ref([])
const memberships = ref([])
const users = ref([])
const selectedCompanyId = ref(null)
const userSearch = ref('')
const companyDialog = ref(false)
const membershipDialog = ref(false)
const userDialog = ref(false)
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
]

const membershipRoles = ['client', 'staff', 'admin']
const globalRoles = ['client', 'staff', 'admin', 'super_admin']

const selectedCompanyName = computed(() =>
  companies.value.find((company) => company.id === selectedCompanyId.value)?.name || ''
)

const userOptions = computed(() =>
  users.value.map((user) => ({
    title: `${user.name} (${user.email || user.phone || 'sem contato'})`,
    value: user.id,
  }))
)

const phoneInput = computed({
  get: () => formatPhone(userForm.value.phone, userForm.value.country),
  set: (value) => {
    userForm.value.phone = normalizePhone(value, userForm.value.country)
  },
})

const initials = (name) =>
  String(name || 'U')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

const loadCompanies = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/super-admin/companies')
    companies.value = Array.isArray(data) ? data : []
    if (!selectedCompanyId.value && companies.value.length) {
      selectedCompanyId.value = companies.value[0].id
    }
  } finally {
    loading.value = false
  }
}

const loadMemberships = async () => {
  if (!selectedCompanyId.value) {
    memberships.value = []
    return
  }
  const { data } = await api.get(`/api/super-admin/companies/${selectedCompanyId.value}/memberships`)
  memberships.value = Array.isArray(data) ? data : []
}

const loadUsers = async (search = '') => {
  const params = new URLSearchParams({ limit: '80' })
  if (search.trim()) {
    params.append('search', search.trim())
  }
  const { data } = await api.get(`/api/super-admin/users?${params.toString()}`)
  users.value = Array.isArray(data) ? data : []
}

const openCreateCompany = () => {
  editingCompany.value = null
  companyForm.value = {
    name: '',
    slug: '',
    active: true,
  }
  companyDialog.value = true
}

const openEditCompany = (company) => {
  editingCompany.value = company
  companyForm.value = {
    name: company.name,
    slug: company.slug,
    active: Boolean(company.active),
  }
  companyDialog.value = true
}

const saveCompany = async () => {
  saving.value = true
  try {
    if (editingCompany.value) {
      await api.put(`/api/super-admin/companies/${editingCompany.value.id}`, companyForm.value)
    } else {
      await api.post('/api/super-admin/companies', companyForm.value)
    }
    companyDialog.value = false
    await loadCompanies()
    await loadMemberships()
    ui.notify('Empresa salva.', 'success')
  } finally {
    saving.value = false
  }
}

const deleteCompany = async (company) => {
  if (!window.confirm(`Excluir a empresa ${company.name}?`)) return
  await api.delete(`/api/super-admin/companies/${company.id}`)
  await loadCompanies()
  await loadMemberships()
  ui.notify('Empresa removida.', 'success')
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
    if (editingMembership.value) {
      await api.put(
        `/api/super-admin/companies/${selectedCompanyId.value}/memberships/${editingMembership.value.id}`,
        {
          role: membershipForm.value.role,
          active: membershipForm.value.active,
        }
      )
    } else {
      await api.post(`/api/super-admin/companies/${selectedCompanyId.value}/memberships`, membershipForm.value)
    }
    membershipDialog.value = false
    await loadMemberships()
    ui.notify('Vínculo salvo.', 'success')
  } finally {
    saving.value = false
  }
}

const deleteMembership = async (membership) => {
  if (!selectedCompanyId.value) return
  if (!window.confirm(`Excluir o vínculo de ${membership.user?.name || 'usuário'}?`)) return
  await api.delete(`/api/super-admin/companies/${selectedCompanyId.value}/memberships/${membership.id}`)
  await loadMemberships()
  ui.notify('Vínculo removido.', 'success')
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
    await loadUsers(userSearch.value)
    ui.notify('Usuário global criado.', 'success')
  } finally {
    saving.value = false
  }
}

let userSearchTimer = null
watch(userSearch, (value) => {
  window.clearTimeout(userSearchTimer)
  userSearchTimer = window.setTimeout(() => {
    loadUsers(value)
  }, 300)
})

watch(selectedCompanyId, () => {
  loadMemberships()
})

onBeforeUnmount(() => {
  window.clearTimeout(userSearchTimer)
})

onMounted(async () => {
  await Promise.all([
    loadCompanies(),
    loadUsers(),
  ])
  await loadMemberships()
})
</script>
