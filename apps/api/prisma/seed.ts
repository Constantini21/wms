import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PERMISSIONS = {
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

const ALL_PERMISSIONS: { key: string; description: string }[] = [
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

async function main() {
  for (const permission of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: { key: permission.key, description: permission.description }
    })
  }

  const allPermissions = await prisma.permission.findMany()
  const operatorKeys: string[] = [
    PERMISSIONS.WAREHOUSES_READ,
    PERMISSIONS.AREAS_READ,
    PERMISSIONS.AREAS_WRITE,
    PERMISSIONS.LOCATIONS_READ,
    PERMISSIONS.LOCATIONS_WRITE
  ]

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: { name: 'Administrator', description: 'Full system access' }
  })

  const operatorRole = await prisma.role.upsert({
    where: { name: 'Operator' },
    update: {},
    create: { name: 'Operator', description: 'Warehouse floor operations' }
  })

  await prisma.rolePermission.deleteMany({
    where: { roleId: { in: [adminRole.id, operatorRole.id] } }
  })

  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: adminRole.id,
      permissionId: permission.id
    }))
  })

  await prisma.rolePermission.createMany({
    data: allPermissions
      .filter((permission) => operatorKeys.includes(permission.key))
      .map((permission) => ({
        roleId: operatorRole.id,
        permissionId: permission.id
      }))
  })

  const adminEmail = 'admin'
  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { roleId: adminRole.id, passwordHash },
    create: {
      name: 'System Administrator',
      email: adminEmail,
      passwordHash,
      roleId: adminRole.id
    }
  })

  console.log('Seed complete. Login: admin / admin123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
