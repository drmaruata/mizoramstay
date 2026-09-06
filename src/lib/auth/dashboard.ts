export type DashboardRole =
  | 'TOURIST'
  | 'HOST'
  | 'GUIDE'
  | 'DRIVER'
  | 'OPERATOR'
  | 'ADMIN'
  | 'SUPER_ADMIN'

/**
 * Canonical post-auth landing page for every supported account role.
 * Administrative roles always land in the admin console; hosts use the host
 * studio; all other authenticated users land in the tourist account area.
 */
export function dashboardPathForRole(role: string | null | undefined): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin'
    case 'HOST':
      return '/host/dashboard'
    default:
      return '/account'
  }
}
