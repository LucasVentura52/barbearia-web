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
                <th class="text-left">Status</th>
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
                  <div class="status-chips">
                    <v-chip size="x-small" variant="tonal" color="primary">Ag {{ client.scheduled_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="success">Ok {{ client.done_count }}</v-chip>
                    <v-chip size="x-small" variant="tonal" color="error">Can {{ client.canceled_count }}</v-chip>
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
  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import api from '@/lib/api'
import { formatPhoneFromE164 } from '@/lib/phone'
import { resolveMediaUrl } from '@/lib/media'
import { formatCurrencyBRL } from '@/lib/currency'

const clients = ref([])
const search = ref('')
const loading = ref(false)
const { smAndDown } = useDisplay()

let searchTimer = null
let activeController = null
let requestCounter = 0

const isRequestCanceled = (error) => error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'

const loadClients = async () => {
  const requestId = ++requestCounter
  activeController?.abort()
  const controller = new AbortController()
  activeController = controller

  loading.value = true
  try {
    const params = { limit: 150 }
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
    throw error
  } finally {
    if (requestId === requestCounter) {
      loading.value = false
    }
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

@media (max-width: 960px) {
  .clients-search {
    min-width: 100%;
  }
}
</style>
