export type AppRole = 'TOURIST' | 'HOST' | 'GUIDE' | 'DRIVER' | 'OPERATOR' | 'ADMIN' | 'SUPER_ADMIN'
export const rolePermissions: Record<AppRole, readonly string[]> = {
  TOURIST: ['profile:read:self','booking:read:self','wishlist:write:self','review:write:eligible'], HOST: ['profile:read:self','property:write:self','booking:read:own-property','inventory:write:self','review:respond:own-property'], GUIDE: ['profile:read:self'], DRIVER: ['profile:read:self'], OPERATOR: ['profile:read:self'], ADMIN: ['admin:read','verification:write','support:write'], SUPER_ADMIN: ['*'],
}
export function can(role: AppRole, permission: string) { return rolePermissions[role].includes('*') || rolePermissions[role].includes(permission) }
