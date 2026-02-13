import { defineStore } from 'pinia'

let nextId = 1

export const useAlertStore = defineStore('alerts', {
  state: () => ({
    items: [],
  }),
  actions: {
    push({ type = 'info', message, timeout = 4500 }) {
      const id = nextId++
      this.items.push({ id, type, message, timeout, show: true })
      return id
    },
    success(message, timeout) {
      return this.push({ type: 'success', message, timeout })
    },
    warning(message, timeout) {
      return this.push({ type: 'warning', message, timeout })
    },
    error(message, timeout) {
      return this.push({ type: 'error', message, timeout })
    },
    info(message, timeout) {
      return this.push({ type: 'info', message, timeout })
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})