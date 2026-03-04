import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginView = () => import('@/views/LoginView.vue')
const ClientHomeView = () => import('@/views/client/ClientHomeView.vue')
const StaffDashboardView = () => import('@/views/staff/StaffDashboardView.vue')
const StaffReportCollaboratorsView = () => import('@/views/staff/reports/StaffReportCollaboratorsView.vue')
const StaffReportClientsView = () => import('@/views/staff/reports/StaffReportClientsView.vue')
const StaffReportProductsView = () => import('@/views/staff/reports/StaffReportProductsView.vue')
const StaffReportAppointmentsView = () => import('@/views/staff/reports/StaffReportAppointmentsView.vue')
const StaffReportFinancialView = () => import('@/views/staff/reports/StaffReportFinancialView.vue')
const StaffAppointmentsView = () => import('@/views/staff/StaffAppointmentsView.vue')
const StaffClientsView = () => import('@/views/staff/StaffClientsView.vue')
const StaffProfileView = () => import('@/views/staff/StaffProfileView.vue')
const StaffScheduleView = () => import('@/views/staff/StaffScheduleView.vue')
const StaffServicesView = () => import('@/views/staff/StaffServicesView.vue')
const StaffProductsView = () => import('@/views/staff/StaffProductsView.vue')
const StaffTeamView = () => import('@/views/staff/StaffTeamView.vue')
const SuperAdminCompaniesView = () => import('@/views/super/SuperAdminCompaniesView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

const resolveAuthenticatedHomeRoute = (auth) => {
  if (auth.isSuperAdmin) return { name: 'super-admin-companies' }
  if (auth.isStaff) return { name: 'staff-dashboard' }
  return { name: 'client-home' }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'login' } },
    { path: '/login', name: 'login', component: LoginView, meta: { layout: 'auth' } },

    { path: '/client', name: 'client-home', component: ClientHomeView, meta: { layout: 'client' } },
    {
      path: '/client/services',
      name: 'client-services',
      redirect: (to) => ({ name: 'client-home', query: to.query }),
      meta: { layout: 'client' },
    },
    {
      path: '/client/booking',
      name: 'client-booking',
      redirect: (to) => ({ name: 'client-home', query: to.query }),
      meta: { layout: 'client' },
    },
    {
      path: '/client/appointments',
      name: 'client-appointments',
      redirect: (to) => ({ name: 'client-home', query: to.query }),
      meta: { layout: 'client' },
    },
    {
      path: '/client/profile',
      name: 'client-profile',
      redirect: (to) => ({ name: 'client-home', query: to.query }),
      meta: { layout: 'client' },
    },

    {
      path: '/staff',
      name: 'staff-dashboard',
      component: StaffDashboardView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/reports',
      name: 'staff-reports',
      redirect: { name: 'staff-reports-collaborators' },
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/reports/collaborators',
      name: 'staff-reports-collaborators',
      component: StaffReportCollaboratorsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/reports/clients',
      name: 'staff-reports-clients',
      component: StaffReportClientsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/reports/products',
      name: 'staff-reports-products',
      component: StaffReportProductsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/reports/appointments',
      name: 'staff-reports-appointments',
      component: StaffReportAppointmentsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/reports/financial',
      name: 'staff-reports-financial',
      component: StaffReportFinancialView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/appointments',
      name: 'staff-appointments',
      component: StaffAppointmentsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/clients',
      name: 'staff-clients',
      component: StaffClientsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/schedule',
      name: 'staff-schedule',
      component: StaffScheduleView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/services',
      name: 'staff-services',
      component: StaffServicesView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/products',
      name: 'staff-products',
      component: StaffProductsView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/profile',
      name: 'staff-profile',
      component: StaffProfileView,
      meta: { layout: 'staff', requiresAuth: true, role: 'staff' },
    },
    {
      path: '/staff/team',
      name: 'staff-team',
      component: StaffTeamView,
      meta: { layout: 'staff', requiresAuth: true, role: 'admin' },
    },
    {
      path: '/super-admin/companies',
      name: 'super-admin-companies',
      component: SuperAdminCompaniesView,
      meta: { layout: 'staff', requiresAuth: true, role: 'super_admin' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { layout: 'auth' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()
  const isPublicRoute = ['login', 'not-found'].includes(String(to.name || ''))

  if (!isPublicRoute && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (auth.token && (!auth.user || !auth.hasValidatedSession)) {
    try {
      const restored = await auth.restoreSession()
      if (!restored) {
        if (to.name === 'login') return true
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    } catch {
      auth.clearSession()
      if (to.name === 'login') return true
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return resolveAuthenticatedHomeRoute(auth)
  }

  const targetName = String(to.name || '')
  const isClientAreaRoute = targetName.startsWith('client-')
  const isInitialNavigation = !from?.name
  const isPostLoginNavigation = from?.name === 'login'
  if (isClientAreaRoute && auth.isAuthenticated && !auth.isClient && (isInitialNavigation || isPostLoginNavigation)) {
    return resolveAuthenticatedHomeRoute(auth)
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.role === 'staff' && !auth.isStaff) {
    return { name: 'client-home' }
  }

  if (to.meta.role === 'admin' && !['admin', 'super_admin'].includes(auth.user?.role)) {
    return { name: 'staff-dashboard' }
  }

  if (to.meta.role === 'super_admin' && auth.user?.role !== 'super_admin') {
    if (auth.isStaff) return { name: 'staff-dashboard' }
    return { name: 'client-home' }
  }

  if (to.meta.role === 'client' && auth.isStaff) {
    return { name: 'staff-dashboard' }
  }

  return true
})

export default router
