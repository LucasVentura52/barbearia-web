import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { pt } from 'vuetify/locale'

const barberTheme = {
  dark: false,
  colors: {
    background: '#F6F1E8',
    surface: '#FFFFFF',
    primary: '#0B1F24',
    secondary: '#C8A35A',
    accent: '#E0623A',
    info: '#205C6A',
    success: '#2D6A4F',
    warning: '#C77D44',
    error: '#B13E3E',
  },
}

export default createVuetify({
  components: {
    VDateInput,
  },
  locale: {
    locale: 'pt',
    fallback: 'en',
    messages: { pt },
  },
  date: {
    locale: { pt: 'pt-BR' },
  },
  theme: {
    defaultTheme: 'barberTheme',
    themes: {
      barberTheme,
    },
  },
  defaults: {
    VTextField: { density: 'compact', clearable: true, rounded: "xl" },
    VSelect: { density: 'compact', clearable: true, rounded: "xl" },
    VTextarea: { density: 'compact', clearable: true, rounded: "xl" },
    VFileInput: { density: 'compact', clearable: true , rounded: "xl"},
    VBtn: { class: 'text-none', rounded: "xl" },
    VDateInput: {
      density: 'compact',
      clearable: true,
      prependIcon: '',
      appendInnerIcon: '',
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})