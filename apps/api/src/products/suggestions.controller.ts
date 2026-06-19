import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { PlacementService } from './placement.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { PERMISSIONS } from '../auth/permissions'
import { PaginationQueryDto } from '../common/pagination'

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly placementService: PlacementService) {}

  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  @Get()
  list(@Query() query: PaginationQueryDto, @Query('status') status?: string) {
    return this.placementService.listSuggestions({ ...query, status })
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Post(':id/apply')
  apply(@Param('id') id: string) {
    return this.placementService.applySuggestion(id)
  }

  @RequirePermissions(PERMISSIONS.PRODUCTS_WRITE)
  @Post(':id/dismiss')
  dismiss(@Param('id') id: string) {
    return this.placementService.dismissSuggestion(id)
  }
}
