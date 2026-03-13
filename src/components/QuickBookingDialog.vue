<template>
  <v-dialog v-model="dialogModel" max-width="760">
    <v-card>
      <v-card-item>
        <template #prepend>
          <v-avatar color="secondary" variant="tonal">
            <v-icon icon="mdi-calendar-star" />
          </v-avatar>
        </template>
        <v-card-title>Agendamento rápido</v-card-title>
        <v-card-subtitle>Um fluxo curto para encaixe, retorno ou ligação de confirmação.</v-card-subtitle>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <v-form class="d-flex flex-column ga-4" @submit.prevent="submit">
          <v-row>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.client"
                :items="clientNames"
                label="Cliente"
                prepend-inner-icon="mdi-account-search-outline"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.packageId"
                :items="packageOptions"
                item-title="title"
                item-value="id"
                label="Ritual"
                prepend-inner-icon="mdi-content-cut"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.stylist"
                :items="stylists"
                label="Profissional"
                prepend-inner-icon="mdi-account-tie-outline"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-date-input
                v-model="form.date"
                label="Data sugerida"
              />
            </v-col>
          </v-row>

          <div>
            <div class="text-subtitle-2 mb-2">Horários sugeridos</div>
            <v-chip-group v-model="selectedSlotIndex" selected-class="text-secondary" mandatory>
              <v-chip
                v-for="slot in availableSlots"
                :key="slot"
                filter
                variant="outlined"
              >
                {{ slot }}
              </v-chip>
            </v-chip-group>
          </div>

          <v-textarea
            v-model="form.notes"
            rows="3"
            label="Observações"
            prepend-inner-icon="mdi-note-text-outline"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="ui.closeQuickBooking()">Fechar</v-btn>
        <v-btn color="secondary" @click="submit">Criar encaixe</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { availableSlots, bookingPackages, clients, stylists } from '@/data/mock'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { quickBookingOpen } = storeToRefs(ui)

const form = ref({
  client: clients[0]?.name || '',
  packageId: bookingPackages[0]?.id || '',
  stylist: stylists[0] || '',
  date: new Date(),
  notes: '',
})

const selectedSlotIndex = ref(0)

const dialogModel = computed({
  get: () => quickBookingOpen.value,
  set: (value) => {
    if (!value) ui.closeQuickBooking()
  },
})

const clientNames = clients.map((client) => client.name)
const packageOptions = bookingPackages

const submit = () => {
  const selectedSlot = availableSlots[selectedSlotIndex.value] || availableSlots[0]
  ui.notify(
    `Encaixe preparado para ${form.value.client} às ${selectedSlot} com ${form.value.stylist}.`,
    'success'
  )
  ui.closeQuickBooking()
}
</script>
