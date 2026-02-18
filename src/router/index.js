import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginView = () => import('@/views/LoginView.vue')
const ClientHomeView = () => import('@/views/client/ClientHomeView.vue')
const ClientServicesView = () => import('@/views/client/ClientServicesView.vue')
const ClientBookingView = () => import('@/views/client/ClientBookingView.vue')
const ClientAppointmentsView = () => import('@/views/client/ClientAppointmentsView.vue')
const ClientProfileView = () => import('@/views/client/ClientProfileView.vue')
const StaffDashboardView = () => import('@/views/staff/StaffDashboardView.vue')
const StaffAppointmentsView = () => import('@/views/staff/StaffAppointmentsView.vue')
const StaffClientsView = () => import('@/views/staff/StaffClientsView.vue')
const StaffProfileView = () => import('@/views/staff/StaffProfileView.vue')
const StaffScheduleView = () => import('@/views/staff/StaffScheduleView.vue')
const StaffServicesView = () => import('@/views/staff/StaffServicesView.vue')
const StaffProductsView = () => import('@/views/staff/StaffProductsView.vue')
const StaffTeamView = () => import('@/views/staff/StaffTeamView.vue')
const SuperAdminCompaniesView = () => import('@/views/super/SuperAdminCompaniesView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/client' },
    { path: '/login', name: 'login', component: LoginView, meta: { layout: 'auth' } },

    { path: '/client', name: 'client-home', component: ClientHomeView, meta: { layout: 'client' } },
    { path: '/client/services', name: 'client-services', component: ClientServicesView, meta: { layout: 'client' } },
    {
      path: '/client/booking',
      name: 'client-booking',
      component: ClientBookingView,
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/appointments',
      name: 'client-appointments',
      component: ClientAppointmentsView,
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },
    {
      path: '/client/profile',
      name: 'client-profile',
      component: ClientProfileView,
      meta: { layout: 'client', requiresAuth: true, role: 'client' },
    },

    {
      path: '/staff',
      name: 'staff-dashboard',
      component: StaffDashboardView,
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
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.token && !auth.user) {
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
    if (auth.isSuperAdmin) return { name: 'super-admin-companies' }
    if (auth.isStaff) return { name: 'staff-dashboard' }
    return { name: 'client-home' }
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
