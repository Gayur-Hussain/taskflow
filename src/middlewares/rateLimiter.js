const ipRequests = new Map();

setInterval(() => ipRequests.clear(), 60 * 1000);

export const authRateLimiter = (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

    const current = ipRequests.get(ip) || 0;

    if (current >= 10) {
        const err = new Error("Too many requests. Please try again after a minute.");
        err.status = 429;
        err.code = "RATE_LIMIT_EXCEEDED";
        return next(err);
    }

    ipRequests.set(ip, current + 1);
    next();
};
