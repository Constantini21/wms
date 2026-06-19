import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { PlacementService } from './placement.service'
import { ProductsController } from './products.controller'
import { SuggestionsController } from './suggestions.controller'
import { ProductsCron } from './products.cron'

@Module({
  providers: [ProductsService, PlacementService, ProductsCron],
  controllers: [ProductsController, SuggestionsController]
})
export class ProductsModule {}
