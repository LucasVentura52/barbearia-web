<template>
  <v-container fluid class="login-shell pa-0">
    <v-row class="ma-0 fill-height" align="center" justify="center">
      <v-col cols="12" sm="11" md="10" lg="9" xl="8">
        <v-card class="glass-card overflow-hidden" rounded="xl" elevation="6">
          <v-row no-gutters>
            <v-col cols="12" md="7">
              <v-card-text :class="formPaddingClass">
                <v-card-item class="px-0 pt-0 pb-3">
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" size="44" class="me-3">
                      <v-icon icon="mdi-account-lock-outline" />
                    </v-avatar>
                  </template>
                  <v-card-title class="text-h5 text-sm-h4">Entrar na plataforma</v-card-title>
                  <v-card-subtitle class="text-wrap text-body-2">
                    Use seu telefone e senha para acessar. Cadastro disponível apenas para clientes.
                  </v-card-subtitle>
                </v-card-item>

                <CompanySwitcher :reload-on-change="false" class="mb-5" />

                <v-tabs v-model="tab" color="primary" grow  class="mb-4">
                  <v-tab value="login" prepend-icon="mdi-login">Login</v-tab>
                  <v-tab value="register" prepend-icon="mdi-account-plus-outline">Cadastrar conta</v-tab>
                </v-tabs>

                <v-window v-model="tab" :touch="false">
                  <v-window-item value="login">
                    <v-form @submit.prevent="handleLogin">
                      <v-alert v-if="loginErrors._form" type="error" variant="tonal" class="mb-4" >
                        {{ loginErrors._form[0] }}
                      </v-alert>

                      <v-row dense class="mt-1">
                        <v-col cols="12" sm="4">
                          <v-select v-model="loginForm.country" :items="countryOptions" item-title="label"
                            item-value="code" label="País" variant="outlined" 
                            hide-details="auto" />
                        </v-col>
                        <v-col cols="12" sm="8" class="mt-3 mt-sm-0">
                          <v-text-field v-model="loginPhone" label="Telefone" placeholder="(11) 99999-9999"
                            variant="outlined"  prepend-inner-icon="mdi-phone-outline" type="tel"
                            maxlength="15" :error-messages="loginErrors.phone" required />
                        </v-col>
                      </v-row>

                      <v-text-field v-model="loginForm.password" label="Senha"
                        :type="showLoginPassword ? 'text' : 'password'" variant="outlined" 
                        prepend-inner-icon="mdi-lock-outline"
                        :append-inner-icon="showLoginPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        :error-messages="loginErrors.password" required
                        @click:append-inner="showLoginPassword = !showLoginPassword" />

                      <v-btn color="primary" size="large" type="submit" :loading="loading" block>
                        Entrar
                      </v-btn>
                    </v-form>
                  </v-window-item>

                  <v-window-item value="register">
                    <v-form @submit.prevent="handleRegister">
                      <v-alert v-if="registerErrors._form" type="error" variant="tonal" class="mb-4"
                        >
                        {{ registerErrors._form[0] }}
                      </v-alert>

                      <v-text-field v-model="registerForm.name" class="mt-1" label="Nome" variant="outlined"
                         prepend-inner-icon="mdi-account-outline"
                        :error-messages="registerErrors.name" required />

                      <v-row dense>
                        <v-col cols="12" sm="4">
                          <v-select v-model="registerForm.country" :items="countryOptions" item-title="label"
                            item-value="code" label="País" variant="outlined" 
                            hide-details="auto" />
                        </v-col>
                        <v-col cols="12" sm="8" class="mt-3 mt-sm-0">
                          <v-text-field v-model="registerPhone" label="Telefone" placeholder="(11) 99999-9999"
                            variant="outlined"  prepend-inner-icon="mdi-phone-outline" type="tel"
                            maxlength="15" :error-messages="registerErrors.phone" required />
                        </v-col>
                      </v-row>

                      <v-text-field v-model="registerForm.email" label="Email (opcional)" variant="outlined"
                         prepend-inner-icon="mdi-email-outline"
                        :error-messages="registerErrors.email" />

                      <v-text-field v-model="registerForm.password" label="Senha"
                        :type="showRegisterPassword ? 'text' : 'password'" variant="outlined" 
                        prepend-inner-icon="mdi-lock-outline"
                        :append-inner-icon="showRegisterPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        :error-messages="registerErrors.password" required
                        @click:append-inner="showRegisterPassword = !showRegisterPassword" />

                      <v-text-field v-model="registerForm.confirm" label="Confirmar senha"
                        :type="showRegisterConfirm ? 'text' : 'password'" variant="outlined" 
                        prepend-inner-icon="mdi-lock-check-outline"
                        :append-inner-icon="showRegisterConfirm ? 'mdi-eye-off' : 'mdi-eye'"
                        :error-messages="registerErrors.confirm" required
                        @click:append-inner="showRegisterConfirm = !showRegisterConfirm" />

                      <v-btn color="primary" size="large" type="submit" :loading="loading" block>
                        Criar conta
                      </v-btn>
                    </v-form>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-col>

            <v-col cols="12" md="5">
              <v-sheet class="login-aside h-100" :class="asidePaddingClass" rounded="0">
                <v-chip color="white" variant="tonal" size="small" class="mb-4">
                  Experiência premium
                </v-chip>

                <div class="text-h5 text-sm-h4 mb-2">Por que usar o nosso sistema?</div>
                <p class="text-body-2 text-white-opacity mb-5">
                  Tudo em um só lugar para você agendar, acompanhar e gerenciar seus horários sem atrito.
                </p>

                <v-list bg-color="transparent"  class="pa-0">
                  <v-list-item class="px-0" title="Sem conflitos" subtitle="Horários sincronizados em tempo real.">
                    <template #prepend>
                      <v-avatar color="white" variant="tonal" size="36" class="me-3">
                        <v-icon icon="mdi-calendar-check-outline" size="18" />
                      </v-avatar>
                    </template>
                  </v-list-item>

                  <v-list-item class="px-0" title="Rápido e simples" subtitle="Agendamento em poucos cliques.">
                    <template #prepend>
                      <v-avatar color="white" variant="tonal" size="36" class="me-3">
                        <v-icon icon="mdi-flash-outline" size="18" />
                      </v-avatar>
                    </template>
                  </v-list-item>

                  <v-list-item class="px-0" title="Organização diária"
                    subtitle="Visualização clara de tudo que vem pela frente.">
                    <template #prepend>
                      <v-avatar color="white" variant="tonal" size="36" class="me-3">
                        <v-icon icon="mdi-view-dashboard-outline" size="18" />
                      </v-avatar>
                    </template>
                  </v-list-item>
                </v-list>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alerts'
import { formatPhone, normalizePhone, buildE164 } from '@/lib/phone'
import CompanySwitcher from '@/components/CompanySwitcher.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const alerts = useAlertStore()
const { smAndDown } = useDisplay()

const tab = ref('login')
const loading = ref(false)
const loginErrors = ref({})
const registerErrors = ref({})
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirm = ref(false)

const formPaddingClass = computed(() => (smAndDown.value ? 'pa-5' : 'pa-8'))
const asidePaddingClass = computed(() => (smAndDown.value ? 'pa-5 pt-4' : 'pa-8'))

const countryOptions = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '1', label: 'EUA (+1)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '34', label: 'Espanha (+34)' },
]

const loginForm = ref({
  country: '55',
  phone: '',
  password: '',
})

const registerForm = ref({
  name: '',
  country: '55',
  phone: '',
  email: '',
  password: '',
  confirm: '',
})

const loginPhone = computed({
  get: () => formatPhone(loginForm.value.phone, loginForm.value.country),
  set: (value) => {
    loginForm.value.phone = normalizePhone(value, loginForm.value.country)
  },
})

const registerPhone = computed({
  get: () => formatPhone(registerForm.value.phone, registerForm.value.country),
  set: (value) => {
    registerForm.value.phone = normalizePhone(value, registerForm.value.country)
  },
})

watch(
  () => loginForm.value.country,
  (newCountry) => {
    loginForm.value.phone = normalizePhone(loginForm.value.phone, newCountry)
  }
)

watch(
  () => registerForm.value.country,
  (newCountry) => {
    registerForm.value.phone = normalizePhone(registerForm.value.phone, newCountry)
  }
)

watchEffect(() => {
  if (auth.isAuthenticated) {
    if (auth.isSuperAdmin) {
      router.replace(route.query.redirect || { name: 'super-admin-companies' })
      return
    }
    if (auth.isStaff) {
      router.replace(route.query.redirect || { name: 'staff-dashboard' })
    } else {
      router.replace(route.query.redirect || { name: 'client-home' })
    }
  }
})

const handleLogin = async () => {
  loading.value = true
  loginErrors.value = {}
  try {
    await auth.login({
      phone: buildE164(loginForm.value.country, loginForm.value.phone),
      password: loginForm.value.password,
    })
    await auth.loadMe()
  } catch (error) {
    loginErrors.value = mapErrors(error)
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirm) {
    alerts.warning('As senhas não conferem.')
    registerErrors.value = { confirm: ['As senhas não conferem.'] }
    return
  }
  loading.value = true
  registerErrors.value = {}
  try {
    await auth.registerClient({
      name: registerForm.value.name,
      phone: buildE164(registerForm.value.country, registerForm.value.phone),
      email: registerForm.value.email || null,
      password: registerForm.value.password,
    })
    await auth.loadMe()
  } catch (error) {
    registerErrors.value = mapErrors(error)
  } finally {
    loading.value = false
  }
}

const mapErrors = (error) => {
  const errors = error?.response?.data?.errors || {}
  const message = error?.response?.data?.message
  const mapped = {}

  Object.entries(errors).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      mapped[field] = messages
    }
  })

  if (!Object.keys(mapped).length && message) {
    mapped._form = [message]
  }

  return mapped
}
</script>

<style scoped>
.login-shell {
  min-height: 75vh;
}

.login-shell :deep(.v-card) {
  border: 1px solid rgba(87, 120, 132, 0.18);
}

.login-shell :deep(.v-card-title) {
  font-family: var(--display-font);
  letter-spacing: 0.01em;
}

.login-shell :deep(.v-window-item) {
  animation: rise 0.35s ease;
}

.login-aside {
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.18), transparent 40%),
    linear-gradient(150deg, #4d7b80 0%, #5f8f93 58%, #b8875d 100%);
  color: #f6fbfc;
}

.text-white-opacity {
  color: rgba(246, 251, 252, 0.84);
}

.login-aside :deep(.v-list-item-subtitle) {
  white-space: normal;
  color: rgba(246, 251, 252, 0.78);
}

@media (max-width: 959px) {
  .login-shell {
    min-height: calc(100vh - 48px);
  }
}
</style>
