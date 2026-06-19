import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { RolesModule } from './roles/roles.module'
import { WarehousesModule } from './warehouses/warehouses.module'
import { AreasModule } from './areas/areas.module'
import { LocationsModule } from './locations/locations.module'
import { AislesModule } from './aisles/aisles.module'
import { ProductsModule } from './products/products.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    WarehousesModule,
    AreasModule,
    LocationsModule,
    AislesModule,
    ProductsModule
  ]
})
export class AppModule {}
