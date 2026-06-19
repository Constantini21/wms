import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getPaging, paginated, PaginationQueryDto } from '../common/pagination'

interface LocationScore {
  locationId: string
  code: string
  name: string | null
  areaName: string | null
  accessibility: number
  capacity: number | null
  occupied: number
  available: number | null
  score: number
  reason: string
}

const REALLOCATION_GAIN_THRESHOLD = 3

@Injectable()
export class PlacementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Heuristic slotting score: high turnover products belong in high
   * accessibility locations. The closer the location accessibility is to the
   * product turnover score, the better the fit (0..10).
   */
  private fitScore(accessibility: number, turnoverScore: number): number {
    return 10 - Math.abs(accessibility - turnoverScore)
  }

  private occupied(location: { allocations: { quantity: number }[] }): number {
    return location.allocations.reduce((sum, a) => sum + a.quantity, 0)
  }

  async suggestForProduct(productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    })
    if (!product) {
      throw new NotFoundException('Product not found')
    }
    const needed = quantity > 0 ? quantity : 1

    const locations = await this.prisma.location.findMany({
      where: { active: true },
      include: {
        allocations: { select: { quantity: true } },
        area: { select: { name: true } }
      }
    })

    const scored: LocationScore[] = locations
      .map((location) => {
        const occupied = this.occupied(location)
        const available =
          location.capacity === null ? null : location.capacity - occupied
        const score = this.fitScore(
          location.accessibility,
          product.turnoverScore
        )
        return {
          locationId: location.id,
          code: location.code,
          name: location.name,
          areaName: location.area?.name ?? null,
          accessibility: location.accessibility,
          capacity: location.capacity,
          occupied,
          available,
          score,
          reason: `Acessibilidade ${location.accessibility} para frequência de saída ${product.turnoverScore}`
        }
      })
      .filter((item) => item.available === null || item.available >= needed)
      .sort(
        (a, b) =>
          b.score - a.score || (b.available ?? 1e9) - (a.available ?? 1e9)
      )

    return {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        turnoverScore: product.turnoverScore
      },
      quantity: needed,
      suggestions: scored.slice(0, 5)
    }
  }

  async listAllocations(productId: string) {
    const allocations = await this.prisma.allocation.findMany({
      where: { productId },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            accessibility: true,
            area: { select: { name: true } }
          }
        }
      },
      orderBy: { quantity: 'desc' }
    })
    return allocations
  }

  private async availableAt(
    locationId: string,
    quantity: number
  ): Promise<void> {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      include: { allocations: { select: { quantity: true } } }
    })
    if (!location) {
      throw new NotFoundException('Location not found')
    }
    if (location.capacity !== null) {
      const occupied = this.occupied(location)
      if (location.capacity - occupied < quantity) {
        throw new BadRequestException(
          'Selected location does not have enough free capacity'
        )
      }
    }
  }

  async allocate(productId: string, locationId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    })
    if (!product) {
      throw new NotFoundException('Product not found')
    }
    await this.availableAt(locationId, quantity)
    return this.prisma.allocation.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: { quantity: { increment: quantity } },
      create: { productId, locationId, quantity }
    })
  }

  async reallocate(
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number
  ) {
    if (fromLocationId === toLocationId) {
      throw new BadRequestException('Origin and destination must differ')
    }
    const from = await this.prisma.allocation.findUnique({
      where: { productId_locationId: { productId, locationId: fromLocationId } }
    })
    if (!from || from.quantity < quantity) {
      throw new BadRequestException(
        'Not enough quantity at the origin location'
      )
    }
    await this.availableAt(toLocationId, quantity)

    await this.prisma.$transaction(async (tx) => {
      if (from.quantity === quantity) {
        await tx.allocation.delete({ where: { id: from.id } })
      } else {
        await tx.allocation.update({
          where: { id: from.id },
          data: { quantity: { decrement: quantity } }
        })
      }
      await tx.allocation.upsert({
        where: {
          productId_locationId: { productId, locationId: toLocationId }
        },
        update: { quantity: { increment: quantity } },
        create: { productId, locationId: toLocationId, quantity }
      })
    })

    return { success: true }
  }

  /**
   * Daily job: recompute product priority scores and regenerate placement
   * suggestions for products stored in poorly matched locations.
   */
  async recalculate() {
    const products = await this.prisma.product.findMany({
      include: { allocations: true }
    })
    const locations = await this.prisma.location.findMany({
      where: { active: true },
      include: {
        allocations: { select: { quantity: true } },
        area: { select: { name: true } }
      }
    })

    let suggestionsCreated = 0
    await this.prisma.placementSuggestion.deleteMany({
      where: { status: 'pending' }
    })

    for (const product of products) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { priorityScore: product.turnoverScore }
      })

      for (const allocation of product.allocations) {
        const current = locations.find((l) => l.id === allocation.locationId)
        if (!current) {
          continue
        }
        const currentScore = this.fitScore(
          current.accessibility,
          product.turnoverScore
        )

        const candidates = locations
          .filter((location) => location.id !== allocation.locationId)
          .map((location) => {
            const occupied = location.allocations.reduce(
              (sum, a) => sum + a.quantity,
              0
            )
            const available =
              location.capacity === null ? null : location.capacity - occupied
            return {
              location,
              available,
              score: this.fitScore(
                location.accessibility,
                product.turnoverScore
              )
            }
          })
          .filter(
            (item) =>
              item.available === null || item.available >= allocation.quantity
          )
          .sort((a, b) => b.score - a.score)

        const best = candidates[0]
        if (best && best.score - currentScore >= REALLOCATION_GAIN_THRESHOLD) {
          await this.prisma.placementSuggestion.create({
            data: {
              productId: product.id,
              fromLocationId: allocation.locationId,
              toLocationId: best.location.id,
              quantity: allocation.quantity,
              score: best.score,
              reason: `Mover de ${current.code} (acesso ${current.accessibility}) para ${best.location.code} (acesso ${best.location.accessibility}) — melhor encaixe para frequência ${product.turnoverScore}`
            }
          })
          suggestionsCreated += 1
        }
      }
    }

    return { productsUpdated: products.length, suggestionsCreated }
  }

  async listSuggestions(query: PaginationQueryDto & { status?: string }) {
    const { all, page, pageSize, skip, take } = getPaging(query)
    const where = { status: query.status ?? 'pending' }
    const orderBy = { score: 'desc' as const }
    const include = { product: { select: { sku: true, name: true } } }

    const rows = all
      ? await this.prisma.placementSuggestion.findMany({
          where,
          include,
          orderBy
        })
      : await this.prisma.placementSuggestion.findMany({
          where,
          include,
          orderBy,
          skip,
          take
        })
    const total = all
      ? rows.length
      : await this.prisma.placementSuggestion.count({ where })

    const locationIds = new Set<string>()
    rows.forEach((row) => {
      if (row.fromLocationId) {
        locationIds.add(row.fromLocationId)
      }
      locationIds.add(row.toLocationId)
    })
    const locations = await this.prisma.location.findMany({
      where: { id: { in: Array.from(locationIds) } },
      select: { id: true, code: true, name: true }
    })
    const byId = new Map(locations.map((l) => [l.id, l]))

    const data = rows.map((row) => ({
      ...row,
      fromLocation: row.fromLocationId
        ? (byId.get(row.fromLocationId) ?? null)
        : null,
      toLocation: byId.get(row.toLocationId) ?? null
    }))

    return paginated(
      data,
      total,
      all ? 1 : page,
      all ? data.length || 1 : pageSize
    )
  }

  async applySuggestion(id: string) {
    const suggestion = await this.prisma.placementSuggestion.findUnique({
      where: { id }
    })
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found')
    }
    if (suggestion.fromLocationId) {
      await this.reallocate(
        suggestion.productId,
        suggestion.fromLocationId,
        suggestion.toLocationId,
        suggestion.quantity
      )
    } else {
      await this.allocate(
        suggestion.productId,
        suggestion.toLocationId,
        suggestion.quantity
      )
    }
    await this.prisma.placementSuggestion.update({
      where: { id },
      data: { status: 'applied' }
    })
    return { success: true }
  }

  async dismissSuggestion(id: string) {
    await this.prisma.placementSuggestion.update({
      where: { id },
      data: { status: 'dismissed' }
    })
    return { success: true }
  }
}
