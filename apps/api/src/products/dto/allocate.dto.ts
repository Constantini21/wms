import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class AllocateDto {
  @IsString()
  locationId: string

  @IsInt()
  @Min(1)
  quantity: number
}

export class ReallocateDto {
  @IsString()
  fromLocationId: string

  @IsString()
  toLocationId: string

  @IsInt()
  @Min(1)
  quantity: number
}

export class SuggestQueryDto {
  @IsOptional()
  @IsString()
  quantity?: string
}
