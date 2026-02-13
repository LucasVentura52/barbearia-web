<template>
  <v-container class="login-shell">
    <v-row justify="center">
      <v-col cols="12" md="9" lg="8">
        <v-card class="glass-card mb-15" elevation="0">
          <v-card-text class="login-card">
            <div class="login-grid">
              <div>
                <div class="section-title">
                  <h2>Entrar na plataforma</h2>
                </div>
                <p class="text-muted">
                  Use seu telefone e senha para acessar. Cadastro disponível apenas para clientes.
                </p>
                <CompanySwitcher :reload-on-change="false" class="mb-4" />

                <v-tabs v-model="tab" class="mb-4" color="primary">
                  <v-tab value="login">Login</v-tab>
                  <v-tab value="register">Cadastrar conta</v-tab>
                </v-tabs>

                <v-window v-model="tab">
                  <v-window-item value="login">
                    <v-form @submit.prevent="handleLogin">
                      <v-alert v-if="loginErrors._form" type="error" variant="tonal" class="mb-4">
                        {{ loginErrors._form[0] }}
                      </v-alert>
                      <div class="phone-row mt-2">
                        <v-select v-model="loginForm.country" :items="countryOptions" item-title="label"
                          item-value="code" label="País" variant="outlined" density="compact" class="phone-country" />
                        <v-text-field v-model="loginPhone" label="Telefone" placeholder="(11) 99999-9999"
                          variant="outlined" type="tel" class="phone-input" maxlength="15"
                          :error-messages="loginErrors.phone" required />
                      </div>
                      <v-text-field v-model="loginForm.password" label="Senha" type="password" variant="outlined"
                        :error-messages="loginErrors.password" required />
                      <v-btn color="primary" size="large" type="submit" :loading="loading">
                        Entrar
                      </v-btn>
                    </v-form>
                  </v-window-item>

                  <v-window-item value="register">
                    <v-form @submit.prevent="handleRegister">
                      <v-alert v-if="registerErrors._form" type="error" variant="tonal" class="mb-4">
                        {{ registerErrors._form[0] }}
                      </v-alert>
                      <v-text-field v-model="registerForm.name" class="mt-2" label="Nome" variant="outlined"
                        :error-messages="registerErrors.name" required />
                      <div class="phone-row">
                        <v-select v-model="registerForm.country" :items="countryOptions" item-title="label"
                          item-value="code" label="País" variant="outlined" class="phone-country" />
                        <v-text-field v-model="registerPhone" label="Telefone" placeholder="(11) 99999-9999"
                          variant="outlined" type="tel" class="phone-input" maxlength="15"
                          :error-messages="registerErrors.phone" required />
                      </div>
                      <v-text-field v-model="registerForm.email" label="Email (opcional)" variant="outlined"
                        :error-messages="registerErrors.email" />
                      <v-text-field v-model="registerForm.password" label="Senha" type="password" variant="outlined"
                        :error-messages="registerErrors.password" required />
                      <v-text-field v-model="registerForm.confirm" label="Confirmar senha" type="password"
                        variant="outlined" :error-messages="registerErrors.confirm" required />
                      <v-btn color="primary" size="large" type="submit" :loading="loading">
                        Criar conta
                      </v-btn>
                    </v-form>
                  </v-window-item>
                </v-window>
              </div>

              <div class="login-aside">
                <div class="aside-title">Por que usar o nosso sistema?</div>
                <div class="aside-item">
                  <v-icon icon="mdi-calendar-check" />
                  <div>
                    <div class="aside-name">Sem conflitos</div>
                    <div class="aside-desc">Horários sincronizados em tempo real.</div>
                  </div>
                </div>
                <div class="aside-item">
                  <v-icon icon="mdi-flash" />
                  <div>
                    <div class="aside-name">Rápido e simples</div>
                    <div class="aside-desc">Agendamento em poucos cliques.</div>
                  </div>
                </div>
                <div class="aside-item">
                  <v-icon icon="mdi-star" />
                  <div>
                    <div class="aside-name">Experiência premium</div>
                    <div class="aside-desc">Mais conforto para você e para o barbeiro.</div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alerts'
import { formatPhone, normalizePhone, buildE164 } from '@/lib/phone'
import CompanySwitcher from '@/components/CompanySwitcher.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const alerts = useAlertStore()

const tab = ref('login')
const loading = ref(false)
const loginErrors = ref({})
const registerErrors = ref({})

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
  display: flex;
  align-items: center;
  overflow: hidden;
}

.login-card {
  padding: 32px;
}

.login-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.phone-row {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 12px;
}

.phone-country :deep(.v-field__input) {
  font-size: 0.9rem;
}

.phone-input {
  min-width: 0;
}

.login-aside {
  background: linear-gradient(160deg, rgba(11, 31, 36, 0.95), rgba(32, 92, 106, 0.9));
  color: #f6f1e8;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  gap: 16px;
}

.aside-title {
  font-family: var(--display-font);
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.aside-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.aside-name {
  font-weight: 600;
}

.aside-desc {
  font-size: 0.85rem;
  color: rgba(246, 241, 232, 0.75);
}
</style>
