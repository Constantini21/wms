import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  sku?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  barcode?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  turnoverScore?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
