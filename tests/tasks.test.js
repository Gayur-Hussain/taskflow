import request from "supertest";
import { app, server } from "../src/server.js";
import db, { prisma } from "../src/config/db.js";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

describe("Projects & Tasks Flow", () => {
    let adminToken = "";
    let memberToken = "";
    let adminUser, memberUser, organization, project, task;

    beforeAll(async () => {
        organization = await prisma.organization.create({
            data: { name: "Test Projects Org" },
        });

        const saltRounds = 10;
        const passwordHash = await import("bcrypt").then((b) => b.default.hashSync("Password123", saltRounds));

        adminUser = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin_${Date.now()}@example.com`,
                password: passwordHash,
            },
        });

        await prisma.orgMember.create({
            data: {
                userId: adminUser.id,
                orgId: organization.id,
                role: "ORG_ADMIN",
            },
        });

        memberUser = await prisma.user.create({
            data: {
                name: "Test Member",
                email: `member_${Date.now()}@example.com`,
                password: passwordHash,
            },
        });

        await prisma.orgMember.create({
            data: {
                userId: memberUser.id,
                orgId: organization.id,
                role: "MEMBER",
            },
        });

        const loginAdminRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: adminUser.email, password: "Password123" });
        adminToken = loginAdminRes.body.data.accessToken;

        const loginMemberRes = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: memberUser.email, password: "Password123" });
        memberToken = loginMemberRes.body.data.accessToken;
    }, 30000);

    afterAll(async () => {
        await prisma.comment.deleteMany({ where: { orgId: organization.id } });
        await prisma.taskAssignment.deleteMany({ where: { orgId: organization.id } });
        await prisma.task.deleteMany({ where: { orgId: organization.id } });
        await prisma.project.deleteMany({ where: { orgId: organization.id } });
        await prisma.orgMember.deleteMany({ where: { orgId: organization.id } });
        await prisma.organization.delete({ where: { id: organization.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: { in: [adminUser.id, memberUser.id] } } });
        await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, memberUser.id] } } });

        server.close();
        await db.disconnectDB();
    }, 30000);

    it("should allow creating a project inside organization", async () => {
        const res = await request(app)
            .post("/api/v1/projects")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "Test Project A",
                description: "Test description",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("id");
        project = res.body.data;
    }, 30000);

    it("should allow members to create tasks under the project", async () => {
        const res = await request(app)
            .post("/api/v1/tasks")
            .set("Authorization", `Bearer ${memberToken}`)
            .send({
                title: "Test Task A",
                description: "Task description",
                status: "TODO",
                priority: "HIGH",
                projectId: project.id,
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("id");
        task = res.body.data;
    }, 30000);

    it("should allow listing tasks with filters", async () => {
        const res = await request(app)
            .get("/api/v1/tasks?status=TODO&priority=HIGH&page=1&limit=20&sort=-createdAt")
            .set("Authorization", `Bearer ${memberToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta).toHaveProperty("pagination");
    }, 30000);

    it("should allow assigning a task to an organization member", async () => {
        const res = await request(app)
            .post(`/api/v1/tasks/${task.id}/assign`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                userId: memberUser.id,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("userId");
        expect(res.body.data.userId).toBe(memberUser.id);
    }, 30000);

    it("should fail task assignment if user does not belong to organization", async () => {
        const anotherUser = await prisma.user.create({
            data: {
                name: "External User",
                email: `external_${Date.now()}@example.com`,
                password: "ExternalPasswordHash",
            },
        });

        const res = await request(app)
            .post(`/api/v1/tasks/${task.id}/assign`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                userId: anotherUser.id,
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_ASSIGNEE_ORGANIZATION");

        await prisma.user.delete({ where: { id: anotherUser.id } });
    }, 30000);
});

