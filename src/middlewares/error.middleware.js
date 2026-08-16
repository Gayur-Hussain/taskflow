import logger from "../utils/logger.js";
import { sendError } from "../utils/apiResponse.js";

const errorMiddleware = (err, req, res, next) => {
    const requestId = req.requestId || "unknown";

    logger.error(err.message || "Internal server error", {
        requestId,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
    });

    if (err.name === "ZodError" || err.isZod || err.issues) {
        const details = err.errors || err.issues || err.details || err;
        return sendError(res, 400, "Validation failed", "VALIDATION_ERROR", details);
    }

    const status = err.status || err.statusCode || 500;
    const code = err.code || "INTERNAL_SERVER_ERROR";
    const message = err.message || "Something went wrong";

    return sendError(res, status, message, code, err.details || {});
};

export default errorMiddleware;
