import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLocationDto } from './dto/create-location.dto'
import { UpdateLocationDto } from './dto/update-location.dto'
import { getPaging, paginated, PaginationQueryDto } from '../common/pagination'

const locationInclude = {
  area: {
    select: {
      id: true,
      code: true,
      name: true,
      warehouse: { select: { id: true, code: true, name: true } }
    }
  }
}

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(areaId?: string, query: PaginationQueryDto = {}) {
    const { all, page, pageSize, skip, take } = getPaging(query)
    const where = areaId ? { areaId } : {}
    const orderBy = [
      { aisle: 'asc' as const },
      { floor: 'asc' as const },
      { position: 'asc' as const }
    ]
    if (all) {
      const data = await this.prisma.location.findMany({
        where,
        include: locationInclude,
        orderBy
      })
      return paginated(data, data.length, 1, data.length || 1)
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({
        where,
        include: locationInclude,
        orderBy,
        skip,
        take
      }),
      this.prisma.location.count({ where })
    ])
    return paginated(data, total, page, pageSize)
  }

  async findOne(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: locationInclude
    })
    if (!location) {
      throw new NotFoundException('Location not found')
    }
    return location
  }

  async findByBarcode(barcode: string) {
    const location = await this.prisma.location.findFirst({
      where: { OR: [{ barcode }, { code: barcode }] },
      include: locationInclude
    })
    if (!location) {
      throw new NotFoundException('No location matches the scanned code')
    }
    return location
  }

  create(dto: CreateLocationDto) {
    return this.prisma.location.create({
      data: {
        code: dto.code,
        areaId: dto.areaId,
        name: dto.name,
        aisle: dto.aisle,
        floor: dto.floor,
        position: dto.position,
        barcode: dto.barcode,
        active: dto.active ?? true
      }
    })
  }

  async update(id: string, dto: UpdateLocationDto) {
    await this.findOne(id)
    return this.prisma.location.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.location.delete({ where: { id } })
    return { success: true }
  }
}
