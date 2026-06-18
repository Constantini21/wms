import {
  Injectable,
  NotFoundException,
  ConflictException
} from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

const userSelect = {
  id: true,
  name: true,
  email: true,
  active: true,
  roleId: true,
  role: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' }
    })
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    })
    if (existing) {
      throw new ConflictException('Email already in use')
    }
    const passwordHash = await bcrypt.hash(dto.password, 10)
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
        active: dto.active ?? true
      },
      select: userSelect
    })
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id)
    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.email !== undefined) data.email = dto.email
    if (dto.roleId !== undefined) data.roleId = dto.roleId
    if (dto.active !== undefined) data.active = dto.active
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10)
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.user.delete({ where: { id } })
    return { success: true }
  }
}
