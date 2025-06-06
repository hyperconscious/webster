export const UserRole = {
    admin:
        'admin',
    user: 'user',
} as const;

export type UserRole = keyof typeof UserRole;
export interface User {
    id: number;
    login: string;
    full_name: string;
    email: string;
    verified: boolean;
    role: UserRole;
    avatar: string;
    createdAt: Date;
    updatedAt: Date;
}
