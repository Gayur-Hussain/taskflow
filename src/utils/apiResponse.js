export const sendSuccess = (res, statusCode = 200, message = "Success", data = null, extra = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...extra
    });
};

export const sendError = (res, statusCode = 500, message = "Internal server error", errorCode = "INTERNAL_SERVER_ERROR", details = {}) => {
    return res.status(statusCode).json({
        success: false,
        error: message,
        code: errorCode,
        details
    });
};

