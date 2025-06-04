// utils/paginateQueryBuilder.ts
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { applySortingToQueryBuilder } from './sorting';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export async function paginateQueryBuilder<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  options: PaginationOptions = {}
): Promise<PaginationResult<T>> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 10;
  const [data, total] =  await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
