import request from "supertest";
import { app, server } from "../src/server.js";
import db, { prisma } from "../src/config/db.js";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

describe("Authentication & Session Flow", () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = "Password123";
    let accessToken = "";
    let refreshToken = "";

    afterAll(async () => {
        await prisma.user.delete({ where: { email: testEmail } }).catch(() => { });
        server.close();
        await db.disconnectDB();
    });

    it("should register a new user successfully", async () => {
        const res = await request(app).post("/api/v1/auth/register").send({
            name: "Test User",
            email: testEmail,
            password: testPassword,
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("id");
        expect(res.body.data.email).toBe(testEmail);
    }, 30000);

    it("should fail registration with invalid input (Zod check)", async () => {
        const res = await request(app).post("/api/v1/auth/register").send({
            name: "A",
            email: "not-an-email",
            password: "short",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    }, 30000);

    it("should log in user and issue tokens", async () => {
        const res = await request(app).post("/api/v1/auth/login").send({
            email: testEmail,
            password: testPassword,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("accessToken");
        expect(res.body.data).toHaveProperty("refreshToken");

        accessToken = res.body.data.accessToken;
        refreshToken = res.body.data.refreshToken;
    }, 30000);

    it("should refresh session and rotate refresh token", async () => {
        const res = await request(app).post("/api/v1/auth/refresh").send({
            refreshToken,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("accessToken");
        expect(res.body.data).toHaveProperty("refreshToken");
        expect(res.body.data.refreshToken).not.toBe(refreshToken);
    }, 30000);
});
