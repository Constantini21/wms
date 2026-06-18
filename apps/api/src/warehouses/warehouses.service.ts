import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.warehouse.findMany({
      include: { _count: { select: { areas: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { areas: true }
    })
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found')
    }
    return warehouse
  }

  async create(dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: dto.code }
    })
    if (existing) {
      throw new ConflictException('Warehouse code already in use')
    }
    return this.prisma.warehouse.create({
      data: {
        code: dto.code,
        name: dto.name,
        address: dto.address,
        active: dto.active ?? true
      }
    })
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id)
    return this.prisma.warehouse.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.warehouse.delete({ where: { id } })
    return { success: true }
  }
}
