<template>
  <v-app class="login-app">
    <section class="login-shell">
      <div class="login-orb login-orb--amber"></div>
      <div class="login-orb login-orb--blue"></div>
      <div class="login-gridline"></div>

      <v-container fluid class="login-frame">
        <v-row class="ma-0 login-grid" align="stretch" justify="center">
          <v-col cols="12" lg="6" class="login-grid__showcase">
            <section class="showcase-panel">
              <div class="showcase-copy">
                <div class="showcase-kicker">Experiencia premium</div>
                <h1 class="showcase-title">Por que usar o nosso sistema?</h1>
                <p class="showcase-text">
                  Tudo em um so lugar para voce agendar, acompanhar e gerenciar seus horarios sem atrito.
                </p>
              </div>

              <div class="journey-grid">
                <article
                  v-for="item in journeyItems"
                  :key="item.title"
                  class="journey-card"
                >
                  <div class="journey-card__icon">
                    <v-icon :icon="item.icon" size="22" />
                  </div>
                  <div>
                    <div class="journey-card__title">{{ item.title }}</div>
                    <div class="journey-card__text">{{ item.text }}</div>
                  </div>
                </article>
              </div>
            </section>
          </v-col>

          <v-col cols="12" lg="5" class="login-grid__form">
            <v-card class="login-card" elevation="0">
              <div class="login-card__glow"></div>

              <div class="login-card__header">
                <div class="login-brand">
                  <v-avatar size="54" class="login-brand__avatar">
                    <v-icon icon="mdi-account-lock-outline" />
                  </v-avatar>
                  <div>
                    <div class="login-brand__eyebrow">Acesso da plataforma</div>
                    <div class="login-brand__title">Entrar na barbearia</div>
                  </div>
                </div>

                <div class="login-brand__subtitle">
                  Use seu telefone e senha para continuar no ambiente correto sem precisar escolher perfil manualmente.
                </div>
              </div>

              <v-form class="login-form" @submit.prevent="handleLogin">
                <div class="login-form__group">
                  <div class="login-form__caption">Telefone de acesso</div>

                  <v-row>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="form.country"
                        :items="countryOptions"
                        item-title="label"
                        item-value="code"
                        label="Pais"
                        variant="outlined"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12" sm="8">
                      <v-text-field
                        v-model="phoneInput"
                        label="Telefone"
                        placeholder="(11) 99999-9999"
                        prepend-inner-icon="mdi-phone-outline"
                        type="tel"
                        maxlength="15"
                        variant="outlined"
                        hide-details="auto"
                      />
                    </v-col>
                  </v-row>
                </div>

                <div class="login-form__group">
                  <div class="login-form__caption">Senha</div>

                  <v-text-field
                    v-model="form.password"
                    label="Senha"
                    :type="showPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    variant="outlined"
                    hide-details="auto"
                    @click:append-inner="showPassword = !showPassword"
                  />
                </div>

                <v-btn
                  class="login-submit"
                  color="secondary"
                  size="large"
                  type="submit"
                  :loading="loading"
                  block
                >
                  Entrar na plataforma
                </v-btn>
              </v-form>

              <div class="login-footnote">
                <v-icon icon="mdi-shield-check-outline" size="18" />
                <span>Cliente, colaborador e super admin usam o mesmo ponto de entrada.</span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </v-app>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { resolveRedirectForRole } from '@/lib/sessionRouting'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import { buildE164, formatPhone, normalizePhone } from '@/lib/phone'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const company = useCompanyStore()

const loading = ref(false)
const showPassword = ref(false)
const form = ref({
  country: '55',
  phone: '',
  password: '',
})

const countryOptions = [
  { code: '55', label: 'Brasil (+55)' },
  { code: '1', label: 'EUA (+1)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '34', label: 'Espanha (+34)' },
]

const journeyItems = [
  {
    icon: 'mdi-calendar-sync-outline',
    title: 'Sem conflitos',
    text: 'Horarios sincronizados em tempo real.',
  },
  {
    icon: 'mdi-lightning-bolt-outline',
    title: 'Rapido e simples',
    text: 'Agendamento em poucos cliques.',
  },
  {
    icon: 'mdi-view-dashboard-outline',
    title: 'Organizacao diaria',
    text: 'Visualizacao clara de tudo que vem pela frente.',
  },
]

const phoneInput = computed({
  get: () => formatPhone(form.value.phone, form.value.country),
  set: (value) => {
    form.value.phone = normalizePhone(value, form.value.country)
  },
})

const resolveRedirect = () => {
  return resolveRedirectForRole(router, auth, route.query.redirect)
}

const handleLogin = async () => {
  loading.value = true

  try {
    await auth.login({
      phone: buildE164(form.value.country, form.value.phone),
      password: form.value.password,
    })
    await auth.loadMe()
    await company.loadMyCompanies({ force: true })
    router.replace(resolveRedirect())
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await company.loadPublicCompanies()
})
</script>

<style scoped>
.login-app {
  background: #0d1318;
}

.login-shell {
  --login-surface: rgba(18, 24, 31, 0.76);
  --login-surface-soft: rgba(28, 37, 47, 0.82);
  --login-stroke: rgba(182, 119, 49, 0.18);
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(204, 145, 77, 0.2), transparent 28%),
    radial-gradient(circle at 88% 14%, rgba(92, 138, 158, 0.18), transparent 24%),
    linear-gradient(135deg, #0f151b 0%, #16202a 42%, #0d1318 100%);
}

.login-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.7;
  pointer-events: none;
}

.login-orb--amber {
  width: 280px;
  height: 280px;
  top: -90px;
  left: -60px;
  background: radial-gradient(circle, rgba(202, 145, 78, 0.42), rgba(202, 145, 78, 0));
  animation: drift 12s ease-in-out infinite;
}

.login-orb--blue {
  width: 320px;
  height: 320px;
  right: -90px;
  bottom: -110px;
  background: radial-gradient(circle, rgba(91, 138, 160, 0.36), rgba(91, 138, 160, 0));
  animation: drift 15s ease-in-out infinite reverse;
}

.login-gridline {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.8), transparent 92%);
  pointer-events: none;
}

.login-frame {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: 28px;
}

.login-grid {
  width: min(1280px, 100%);
  margin: 0 auto;
  align-items: stretch;
}

.login-grid__showcase,
.login-grid__form {
  display: flex;
  align-self: stretch;
}

.showcase-panel {
  width: 100%;
  height: 100%;
  border-radius: 34px;
  padding: 34px;
  background: linear-gradient(155deg, rgba(17, 24, 31, 0.84), rgba(25, 35, 45, 0.72));
  border: 1px solid rgba(180, 208, 221, 0.12);
  box-shadow: 0 28px 60px rgba(3, 8, 12, 0.32);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 22px;
  justify-content: space-between;
  color: #edf4f7;
}

.showcase-copy {
  display: grid;
  gap: 12px;
}

.showcase-kicker {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(206, 147, 74, 0.92);
  margin-bottom: 0;
}

.showcase-title {
  max-width: 16ch;
  margin: 0;
  font-family: var(--display-font, 'Avenir Next');
  font-size: clamp(2.1rem, 3.8vw, 3.6rem);
  line-height: 0.92;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.showcase-text {
  max-width: 58ch;
  margin: 0;
  font-size: 0.97rem;
  line-height: 1.58;
  color: rgba(237, 244, 247, 0.74);
}

.journey-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.journey-card {
  min-height: 132px;
  padding: 16px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(10, 16, 22, 0.3);
  border: 1px solid rgba(180, 208, 221, 0.12);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.journey-card__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-grid;
  place-items: center;
  background: linear-gradient(145deg, rgba(206, 147, 74, 0.2), rgba(92, 138, 158, 0.14));
  color: #f5d2a2;
}

.journey-card__title {
  font-size: 1rem;
  font-weight: 800;
  color: #edf4f7;
  margin-bottom: 6px;
}

.journey-card__text {
  font-size: 0.88rem;
  line-height: 1.5;
  color: rgba(237, 244, 247, 0.7);
}

.login-card {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  padding: 30px;
  background: linear-gradient(180deg, rgba(248, 250, 251, 0.96), rgba(236, 243, 247, 0.9));
  border: 1px solid rgba(180, 208, 221, 0.5);
  box-shadow: 0 30px 70px rgba(5, 10, 14, 0.32);
}

.login-card__glow {
  position: absolute;
  inset: 0 0 auto;
  height: 170px;
  background: radial-gradient(circle at top, rgba(206, 147, 74, 0.22), rgba(206, 147, 74, 0));
  pointer-events: none;
}

.login-card__header,
.login-form,
.login-footnote {
  position: relative;
  z-index: 1;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.login-brand__avatar {
  background: linear-gradient(145deg, rgba(182, 119, 49, 0.18), rgba(23, 49, 51, 0.12));
  color: #173133;
}

.login-brand__eyebrow {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(23, 49, 51, 0.56);
}

.login-brand__title {
  font-family: var(--display-font, 'Avenir Next');
  font-size: clamp(2rem, 2.4vw, 2.7rem);
  line-height: 1;
  font-weight: 800;
  color: #173133;
  letter-spacing: -0.04em;
}

.login-brand__subtitle {
  margin-top: 18px;
  font-size: 0.98rem;
  line-height: 1.65;
  color: rgba(23, 49, 51, 0.72);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 24px;
}

.login-form__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-form__caption {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(23, 49, 51, 0.56);
}

.login-form :deep(.v-field) {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: none;
}

.login-form :deep(.v-field--variant-outlined .v-field__outline) {
  color: rgba(23, 49, 51, 0.16);
}

.login-form :deep(.v-field--focused .v-field__outline) {
  color: rgba(182, 119, 49, 0.62);
}

.login-submit {
  min-height: 58px;
  margin-top: 6px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(182, 119, 49, 1), rgba(210, 150, 76, 1)) !important;
  box-shadow: 0 20px 30px rgba(182, 119, 49, 0.24);
  font-weight: 800;
  letter-spacing: 0.01em;
}

.login-footnote {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(23, 49, 51, 0.68);
  font-size: 0.9rem;
}

@keyframes drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(14px, 18px, 0) scale(1.04);
  }
}

@media (max-width: 1260px) {
  .login-grid {
    width: min(620px, 100%);
  }

  .login-grid__showcase {
    display: none;
  }

  .login-grid__form {
    max-width: 620px;
    margin: 0 auto;
  }
}

@media (max-width: 960px) {
  .login-frame {
    padding: 18px;
  }

  .showcase-panel,
  .login-card {
    border-radius: 28px;
    padding: 24px;
  }

  .showcase-title {
    max-width: 100%;
  }

}

@media (max-width: 640px) {
  .login-frame {
    padding: 12px;
  }

  .showcase-panel,
  .login-card {
    padding: 20px;
    border-radius: 24px;
  }

  .showcase-topline,
  .login-brand {
    align-items: flex-start;
  }

  .journey-grid {
    grid-template-columns: 1fr;
  }

  .login-form {
    margin-top: 20px;
  }
}
</style>
