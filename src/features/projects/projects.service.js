import projectsRepository from "./projects.repository.js";

class ProjectsService {
    async createProject(name, description, orgId) {
        return projectsRepository.createProject({
            name,
            description,
            orgId,
        });
    }

    async listProjects(orgId) {
        return projectsRepository.listProjects(orgId);
    }

    async getProjectById(id, orgId) {
        const project = await projectsRepository.findProjectById(id, orgId);
        if (!project) {
            const err = new Error("Project not found");
            err.status = 404;
            err.code = "PROJECT_NOT_FOUND";
            throw err;
        }
        return project;
    }

    async updateProject(id, orgId, updateData) {
        await this.getProjectById(id, orgId);
        return projectsRepository.updateProject(id, updateData);
    }

    async deleteProject(id, orgId) {
        await this.getProjectById(id, orgId);
        return projectsRepository.softDeleteProject(id);
    }

    async getDashboard(id, orgId) {
        await this.getProjectById(id, orgId);
        return projectsRepository.getDashboardCounts(id, orgId);
    }
}

export default new ProjectsService();
