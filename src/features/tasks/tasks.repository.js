import { prisma } from "../../config/db.js";

const tasksRepository = {
    createTask: async (data) => {
        return prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                orgId: data.orgId,
                projectId: data.projectId,
            },
            include: {
                project: {
                    select: { id: true, name: true },
                },
            },
        });
    },

    findTaskById: async (id, orgId) => {
        return prisma.task.findFirst({
            where: {
                id,
                orgId,
                deletedAt: null,
            },
            include: {
                assignments: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                project: {
                    select: { id: true, name: true },
                },
            },
        });
    },

    listTasks: async (orgId, filters) => {
        const where = {
            orgId,
            deletedAt: null,
        };

        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.priority) {
            where.priority = filters.priority;
        }
        if (filters.assignee) {
            where.assignments = {
                some: {
                    userId: filters.assignee,
                },
            };
        }
        if (filters.from || filters.to) {
            where.dueDate = {};
            if (filters.from) {
                where.dueDate.gte = new Date(filters.from);
            }
            if (filters.to) {
                where.dueDate.lte = new Date(filters.to);
            }
        }

        let orderBy = { createdAt: "desc" };
        if (filters.sort) {
            const isDesc = filters.sort.startsWith("-");
            const field = isDesc ? filters.sort.substring(1) : filters.sort;
            orderBy = { [field]: isDesc ? "desc" : "asc" };
        }

        const skip = (filters.page - 1) * filters.limit;
        const take = filters.limit;

        const [data, total] = await prisma.$transaction([
            prisma.task.findMany({
                where,
                orderBy,
                skip,
                take,
                include: {
                    assignments: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
                    project: {
                        select: { id: true, name: true },
                    },
                },
            }),
            prisma.task.count({ where }),
        ]);

        return { data, total };
    },

    updateTask: async (id, updateData) => {
        const data = { ...updateData };
        if (data.dueDate !== undefined) {
            data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        }
        return prisma.task.update({
            where: { id },
            data,
            include: {
                project: {
                    select: { id: true, name: true },
                },
            },
        });
    },

    softDeleteTask: async (id) => {
        return prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    },

    findAssignment: async (taskId, userId) => {
        return prisma.taskAssignment.findUnique({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });
    },

    assignTask: async (taskId, userId, orgId) => {
        return prisma.taskAssignment.create({
            data: {
                taskId,
                userId,
                orgId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    },

    unassignTask: async (taskId, userId) => {
        return prisma.taskAssignment.delete({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });
    },
};

export default tasksRepository;
