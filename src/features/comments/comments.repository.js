import { prisma } from "../../config/db.js";

const commentsRepository = {
    createComment: async ({ content, taskId, userId, orgId }) => {
        return prisma.comment.create({
            data: {
                content,
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

    listCommentsByTaskId: async (taskId, orgId) => {
        return prisma.comment.findMany({
            where: {
                taskId,
                orgId,
            },
            orderBy: {
                createdAt: "asc",
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    },
};

export default commentsRepository;
