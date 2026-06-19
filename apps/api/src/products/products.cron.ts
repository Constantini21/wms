import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PlacementService } from './placement.service'

@Injectable()
export class ProductsCron {
  private readonly logger = new Logger(ProductsCron.name)

  constructor(private readonly placementService: PlacementService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'recalculate-slotting' })
  async handleDailyRecalculation() {
    const result = await this.placementService.recalculate()
    this.logger.log(
      `Slotting recalculated: ${result.productsUpdated} products, ${result.suggestionsCreated} suggestions`
    )
  }
}
