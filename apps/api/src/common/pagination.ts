import { IsInt, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number

  @IsOptional()
  all?: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Paging {
  all: boolean
  page: number
  pageSize: number
  skip: number
  take: number
}

const DEFAULT_PAGE_SIZE = 20

export function getPaging(query: PaginationQueryDto): Paging {
  const all = query.all === 'true' || query.all === '1'
  const page = query.page && query.page > 0 ? query.page : 1
  const pageSize =
    query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE
  return { all, page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): Paginated<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  }
}
