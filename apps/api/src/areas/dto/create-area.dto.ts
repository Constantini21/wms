import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class CreateAreaDto {
  @IsString()
  code: string

  @IsString()
  name: string

  @IsString()
  warehouseId: string

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
  @IsBoolean()
  active?: boolean
}
