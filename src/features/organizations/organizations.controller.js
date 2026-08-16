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
};

export default organizationsController;
