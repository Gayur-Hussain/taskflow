import jwt from "jsonwebtoken";
import crypto from "crypto";

export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateAccessToken = (userId, orgId = null, role = null) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    return jwt.sign(
        { id: userId, orgId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString("hex");
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const clearTokenCookies = (res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
};
