export interface IProjectFilters {
    name?: string;
    isTemplate?: boolean;
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
    filters?: IProjectFilters;
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}
