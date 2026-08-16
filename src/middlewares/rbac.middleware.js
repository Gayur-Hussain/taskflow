import { sendError } from "../utils/apiResponse.js";

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 401, "Authentication required", "UNAUTHORIZED");
        }

        if (!req.user.orgId) {
            return sendError(res, 403, "Organization context is missing. Please create or select an organization.", "ORG_CONTEXT_MISSING");
        }

        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res, 403, "Forbidden. Insufficient permissions", "FORBIDDEN");
        }

        next();
    };
};
