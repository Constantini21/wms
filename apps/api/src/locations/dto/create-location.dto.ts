import { IsBoolean, IsOptional, IsString } from 'class-validator'

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
  @IsString()
  barcode?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
