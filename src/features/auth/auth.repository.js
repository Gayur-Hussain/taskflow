import { prisma } from "../../config/db.js";

const authRepository = {
    findUserByEmail: async (email) => {
        return prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    select: {
                        orgId: true,
                        role: true,
                    },
                },
            },
        });
    },

    findUserById: async (id) => {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
    },

    createUser: async (userData) => {
        return prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                password: userData.password,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });
    },

    findRefreshToken: async (tokenHash) => {
        return prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
    },

    createRefreshToken: async ({ userId, tokenHash, expiresAt }) => {
        return prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    },

    revokeRefreshToken: async (id, replacedByTokenId = null) => {
        return prisma.refreshToken.update({
            where: { id },
            data: {
                revokedAt: new Date(),
                replacedByTokenId,
            },
        });
    },

    revokeAllUserTokens: async (userId) => {
        return prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    },
};

export default authRepository;
