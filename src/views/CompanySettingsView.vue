<template>
  <div class="d-flex flex-column ga-6">
    <v-row>
      <v-col cols="12" md="4">
        <metric-card
          title="Envio"
          :value="form.active ? 'Ativo' : 'Desligado'"
          subtitle="Status do envio transacional da empresa"
          icon="mdi-email-fast-outline"
          color="secondary"
          :progress="form.active ? 100 : 18"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Senha app"
          :value="form.has_password ? 'Configurada' : 'Pendente'"
          subtitle="Credencial Gmail salva no backend"
          icon="mdi-lock-check-outline"
          color="primary"
          :progress="form.has_password ? 100 : 25"
        />
      </v-col>
      <v-col cols="12" md="4">
        <metric-card
          title="Remetente"
          :value="senderMetricValue"
          subtitle="Conta usada para notificacoes da empresa"
          icon="mdi-account-voice"
          color="success"
          :progress="form.gmail_email ? 100 : 20"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" xl="8">
        <v-card class="glass-panel">
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary" variant="tonal">
                <v-icon icon="mdi-office-building-cog-outline" />
              </v-avatar>
            </template>
            <v-card-title>Email da empresa</v-card-title>
            <v-card-subtitle>{{ companyName }}</v-card-subtitle>
            <template #append>
              <v-btn variant="tonal" :loading="loading" @click="loadSettings">Recarregar</v-btn>
            </template>
          </v-card-item>

          <v-card-text class="d-flex flex-column ga-4">
            <v-alert color="info" variant="tonal" icon="mdi-gmail">
              O backend atual suporta o provedor <strong>Gmail SMTP</strong> com host, porta e criptografia padronizados.
            </v-alert>

            <v-skeleton-loader v-if="loading" type="article, actions" />

            <template v-else>
              <v-row>
                <v-col cols="12" md="4">
                  <v-switch v-model="form.active" color="secondary" label="Ativar envio" inset hide-details />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.from_name"
                    label="Nome remetente"
                    prepend-inner-icon="mdi-account-outline"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.gmail_email"
                    label="Email Gmail"
                    prepend-inner-icon="mdi-email-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.smtp_password"
                    :label="form.has_password ? 'Nova senha de app (opcional)' : 'Senha de app Gmail'"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="testTo"
                    label="Email para teste (opcional)"
                    prepend-inner-icon="mdi-send-outline"
                  />
                </v-col>
              </v-row>

              <v-card variant="outlined" class="pa-4">
                <div class="text-subtitle-1 font-weight-bold mb-3">Conexao aplicada</div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip color="secondary" variant="tonal">Gmail SMTP</v-chip>
                  <v-chip color="primary" variant="tonal">{{ form.smtp_host }}</v-chip>
                  <v-chip color="primary" variant="tonal">Porta {{ form.smtp_port }}</v-chip>
                  <v-chip color="primary" variant="tonal">{{ form.smtp_encryption?.toUpperCase() }}</v-chip>
                </div>
              </v-card>
            </template>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="outlined"
              color="secondary"
              :loading="testing"
              :disabled="saving || loading"
              @click="sendTest"
            >
              Enviar teste
            </v-btn>
            <v-btn
              color="secondary"
              :loading="saving"
              :disabled="testing || loading"
              @click="saveSettings"
            >
              Salvar configuracoes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <div class="d-flex flex-column ga-6 management-side-card">
          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="mdi-check-decagram-outline" />
                </v-avatar>
              </template>
              <v-card-title>Checklist rapido</v-card-title>
              <v-card-subtitle>Validacao minima antes de disparar notificacoes.</v-card-subtitle>
            </v-card-item>
            <v-card-text class="d-flex flex-column ga-3">
              <v-alert color="secondary" variant="tonal" icon="mdi-form-select">
                Preencha nome remetente e email Gmail da empresa.
              </v-alert>
              <v-alert color="warning" variant="tonal" icon="mdi-lock-outline">
                No primeiro cadastro, a senha de app Gmail e obrigatoria.
              </v-alert>
              <v-alert color="success" variant="tonal" icon="mdi-email-check-outline">
                Depois de salvar, envie um email de teste para validar a conta.
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card class="glass-panel">
            <v-card-item>
              <template #prepend>
                <v-avatar color="warning" variant="tonal">
                  <v-icon icon="mdi-help-circle-outline" />
                </v-avatar>
              </template>
              <v-card-title>Como configurar</v-card-title>
              <v-card-subtitle>Guia curto para Gmail SMTP.</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel rounded="xl">
                  <v-expansion-panel-title>1. Ative a verificacao em 2 etapas</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    A conta Gmail precisa ter 2FA ativo para liberar senha de app.
                  </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel rounded="xl">
                  <v-expansion-panel-title>2. Gere a senha de app</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    No Google Account, abra Seguranca, gere uma senha de app e use esse valor no formulario.
                  </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel rounded="xl">
                  <v-expansion-panel-title>3. Salve e teste</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    Salve os dados da empresa e dispare um email de teste para confirmar a configuracao.
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const company = useCompanyStore()
const ui = useUiStore()

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const showPassword = ref(false)
const testTo = ref('')
const form = ref({
  active: false,
  from_name: '',
  gmail_email: '',
  smtp_password: '',
  has_password: false,
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_encryption: 'tls',
})

const companyName = computed(() => company.currentCompany?.name || auth.user?.company?.name || 'Empresa atual')
const senderMetricValue = computed(() => form.value.gmail_email || 'Pendente')

const loadSettings = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/company/mail-settings')
    const setting = data?.setting || {}
    form.value = {
      active: Boolean(setting.active),
      from_name: setting.from_name || '',
      gmail_email: setting.smtp_username || setting.from_email || '',
      smtp_password: '',
      has_password: Boolean(setting.has_password),
      smtp_host: setting.smtp_host || 'smtp.gmail.com',
      smtp_port: Number(setting.smtp_port || 587),
      smtp_encryption: setting.smtp_encryption || 'tls',
    }
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  const fromName = String(form.value.from_name || '').trim()
  const gmailEmail = String(form.value.gmail_email || '').trim()
  const password = String(form.value.smtp_password || '').trim()

  if (!fromName) {
    ui.notify('Informe o nome remetente.', 'warning')
    return
  }

  if (!gmailEmail) {
    ui.notify('Informe o email Gmail.', 'warning')
    return
  }

  if (!form.value.has_password && !password) {
    ui.notify('Informe a senha de app Gmail no primeiro cadastro.', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      active: Boolean(form.value.active),
      provider: 'gmail_smtp',
      from_name: fromName,
      from_email: gmailEmail,
      smtp_username: gmailEmail,
    }

    if (password) {
      payload.smtp_password = password
    }

    const { data } = await api.put('/api/company/mail-settings', payload)
    form.value.smtp_password = ''
    form.value.has_password = Boolean(data?.setting?.has_password)
    ui.notify(data?.message || 'Configuracoes salvas.', 'success')
  } finally {
    saving.value = false
  }
}

const sendTest = async () => {
  testing.value = true
  try {
    const payload = {}
    const to = String(testTo.value || '').trim()
    if (to) {
      payload.to_email = to
    }

    const { data } = await api.post('/api/company/mail-settings/test', payload)
    ui.notify(data?.message || 'Email de teste enviado.', 'success')
  } finally {
    testing.value = false
  }
}

onMounted(loadSettings)
</script>
