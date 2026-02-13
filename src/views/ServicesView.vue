<template>
  <v-container>
    <div class="services-hero glass-card">
      <div>
        <div class="section-label">Catálogo</div>
        <h2 class="services-title">Serviços feitos sob medida</h2>
        <p class="services-text">
          Escolha os combos e monte a experiência ideal. Preços transparentes e tempo estimado.
        </p>
      </div>
      <v-btn color="primary" size="large" :to="{ name: 'booking' }">
        Agendar agora
      </v-btn>
    </div>

    <v-row>
      <v-col v-for="service in services" :key="service.id" cols="12" md="4">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="service-card">
              <div class="service-icon">
                <v-img v-if="service.photo_url" :src="resolveMediaUrl(service.photo_url)" cover class="service-icon__img" />
                <v-icon v-else icon="mdi-content-cut" size="28" />
              </div>
              <div>
                <div class="service-name">{{ service.name }}</div>
                <div class="text-muted">{{ service.description || 'Serviço premium' }}</div>
                <div class="service-meta">
                  <v-chip size="small" color="secondary" variant="tonal">
                    {{ service.duration_minutes }} min
                  </v-chip>
                  <v-chip size="small" color="primary" variant="tonal">
                    R$ {{ Number(service.price).toFixed(2) }}
                  </v-chip>
                </div>
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
import api from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'

const services = ref([])

onMounted(async () => {
  const { data } = await api.get('/api/services')
  services.value = data
})
</script>

<style scoped>
.services-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
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
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
}

.service-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(11, 31, 36, 0.08);
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
