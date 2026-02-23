import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { setupInterceptors } from './lib/api'
import { useAuthStore } from './stores/auth'
import { useAlertStore } from './stores/alerts'
import { useAppStore } from './stores/app'
import './style.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(vuetify)

const auth = useAuthStore(pinia)
const alerts = useAlertStore(pinia)
const appState = useAppStore(pinia)
setupInterceptors(auth, router, alerts)

appState.startBoot()

const bootstrap = async () => {
  try {
    if (auth.token && !auth.user) {
      try {
        await auth.restoreSession()
      } catch {
        // Interceptors and guards already handle session failures.
      }
    }

    await router.isReady()
  } finally {
    appState.finishBoot()
  }
}

bootstrap()

app.mount('#app')
