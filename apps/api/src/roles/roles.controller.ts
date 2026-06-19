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
import { RolesService } from './roles.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'
import { PaginationQueryDto } from '../common/pagination'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.rolesService.findAll(query)
  }

  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @Get('permissions')
  listPermissions() {
    return this.rolesService.listPermissions()
  }

  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id)
  }

  @RequirePermissions(PERMISSIONS.ROLES_WRITE)
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.ROLES_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto)
  }

  @RequirePermissions(PERMISSIONS.ROLES_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id)
  }
}
