import { Router } from "express";
import { validateSchema } from "../middlewares/validation.middleware";
import { auth, authAdmin, authOwnerOrAdmin } from "../middlewares/auth.middleware";
import { ProjectController } from "../controllers/project.controller";
import { createProjectDto, projectQueryDto, updateProjectDto } from "../dto/project.dto";


const projectRouter = Router();

projectRouter.get("/", authAdmin, validateSchema(projectQueryDto, 'query'), ProjectController.getAllProjects);
projectRouter.get("/my-projects", auth, ProjectController.getMyProjects);
projectRouter.get("/:slug", auth, ProjectController.getProjectBySlug);

projectRouter.get("/of-user/:user_id", authOwnerOrAdmin, ProjectController.getProjectsByUserId);

projectRouter.post("/", auth, validateSchema(createProjectDto), ProjectController.createProject);
projectRouter.patch("/:slug", auth, validateSchema(updateProjectDto), ProjectController.updateProject);
projectRouter.post("/:slug/copy", auth, ProjectController.copyProject);

projectRouter.delete("/:slug", auth, ProjectController.deleteProject);

export default projectRouter;
