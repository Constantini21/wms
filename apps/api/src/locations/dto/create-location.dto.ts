import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class CreateLocationDto {
  @IsString()
  code: string

  @IsString()
  areaId: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  aisle?: string

  @IsOptional()
  @IsString()
  floor?: string

  @IsOptional()
  @IsString()
  position?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  accessibility?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number

  @IsOptional()
  @IsString()
  barcode?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
