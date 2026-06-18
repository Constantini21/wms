import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  warehouseId?: string

  @IsOptional()
  @IsString()
  barcode?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
