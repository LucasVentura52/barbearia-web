import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    booting: true,
    drawer: true,
    rail: false,
    quickBookingOpen: false,
    snackbar: {
      show: false,
      text: '',
      color: 'secondary',
    },
  }),
  actions: {
    startBoot() {
      this.booting = true
    },
    finishBoot() {
      this.booting = false
    },
    toggleDrawer(forceValue) {
      this.drawer = typeof forceValue === 'boolean' ? forceValue : !this.drawer
    },
    toggleRail(forceValue) {
      this.rail = typeof forceValue === 'boolean' ? forceValue : !this.rail
    },
    openQuickBooking() {
      this.quickBookingOpen = true
    },
    closeQuickBooking() {
      this.quickBookingOpen = false
    },
    notify(text, color = 'secondary') {
      this.snackbar = {
        show: true,
        text,
        color,
      }
    },
    dismissNotification() {
      this.snackbar.show = false
    },
  },
})
