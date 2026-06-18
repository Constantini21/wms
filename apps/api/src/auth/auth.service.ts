import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: { include: { permissions: true } } }
    })

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const token = await this.jwt.signAsync({ sub: user.id })

    const permissionIds = user.role.permissions.map((p) => p.permissionId)
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } }
    })

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleName: user.role.name,
        permissions: permissions.map((p) => p.key)
      }
    }
  }
}
