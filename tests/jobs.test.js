import request from "supertest";
import { app, server } from "../src/server.js";
import db, { prisma } from "../src/config/db.js";
import { Job } from "bullmq";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

const mockGetState = async () => "completed";
const mockJob = {
    id: "mock-job-123",
    name: "task-assigned",
    getState: mockGetState,
    data: { email: "atul@grubpac.com", taskTitle: "Fix bugs" },
    failedReason: null,
    progress: 0,
    attemptsMade: 1,
};

Job.fromId = async (queue, id) => {
    if (id === "mock-job-123") {
        return mockJob;
    }
    return null;
};

describe("Background Jobs Status Polling", () => {
    let adminToken = "";
    let user, organization;

    beforeAll(async () => {
        const saltRounds = 10;
        const passwordHash = await import("bcrypt").then((b) => b.default.hashSync("Password123", saltRounds));

        organization = await prisma.organization.create({ data: { name: "Test Jobs Org" } });
        user = await prisma.user.create({
            data: { name: "Jobs User", email: `jobs_${Date.now()}@example.com`, password: passwordHash },
        });
        await prisma.orgMember.create({
            data: { userId: user.id, orgId: organization.id, role: "MEMBER" },
        });

        const loginRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: user.email, password: "Password123" });
        adminToken = loginRes.body.data.accessToken;
    }, 30000);

    afterAll(async () => {
        await prisma.orgMember.deleteMany({ where: { orgId: organization.id } });
        await prisma.organization.delete({ where: { id: organization.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });

        server.close();
        await db.disconnectDB();
    }, 30000);

    it("should return job details for a valid jobId", async () => {
        const res = await request(app).get("/api/v1/jobs/mock-job-123").set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe("mock-job-123");
        expect(res.body.data.status).toBe("completed");
    }, 30000);

    it("should return 404 for a non-existent jobId", async () => {
        const res = await request(app).get("/api/v1/jobs/invalid-job-id").set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("JOB_NOT_FOUND");
    }, 30000);
});
