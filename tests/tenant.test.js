import request from "supertest";
import { app, server } from "../src/server.js";
import db, { prisma } from "../src/config/db.js";
import { jest } from "@jest/globals";

jest.setTimeout(30000);

describe("Multi-Tenant Isolation & Role Authorization", () => {
  let orgAToken = "";
  let orgBToken = "";
  let orgAMemberToken = "";

  let userAAdmin, userAMember, userBAdmin;
  let orgA, orgB;
  let projectA, taskA;

  beforeAll(async () => {
    const saltRounds = 10;
    const passwordHash = await import("bcrypt").then((b) => b.default.hashSync("Password123", saltRounds));

    // Create Organizations
    orgA = await prisma.organization.create({ data: { name: "Org A" } });
    orgB = await prisma.organization.create({ data: { name: "Org B" } });

    // Create Users
    userAAdmin = await prisma.user.create({
      data: { name: "A Admin", email: `a_admin_${Date.now()}@example.com`, password: passwordHash },
    });
    userAMember = await prisma.user.create({
      data: { name: "A Member", email: `a_member_${Date.now()}@example.com`, password: passwordHash },
    });
    userBAdmin = await prisma.user.create({
      data: { name: "B Admin", email: `b_admin_${Date.now()}@example.com`, password: passwordHash },
    });

    // Establish memberships
    await prisma.orgMember.create({
      data: { userId: userAAdmin.id, orgId: orgA.id, role: "ORG_ADMIN" },
    });
    await prisma.orgMember.create({
      data: { userId: userAMember.id, orgId: orgA.id, role: "MEMBER" },
    });
    await prisma.orgMember.create({
      data: { userId: userBAdmin.id, orgId: orgB.id, role: "ORG_ADMIN" },
    });

    // Create a Project and Task in Org A
    projectA = await prisma.project.create({
      data: { name: "Project A", orgId: orgA.id },
    });
    taskA = await prisma.task.create({
      data: { title: "Task A", orgId: orgA.id, projectId: projectA.id },
    });

    // Login to get tokens
    const loginAAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userAAdmin.email, password: "Password123" });
    orgAToken = loginAAdmin.body.data.accessToken;

    const loginAMember = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userAMember.email, password: "Password123" });
    orgAMemberToken = loginAMember.body.data.accessToken;

    const loginBAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: userBAdmin.email, password: "Password123" });
    orgBToken = loginBAdmin.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    // Cleanup
    await prisma.task.deleteMany({ where: { orgId: { in: [orgA.id, orgB.id] } } });
    await prisma.project.deleteMany({ where: { orgId: { in: [orgA.id, orgB.id] } } });
    await prisma.orgMember.deleteMany({ where: { orgId: { in: [orgA.id, orgB.id] } } });
    await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [userAAdmin.id, userAMember.id, userBAdmin.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAAdmin.id, userAMember.id, userBAdmin.id] } },
    });

    server.close();
    await db.disconnectDB();
  }, 30000);

  it("should prevent User B from reading Project A (returns 404 for information leakage safety)", async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectA.id}`)
      .set("Authorization", `Bearer ${orgBToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("PROJECT_NOT_FOUND");
  }, 30000);

  it("should prevent User B from reading Task A (returns 404)", async () => {
    const res = await request(app).get(`/api/v1/tasks/${taskA.id}`).set("Authorization", `Bearer ${orgBToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("TASK_NOT_FOUND");
  }, 30000);

  it("should prevent a MEMBER of Org A from deleting Project A (returns 403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectA.id}`)
      .set("Authorization", `Bearer ${orgAMemberToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("FORBIDDEN");
  }, 30000);

  it("should allow an ORG_ADMIN of Org A to delete Project A (returns 200)", async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectA.id}`)
      .set("Authorization", `Bearer ${orgAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  }, 30000);
});
