import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      sass: {
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api', 'global-builtin', 'if-function'],
      },
      scss: {
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api', 'global-builtin', 'if-function'],
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true, styles: 'sass' }),
  ],
})
