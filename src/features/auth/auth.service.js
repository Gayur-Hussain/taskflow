import bcrypt from "bcrypt";
import authRepository from "./auth.repository.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../../utils/tokenGenerator.js";

class AuthService {
    async register({ name, email, password }) {
        const existingUser = await authRepository.findUserByEmail(email);
        if (existingUser) {
            const err = new Error("Email is already in use");
            err.status = 409;
            err.code = "EMAIL_ALREADY_IN_USE";
            throw err;
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        return authRepository.createUser({
            name,
            email,
            password: hashedPassword,
        });
    }

    async login({ email, password }) {
        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            const err = new Error("Invalid email or password");
            err.status = 401;
            err.code = "INVALID_CREDENTIALS";
            throw err;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const err = new Error("Invalid email or password");
            err.status = 401;
            err.code = "INVALID_CREDENTIALS";
            throw err;
        }

        const primaryMembership = user.memberships?.[0];
        const orgId = primaryMembership?.orgId || null;
        const role = primaryMembership?.role || null;

        const accessToken = generateAccessToken(user.id, orgId, role);
        const rawRefreshToken = generateRefreshToken();
        const tokenHash = hashToken(rawRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await authRepository.createRefreshToken({
            userId: user.id,
            tokenHash,
            expiresAt,
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                orgId,
                role,
            },
            accessToken,
            refreshToken: rawRefreshToken,
        };
    }

    async refresh(rawRefreshToken) {
        if (!rawRefreshToken) {
            const err = new Error("Refresh token required");
            err.status = 400;
            err.code = "REFRESH_TOKEN_REQUIRED";
            throw err;
        }

        const tokenHash = hashToken(rawRefreshToken);
        const tokenRecord = await authRepository.findRefreshToken(tokenHash);

        if (!tokenRecord) {
            const err = new Error("Invalid refresh token");
            err.status = 401;
            err.code = "INVALID_REFRESH_TOKEN";
            throw err;
        }


        if (tokenRecord.revokedAt) {
            await authRepository.revokeAllUserTokens(tokenRecord.userId);
            const err = new Error("Compromised token used. All sessions revoked.");
            err.status = 401;
            err.code = "COMPROMISED_REFRESH_TOKEN";
            throw err;
        }

        if (new Date() > new Date(tokenRecord.expiresAt)) {
            const err = new Error("Refresh token expired");
            err.status = 401;
            err.code = "EXPIRED_REFRESH_TOKEN";
            throw err;
        }

        const newRawRefreshToken = generateRefreshToken();
        const newHash = hashToken(newRawRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const newRecord = await authRepository.createRefreshToken({
            userId: tokenRecord.userId,
            tokenHash: newHash,
            expiresAt,
        });

        await authRepository.revokeRefreshToken(tokenRecord.id, newRecord.id);

        const user = await authRepository.findUserById(tokenRecord.userId);
        const fullUser = await authRepository.findUserByEmail(user.email);
        const primaryMembership = fullUser.memberships?.[0];
        const orgId = primaryMembership?.orgId || null;
        const role = primaryMembership?.role || null;

        const accessToken = generateAccessToken(tokenRecord.userId, orgId, role);

        return {
            accessToken,
            refreshToken: newRawRefreshToken,
        };
    }

    async logout(rawRefreshToken) {
        if (!rawRefreshToken) return;

        const tokenHash = hashToken(rawRefreshToken);
        const tokenRecord = await authRepository.findRefreshToken(tokenHash);

        if (tokenRecord && !tokenRecord.revokedAt) {
            await authRepository.revokeRefreshToken(tokenRecord.id);
        }
    }
}

export default new AuthService();
