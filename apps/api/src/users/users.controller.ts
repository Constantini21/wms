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
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'
import { PaginationQueryDto } from '../common/pagination'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions(PERMISSIONS.USERS_READ)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query)
  }

  @RequirePermissions(PERMISSIONS.USERS_READ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @RequirePermissions(PERMISSIONS.USERS_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }
}
