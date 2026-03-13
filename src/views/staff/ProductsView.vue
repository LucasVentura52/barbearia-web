<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Itens ativos"
          :value="`${activeProductsCount}`"
          subtitle="Produtos visíveis para venda"
          icon="mdi-basket-outline"
          color="secondary"
          :progress="products.length ? Math.round((activeProductsCount / products.length) * 100) : 0"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Alertas de estoque"
          :value="`${lowStockProducts.length}`"
          subtitle="Itens sem estoque ou abaixo do mínimo"
          icon="mdi-alert-outline"
          color="warning"
          :progress="products.length ? Math.round((lowStockProducts.length / products.length) * 100) : 0"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Valor em estoque"
          :value="formatCurrencyBRL(inventoryValue)"
          subtitle="Preço x quantidade dos itens controlados"
          icon="mdi-package-variant-closed"
          color="success"
          :progress="Math.min(100, Math.round(inventoryValue / 100))"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" xl="8">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal">
                <v-icon icon="mdi-bottle-tonic-outline" />
              </v-avatar>
            </template>
            <v-card-title>Portfólio de produtos</v-card-title>
            <v-card-subtitle>CRUD completo com foto, preço, estoque e entrada registrada.</v-card-subtitle>
            <template #append>
              <div class="d-flex flex-wrap ga-2 justify-end">
                <v-btn variant="tonal" :loading="loading" @click="loadProducts">Atualizar</v-btn>
                <v-btn color="secondary" @click="openCreate">Novo produto</v-btn>
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
                <v-chip-group v-model="stockFilter" mandatory color="secondary">
                  <v-chip value="all" filter variant="tonal">Todos</v-chip>
                  <v-chip value="available" filter variant="tonal">Com estoque</v-chip>
                  <v-chip value="low" filter variant="tonal">Baixo estoque</v-chip>
                  <v-chip value="inactive" filter variant="tonal">Inativos</v-chip>
                </v-chip-group>
              </v-col>
            </v-row>

            <v-skeleton-loader v-if="loading" type="table-heading, table-tbody" />

            <template v-else>
              <v-table v-if="mdAndUp" class="management-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th class="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in filteredProducts" :key="product.id">
                    <td>
                      <div class="d-flex align-center ga-3">
                        <v-avatar color="secondary" variant="tonal" size="44" rounded="lg">
                          <v-img v-if="product.photo_url" :src="resolveMediaUrl(product.photo_url)" cover />
                          <span v-else>{{ initials(product.name) }}</span>
                        </v-avatar>
                        <div>
                          <div class="font-weight-bold">{{ product.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ product.description || 'Sem descrição comercial.' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{{ formatCurrencyBRL(product.price) }}</td>
                    <td>
                      <v-chip :color="stockColor(product.stock)" variant="tonal" size="small">
                        {{ stockLabel(product.stock) }}
                      </v-chip>
                    </td>
                    <td>
                      <v-chip :color="product.active ? 'success' : 'warning'" variant="tonal" size="small">
                        {{ product.active ? 'Ativo' : 'Inativo' }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <v-btn icon variant="text" size="small" @click="openEdit(product)">
                        <v-icon icon="mdi-pencil-outline" />
                      </v-btn>
                      <v-btn icon variant="text" size="small" color="error" @click="askDelete(product)">
                        <v-icon icon="mdi-delete-outline" />
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-expansion-panels v-else variant="accordion">
                <v-expansion-panel
                  v-for="product in filteredProducts"
                  :key="product.id"
                  rounded="xl"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center ga-3">
                      <v-avatar color="secondary" variant="tonal" size="42" rounded="lg">
                        <v-img v-if="product.photo_url" :src="resolveMediaUrl(product.photo_url)" cover />
                        <span v-else>{{ initials(product.name) }}</span>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold">{{ product.name }}</div>
                        <div class="text-caption text-medium-emphasis">
                          {{ formatCurrencyBRL(product.price) }} · {{ stockLabel(product.stock) }}
                        </div>
                      </div>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text class="d-flex flex-column ga-3">
                    <div class="text-body-2 text-medium-emphasis">
                      {{ product.description || 'Sem descrição comercial.' }}
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                      <v-chip :color="product.active ? 'success' : 'warning'" variant="tonal" size="small">
                        {{ product.active ? 'Ativo' : 'Inativo' }}
                      </v-chip>
                      <v-chip :color="stockColor(product.stock)" variant="tonal" size="small">
                        {{ stockLabel(product.stock) }}
                      </v-chip>
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                      <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="openEdit(product)">
                        Editar
                      </v-btn>
                      <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="askDelete(product)">
                        Excluir
                      </v-btn>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <v-alert
                v-if="!filteredProducts.length"
                color="warning"
                icon="mdi-information-outline"
                variant="tonal"
              >
                Nenhum produto encontrado para o filtro atual.
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
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-warehouse" />
                </v-avatar>
              </template>
              <v-card-title>Baixo estoque</v-card-title>
              <v-card-subtitle>Itens que pedem reposição prioritária.</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <v-list v-if="lowStockProducts.length" class="bg-transparent">
                <v-list-item
                  v-for="product in lowStockProducts.slice(0, 6)"
                  :key="product.id"
                  :title="product.name"
                  :subtitle="formatCurrencyBRL(product.price)"
                >
                  <template #append>
                    <v-chip :color="stockColor(product.stock)" variant="tonal" size="small">
                      {{ stockLabel(product.stock) }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert v-else color="success" variant="tonal" icon="mdi-check-circle-outline">
                Nenhum alerta de estoque no momento.
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="mdi-clipboard-list-outline" />
                </v-avatar>
              </template>
              <v-card-title>Operação de estoque</v-card-title>
              <v-card-subtitle>O histórico de entrada é registrado na API real.</v-card-subtitle>
            </v-card-item>
            <v-card-text class="d-flex flex-column ga-3">
              <v-alert color="secondary" variant="tonal" icon="mdi-package-variant-plus">
                Use "Entrada de estoque" dentro do produto para lançar fornecedor, data e quantidade.
              </v-alert>
              <v-alert color="info" variant="tonal" icon="mdi-camera-outline">
                Fotos de produto também são enviadas para o backend e refletidas na vitrine.
              </v-alert>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="760">
      <v-card>
        <v-card-item>
          <template #prepend>
            <v-avatar color="secondary" variant="tonal">
              <v-icon icon="mdi-bottle-tonic-outline" />
            </v-avatar>
          </template>
          <v-card-title>{{ editing ? 'Editar produto' : 'Novo produto' }}</v-card-title>
          <v-card-subtitle>Cadastre item comercial, foto e controle de estoque.</v-card-subtitle>
        </v-card-item>
        <v-divider />
        <v-card-text class="d-flex flex-column ga-4">
          <v-text-field v-model="form.name" label="Nome do produto" />
          <v-textarea v-model="form.description" label="Descrição" rows="3" auto-grow />
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.price"
                label="Preço"
                type="number"
                min="0"
                step="0.01"
                prefix="R$"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.stock"
                label="Estoque atual"
                type="number"
                min="0"
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-btn
                block
                variant="tonal"
                color="secondary"
                prepend-icon="mdi-package-variant-plus"
                :disabled="!editing?.id"
                @click="openStockEntryDialog"
              >
                Entrada de estoque
              </v-btn>
            </v-col>
          </v-row>
          <v-file-input
            v-model="photoFile"
            label="Foto do produto"
            accept="image/*"
            prepend-icon="mdi-camera-outline"
            chips
            show-size
          />
          <v-switch v-model="form.active" color="secondary" label="Produto ativo" inset hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Fechar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveProduct">Salvar produto</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="stockDialog" max-width="560">
      <v-card>
        <v-card-item>
          <v-card-title>Entrada de estoque</v-card-title>
          <v-card-subtitle>{{ editing?.name || 'Produto selecionado' }}</v-card-subtitle>
        </v-card-item>
        <v-card-text class="d-flex flex-column ga-4">
          <v-text-field v-model="stockEntryForm.supplier" label="Fornecedor" />
          <v-text-field v-model="stockEntryForm.entry_date" label="Data da entrada" type="date" />
          <v-text-field
            v-model.number="stockEntryForm.quantity"
            label="Quantidade"
            type="number"
            min="1"
          />
          <v-textarea
            v-model="stockEntryForm.notes"
            label="Observações"
            rows="3"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="stockDialog = false">Cancelar</v-btn>
          <v-btn color="secondary" :loading="savingStockEntry" @click="saveStockEntry">
            Confirmar entrada
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card>
        <v-card-item>
          <v-card-title>Excluir produto</v-card-title>
          <v-card-subtitle>Essa ação remove o item do catálogo.</v-card-subtitle>
        </v-card-item>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deletingLoading" @click="deleteProduct">Excluir</v-btn>
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

const products = ref([])
const loading = ref(false)
const saving = ref(false)
const savingStockEntry = ref(false)
const deletingLoading = ref(false)
const search = ref('')
const stockFilter = ref('all')
const dialog = ref(false)
const stockDialog = ref(false)
const deleteDialog = ref(false)
const editing = ref(null)
const deleting = ref(null)
const photoFile = ref(null)
const form = ref({
  name: '',
  description: '',
  price: 0,
  stock: null,
  active: true,
})
const stockEntryForm = ref({
  supplier: '',
  entry_date: '',
  quantity: 1,
  notes: '',
})

const activeProductsCount = computed(() => products.value.filter((product) => product.active).length)
const inventoryValue = computed(() =>
  products.value.reduce((sum, product) => {
    const stock = Number(product.stock)
    if (!Number.isFinite(stock) || stock <= 0) return sum
    return sum + Number(product.price || 0) * stock
  }, 0)
)
const lowStockProducts = computed(() =>
  products.value.filter((product) => {
    if (!product.active) return false
    const stock = Number(product.stock)
    if (!Number.isFinite(stock)) return false
    return stock <= 5
  })
)
const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const matchesTerm =
      !term ||
      String(product.name || '').toLowerCase().includes(term) ||
      String(product.description || '').toLowerCase().includes(term)

    const stock = Number(product.stock)
    const hasFiniteStock = Number.isFinite(stock)

    const matchesFilter =
      stockFilter.value === 'all' ||
      (stockFilter.value === 'available' && hasFiniteStock && stock > 0 && product.active) ||
      (stockFilter.value === 'low' && hasFiniteStock && stock <= 5 && product.active) ||
      (stockFilter.value === 'inactive' && !product.active)

    return matchesTerm && matchesFilter
  })
})

const initials = (value) =>
  String(value || 'PD')
    .split(' ')
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

const resolveSelectedFile = (value) => {
  if (Array.isArray(value)) return value[0] || null
  return value || null
}

const stockLabel = (stockValue) => {
  const stock = Number(stockValue)
  if (!Number.isFinite(stock)) return 'Sem controle'
  if (stock <= 0) return 'Sem estoque'
  return `${stock} un`
}

const stockColor = (stockValue) => {
  const stock = Number(stockValue)
  if (!Number.isFinite(stock)) return 'secondary'
  if (stock <= 0) return 'error'
  if (stock <= 5) return 'warning'
  return 'success'
}

const todayDate = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    price: 0,
    stock: null,
    active: true,
  }
  photoFile.value = null
}

const resetStockEntryForm = () => {
  stockEntryForm.value = {
    supplier: '',
    entry_date: todayDate(),
    quantity: 1,
    notes: '',
  }
}

const loadProducts = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/products', {
      params: {
        include_inactive: 1,
      },
    })
    products.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = null
  resetForm()
  resetStockEntryForm()
  dialog.value = true
}

const openEdit = (product) => {
  editing.value = product
  form.value = {
    name: product.name || '',
    description: product.description || '',
    price: Number(product.price || 0),
    stock: product.stock === null || product.stock === undefined ? null : Number(product.stock),
    active: Boolean(product.active),
  }
  photoFile.value = null
  resetStockEntryForm()
  dialog.value = true
}

const askDelete = (product) => {
  deleting.value = product
  deleteDialog.value = true
}

const openStockEntryDialog = () => {
  if (!editing.value?.id) {
    ui.notify('Salve o produto primeiro para registrar entradas.', 'warning')
    return
  }
  resetStockEntryForm()
  stockDialog.value = true
}

const uploadPhoto = async (productId) => {
  const file = resolveSelectedFile(photoFile.value)
  if (!file || !productId) return

  const formData = new FormData()
  formData.append('file', file)
  await api.post(`/api/products/${productId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

const saveProduct = async () => {
  if (!String(form.value.name || '').trim()) {
    ui.notify('Informe o nome do produto.', 'warning')
    return
  }

  if (!Number.isFinite(Number(form.value.price)) || Number(form.value.price) < 0) {
    ui.notify('Informe um preço válido.', 'warning')
    return
  }

  const normalizedStock =
    form.value.stock === '' || form.value.stock === null || form.value.stock === undefined
      ? null
      : Number(form.value.stock)

  if (normalizedStock !== null && (!Number.isInteger(normalizedStock) || normalizedStock < 0)) {
    ui.notify('Informe um estoque inteiro válido.', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: String(form.value.name).trim(),
      description: String(form.value.description || '').trim() || null,
      price: Number(form.value.price),
      stock: normalizedStock,
      active: Boolean(form.value.active),
    }

    let productId = editing.value?.id

    if (editing.value) {
      await api.put(`/api/products/${productId}`, payload)
    } else {
      const { data } = await api.post('/api/products', payload)
      productId = data?.id
    }

    await uploadPhoto(productId)

    dialog.value = false
    ui.notify(editing.value ? 'Produto atualizado.' : 'Produto criado.', 'success')
    await loadProducts()
  } finally {
    saving.value = false
  }
}

const saveStockEntry = async () => {
  if (!editing.value?.id) return

  const quantity = Number(stockEntryForm.value.quantity)
  if (!String(stockEntryForm.value.supplier || '').trim()) {
    ui.notify('Informe o fornecedor.', 'warning')
    return
  }
  if (!String(stockEntryForm.value.entry_date || '').trim()) {
    ui.notify('Informe a data da entrada.', 'warning')
    return
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    ui.notify('Informe uma quantidade válida.', 'warning')
    return
  }

  savingStockEntry.value = true
  try {
    const { data } = await api.post(`/api/products/${editing.value.id}/stock-entries`, {
      supplier: String(stockEntryForm.value.supplier).trim(),
      entry_date: String(stockEntryForm.value.entry_date).trim(),
      quantity,
      notes: String(stockEntryForm.value.notes || '').trim() || null,
    })

    const nextStock = Number(data?.product?.stock)
    if (Number.isFinite(nextStock)) {
      form.value.stock = nextStock
    }

    stockDialog.value = false
    ui.notify('Entrada de estoque registrada.', 'success')
    await loadProducts()
  } finally {
    savingStockEntry.value = false
  }
}

const deleteProduct = async () => {
  if (!deleting.value?.id) return

  deletingLoading.value = true
  try {
    await api.delete(`/api/products/${deleting.value.id}`)
    deleteDialog.value = false
    ui.notify('Produto excluído.', 'success')
    await loadProducts()
  } finally {
    deletingLoading.value = false
  }
}

onMounted(loadProducts)
</script>
