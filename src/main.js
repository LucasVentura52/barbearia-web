import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { setupInterceptors } from './lib/api'
import { useAuthStore } from './stores/auth'
import { useAlertStore } from './stores/alerts'
import './style.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(vuetify)

const auth = useAuthStore(pinia)
const alerts = useAlertStore(pinia)
setupInterceptors(auth, router, alerts)

app.mount('#app')
