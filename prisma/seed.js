import { prisma } from "../src/config/db.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("Cleaning database before seeding...");
  await prisma.comment.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.orgMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleared. Seeding initial data...");

  // 1. Create Users
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync("Password123", saltRounds);

  const uAtul = await prisma.user.create({
    data: {
      name: "Atul Kumar",
      email: "atul@grubpac.com",
      password: hashedPassword,
    },
  });

  const uMohit = await prisma.user.create({
    data: {
      name: "Mohit",
      email: "mohit@grubpac.com",
      password: hashedPassword,
    },
  });

  const uGayur = await prisma.user.create({
    data: {
      name: "Gayur",
      email: "gayur@veridexa.cloud",
      password: hashedPassword,
    },
  });

  const uAlice = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@veridexa.cloud",
      password: hashedPassword,
    },
  });

  const uBob = await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@general.com",
      password: hashedPassword,
    },
  });

  console.log("Seeded 5 users.");

  // 2. Create Organizations
  const oGrubpac = await prisma.organization.create({
    data: { name: "GrubPac Technologies" },
  });

  const oVeridexa = await prisma.organization.create({
    data: { name: "Veridexa Cloud" },
  });

  console.log("Seeded 2 organizations.");

  // 3. Create memberships (OrgMembers)
  // GrubPac members
  await prisma.orgMember.createMany({
    data: [
      { userId: uAtul.id, orgId: oGrubpac.id, role: "ORG_ADMIN" },
      { userId: uMohit.id, orgId: oGrubpac.id, role: "MEMBER" },
      { userId: uBob.id, orgId: oGrubpac.id, role: "MEMBER" },
    ],
  });

  // Veridexa members
  await prisma.orgMember.createMany({
    data: [
      { userId: uGayur.id, orgId: oVeridexa.id, role: "ORG_ADMIN" },
      { userId: uAlice.id, orgId: oVeridexa.id, role: "MEMBER" },
    ],
  });

  console.log("Seeded memberships (RBAC).");

  // 4. Create Projects
  const pTaskFlow = await prisma.project.create({
    data: {
      name: "TaskFlow Backend",
      description: "Core project management engine with PostgreSQL and BullMQ",
      orgId: oGrubpac.id,
    },
  });

  const pDelivery = await prisma.project.create({
    data: {
      name: "GrubPac Delivery App",
      description: "Real-time dispatch and delivery routing service",
      orgId: oGrubpac.id,
    },
  });

  const pVeridexaAPI = await prisma.project.create({
    data: {
      name: "Veridexa API Portal",
      description: "Public developer gateway and access controls",
      orgId: oVeridexa.id,
    },
  });

  console.log("Seeded 3 projects.");

  // 5. Create Tasks
  // GrubPac - TaskFlow Backend tasks
  const t1 = await prisma.task.create({
    data: {
      title: "Setup database schema and migrations",
      description: "Define Prisma schema, configure indexes, and run migrations.",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
      orgId: oGrubpac.id,
      projectId: pTaskFlow.id,
    },
  });

  const t2 = await prisma.task.create({
    data: {
      title: "Implement JWT auth & session rotation",
      description: "Build secure authentication flow with HttpOnly cookies and token rotation.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day from now
      orgId: oGrubpac.id,
      projectId: pTaskFlow.id,
    },
  });

  const t3 = await prisma.task.create({
    data: {
      title: "Build project and task controller",
      description: "Implement core HTTP endpoints and wire to services.",
      status: "REVIEW",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      orgId: oGrubpac.id,
      projectId: pTaskFlow.id,
    },
  });

  const t4 = await prisma.task.create({
    data: {
      title: "Configure BullMQ background worker",
      description: "Setup Redis and enqueuing jobs for email delivery.",
      status: "TODO",
      priority: "HIGH",
      orgId: oGrubpac.id,
      projectId: pTaskFlow.id,
    },
  });

  const t5 = await prisma.task.create({
    data: {
      title: "Write integration tests for multi-tenancy",
      description: "Verify tenant isolation and cross-tenant access controls.",
      status: "TODO",
      priority: "HIGH",
      orgId: oGrubpac.id,
      projectId: pTaskFlow.id,
    },
  });

  const t6 = await prisma.task.create({
    data: {
      title: "Add Swagger UI documentation",
      description: "Document all routes, schema, and error configurations.",
      status: "DONE",
      priority: "LOW",
      orgId: oGrubpac.id,
      projectId: pTaskFlow.id,
    },
  });

  // GrubPac - Delivery App tasks
  const t7 = await prisma.task.create({
    data: {
      title: "Design delivery tracking algorithm",
      description: "Route optimization for dispatch riders.",
      status: "TODO",
      priority: "MEDIUM",
      orgId: oGrubpac.id,
      projectId: pDelivery.id,
    },
  });

  const t8 = await prisma.task.create({
    data: {
      title: "Implement real-time notification service",
      description: "Push status updates to delivery customers.",
      status: "TODO",
      priority: "HIGH",
      orgId: oGrubpac.id,
      projectId: pDelivery.id,
    },
  });

  // Veridexa - API Portal tasks
  const t9 = await prisma.task.create({
    data: {
      title: "Setup OAuth2 login portal",
      description: "Register developers and issue API client keys.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      orgId: oVeridexa.id,
      projectId: pVeridexaAPI.id,
    },
  });

  const t10 = await prisma.task.create({
    data: {
      title: "Configure API rate limiters and analytics",
      description: "Protect endpoints against brute forcing and track traffic metrics.",
      status: "TODO",
      priority: "MEDIUM",
      orgId: oVeridexa.id,
      projectId: pVeridexaAPI.id,
    },
  });

  const t11 = await prisma.task.create({
    data: {
      title: "Design portal landing page",
      description: "Build landing layout featuring API documents and examples.",
      status: "DONE",
      priority: "LOW",
      orgId: oVeridexa.id,
      projectId: pVeridexaAPI.id,
    },
  });

  console.log("Seeded 11 tasks with mixed status and priority.");

  // 6. Create Assignments
  await prisma.taskAssignment.createMany({
    data: [
      { taskId: t1.id, userId: uAtul.id, orgId: oGrubpac.id },
      { taskId: t2.id, userId: uAtul.id, orgId: oGrubpac.id },
      { taskId: t3.id, userId: uMohit.id, orgId: oGrubpac.id },
      { taskId: t4.id, userId: uMohit.id, orgId: oGrubpac.id },
      { taskId: t9.id, userId: uGayur.id, orgId: oVeridexa.id },
      { taskId: t10.id, userId: uAlice.id, orgId: oVeridexa.id },
      { taskId: t11.id, userId: uAlice.id, orgId: oVeridexa.id },
    ],
  });

  console.log("Seeded assignments.");

  // 7. Create Comments
  await prisma.comment.createMany({
    data: [
      {
        content: "Prisma schema is now complete. Database is synchronized.",
        taskId: t1.id,
        userId: uAtul.id,
        orgId: oGrubpac.id,
      },
      {
        content: "Will review the controllers today. Let me know when JWT endpoints are ready.",
        taskId: t3.id,
        userId: uMohit.id,
        orgId: oGrubpac.id,
      },
      {
        content: "Starting integration with OAuth. Client configurations complete.",
        taskId: t9.id,
        userId: uGayur.id,
        orgId: oVeridexa.id,
      },
    ],
  });

  console.log("Seeded comments.");
  console.log("Seeding process completed successfully!");
}

main()
  .catch((error) => {
    console.error("Error while seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });