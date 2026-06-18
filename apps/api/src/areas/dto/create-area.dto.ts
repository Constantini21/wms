import { IsBoolean, IsOptional, IsString } from 'class-validator'

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
  @IsBoolean()
  active?: boolean
}
