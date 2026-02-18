import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { pt } from 'vuetify/locale'

const brandColors = {
  background: '#F3F7F6',
  surface: '#FFFFFF',
  'surface-variant': '#E7EFEC',
  primary: '#5B8C8F',
  secondary: '#B8885E',
  accent: '#D7B38A',
  info: '#6A8BA3',
  success: '#6F917B',
  warning: '#B99363',
  error: '#B37A7A',
  'on-surface': '#213139',
  'on-surface-variant': '#607883',
}

const barberLight = {
  dark: false,
  colors: brandColors,
}

const barberStaff = {
  dark: false,
  colors: brandColors,
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
    variations: {
      colors: ['primary', 'secondary'],
      lighten: 2,
      darken: 2,
    },
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
      border: 'thin',
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
      class: 'text-none font-weight-semibold',
      rounded: 'lg',
      height: 40,
    },
    VChip: {
      rounded: 'lg',
      size: 'small',
    },
    VListItem: {
      rounded: 'lg',
      minHeight: 42,
    },
    VTabs: {
      density: 'compact',
    },
    VAlert: {
      rounded: 'lg',
      border: 'start',
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
