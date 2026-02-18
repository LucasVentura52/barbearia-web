<template>
  <v-container>
    <v-card class="services-hero glass-card mb-6" elevation="0">
      <v-card-text class="d-flex flex-wrap justify-space-between align-center ga-4">
        <div>
          <div class="section-label">Catálogo</div>
          <h2 class="services-title">Serviços feitos sob medida</h2>
          <p class="services-text">
            Escolha os combos e monte a experiência ideal. Preços transparentes e tempo estimado.
          </p>
        </div>
        <v-btn color="primary" size="large" :block="smAndDown" :to="{ name: 'client-booking' }">
          Agendar agora
        </v-btn>
      </v-card-text>
    </v-card>

    <v-row>
      <v-col v-for="service in services" :key="service.id" cols="12" md="4">
        <v-card class="glass-card" elevation="0">
          <v-card-item>
            <template #prepend>
              <div class="service-icon me-3">
                <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover class="service-icon__img" />
                <v-icon v-else icon="mdi-content-cut" size="28" />
              </div>
            </template>
            <v-card-title class="text-body-1">{{ service.name }}</v-card-title>
            <v-card-subtitle class="text-wrap">{{ service.description || 'Serviço premium' }}</v-card-subtitle>
          </v-card-item>
          <v-card-text class="pt-0">
            <div class="service-card">
              <div class="service-meta">
                <v-chip size="small" color="secondary" variant="tonal">
                  {{ service.duration_minutes }} min
                </v-chip>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ formatCurrencyBRL(service.price) }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { cachedGet } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { formatCurrencyBRL } from '@/lib/currency'

const services = ref([])
const { smAndDown } = useDisplay()

onMounted(async () => {
  const { data } = await cachedGet('/api/services', {}, { ttl: 30_000 })
  services.value = data
})
</script>

<style scoped>
.services-hero {
  padding: 4px;
}

.services-title {
  margin: 0 0 8px;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
}

.services-text {
  color: var(--ink-700);
  max-width: 520px;
}

.service-card {
  display: grid;
  gap: 12px;
}

.service-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(35, 58, 74, 0.08);
  display: grid;
  place-items: center;
  color: var(--ink-900);
  overflow: hidden;
}

.service-icon__img {
  width: 100%;
  height: 100%;
}

.service-name {
  font-weight: 600;
  font-size: 1.05rem;
}

.service-meta {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
