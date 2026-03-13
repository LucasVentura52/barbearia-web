<template>
  <router-view v-if="layoutName === 'auth'" />
  <client-chat-shell v-else-if="layoutName === 'client-chat'" />
  <client-shell v-else-if="layoutName === 'client'" />
  <app-shell v-else />
  <div v-if="ui.booting" class="app-boot">
    <v-progress-circular indeterminate color="secondary" :size="74" :width="7" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import ClientChatShell from '@/layouts/ClientChatShell.vue'
import ClientShell from '@/layouts/ClientShell.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()
const layoutName = computed(() => String(route.meta.layout || 'app'))
</script>
