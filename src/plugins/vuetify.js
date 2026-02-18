import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { pt } from 'vuetify/locale'

const barberLight = {
  dark: false,
  colors: {
    background: '#F2F5F8',
    surface: '#FFFFFF',
    'surface-variant': '#EAF0F4',
    primary: '#5B778D',
    secondary: '#859BAA',
    accent: '#B3A086',
    info: '#7292A7',
    success: '#6D8E79',
    warning: '#A88C6A',
    error: '#B08080',
    'on-surface': '#243443',
    'on-surface-variant': '#6B8191',
  },
}

const barberStaff = {
  dark: false,
  colors: {
    background: '#F2F5F8',
    surface: '#FFFFFF',
    'surface-variant': '#EAF0F4',
    primary: '#5B778D',
    secondary: '#859BAA',
    accent: '#B3A086',
    info: '#7292A7',
    success: '#6D8E79',
    warning: '#A88C6A',
    error: '#B08080',
    'on-surface': '#243443',
    'on-surface-variant': '#6B8191',
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
    defaultTheme: 'barberLight',
    themes: {
      barberLight,
      barberStaff,
    },
  },
  defaults: {
    VAppBar: {
      flat: true,
      elevation: 0,
      height: 68,
    },
    VNavigationDrawer: {
      width: 292,
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VSheet: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      density: 'compact',
      variant: 'outlined',
      rounded: 'lg',
      color: 'primary',
    },
    VSelect: {
      density: 'compact',
      variant: 'outlined',
      rounded: 'lg',
      color: 'primary',
    },
    VTextarea: {
      density: 'compact',
      variant: 'outlined',
      rounded: 'lg',
      color: 'primary',
    },
    VFileInput: {
      density: 'compact',
      variant: 'outlined',
      rounded: 'lg',
      color: 'primary',
    },
    VBtn: {
      class: 'text-none font-weight-medium',
      rounded: 'lg',
      height: 40,
    },
    VChip: {
      rounded: 'lg',
      size: 'small',
    },
    VDateInput: {
      density: 'compact',
      variant: 'outlined',
      rounded: 'lg',
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
