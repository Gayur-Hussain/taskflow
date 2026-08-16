import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { sendError } from "../utils/apiResponse.js";

export const protectRoute = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    } else if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(";").map((c) => c.trim());
        const accessTokenCookie = cookies.find((c) => c.startsWith("accessToken="));
        token = accessTokenCookie?.split("=")[1];
    }

    if (!token) {
        return sendError(res, 401, "Authentication required", "UNAUTHORIZED");
    }

    if (!process.env.JWT_SECRET) {
        return sendError(res, 500, "JWT secret is not configured", "CONFIG_ERROR");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            return sendError(res, 401, "Invalid or expired token", "UNAUTHORIZED");
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        const headerOrgId = req.headers["x-organization-id"];

        if (headerOrgId) {
            const membership = await prisma.orgMember.findUnique({
                where: {
                    userId_orgId: {
                        userId: user.id,
                        orgId: headerOrgId,
                    },
                },
            });

            if (membership) {
                req.user.orgId = headerOrgId;
                req.user.role = membership.role;
            } else {
                return sendError(
                    res,
                    403,
                    "Forbidden. You are not a member of this organization",
                    "FORBIDDEN",
                );
            }
        } else if (decoded.orgId) {
            const membership = await prisma.orgMember.findUnique({
                where: {
                    userId_orgId: {
                        userId: user.id,
                        orgId: decoded.orgId,
                    },
                },
            });
            if (membership) {
                req.user.orgId = decoded.orgId;
                req.user.role = membership.role;
            } else {
                const firstMember = await prisma.orgMember.findFirst({
                    where: { userId: user.id },
                });
                if (firstMember) {
                    req.user.orgId = firstMember.orgId;
                    req.user.role = firstMember.role;
                }
            }
        } else {
            const firstMember = await prisma.orgMember.findFirst({
                where: { userId: user.id },
            });
            if (firstMember) {
                req.user.orgId = firstMember.orgId;
                req.user.role = firstMember.role;
            }
        }

        return next();
    } catch (error) {
        return sendError(res, 401, "Invalid or expired token", "UNAUTHORIZED");
    }
};
