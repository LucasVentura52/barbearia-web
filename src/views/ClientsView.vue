<template>
  <v-row class="mb-6">
    <v-col cols="12" xl="8">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-account-group-outline" />
            </v-avatar>
          </template>
          <v-card-title>Base de clientes</v-card-title>
          <v-card-subtitle>Pesquisa, leitura comercial e edição básica em cima da API real.</v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="7">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Buscar cliente por nome, email ou telefone"
              />
            </v-col>
            <v-col cols="12" md="5" class="d-flex align-center">
              <v-chip-group v-model="statusFilter" mandatory color="secondary">
                <v-chip value="all" filter variant="tonal">Todos</v-chip>
                <v-chip value="active" filter variant="tonal">Ativos</v-chip>
                <v-chip value="inactive" filter variant="tonal">Inativos</v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12">
              <v-btn color="secondary" :loading="loading" @click="loadClients">
                Atualizar lista
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" xl="4">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="accent" variant="tonal">
              <v-icon icon="mdi-briefcase-account-outline" />
            </v-avatar>
          </template>
          <v-card-title>Leitura comercial</v-card-title>
          <v-card-subtitle>Esses números vêm do relacionamento já consolidado na API.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          <v-alert icon="mdi-currency-brl" color="secondary">
            Receita acumulada da lista: {{ formatCurrencyBRL(totalRevenue) }}.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-row class="mb-6">
    <v-col v-for="metric in metrics" :key="metric.title" cols="12" md="4">
      <metric-card v-bind="metric" />
    </v-col>
  </v-row>

  <v-row>
    <v-col cols="12" xl="8">
      <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="mdi-table-account" />
              </v-avatar>
            </template>
          <v-card-title>Clientes do contexto atual</v-card-title>
          <v-card-subtitle>Filtre ativos e inativos. Clique na linha para ver detalhes.</v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-table class="client-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Último atendimento</th>
                <th>Status</th>
                <th class="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="client in filteredClients"
                :key="client.id"
                @click="openDetails(client)"
              >
                <td>
                  <div class="d-flex align-center ga-3">
                    <v-avatar color="secondary" variant="tonal">
                      <v-img v-if="client.avatar_url" :src="resolveMediaUrl(client.avatar_url)" cover />
                      <span v-else>{{ initials(client.name) }}</span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-bold">{{ client.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ client.email || 'Sem e-mail' }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ formatPhoneFromE164(client.phone) || 'Sem telefone' }}</td>
                <td>{{ formatDateTime(client.last_appointment_at) }}</td>
                <td>
                  <v-chip :color="client.active ? 'success' : 'warning'" variant="tonal">
                    {{ client.active ? 'Ativo' : 'Inativo' }}
                  </v-chip>
                </td>
                <td class="text-right">
                  <v-btn icon variant="text" size="small" @click.stop="openEdit(client)">
                    <v-icon icon="mdi-pencil-outline" />
                  </v-btn>
                  <v-btn icon variant="text" size="small" color="warning" @click.stop="toggleActive(client)">
                    <v-icon icon="mdi-power" />
                  </v-btn>
                  <v-btn icon variant="text" size="small" color="error" @click.stop="askDelete(client)">
                    <v-icon icon="mdi-delete-outline" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert
            v-if="!filteredClients.length && !loading"
            icon="mdi-account-search-outline"
            color="warning"
            class="mt-4"
          >
            Nenhum cliente encontrado para a busca atual.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" xl="4">
      <v-card class="glass-panel h-100">
        <v-card-item>
          <template #prepend>
            <v-avatar color="success" variant="tonal">
              <v-icon icon="mdi-format-list-bulleted-square" />
            </v-avatar>
          </template>
          <v-card-title>Top recorrência</v-card-title>
          <v-card-subtitle>Visão rápida dos clientes mais presentes na lista filtrada.</v-card-subtitle>
        </v-card-item>

        <v-card-text>
          <v-list v-if="topRecurring.length" class="bg-transparent">
            <v-list-item
              v-for="client in topRecurring"
              :key="client.id"
              :title="client.name"
              :subtitle="`${client.appointments_total} atendimentos`"
            >
              <template #append>
                <v-chip color="secondary" variant="tonal">{{ formatCurrencyBRL(client.total_spent) }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-alert v-else icon="mdi-information-outline" color="warning">
            Sem dados de recorrência para exibir.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="detailsDialog" max-width="760">
    <v-card v-if="selectedClient">
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal" size="56">
            <v-img v-if="selectedClient.avatar_url" :src="resolveMediaUrl(selectedClient.avatar_url)" cover />
            <span v-else>{{ initials(selectedClient.name) }}</span>
          </v-avatar>
        </template>
        <v-card-title>{{ selectedClient.name }}</v-card-title>
        <v-card-subtitle>
          {{ selectedClient.email || formatPhoneFromE164(selectedClient.phone) || 'Sem contato cadastrado' }}
        </v-card-subtitle>
        <template #append>
          <v-chip :color="selectedClient.active ? 'success' : 'warning'" variant="tonal">
            {{ selectedClient.active ? 'Ativo' : 'Inativo' }}
          </v-chip>
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text class="d-flex flex-column ga-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-sheet rounded="xl" color="surface-variant" class="pa-4 h-100">
              <div class="text-overline">Atendimentos</div>
              <div class="text-h4 font-weight-black">{{ selectedClient.appointments_total }}</div>
              <div class="text-body-2 text-medium-emphasis">Histórico total desse cliente na empresa.</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" md="4">
            <v-sheet rounded="xl" color="surface-variant" class="pa-4 h-100">
              <div class="text-overline">Total gasto</div>
              <div class="text-h5 font-weight-black">{{ formatCurrencyBRL(selectedClient.total_spent) }}</div>
              <div class="text-body-2 text-medium-emphasis">Receita acumulada gerada por esse cadastro.</div>
            </v-sheet>
          </v-col>
          <v-col cols="12" md="4">
            <v-sheet rounded="xl" color="surface-variant" class="pa-4 h-100">
              <div class="text-overline">Último atendimento</div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ formatDateTime(selectedClient.last_appointment_at) }}
              </div>
              <div class="text-body-2 text-medium-emphasis">Última movimentação encontrada na agenda.</div>
            </v-sheet>
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2">
          <v-chip color="primary" variant="tonal">Agendados {{ selectedClient.scheduled_count }}</v-chip>
          <v-chip color="success" variant="tonal">Concluídos {{ selectedClient.done_count }}</v-chip>
          <v-chip color="warning" variant="tonal">Cancelados {{ selectedClient.canceled_count }}</v-chip>
          <v-chip color="error" variant="tonal">No-show {{ selectedClient.no_show_count }}</v-chip>
        </div>

        <v-list class="bg-transparent" lines="two">
          <v-list-item
            title="Telefone"
            :subtitle="formatPhoneFromE164(selectedClient.phone) || 'Sem telefone cadastrado'"
            prepend-icon="mdi-phone-outline"
          />
          <v-list-item
            title="E-mail"
            :subtitle="selectedClient.email || 'Sem e-mail cadastrado'"
            prepend-icon="mdi-email-outline"
          />
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="detailsDialog = false">Fechar</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEditFromDetails">
          Editar
        </v-btn>
        <v-btn variant="text" color="warning" prepend-icon="mdi-power" @click="toggleActive(selectedClient)">
          {{ selectedClient.active ? 'Inativar' : 'Reativar' }}
        </v-btn>
        <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDeleteFromDetails">
          Excluir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialog" max-width="620">
    <v-card>
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal">
            <span>{{ initials(form.name || 'Cliente') }}</span>
          </v-avatar>
        </template>
        <v-card-title>Editar cliente</v-card-title>
        <v-card-subtitle>Ajuste dados básicos e status.</v-card-subtitle>
      </v-card-item>

      <v-divider />

      <v-card-text class="d-flex flex-column ga-4">
        <v-text-field v-model="form.name" label="Nome" />

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
              type="tel"
              maxlength="15"
            />
          </v-col>
        </v-row>

        <v-text-field v-model="form.email" label="E-mail" />
        <v-file-input
          v-model="form.photo"
          label="Foto do cliente"
          accept="image/*"
          prepend-icon="mdi-camera-outline"
          chips
          show-size
        />
        <v-switch v-model="form.active" color="secondary" label="Cliente ativo" inset hide-details />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Fechar</v-btn>
        <v-btn color="secondary" :loading="saving" @click="saveClient">Salvar alterações</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="460">
    <v-card>
      <v-card-item>
        <v-card-title>Excluir cliente</v-card-title>
        <v-card-subtitle>Essa ação remove o vínculo do cliente com a empresa atual.</v-card-subtitle>
      </v-card-item>
      <v-card-text>
        Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
        <v-btn color="error" :loading="deletingLoading" @click="deleteClient">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/lib/api'
import { formatCurrencyBRL } from '@/lib/currency'
import { formatDateTime } from '@/lib/dates'
import { resolveMediaUrl } from '@/lib/media'
import { buildE164, formatPhone, formatPhoneFromE164, normalizePhone } from '@/lib/phone'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const loading = ref(false)
const saving = ref(false)
const deletingLoading = ref(false)
const search = ref('')
const statusFilter = ref('active')
const clients = ref([])
const detailsDialog = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const selectedClient = ref(null)
const deleting = ref(null)
const form = ref({
  id: null,
  name: '',
  country: '55',
  phone: '',
  email: '',
  active: true,
  photo: null,
})

const countryOptions = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '1', label: 'EUA (+1)' },
  { code: '351', label: 'Portugal (+351)' },
]

const filteredClients = computed(() =>
  clients.value.filter((client) => {
    if (statusFilter.value === 'active') return client.active
    if (statusFilter.value === 'inactive') return !client.active
    return true
  })
)

const totalRevenue = computed(() =>
  filteredClients.value.reduce((sum, client) => sum + Number(client.total_spent || 0), 0)
)

const activeClients = computed(() => filteredClients.value.filter((client) => client.active).length)
const returnCustomers = computed(() =>
  filteredClients.value.filter((client) => Number(client.done_count || 0) >= 2).length
)
const topRecurring = computed(() =>
  [...filteredClients.value]
    .sort((left, right) => Number(right.appointments_total || 0) - Number(left.appointments_total || 0))
    .slice(0, 6)
)

const metrics = computed(() => [
  {
    title: 'Clientes ativos',
    value: `${activeClients.value}`,
    subtitle: `${filteredClients.value.length} no filtro atual`,
    icon: 'mdi-account-check-outline',
    color: 'success',
    progress: filteredClients.value.length ? Math.round((activeClients.value / filteredClients.value.length) * 100) : 0,
  },
  {
    title: 'Receita acumulada',
    value: formatCurrencyBRL(totalRevenue.value),
    subtitle: 'Somando gasto total do filtro',
    icon: 'mdi-cash-multiple',
    color: 'secondary',
    progress: Math.min(100, Math.round(totalRevenue.value / 100)),
  },
  {
    title: 'Recorrentes',
    value: `${returnCustomers.value}`,
    subtitle: 'Com 2 ou mais atendimentos concluídos',
    icon: 'mdi-account-convert-outline',
    color: 'primary',
    progress: filteredClients.value.length
      ? Math.round((returnCustomers.value / filteredClients.value.length) * 100)
      : 0,
  },
])

const phoneInput = computed({
  get: () => formatPhone(form.value.phone, form.value.country),
  set: (value) => {
    form.value.phone = normalizePhone(value, form.value.country)
  },
})

const parsePhoneForForm = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 2) {
    return {
      country: '55',
      phone: digits.slice(2),
    }
  }

  return {
    country: '55',
    phone: digits,
  }
}

const initials = (name) =>
  String(name || 'CL')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

const resolveSelectedFile = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const syncSelectedClient = () => {
  if (!selectedClient.value?.id) return

  const freshClient = clients.value.find((client) => Number(client.id) === Number(selectedClient.value.id))
  if (freshClient) {
    selectedClient.value = freshClient
    return
  }

  selectedClient.value = null
  detailsDialog.value = false
}

const loadClients = async () => {
  loading.value = true

  try {
    const { data } = await api.get('/api/staff/clients', {
      params: {
        search: search.value || undefined,
        include_inactive: 1,
        limit: 120,
      },
    })
    clients.value = Array.isArray(data) ? data : []
    syncSelectedClient()
  } finally {
    loading.value = false
  }
}

const openDetails = (client) => {
  selectedClient.value = client
  detailsDialog.value = true
}

const openEdit = (client) => {
  selectedClient.value = client
  const phone = parsePhoneForForm(client.phone)
  form.value = {
    id: client.id,
    name: client.name || '',
    country: phone.country,
    phone: phone.phone,
    email: client.email || '',
    active: Boolean(client.active),
    photo: null,
  }
  dialog.value = true
}

const openEditFromDetails = () => {
  if (!selectedClient.value) return
  detailsDialog.value = false
  openEdit(selectedClient.value)
}

const saveClient = async () => {
  if (!form.value.id) return

  saving.value = true
  try {
    await api.put(`/api/staff/clients/${form.value.id}`, {
      name: form.value.name,
      phone: buildE164(form.value.country, form.value.phone),
      email: form.value.email || null,
      active: form.value.active,
    })

    const photoFile = resolveSelectedFile(form.value.photo)
    if (photoFile) {
      const formData = new FormData()
      formData.append('file', photoFile)
      await api.post(`/api/staff/clients/${form.value.id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    }

    ui.notify('Cliente atualizado.', 'success')
    dialog.value = false
    await loadClients()
  } finally {
    saving.value = false
  }
}

const askDelete = (client) => {
  deleting.value = client
  deleteDialog.value = true
}

const askDeleteFromDetails = () => {
  if (!selectedClient.value) return
  detailsDialog.value = false
  askDelete(selectedClient.value)
}

const toggleActive = async (client) => {
  await api.put(`/api/staff/clients/${client.id}`, {
    active: !client.active,
  })
  ui.notify(`Cliente ${client.active ? 'inativado' : 'reativado'}.`, 'success')
  await loadClients()
}

const deleteClient = async () => {
  if (!deleting.value?.id) return

  deletingLoading.value = true
  try {
    await api.delete(`/api/staff/clients/${deleting.value.id}`)
    if (Number(selectedClient.value?.id) === Number(deleting.value.id)) {
      selectedClient.value = null
      detailsDialog.value = false
    }
    ui.notify('Cliente excluído.', 'success')
    deleteDialog.value = false
    deleting.value = null
    await loadClients()
  } finally {
    deletingLoading.value = false
  }
}

let searchTimer = null
watch(search, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    loadClients()
  }, 350)
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
})

onMounted(loadClients)
</script>
