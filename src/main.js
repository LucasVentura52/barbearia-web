import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { setupInterceptors } from './lib/api'
import { useAuthStore } from './stores/auth'
import { useCompanyStore } from './stores/company'
import { useUiStore } from './stores/ui'
import './styles.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

const auth = useAuthStore(pinia)
const company = useCompanyStore(pinia)
const ui = useUiStore(pinia)
setupInterceptors(auth, router, ui)
ui.startBoot()

const bootstrap = async () => {
  try {
    if (auth.token && (!auth.user || !auth.hasValidatedSession)) {
      try {
        await auth.restoreSession()
      } catch {
        // route guard and interceptors already handle invalid sessions
      }
    }

    if (auth.isAuthenticated) {
      await company.loadMyCompanies()
    } else {
      await company.loadPublicCompanies()
    }

    await router.isReady()
  } finally {
    ui.finishBoot()
  }
}

bootstrap()
app.mount('#app')
