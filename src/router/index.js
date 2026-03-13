import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resolveHomeRoute, resolveRedirectForRole } from '@/lib/sessionRouting'

const LoginView = () => import('@/views/auth/LoginView.vue')
const ClientAssistantView = () => import('@/views/client/ClientAssistantView.vue')
const OverviewView = () => import('@/views/staff/OverviewView.vue')
const OperationsView = () => import('@/views/staff/OperationsView.vue')
const ClientsView = () => import('@/views/staff/ClientsView.vue')
const BookingStudioView = () => import('@/views/staff/BookingStudioView.vue')
const ServicesView = () => import('@/views/staff/ServicesView.vue')
const ProductsView = () => import('@/views/staff/ProductsView.vue')
const TeamView = () => import('@/views/staff/TeamView.vue')
const ScheduleView = () => import('@/views/staff/ScheduleView.vue')
const CompanySettingsView = () => import('@/views/staff/CompanySettingsView.vue')
const MediaView = () => import('@/views/staff/MediaView.vue')
const ReportsView = () => import('@/views/staff/ReportsView.vue')
const ProfileView = () => import('@/views/shared/ProfileView.vue')
const SuperAdminView = () => import('@/views/super/SuperAdminView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        layout: 'auth',
        public: true,
      },
    },
    {
      path: '/client',
      name: 'client-home',
      component: ClientAssistantView,
      meta: {
        requiresAuth: true,
        layout: 'client-chat',
        area: 'client',
        clientPanel: 'menu',
        title: 'Assistente do cliente',
        subtitle: 'Converse com o assistente para agendar, reagendar, cancelar e revisar seus horários.',
      },
    },
    {
      path: '/client/appointments',
      name: 'client-appointments',
      component: ClientAssistantView,
      meta: {
        requiresAuth: true,
        layout: 'client-chat',
        area: 'client',
        clientPanel: 'appointments',
        title: 'Meus agendamentos',
        subtitle: 'Consulte seus horários e gerencie reagendamentos e cancelamentos pelo assistente.',
      },
    },
    {
      path: '/client/booking',
      name: 'client-booking',
      component: ClientAssistantView,
      meta: {
        requiresAuth: true,
        layout: 'client-chat',
        area: 'client',
        clientPanel: 'booking',
        title: 'Novo agendamento',
        subtitle: 'Escolha profissional, serviços, data e horário com ajuda do assistente.',
      },
    },
    {
      path: '/client/services',
      name: 'client-services',
      component: ClientAssistantView,
      meta: {
        requiresAuth: true,
        layout: 'client-chat',
        area: 'client',
        clientPanel: 'services',
        title: 'Catálogo de serviços',
        subtitle: 'Veja o catálogo da empresa atual e siga para o agendamento em poucos passos.',
      },
    },
    {
      path: '/client/profile',
      name: 'client-profile',
      component: ClientAssistantView,
      meta: {
        requiresAuth: true,
        layout: 'client-chat',
        area: 'client',
        clientPanel: 'profile',
        title: 'Meu perfil',
        subtitle: 'Atualize seus dados e sua foto dentro do próprio atendimento do assistente.',
      },
    },
    {
      path: '/overview',
      name: 'overview',
      component: OverviewView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Panorama do atelier',
        subtitle: 'Indicadores, atmosfera da marca e agenda do dia em uma navegação única.',
      },
    },
    {
      path: '/operations',
      name: 'operations',
      component: OperationsView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Operação ao vivo',
        subtitle: 'Acompanhe cadeiras, fila, tempo de atendimento e ritmo do turno.',
      },
    },
    {
      path: '/clients',
      name: 'clients',
      component: ClientsView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Relacionamento com clientes',
        subtitle: 'Segmentação, recorrência e oportunidades para elevar ticket e retenção.',
      },
    },
    {
      path: '/booking-studio',
      name: 'booking-studio',
      component: BookingStudioView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Studio de agendamento',
        subtitle: 'Fluxo de marcação com mais contexto visual, decisão guiada e upsell.',
      },
    },
    {
      path: '/services',
      name: 'services',
      component: ServicesView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Catálogo de serviços',
        subtitle: 'Controle duração, preço, foto e status do mix vendido pela operação.',
      },
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Produtos',
        subtitle: 'Gerencie portfólio, estoque, entradas e vitrine comercial.',
      },
    },
    {
      path: '/team',
      name: 'team',
      component: TeamView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        operationalRole: 'admin',
        title: 'Equipe',
        subtitle: 'Cadastre colaboradores, permissões, serviços e foto operacional.',
      },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: ScheduleView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Horários e folgas',
        subtitle: 'Controle jornadas, indisponibilidades e bloqueios da agenda por colaborador.',
      },
    },
    {
      path: '/company-settings',
      name: 'company-settings',
      component: CompanySettingsView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        operationalRole: 'admin',
        title: 'Configurações da empresa',
        subtitle: 'Ajuste email transacional e parâmetros administrativos da empresa atual.',
      },
    },
    {
      path: '/media',
      name: 'media',
      component: MediaView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Galeria de mídia',
        subtitle: 'Suba, consulte e organize imagens vinculadas aos módulos da operação.',
      },
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
      meta: {
        requiresAuth: true,
        area: 'staff',
        title: 'Relatórios',
        subtitle: 'Consolidados operacionais, financeiros e comerciais da empresa atual.',
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
        area: 'authenticated',
        title: 'Perfil',
        subtitle: 'Atualize dados pessoais, foto e senha da sua conta.',
      },
    },
    {
      path: '/super-admin',
      name: 'super-admin',
      component: SuperAdminView,
      meta: {
        requiresAuth: true,
        role: 'super_admin',
        area: 'super_admin',
        title: 'Super Admin',
        subtitle: 'Gerencie empresas, vínculos e usuários globais.',
      },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const isPublicRoute = Boolean(to.meta.public)

  if (!isPublicRoute && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (auth.token && (!auth.user || !auth.hasValidatedSession)) {
    try {
      const restored = await auth.restoreSession()
      if (!restored) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    } catch {
      auth.clearSession()
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return resolveRedirectForRole(router, auth, to.query.redirect)
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'profile' && auth.isClient) {
    return { name: 'client-profile' }
  }

  if (to.meta.area === 'super_admin' && !auth.isSuperAdmin) {
    return resolveHomeRoute(auth)
  }

  if (to.meta.area === 'client' && !auth.isClient) {
    return resolveHomeRoute(auth)
  }

  if (to.meta.area === 'staff' && !auth.isOperationalStaff) {
    return resolveHomeRoute(auth)
  }

  if (to.meta.operationalRole === 'admin' && !auth.isAdmin) {
    return { name: 'overview' }
  }

  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'Atelier Barber'} | Barbearia`
})

export default router
