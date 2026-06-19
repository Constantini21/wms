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
import { AreasService } from './areas.service'
import { CreateAreaDto } from './dto/create-area.dto'
import { UpdateAreaDto } from './dto/update-area.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'
import { PaginationQueryDto } from '../common/pagination'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @RequirePermissions(PERMISSIONS.AREAS_READ)
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('warehouseId') warehouseId?: string
  ) {
    return this.areasService.findAll(warehouseId, query)
  }

  @RequirePermissions(PERMISSIONS.AREAS_READ)
  @Get('lookup')
  lookup(@Query('code') code: string) {
    return this.areasService.findByBarcode(code)
  }

  @RequirePermissions(PERMISSIONS.AREAS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.areasService.findOne(id)
  }

  @RequirePermissions(PERMISSIONS.AREAS_WRITE)
  @Post(':id/generate-locations')
  generateLocations(@Param('id') id: string) {
    return this.areasService.generateLocations(id)
  }

  @RequirePermissions(PERMISSIONS.AREAS_WRITE)
  @Post()
  create(@Body() dto: CreateAreaDto) {
    return this.areasService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.AREAS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.areasService.update(id, dto)
  }

  @RequirePermissions(PERMISSIONS.AREAS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.areasService.remove(id)
  }
}
