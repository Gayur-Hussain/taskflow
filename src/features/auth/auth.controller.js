import authService from "./auth.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { setTokenCookies, clearTokenCookies } from "../../utils/tokenGenerator.js";

const authController = {
    registerUser: async (req, res) => {
        const { name, email, password } = req.body;
        const user = await authService.register({ name, email, password });
        return sendSuccess(res, 201, "User registered successfully", user);
    },

    loginUser: async (req, res) => {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.login({ email, password });

        setTokenCookies(res, accessToken, refreshToken);

        return sendSuccess(res, 200, "Logged in successfully", {
            user,
            accessToken,
            refreshToken,
        });
    },

    logoutUser: async (req, res) => {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        await authService.logout(refreshToken);
        clearTokenCookies(res);
        return sendSuccess(res, 200, "Logged out successfully");
    },

    refreshSession: async (req, res) => {
        const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

        setTokenCookies(res, accessToken, refreshToken);

        return sendSuccess(res, 200, "Token refreshed successfully", {
            accessToken,
            refreshToken,
        });
    },

    getCurrentUser: async (req, res) => {
        return sendSuccess(res, 200, "Current user fetched successfully", {
            user: req.user,
        });
    },
};

export default authController;
