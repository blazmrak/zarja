import { IsOptional, Max, Min } from './validation'
import { Public } from './serialization'
import { IsString } from 'class-validator'

export interface Pagination<T> {
  data: T[]
  page: number
  length: number
  maxPage: number
}

export class PaginationParams {
  @IsOptional()
  @Min(1)
  // @Default(1)
  @Public()
  page?: number

  @IsOptional()
  @Max(100)
  // @Default(10)
  @Public()
  length?: number
}

export class SearchParams extends PaginationParams {
  @IsOptional()
  @IsString()
  @Public()
  search?: string
}
