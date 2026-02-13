<template>
  <v-container>
    <div class="section-title">
      <h2>Produtos</h2>
    </div>

    <v-card class="staff-toolbar-card" elevation="0">
      <v-card-text class="toolbar">
        <v-text-field v-model="search" label="Buscar produto" variant="outlined" prepend-inner-icon="mdi-magnify" />
        <div class="toolbar-actions">
          <v-btn color="secondary" class="text-none" size="large" @click="openCreate">Novo produto</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="glass-card" elevation="0">
      <v-card-text>
        <v-table class="staff-table">
          <thead>
            <tr>
              <th class="text-left">Foto</th>
              <th class="text-left">Produto</th>
              <th class="text-left">Preço</th>
              <th class="text-left">Estoque</th>
              <th class="text-left">Status</th>
              <th class="text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="cell-avatar">
                  <v-img v-if="product.photo_url" :src="resolveMediaUrl(product.photo_url)" cover
                    class="cell-avatar__img" />
                  <div v-else class="cell-avatar__initials">
                    {{ product.name?.slice(0, 1) || '?' }}
                  </div>
                </div>
              </td>
              <td>
                <div class="cell-title">{{ product.name }}</div>
                <div class="text-muted line-clamp">
                  {{ product.description || 'Sem descrição' }}
                </div>
              </td>
              <td>R$ {{ Number(product.price).toFixed(2) }}</td>
              <td>{{ product.stock ?? '—' }}</td>
              <td>
                <v-chip size="small" :color="product.active ? 'success' : 'warning'" variant="tonal">
                  {{ product.active ? 'Ativo' : 'Inativo' }}
                </v-chip>
              </td>
              <td>
                <div class="row-actions">
                  <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(product)" />
                  <v-btn icon="mdi-delete-outline" variant="text" color="error" @click="askDelete(product)" />
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="!filteredProducts.length" class="empty-state">
          Nenhum produto encontrado.
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="640">
      <v-card class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ editing ? 'Editar produto' : 'Novo produto' }}</div>
            <div class="modal-subtitle">Cadastre itens para venda e vitrine.</div>
          </div>
          <v-icon icon="mdi-bottle-tonic-outline" />
        </div>
        <v-card-text class="form-grid">
          <v-text-field v-model="form.name" label="Nome" variant="outlined" />
          <v-textarea v-model="form.description" label="Descrição" variant="outlined" rows="3" />
          <div class="form-row">
            <v-text-field v-model.number="form.price" type="number" min="0" step="0.01" label="Preço" prefix="R$"
              variant="outlined" />
            <v-text-field v-model.number="form.stock" type="number" min="0" label="Estoque" variant="outlined" />
          </div>
          <v-switch v-model="form.active" color="secondary" label="Ativo" inset />
          <v-file-input v-model="photoFile" label="Foto do produto" accept="image/*" prepend-icon="mdi-image-outline"
            variant="outlined" />
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="secondary" :loading="saving" @click="saveProduct">
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card>
        <v-card-title>Excluir produto</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir <strong>{{ deleting?.name }}</strong>?
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn variant="text" @click="confirmDelete = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deletingLoading" @click="deleteProduct">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { useAlertStore } from '@/stores/alerts'

const products = ref([])
const search = ref('')
const dialog = ref(false)
const confirmDelete = ref(false)
const saving = ref(false)
const deletingLoading = ref(false)
const editing = ref(null)
const deleting = ref(null)
const photoFile = ref(null)
const alerts = useAlertStore()

const form = ref({
  name: '',
  description: '',
  price: 0,
  stock: null,
  active: true,
})

const filteredProducts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return products.value
  return products.value.filter((product) => {
    return (
      product.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    )
  })
})

const loadProducts = async () => {
  const { data } = await api.get('/api/products?include_inactive=1')
  products.value = data
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

const openCreate = () => {
  editing.value = null
  resetForm()
  dialog.value = true
}

const openEdit = (product) => {
  editing.value = product
  form.value = {
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    stock: product.stock ?? null,
    active: Boolean(product.active),
  }
  photoFile.value = null
  dialog.value = true
}

const saveProduct = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      price: Number(form.value.price),
      stock: form.value.stock === '' ? null : form.value.stock,
    }

    let productId = editing.value?.id
    if (editing.value) {
      await api.put(`/api/products/${productId}`, payload)
    } else {
      const { data } = await api.post('/api/products', payload)
      productId = data.id
    }

    if (photoFile.value && productId) {
      const file = Array.isArray(photoFile.value) ? photoFile.value[0] : photoFile.value
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        await api.post(`/api/products/${productId}/photo`, formData)
      }
    }

    alerts.success('Produto salvo com sucesso.')
    dialog.value = false
    await loadProducts()
  } finally {
    saving.value = false
  }
}

const askDelete = (product) => {
  deleting.value = product
  confirmDelete.value = true
}

const deleteProduct = async () => {
  if (!deleting.value) return
  deletingLoading.value = true
  try {
    await api.delete(`/api/products/${deleting.value.id}`)
    alerts.success('Produto removido.')
    confirmDelete.value = false
    await loadProducts()
  } finally {
    deletingLoading.value = false
  }
}

onMounted(loadProducts)
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
  background: rgba(11, 31, 36, 0.08);
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
  padding: 16px 24px 20px;
  justify-content: flex-end;
  gap: 12px;
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
  background: linear-gradient(135deg, rgba(200, 163, 90, 0.22), rgba(240, 179, 90, 0.16));
  color: #0b1f24;
  border-bottom: 1px solid rgba(11, 31, 36, 0.08);
}

.modal-title {
  font-family: var(--display-font);
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: rgba(11, 31, 36, 0.6);
  margin-top: 4px;
}

.modal-card :deep(.v-card-text) {
  padding: 20px 24px 8px;
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: rgba(11, 31, 36, 0.6);
}
</style>
