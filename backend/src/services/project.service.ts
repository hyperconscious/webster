import { getRepository, ObjectId, Repository } from "typeorm";
import { AppDataSource } from "../config/orm.config";
import { Project } from "../entities/project.entity";
import { paginateQueryBuilder, PaginationResult } from "../utils/paginator";
import { ProjectQueryDto } from "../dto/project.dto";
import { applyCondition } from "../utils/filtering";
import { applySortingToQueryBuilder } from "../utils/sorting";


export class ProjectService {
    projectRepository: Repository<Project> = AppDataSource.getRepository(Project);

    public async getAllProjects(validatedQuery: ProjectQueryDto): Promise<PaginationResult<Project>> {
        const queryBuilder =  this.projectRepository.createQueryBuilder("project")
        if(validatedQuery.filters) {
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
        return this.projectRepository.findOne({ where: { id } });
    }

    public async getProjectsByUserId(userId: number): Promise<Project[]> {
        return this.projectRepository.find({ where: { user: { id: userId } } });
    }

    public async createProject(projectData: Partial<Project>): Promise<Project> {
        const project = this.projectRepository.create(projectData);
        return this.projectRepository.save(project);
    }

    public async updateProject(id: number, projectData: Partial<Project>): Promise<Project | null> {
        await this.projectRepository.update(id, projectData);
        return this.getProjectById(id);
    }

    public async deleteProject(id: number): Promise<void> {
        await this.projectRepository.delete(id);
    }

    public async copyProject(id: number): Promise<Project | null> {
        const project = await this.getProjectById(id);
        if (!project) {
            return null;
        }
        const newProject = this.projectRepository.create({
            ...project,
            id: undefined,
            name: `${project.name} (Copy)`,
        });
        return this.projectRepository.save(newProject);
    }

    public async checkAuthorship(projectId: number, userId: number): Promise<boolean>
    {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ['user'],
        });
        if (!project) {
            return false;
        }
        return project.user.id === userId;
    }

}