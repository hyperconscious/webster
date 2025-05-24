export interface IEventFilters {
    format?: string;
    themes?: string;
    minPrice?: number;
    maxPrice?: number;
    startDate?: Date;
    endDate?: Date;
}

export interface EventSortOption {
    field: 'startDate' | 'price';
    direction: 'ASC' | 'DESC';
}

export interface CommentSortOption {
    field: 'createdAt' | 'updatedAt';
    direction: 'ASC' | 'DESC';
}

export interface QueryOptions {
    page?: number;
    limit?: number;
    sortField?: string;
    sortDirection?: 'ASC' | 'DESC';
    filters?: IEventFilters;
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}
