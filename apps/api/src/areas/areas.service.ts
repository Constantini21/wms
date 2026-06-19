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
      corridors: {
        select: {
          id: true,
          code: true,
          levels: true,
          positionsPerLevel: true,
          orderIndex: true
        },
        orderBy: { orderIndex: 'asc' as const }
      },
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
        aisles: dto.aisles ?? 1,
        levels: dto.levels ?? 1,
        positionsPerLevel: dto.positionsPerLevel ?? 1,
        floor: dto.floor ?? 1,
        active: dto.active ?? true
      }
    })
  }

  async update(id: string, dto: UpdateAreaDto) {
    await this.findOne(id)
    return this.prisma.area.update({ where: { id }, data: dto })
  }

  /**
   * Accessibility heuristic by level: ground/eye level is easiest to reach,
   * higher levels are progressively harder (1..10).
   */
  private accessibilityForLevel(level: number, levels: number): number {
    if (levels <= 1) {
      return 8
    }
    const value = 10 - Math.round(((level - 1) / (levels - 1)) * 8)
    return Math.max(2, Math.min(10, value))
  }

  async generateLocations(id: string) {
    const area = await this.prisma.area.findUnique({ where: { id } })
    if (!area) {
      throw new NotFoundException('Area not found')
    }

    await this.prisma.aisle.deleteMany({ where: { areaId: id } })
    await this.prisma.location.deleteMany({ where: { areaId: id } })

    let total = 0
    for (let a = 0; a < area.aisles; a += 1) {
      const aisleCode = `${String.fromCharCode(65 + (a % 26))}${a + 1}`
      const aisle = await this.prisma.aisle.create({
        data: {
          areaId: id,
          code: aisleCode,
          orderIndex: a,
          levels: area.levels,
          positionsPerLevel: area.positionsPerLevel,
          barcode: `${area.code}-${aisleCode}`
        }
      })

      const rows: {
        areaId: string
        aisleId: string
        code: string
        name: string
        aisle: string
        floor: string
        position: string
        barcode: string
        accessibility: number
        capacity: number
      }[] = []

      for (let level = 1; level <= area.levels; level += 1) {
        const accessibility = this.accessibilityForLevel(level, area.levels)
        for (let pos = 1; pos <= area.positionsPerLevel; pos += 1) {
          const floorLabel = String(level)
          const posLabel = String(pos).padStart(2, '0')
          const code = `${area.code}-${aisleCode}-A${floorLabel}-P${posLabel}`
          rows.push({
            areaId: id,
            aisleId: aisle.id,
            code,
            name: code,
            aisle: aisleCode,
            floor: floorLabel,
            position: posLabel,
            barcode: code,
            accessibility,
            capacity: 50
          })
        }
      }
      await this.prisma.location.createMany({ data: rows })
      total += rows.length
    }

    return { created: total, corridors: area.aisles }
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.area.delete({ where: { id } })
    return { success: true }
  }
}
