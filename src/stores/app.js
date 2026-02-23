import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    booting: true,
  }),
  actions: {
    startBoot() {
      this.booting = true
    },
    finishBoot() {
      this.booting = false
    },
  },
})

