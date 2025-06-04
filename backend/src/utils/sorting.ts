import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface SortParams {
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export function applySortingToQueryBuilder<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  sortParams: SortParams,
  alias: string,
  allowedFields: string[] = []
) {
  const { sortField, sortDirection = 'ASC' } = sortParams;
  if (sortField && ((allowedFields.length == 0) || allowedFields.includes(sortField))) {
    const direction = sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    qb.orderBy(`${alias}.${sortField}`, direction);
  }

  return qb;
}


