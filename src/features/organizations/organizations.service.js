import organizationsRepository from "./organizations.repository.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../../utils/tokenGenerator.js";
import authRepository from "../auth/auth.repository.js";

class OrganizationsService {
    async createOrganization(name, userId) {
        const { org, membership } = await organizationsRepository.createOrganization(name, userId);


        const accessToken = generateAccessToken(userId, org.id, membership.role);
        const rawRefreshToken = generateRefreshToken();
        const tokenHash = hashToken(rawRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await authRepository.createRefreshToken({
            userId,
            tokenHash,
            expiresAt,
        });

        return {
            organization: org,
            membership,
            accessToken,
            refreshToken: rawRefreshToken,
        };
    }

    async getMemberships(userId) {
        return organizationsRepository.listUserMemberships(userId);
    }

    async getOrgMembers(orgId) {
        return organizationsRepository.listOrgMembers(orgId);
    }
}

export default new OrganizationsService();
