import { prisma } from "../../config/db.js";

const projectsRepository = {
    createProject: async (data) => {
        return prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                orgId: data.orgId,
            },
        });
    },

    listProjects: async (orgId) => {
        return prisma.project.findMany({
            where: {
                orgId,
                deletedAt: null,
            },
        });
    },

    findProjectById: async (id, orgId) => {
        return prisma.project.findFirst({
            where: {
                id,
                orgId,
                deletedAt: null,
            },
        });
    },

    updateProject: async (id, updateData) => {
        return prisma.project.update({
            where: {
                id,
            },
            data: updateData,
        });
    },

    softDeleteProject: async (id) => {
        return prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },

    getDashboardCounts: async (projectId, orgId) => {
        const tasks = await prisma.task.groupBy({
            by: ["status"],
            where: {
                projectId,
                orgId,
                deletedAt: null,
            },
            _count: {
                _all: true,
            },
        });

        const counts = {
            todo: 0,
            in_progress: 0,
            review: 0,
            done: 0,
        };

        tasks.forEach((group) => {
            const key = group.status.toLowerCase();
            if (key in counts) {
                counts[key] = group._count._all;
            }
        });

        return counts;
    },
};

export default projectsRepository;
