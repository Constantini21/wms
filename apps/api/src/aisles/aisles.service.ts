import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAisleDto } from './dto/create-aisle.dto'

@Injectable()
export class AislesService {
  constructor(private readonly prisma: PrismaService) {}

  private accessibilityForLevel(level: number, levels: number): number {
    if (levels <= 1) {
      return 8
    }
    const value = 10 - Math.round(((level - 1) / (levels - 1)) * 8)
    return Math.max(2, Math.min(10, value))
  }

  listByArea(areaId: string) {
    return this.prisma.aisle.findMany({
      where: { areaId },
      include: { _count: { select: { locations: true } } },
      orderBy: { orderIndex: 'asc' }
    })
  }

  async create(dto: CreateAisleDto) {
    const area = await this.prisma.area.findUnique({
      where: { id: dto.areaId }
    })
    if (!area) {
      throw new NotFoundException('Area not found')
    }
    const existing = await this.prisma.aisle.findUnique({
      where: { areaId_code: { areaId: dto.areaId, code: dto.code } }
    })
    if (existing) {
      throw new ConflictException('Corridor code already exists in this area')
    }

    const levels = dto.levels ?? area.levels
    const positionsPerLevel = dto.positionsPerLevel ?? area.positionsPerLevel
    const count = await this.prisma.aisle.count({
      where: { areaId: dto.areaId }
    })

    const aisle = await this.prisma.aisle.create({
      data: {
        areaId: dto.areaId,
        code: dto.code,
        label: dto.label ?? dto.code,
        corridorFront: dto.corridorFront ?? `C${count + 1}`,
        corridorBack: dto.corridorBack ?? `C${count + 2}`,
        levels,
        positionsPerLevel,
        orderIndex: count,
        barcode: `${area.code}-${dto.code}`
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
    for (let level = 1; level <= levels; level += 1) {
      const accessibility = this.accessibilityForLevel(level, levels)
      for (let pos = 1; pos <= positionsPerLevel; pos += 1) {
        const posLabel = String(pos).padStart(2, '0')
        const code = `${area.code}-${dto.code}-A${level}-P${posLabel}`
        rows.push({
          areaId: dto.areaId,
          aisleId: aisle.id,
          code,
          name: code,
          aisle: dto.code,
          floor: String(level),
          position: posLabel,
          barcode: code,
          accessibility,
          capacity: 50
        })
      }
    }
    await this.prisma.location.createMany({ data: rows })
    return { ...aisle, locationsCreated: rows.length }
  }

  async remove(id: string) {
    const aisle = await this.prisma.aisle.findUnique({ where: { id } })
    if (!aisle) {
      throw new NotFoundException('Corridor not found')
    }
    await this.prisma.aisle.delete({ where: { id } })
    return { success: true }
  }
}
