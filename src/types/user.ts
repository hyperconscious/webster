export const UserRole = {
    visitor: 'visitor',
    editor: 'editor',
    admin: 'admin',
    owner: 'owner',
} as const;

export type UserRole = keyof typeof UserRole;
export interface User {
    id: number;
    login: string;
    full_name: string;
    email: string;
    verified: boolean;
    avatar: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
