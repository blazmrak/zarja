import { IsOptional, Max, Min } from './validation'
import { Public } from './serialization'
import { IsString } from 'class-validator'

export interface Pagination<T> {
  data: T[]
  page: number
  perPage: number
  count: number
  maxPage: number
}

export class PaginationParams {
  @IsOptional()
  @Min(1)
  @Public()
  page?: number

  @IsOptional()
  @Max(100)
  @Public()
  perPage?: number
}

export class SearchParams extends PaginationParams {
  @IsOptional()
  @IsString()
  @Public()
  search?: string
}

export type PaginationLimits = {
  page: number
  perPage: number
}

export function setPaginationDefaults<T>(params: T): T & PaginationLimits {
  return {
    page: 1,
    perPage: 10,
    ...params,
  }
}

export async function executePaginatedQuery<P, T, R extends T[]>(
  params: P & Partial<PaginationLimits>,
  query: (p: P & PaginationLimits) => Promise<[R, number]>,
): Promise<Pagination<T>> {
  const defaults = setPaginationDefaults(params)
  const [data, count] = await query(defaults)

  const maxPage = Math.ceil(count / defaults.perPage)

  return {
    data,
    perPage: defaults.perPage,
    page: defaults.page,
    count,
    maxPage,
  }
}
