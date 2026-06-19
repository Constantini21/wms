import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class CreateWarehouseDto {
  @IsString()
  code: string

  @IsString()
  name: string

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
