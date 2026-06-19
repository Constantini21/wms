import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

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
  @IsInt()
  @Min(1)
  @Max(20)
  floors?: number

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
