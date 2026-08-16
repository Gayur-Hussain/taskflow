import organizationsService from "./organizations.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { setTokenCookies } from "../../utils/tokenGenerator.js";

const organizationsController = {
    createOrg: async (req, res) => {
        const { name } = req.body;
        const userId = req.user.id;

        const { organization, membership, accessToken, refreshToken } =
            await organizationsService.createOrganization(name, userId);

        setTokenCookies(res, accessToken, refreshToken);

        return sendSuccess(res, 201, "Organization created successfully", {
            organization,
            membership,
            accessToken,
            refreshToken,
        });
    },

    getMemberships: async (req, res) => {
        const userId = req.user.id;
        const memberships = await organizationsService.getMemberships(userId);
        return sendSuccess(res, 200, "User memberships retrieved successfully", memberships);
    },

    getOrgMembers: async (req, res) => {
        const orgId = req.user.orgId;

        if (!orgId) {
            const err = new Error("Organization context is missing. Please select an organization.");
            err.status = 400;
            err.code = "ORG_CONTEXT_MISSING";
            throw err;
        }

        const members = await organizationsService.getOrgMembers(orgId);
        const mappedMembers = members.map((member) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            role: member.role,
        }));

        return sendSuccess(res, 200, "Organization members retrieved successfully", {
            members: mappedMembers,
        });
    },
};

export default organizationsController;
