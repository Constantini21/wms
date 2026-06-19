import { Module } from '@nestjs/common'
import { AislesService } from './aisles.service'
import { AislesController } from './aisles.controller'

@Module({
  providers: [AislesService],
  controllers: [AislesController]
})
export class AislesModule {}
