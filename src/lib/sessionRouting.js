export const resolveHomeRoute = (auth) => {
  if (auth.isSuperAdmin) return { name: 'super-admin' }
  if (auth.isOperationalStaff) return { name: 'overview' }
  return { name: 'client-home' }
}

const canAccessResolvedRoute = (resolved, auth) => {
  if (resolved.meta?.public) return true

  const area = String(resolved.meta?.area || '')

  if (area === 'super_admin') {
    return auth.isSuperAdmin
  }

  if (area === 'staff') {
    if (!auth.isOperationalStaff) return false
    if (resolved.meta?.operationalRole === 'admin') {
      return auth.isAdmin
    }
    return true
  }

  if (area === 'client') {
    return auth.isClient
  }

  if (area === 'authenticated') {
    return auth.isAuthenticated
  }

  return auth.isAuthenticated
}

export const resolveRedirectForRole = (router, auth, redirect) => {
  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return resolveHomeRoute(auth)
  }

  const resolved = router.resolve(redirect)

  if (!resolved?.name) {
    return resolveHomeRoute(auth)
  }

  if (!canAccessResolvedRoute(resolved, auth)) {
    return resolveHomeRoute(auth)
  }

  return redirect
}
