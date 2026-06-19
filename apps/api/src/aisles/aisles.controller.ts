import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { AislesService } from './aisles.service'
import { CreateAisleDto } from './dto/create-aisle.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('aisles')
export class AislesController {
  constructor(private readonly aislesService: AislesService) {}

  @RequirePermissions(PERMISSIONS.AREAS_READ)
  @Get()
  list(@Query('areaId') areaId: string) {
    return this.aislesService.listByArea(areaId)
  }

  @RequirePermissions(PERMISSIONS.AREAS_WRITE)
  @Post()
  create(@Body() dto: CreateAisleDto) {
    return this.aislesService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.AREAS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aislesService.remove(id)
  }
}
