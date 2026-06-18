import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'
import { WarehousesService } from './warehouses.service'
import { CreateWarehouseDto } from './dto/create-warehouse.dto'
import { UpdateWarehouseDto } from './dto/update-warehouse.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @RequirePermissions(PERMISSIONS.WAREHOUSES_READ)
  @Get()
  findAll() {
    return this.warehousesService.findAll()
  }

  @RequirePermissions(PERMISSIONS.WAREHOUSES_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id)
  }

  @RequirePermissions(PERMISSIONS.WAREHOUSES_WRITE)
  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.WAREHOUSES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto)
  }

  @RequirePermissions(PERMISSIONS.WAREHOUSES_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehousesService.remove(id)
  }
}
