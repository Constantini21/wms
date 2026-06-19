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
import { LocationsService } from './locations.service'
import { CreateLocationDto } from './dto/create-location.dto'
import { UpdateLocationDto } from './dto/update-location.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @RequirePermissions(PERMISSIONS.LOCATIONS_READ)
  @Get()
  findAll(@Query('areaId') areaId?: string) {
    return this.locationsService.findAll(areaId)
  }

  @RequirePermissions(PERMISSIONS.LOCATIONS_READ)
  @Get('lookup')
  lookup(@Query('code') code: string) {
    return this.locationsService.findByBarcode(code)
  }

  @RequirePermissions(PERMISSIONS.LOCATIONS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id)
  }

  @RequirePermissions(PERMISSIONS.LOCATIONS_WRITE)
  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.LOCATIONS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto)
  }

  @RequirePermissions(PERMISSIONS.LOCATIONS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id)
  }
}
