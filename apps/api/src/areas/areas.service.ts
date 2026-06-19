import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAreaDto } from './dto/create-area.dto'
import { UpdateAreaDto } from './dto/update-area.dto'
import { getPaging, paginated, PaginationQueryDto } from '../common/pagination'

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(warehouseId?: string, query: PaginationQueryDto = {}) {
    const { all, page, pageSize, skip, take } = getPaging(query)
    const where = warehouseId ? { warehouseId } : {}
    const include = {
      warehouse: { select: { id: true, code: true, name: true } },
      _count: { select: { locations: true } }
    }
    const orderBy = { createdAt: 'desc' as const }
    if (all) {
      const data = await this.prisma.area.findMany({ where, include, orderBy })
      return paginated(data, data.length, 1, data.length || 1)
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.area.findMany({ where, include, orderBy, skip, take }),
      this.prisma.area.count({ where })
    ])
    return paginated(data, total, page, pageSize)
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
