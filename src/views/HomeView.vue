<template>
  <v-container>
    <div class="hero-grid">
      <div class="hero-copy glass-card fade-in">
        <div class="badge">
          <v-icon icon="mdi-star-four-points" size="16" />
          Experiência premium
        </div>
        <h1 class="hero-title">Agenda inteligente para barbearias modernas</h1>
        <p class="hero-text">
          Visual limpo, decisões rápidas e uma jornada de agendamento que passa confiança.
          Tudo conectado em tempo real.
        </p>
        <div class="hero-actions">
          <v-btn color="primary" size="x-large" :to="{ name: 'booking' }">
            Quero agendar
          </v-btn>
          <v-btn variant="outlined" color="primary" size="x-large" :to="{ name: 'services' }">
            Ver serviços
          </v-btn>
        </div>
        <div class="hero-stats">
          <div class="stat-card">
            <div class="stat-value">+{{ staff.length }}</div>
            <div class="stat-label">Barbeiros ativos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ services.length }}</div>
            <div class="stat-label">Serviços premium</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">98%</div>
            <div class="stat-label">Satisfação</div>
          </div>
        </div>
      </div>

      <div class="hero-panel fade-in">
        <div class="hero-panel-card soft-shadow">
          <div class="panel-header">
            <div>
              <div class="panel-title">Agenda do dia</div>
              <div class="panel-subtitle">Hoje, destaque da equipe</div>
            </div>
            <v-chip color="secondary" variant="flat">Livre</v-chip>
          </div>
          <div class="panel-body">
            <div class="panel-slot" v-for="slot in highlightSlots" :key="slot.time">
              <div class="slot-time">{{ slot.time }}</div>
              <div>
                <div class="slot-title">{{ slot.title }}</div>
                <div class="slot-subtitle">{{ slot.subtitle }}</div>
              </div>
              <v-btn size="small" variant="tonal" color="secondary">Agendar</v-btn>
            </div>
          </div>
        </div>
        <div class="hero-panel-card hero-panel-card--light">
          <div class="panel-title">Assinatura da casa</div>
          <div class="panel-body">
            <div class="highlight" v-for="item in highlights" :key="item.title">
              <div class="highlight-dot"></div>
              <div>
                <div class="highlight-title">{{ item.title }}</div>
                <div class="highlight-subtitle">{{ item.subtitle }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">
      <h2>Como funciona</h2>
    </div>
    <div class="card-grid cols-3">
      <div class="feature-card">
        <div class="feature-title">1. Escolha o profissional</div>
        <div class="feature-desc">Veja o perfil, serviços e disponibilidade.</div>
      </div>
      <div class="feature-card">
        <div class="feature-title">2. Combine serviços</div>
        <div class="feature-desc">Monte o pacote ideal e confira o tempo total.</div>
      </div>
      <div class="feature-card">
        <div class="feature-title">3. Confirme em segundos</div>
        <div class="feature-desc">Agenda sempre atualizada e sem conflito.</div>
      </div>
    </div>

    <div class="experience-section">
      <div>
        <div class="section-label">Experiência premium</div>
        <h2 class="experience-title">Ambiente, técnica e estilo para elevar sua marca</h2>
        <p class="experience-text">
          Atendimento focado em detalhes: do primeiro contato até o pós-corte.
          Visual consistente, comunicação clara e uma agenda que trabalha por você.
        </p>
        <div class="experience-actions">
          <v-btn color="secondary" size="large">Fale com a equipe</v-btn>
          <v-btn variant="text" color="primary" size="large">Conhecer planos</v-btn>
        </div>
      </div>
      <div class="experience-card">
        <div class="experience-overlay"></div>
        <div class="experience-content">
          <div class="experience-pill">Barbearia 360°</div>
          <div class="experience-list">
            <div>
              <div class="experience-metric">+120</div>
              <div class="experience-label">Agendamentos/mês</div>
            </div>
            <div>
              <div class="experience-metric">45 min</div>
              <div class="experience-label">Tempo médio</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">
      <h2>Barbeiros em destaque</h2>
    </div>
    <v-row>
      <v-col v-for="member in staff" :key="member.id" cols="12" md="4">
        <v-card class="glass-card" elevation="0">
          <v-card-text>
            <div class="staff-card">
              <div class="staff-avatar">
                <v-img v-if="member.avatar_url" :src="resolveMediaUrl(member.avatar_url)" cover
                  class="staff-avatar__img" />
                <div v-else class="staff-initials">
                  {{ initials(member.name) }}
                </div>
              </div>
              <div>
                <div class="staff-name">{{ member.name }}</div>
                <div class="text-muted">{{ member.profile?.bio || 'Especialista em cortes' }}</div>
                <div class="staff-services">
                  <v-chip v-for="service in member.services" :key="service.id" size="small" color="secondary"
                    variant="tonal">
                    {{ service.name }}
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

const staff = ref([])
const services = ref([])

const highlightSlots = [
  { time: '09:30', title: 'Corte + Barba', subtitle: '45 min' },
  { time: '11:15', title: 'Corte Premium', subtitle: '30 min' },
  { time: '15:40', title: 'Barba completa', subtitle: '25 min' },
]

const highlights = [
  { title: 'Agenda inteligente', subtitle: 'Sem conflitos de horários' },
  { title: 'Pagamentos claros', subtitle: 'Valores sempre atualizados' },
  { title: 'Equipe conectada', subtitle: 'Barbeiros e clientes alinhados' },
]

const initials = (name) =>
  name
    .split(' ')
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

onMounted(async () => {
  const [staffResponse, servicesResponse] = await Promise.all([
    api.get('/api/staff'),
    api.get('/api/services'),
  ])
  staff.value = staffResponse.data
  services.value = servicesResponse.data
})
</script>

<style scoped>
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.hero-copy {
  padding: 32px;
}

.hero-title {
  font-size: clamp(2.4rem, 4vw, 3.6rem);
  margin: 16px 0;
}

.hero-text {
  font-size: 1.05rem;
  color: var(--ink-700);
  max-width: 520px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 24px 0;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
}

.hero-panel {
  display: grid;
  gap: 18px;
}

.hero-panel-card {
  background: linear-gradient(165deg, #283f4e 0%, #36586d 100%);
  color: #edf3f7;
  padding: 24px;
  border-radius: 22px;
}

.hero-panel-card--light {
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink-900);
  border: 1px solid var(--stroke-soft);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-title {
  font-family: var(--display-font);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.panel-subtitle {
  font-size: 0.85rem;
  color: rgba(237, 243, 247, 0.74);
}

.panel-body {
  display: grid;
  gap: 14px;
}

.panel-slot {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.08);
  padding: 12px 16px;
  border-radius: 16px;
}

.hero-panel-card--light .panel-slot {
  background: rgba(35, 58, 74, 0.06);
}

.slot-time {
  font-family: var(--display-font);
  font-size: 1.1rem;
}

.slot-title {
  font-weight: 600;
}

.slot-subtitle {
  font-size: 0.8rem;
  color: rgba(237, 243, 247, 0.74);
}

.hero-panel-card--light .slot-subtitle {
  color: var(--ink-500);
}

.highlight {
  display: flex;
  gap: 12px;
  align-items: center;
}

.highlight-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent-500);
}

.highlight-title {
  font-weight: 600;
}

.highlight-subtitle {
  font-size: 0.85rem;
  color: rgba(35, 58, 74, 0.65);
}

.experience-section {
  margin: 48px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: center;
}

.experience-title {
  font-size: clamp(2rem, 3vw, 2.6rem);
  margin: 12px 0;
}

.experience-text {
  color: var(--ink-700);
  max-width: 500px;
}

.experience-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.experience-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 280px;
  background: linear-gradient(140deg, #263b4a 0%, #46677d 58%, #9f8665 100%);
  color: #edf3f7;
}

.experience-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.16), transparent 55%);
}

.experience-content {
  position: relative;
  padding: 32px;
  display: grid;
  gap: 20px;
}

.experience-pill {
  align-self: start;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  display: inline-flex;
}

.experience-list {
  display: flex;
  gap: 24px;
}

.experience-metric {
  font-family: var(--display-font);
  font-size: 1.6rem;
}

.experience-label {
  font-size: 0.85rem;
  color: rgba(237, 243, 247, 0.78);
}

.staff-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
}

.staff-avatar {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(35, 58, 74, 0.08);
  display: grid;
  place-items: center;
}

.staff-avatar__img {
  width: 100%;
  height: 100%;
}

.staff-initials {
  font-family: var(--display-font);
  font-size: 1.2rem;
}

.staff-name {
  font-weight: 600;
}

.staff-services {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
</style>
