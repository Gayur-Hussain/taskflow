import crypto from "crypto";
import logger from "../utils/logger.js";

const requestLogger = (req, res, next) => {
    req.requestId = crypto.randomUUID();
    const startTime = process.hrtime();

    res.on("finish", () => {
        const elapsedDiff = process.hrtime(startTime);
        const responseTimeMs = (elapsedDiff[0] * 1000 + elapsedDiff[1] / 1e6).toFixed(2);

        logger.info(`${req.method} ${req.originalUrl}`, {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            responseTime: `${responseTimeMs}ms`,
            userId: req.user?.id || "unauthenticated",
            orgId: req.user?.orgId || "none",
        });
    });

    next();
};

export default requestLogger;
