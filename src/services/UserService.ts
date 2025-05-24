import axios from '../api/axios'
import type { PaginatedResponse, QueryOptions } from '../types/query';
import type { User } from '../types/user';

class UserService {
    static async getUsers(query: QueryOptions): Promise<PaginatedResponse<User>> {
        const response = await axios.get('/api/users', { params: query });
        return response.data;
    }

    static async getUserProfile(userId: number): Promise<User> {
        const response = await axios.get(`/api/users/${userId}`);
        return response.data.data;
    }

    static async getUserByEmail(email: string): Promise<User> {
        const response = await axios.get(`/api/users/mail/${email}`);
        return response.data.data;
    }

    static async getMyProfile(): Promise<User> {
        const response = await axios.get('/api/users/my-profile');
        return response.data.data;
    }

    static async getUserAttendedEvents(userId: number, query: QueryOptions): Promise<PaginatedResponse<Event>> {
        const response = await axios.get(`/api/users/${userId}/attendedEvents`, { params: query });
        return response.data;
    }

    static async updateUserProfile(userId: number, data: Partial<User>): Promise<User> {
        const response = await axios.patch(`/api/users/${userId}`, data);
        return response.data;
    }

    static async uploadAvatar(userId: number, formData: FormData): Promise<User> {
        const response = await axios.patch(`/api/users/${userId}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }

    static async deleteUserProfile(userId: number): Promise<void> {
        const response = await axios.delete(`/api/users/${userId}`);
        return response.data;
    }

    static async verifyCredential(userId: number, credential: string): Promise<boolean> {
        const response = await axios.post(`/api/users/${userId}/verifyCredential`, { credential });
        return response.data;
    }
}

export default UserService;