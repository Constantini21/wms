import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' }
    })
    return roles.map((role) => this.serialize(role))
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } }
    })
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    return this.serialize(role)
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } })
  }

  async create(dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: { name: dto.name, description: dto.description }
    })
    if (dto.permissionKeys) {
      await this.syncPermissions(role.id, dto.permissionKeys)
    }
    return this.findOne(role.id)
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id)
    await this.prisma.role.update({
      where: { id },
      data: { name: dto.name, description: dto.description }
    })
    if (dto.permissionKeys) {
      await this.syncPermissions(id, dto.permissionKeys)
    }
    return this.findOne(id)
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.role.delete({ where: { id } })
    return { success: true }
  }

  private async syncPermissions(roleId: string, keys: string[]) {
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: keys } }
    })
    await this.prisma.rolePermission.deleteMany({ where: { roleId } })
    await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId,
        permissionId: permission.id
      }))
    })
  }

  private serialize(role: {
    id: string
    name: string
    description: string | null
    permissions: { permission: { key: string } }[]
  }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissionKeys: role.permissions.map((p) => p.permission.key)
    }
  }
}
