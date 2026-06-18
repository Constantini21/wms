import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
