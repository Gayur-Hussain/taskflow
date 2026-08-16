import { prisma } from "../../config/db.js";

const organizationsRepository = {
    createOrganization: async (name, userId) => {
        return prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: { name },
            });

            const membership = await tx.orgMember.create({
                data: {
                    orgId: org.id,
                    userId,
                    role: "ORG_ADMIN",
                },
            });

            return { org, membership };
        });
    },

    findMembership: async (userId, orgId) => {
        return prisma.orgMember.findUnique({
            where: {
                userId_orgId: {
                    userId,
                    orgId,
                },
            },
        });
    },

    listUserMemberships: async (userId) => {
        return prisma.orgMember.findMany({
            where: { userId },
            include: {
                organization: true,
            },
        });
    },

    findOrgMemberByUserId: async (orgId, userId) => {
        return prisma.orgMember.findUnique({
            where: {
                userId_orgId: {
                    userId,
                    orgId,
                },
            },
        });
    },
};

export default organizationsRepository;
