import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { PlacementService } from './placement.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { AllocateDto, ReallocateDto } from './dto/allocate.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'
import { PaginationQueryDto } from '../common/pagination'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly placementService: PlacementService
  ) {}

  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.findAll(query)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @Get('lookup')
  lookup(@Query('code') code: string) {
    return this.productsService.findByBarcode(code)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Post('recalculate')
  recalculate() {
    return this.placementService.recalculate()
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Post('reallocate')
  reallocate(@Body() dto: ReallocateDto & { productId: string }) {
    return this.placementService.reallocate(
      dto.productId,
      dto.fromLocationId,
      dto.toLocationId,
      dto.quantity
    )
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @Get(':id/allocations')
  allocations(@Param('id') id: string) {
    return this.placementService.listAllocations(id)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @Get(':id/suggest')
  suggest(@Param('id') id: string, @Query('quantity') quantity?: string) {
    return this.placementService.suggestForProduct(
      id,
      quantity ? Number(quantity) : 1
    )
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Post(':id/allocate')
  allocate(@Param('id') id: string, @Body() dto: AllocateDto) {
    return this.placementService.allocate(id, dto.locationId, dto.quantity)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }
}
