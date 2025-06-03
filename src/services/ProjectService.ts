// src/services/ProjectService.ts
import axios from '../api/axios';
import type { PaginatedResponse, QueryOptions } from '../types/query';
import type { Project } from '../types';

class ProjectService {
    static async getAllProjects(query: QueryOptions): Promise<PaginatedResponse<Project>> {
        const response = await axios.get('/api/projects', { params: query });
        return response.data;
    }

    static async getProjectBySlug(slug: string): Promise<Project> {
        const response = await axios.get(`/api/projects/${slug}`);
        return response.data;
    }

    static async getMyProjects(query: QueryOptions): Promise<PaginatedResponse<Project>> {
        const response = await axios.get('/api/projects/my-projects', { params: query });
        return response.data;
    }

    static async getProjectsByUserId(userId: number): Promise<Project[]> {
        const response = await axios.get(`/api/projects/user/${userId}`);
        return response.data;
    }

    static async createProject(projectData: Partial<Project>): Promise<Project> {
        console.log('Creating project with data:', projectData);
        const response = await axios.post('/api/projects', projectData);
        return response.data;
    }

    static async updateProject(slug: string, projectData: Partial<Project>): Promise<Project> {
        const response = await axios.patch(`/api/projects/${slug}`, projectData);
        return response.data;
    }

    static async deleteProject(slug: string): Promise<void> {
        await axios.delete(`/api/projects/${slug}`);
    }

    static async copyProject(slug: string): Promise<Project> {
        const response = await axios.post(`/api/projects/${slug}/copy`);
        return response.data;
    }
}

export default ProjectService;
