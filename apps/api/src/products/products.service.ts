import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { getPaging, paginated, PaginationQueryDto } from '../common/pagination'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(product: {
    allocations?: { quantity: number }[]
    [key: string]: unknown
  }) {
    const allocations = product.allocations ?? []
    const allocatedQuantity = allocations.reduce(
      (sum, item) => sum + item.quantity,
      0
    )
    const { allocations: _omit, ...rest } = product
    return {
      ...rest,
      allocatedQuantity,
      unallocatedQuantity: Math.max(
        0,
        (product.quantity as number) - allocatedQuantity
      )
    }
  }

  async findAll(query: PaginationQueryDto = {}) {
    const { all, page, pageSize, skip, take } = getPaging(query)
    const include = { allocations: { select: { quantity: true } } }
    const orderBy = [
      { priorityScore: 'desc' as const },
      { createdAt: 'desc' as const }
    ]
    if (all) {
      const rows = await this.prisma.product.findMany({ include, orderBy })
      const data = rows.map((row) => this.serialize(row))
      return paginated(data, data.length, 1, data.length || 1)
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ include, orderBy, skip, take }),
      this.prisma.product.count()
    ])
    return paginated(
      rows.map((row) => this.serialize(row)),
      total,
      page,
      pageSize
    )
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { allocations: { select: { quantity: true } } }
    })
    if (!product) {
      throw new NotFoundException('Product not found')
    }
    return this.serialize(product)
  }

  async findByBarcode(code: string) {
    const product = await this.prisma.product.findFirst({
      where: { OR: [{ barcode: code }, { sku: code }] },
      include: { allocations: { select: { quantity: true } } }
    })
    if (!product) {
      throw new NotFoundException('No product matches the scanned code')
    }
    return this.serialize(product)
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku }
    })
    if (existing) {
      throw new ConflictException('SKU already in use')
    }
    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        barcode: dto.barcode,
        weight: dto.weight,
        turnoverScore: dto.turnoverScore ?? 5,
        quantity: dto.quantity ?? 0,
        priorityScore: dto.turnoverScore ?? 5,
        active: dto.active ?? true
      }
    })
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id)
    return this.prisma.product.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.product.delete({ where: { id } })
    return { success: true }
  }
}
