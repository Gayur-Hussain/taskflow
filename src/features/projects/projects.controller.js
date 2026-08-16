import projectsService from "./projects.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const projectsController = {
    createProject: async (req, res) => {
        const { name, description } = req.body;
        const orgId = req.user.orgId;

        const project = await projectsService.createProject(name, description, orgId);
        return sendSuccess(res, 201, "Project created successfully", project);
    },

    listProjects: async (req, res) => {
        const orgId = req.user.orgId;
        const projects = await projectsService.listProjects(orgId);
        return sendSuccess(res, 200, "Projects retrieved successfully", projects);
    },

    getProjectById: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;

        const project = await projectsService.getProjectById(id, orgId);
        return sendSuccess(res, 200, "Project retrieved successfully", project);
    },

    updateProject: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;
        const { name, description } = req.body;

        const project = await projectsService.updateProject(id, orgId, { name, description });
        return sendSuccess(res, 200, "Project updated successfully", project);
    },

    deleteProject: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;

        await projectsService.deleteProject(id, orgId);
        return sendSuccess(res, 200, "Project deleted successfully");
    },

    getDashboard: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;

        const counts = await projectsService.getDashboard(id, orgId);
        return sendSuccess(res, 200, "Dashboard counts retrieved successfully", counts);
    },
};

export default projectsController;
