import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserService } from "../services/user.service";
import { ProjectService } from "../services/project.service";
import { projectQueryDto } from "../dto/project.dto";
import { checkBadRequestError } from "../utils/error-handler";
import { Project } from "../entities/project.entity";


export class ProjectController
{
    static userService = new UserService();
    static projectService = new ProjectService();

    public static async getAllProjects(req:Request , res: Response)
    {
        const validatedQuery = projectQueryDto.safeParse(req.query);
        checkBadRequestError(validatedQuery.error);
        if (!validatedQuery.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Invalid query parameters',
                errors: validatedQuery.error.errors,
            });
        }
        return res.status(StatusCodes.OK).json(await ProjectController.projectService.getAllProjects(validatedQuery.data));

    }

    public static async getProjectById(req: Request, res: Response)
    {
        const user = await ProjectController.userService.getUserById(req.user?.id!);
        const projectId = parseInt(req.params.id);
        if(!projectId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project ID is not a number.' });
        }
        const project = await ProjectController.projectService.getProjectById(projectId);
        if (!project) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found.' });
        }
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'You need to be logged in.' });
        }
        if (!(await ProjectController.projectService.checkAuthorship(projectId, user.id)) && user.role !== 'admin') {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not allowed to access this project.' });
        }
        return res.status(StatusCodes.OK).json(project);
    }

    public static async getMyProjects(req: Request, res: Response)
    {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'You need to be logged in.' });
        }
        const projects = await ProjectController.projectService.getProjectsByUserId(userId);
        res.status(StatusCodes.OK).json(projects);
    }


    public static async getProjectsByUserId(req: Request, res: Response)
    {
        const userId = req.params.user_id;
        res.status(StatusCodes.OK).json({ message: `Get projects by user id: ${userId}` });
    }

    public static async createProject(req: Request, res: Response)
    {
        const user = await ProjectController.userService.getUserById(req.user?.id!);
        console.log('User:', user);
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'You need to be logged in.' });
        }
        const projectData: Partial<Project> = req.body;
        projectData.user = user;
        const newProject = await ProjectController.projectService.createProject(projectData);
        res.status(StatusCodes.CREATED).json(newProject);
    }

    public static async updateProject(req: Request, res: Response)
    {
        const projectId = parseInt(req.params.id);
        if (!projectId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project ID is required.' });
        }
        const project = await ProjectController.projectService.getProjectById(projectId);
        if (!project) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found.' });
        }
        const user = await ProjectController.userService.getUserById(req.user?.id!);
        if (!(await ProjectController.projectService.checkAuthorship(projectId, user.id)) && user.role !== 'admin') {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not allowed to update this project.' });
        }
        const projectData: Partial<Project> = req.body;
        projectData.id = projectId;
        const updatedProject = await ProjectController.projectService.updateProject(projectId, projectData);
        if (!updatedProject) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found.' });
        }
        return res.status(StatusCodes.OK).json(updatedProject);
    }

    public static async deleteProject(req: Request, res: Response)
    {
        const projectId = parseInt(req.params.id);
        if (!projectId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project ID is required.' });
        }
        const user = await ProjectController.userService.getUserById(req.user?.id!);
        if (!(await ProjectController.projectService.checkAuthorship(projectId, user.id)) && user.role !== 'admin') {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not allowed to delete this project.' });
        }
        if (!(await ProjectController.projectService.getProjectById(projectId))) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found.' });
        }
        await ProjectController.projectService.deleteProject(projectId);
        return res.status(StatusCodes.NO_CONTENT).json({ message: 'Project deleted successfully.' });
    }

    public static async copyProject(req: Request, res: Response)
    {
        const projectId = req.params.id;
        if (!projectId) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Project ID is required.' });
        }
        const user = await ProjectController.userService.getUserById(req.user?.id!);
        if (!(await ProjectController.projectService.checkAuthorship(parseInt(projectId), user.id)) && user.role !== 'admin') {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'You are not allowed to copy this project.' });
        }
        const copiedProject = await ProjectController.projectService.copyProject(parseInt(projectId));
        if (!copiedProject) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Project not found.' });
        }
        return res.status(StatusCodes.CREATED).json(copiedProject);
    }
}