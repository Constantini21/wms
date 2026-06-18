import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAreaDto } from './dto/create-area.dto'
import { UpdateAreaDto } from './dto/update-area.dto'

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(warehouseId?: string) {
    return this.prisma.area.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: { warehouse: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findOne(id: string) {
    const area = await this.prisma.area.findUnique({
      where: { id },
      include: { warehouse: true }
    })
    if (!area) {
      throw new NotFoundException('Area not found')
    }
    return area
  }

  async findByBarcode(barcode: string) {
    const area = await this.prisma.area.findFirst({
      where: { OR: [{ barcode }, { code: barcode }] },
      include: { warehouse: true }
    })
    if (!area) {
      throw new NotFoundException('No area matches the scanned code')
    }
    return area
  }

  create(dto: CreateAreaDto) {
    return this.prisma.area.create({
      data: {
        code: dto.code,
        name: dto.name,
        warehouseId: dto.warehouseId,
        barcode: dto.barcode,
        active: dto.active ?? true
      }
    })
  }

  async update(id: string, dto: UpdateAreaDto) {
    await this.findOne(id)
    return this.prisma.area.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.area.delete({ where: { id } })
    return { success: true }
  }
}
