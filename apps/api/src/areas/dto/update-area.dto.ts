import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

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
  @IsInt()
  @Min(1)
  @Max(50)
  aisles?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  levels?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  positionsPerLevel?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  floor?: number

  @IsOptional()
  @IsNumber()
  mapX?: number

  @IsOptional()
  @IsNumber()
  mapZ?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
