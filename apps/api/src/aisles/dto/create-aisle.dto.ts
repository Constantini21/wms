import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateAisleDto {
  @IsString()
  areaId: string

  @IsString()
  code: string

  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @IsString()
  corridorFront?: string

  @IsOptional()
  @IsString()
  corridorBack?: string

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
}
