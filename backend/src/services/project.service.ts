import { getRepository, ObjectId, Repository } from "typeorm";
import { AppDataSource } from "../config/orm.config";
import { Project } from "../entities/project.entity";
import { paginateQueryBuilder, PaginationResult } from "../utils/paginator";
import { ProjectQueryDto } from "../dto/project.dto";
import { applyCondition } from "../utils/filtering";
import { applySortingToQueryBuilder } from "../utils/sorting";
import { nanoid } from 'nanoid';


export class ProjectService {
    projectRepository: Repository<Project> = AppDataSource.getRepository(Project);

    public async getAllProjects(validatedQuery: ProjectQueryDto): Promise<PaginationResult<Project>> {
        const queryBuilder = this.projectRepository.createQueryBuilder("project")
        if (validatedQuery.filters) {
            applyCondition(queryBuilder, 'name', "LIKE", validatedQuery.filters.name);
        }

        applySortingToQueryBuilder(queryBuilder, {
            sortDirection: validatedQuery.sortDirection || 'ASC',
            sortField: validatedQuery.sortBy || 'createdAt',
        }, 'project');

        return await paginateQueryBuilder(queryBuilder, {
            page: validatedQuery.page,
            limit: validatedQuery.limit,
        });
    }

    public async getProjectById(id: number): Promise<Project | null> {
        return this.projectRepository.findOne({ where: { id }, relations: ['user'] });
    }

    public async getProjectBySlug(slug: string): Promise<Project | null> {
        return this.projectRepository.findOne({ where: { slug }, relations: ['user'] });
    }

    public async getProjectsByUserId(userId: number, validatedQuery: ProjectQueryDto): Promise<PaginationResult<Project>> {
        const queryBuilder = this.projectRepository.createQueryBuilder("project")
        queryBuilder.where("project.userId = :userId", { userId });
        queryBuilder.leftJoinAndSelect("project.user", "user");
        if (validatedQuery.filters) {
            applyCondition(queryBuilder, 'name', "LIKE", validatedQuery.filters.name);
            applyCondition(queryBuilder, 'isTemplate', "=", validatedQuery.filters.isTemplate);
        }

        applySortingToQueryBuilder(queryBuilder, {
            sortDirection: validatedQuery.sortDirection || 'ASC',
            sortField: validatedQuery.sortBy || 'createdAt',
        }, 'project');

        return await paginateQueryBuilder(queryBuilder, {
            page: validatedQuery.page,
            limit: validatedQuery.limit,
        });
    }

    public async createProject(projectData: Partial<Project>): Promise<Project> {
        const slug = nanoid(16);
        const project = this.projectRepository.create({
            ...projectData,
            slug,
            name: projectData.name || `Project ${slug}`,
        });
        return this.projectRepository.save(project);
    }

    public async updateProject(id: number, projectData: Partial<Project>): Promise<Project | null> {
        await this.projectRepository.update(id, projectData);
        return this.getProjectById(id);
    }

    public async deleteProject(id: number): Promise<void> {
        await this.projectRepository.delete(id);
    }

    public async copyProject(slug: string): Promise<Project | null> {
        const project = await this.getProjectBySlug(slug);
        const newSlug = nanoid(16);
        if (!project) {
            return null;
        }
        const newProject = this.projectRepository.create({
            ...project,
            id: undefined,
            slug: newSlug,
            name: `${project.name} (Copy)`,
            user: project.user,
            isTemplate: project.isTemplate || false,
        });
        return this.projectRepository.save(newProject);
    }

    public async checkAuthorship(projectSlug: string, userId: number): Promise<boolean> {
        const project = await this.projectRepository.findOne({
            where: { slug: projectSlug },
            relations: ['user'],
        });
        if (!project) {
            return false;
        }
        return project.user.id === userId;
    }

}