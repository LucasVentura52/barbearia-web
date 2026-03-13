import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { pt } from 'vuetify/locale'

const atelierLight = {
  dark: false,
  colors: {
    background: '#f6efe7',
    surface: '#fffaf3',
    'surface-variant': '#efe1d2',
    primary: '#31454d',
    secondary: '#b67731',
    accent: '#d9a15f',
    info: '#6a7d95',
    success: '#3d7760',
    warning: '#b46d27',
    error: '#ab4f4f',
    'on-surface': '#1e2627',
    'on-surface-variant': '#5e5e59',
  },
}

const atelierNight = {
  dark: true,
  colors: {
    background: '#111316',
    surface: '#1b2026',
    'surface-variant': '#262c34',
    primary: '#e5d3b6',
    secondary: '#d99b53',
    accent: '#8f9fbe',
    info: '#8fb7c8',
    success: '#71c397',
    warning: '#f1af66',
    error: '#f28f8f',
    'on-surface': '#f5f0e7',
    'on-surface-variant': '#c0c6d0',
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
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'atelierLight',
    themes: {
      atelierLight,
      atelierNight,
    },
    variations: {
      colors: ['primary', 'secondary', 'accent'],
      lighten: 1,
      darken: 2,
    },
  },
  defaults: {
    global: {
      ripple: true,
    },
    VAppBar: {
      flat: true,
      elevation: 0,
      height: 76,
    },
    VNavigationDrawer: {
      elevation: 0,
      width: 312,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
      border: 'thin',
    },
    VSheet: {
      rounded: 'xl',
      elevation: 0,
    },
    VBtn: {
      class: 'text-none font-weight-bold',
      rounded: 'xl',
      height: 44,
    },
    VChip: {
      rounded: 'xl',
      size: 'small',
    },
    VTextField: {
      density: 'comfortable',
      variant: 'outlined',
      rounded: 'xl',
      color: 'secondary',
      hideDetails: 'auto',
    },
    VSelect: {
      density: 'comfortable',
      variant: 'outlined',
      rounded: 'xl',
      color: 'secondary',
      hideDetails: 'auto',
    },
    VTextarea: {
      density: 'comfortable',
      variant: 'outlined',
      rounded: 'xl',
      color: 'secondary',
      hideDetails: 'auto',
    },
    VAutocomplete: {
      density: 'comfortable',
      variant: 'outlined',
      rounded: 'xl',
      color: 'secondary',
      hideDetails: 'auto',
    },
    VDateInput: {
      density: 'comfortable',
      variant: 'outlined',
      rounded: 'xl',
      prependIcon: '',
      appendInnerIcon: 'mdi-calendar-month-outline',
      hideDetails: 'auto',
    },
    VTabs: {
      density: 'comfortable',
      color: 'secondary',
    },
    VAlert: {
      rounded: 'xl',
      border: 'start',
      variant: 'tonal',
    },
    VListItem: {
      rounded: 'lg',
      minHeight: 46,
    },
  },
})
