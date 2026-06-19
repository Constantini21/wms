export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  ROLES_READ: 'roles.read',
  ROLES_WRITE: 'roles.write',
  WAREHOUSES_READ: 'warehouses.read',
  WAREHOUSES_WRITE: 'warehouses.write',
  AREAS_READ: 'areas.read',
  AREAS_WRITE: 'areas.write',
  LOCATIONS_READ: 'locations.read',
  LOCATIONS_WRITE: 'locations.write'
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: { key: PermissionKey; description: string }[] = [
  { key: PERMISSIONS.USERS_READ, description: 'View users' },
  { key: PERMISSIONS.USERS_WRITE, description: 'Manage users' },
  { key: PERMISSIONS.ROLES_READ, description: 'View roles' },
  { key: PERMISSIONS.ROLES_WRITE, description: 'Manage roles' },
  { key: PERMISSIONS.WAREHOUSES_READ, description: 'View warehouses' },
  { key: PERMISSIONS.WAREHOUSES_WRITE, description: 'Manage warehouses' },
  { key: PERMISSIONS.AREAS_READ, description: 'View areas' },
  { key: PERMISSIONS.AREAS_WRITE, description: 'Manage areas' },
  { key: PERMISSIONS.LOCATIONS_READ, description: 'View locations' },
  { key: PERMISSIONS.LOCATIONS_WRITE, description: 'Manage locations' }
]
