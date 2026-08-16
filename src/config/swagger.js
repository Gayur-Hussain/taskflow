export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "TaskFlow API Documentation",
        version: "1.0.0",
        description: "Production-grade multi-tenant project management system API",
    },
    servers: [
        {
            url: "/api/v1",
            description: "Local Development Server",
        },
    ],
    paths: {
        "/auth/register": {
            post: {
                summary: "Register a new user",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "password"],
                                properties: {
                                    name: { type: "string", example: "Atul Kumar" },
                                    email: { type: "string", format: "email", example: "atul@grubpac.com" },
                                    password: { type: "string", format: "password", example: "Password123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "User registered successfully" },
                    400: { description: "Validation error" },
                },
            },
        },
        "/auth/login": {
            post: {
                summary: "Authenticate user and issue tokens",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", format: "email", example: "atul@grubpac.com" },
                                    password: { type: "string", format: "password", example: "Password123" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Login successful" },
                    401: { description: "Invalid credentials" },
                },
            },
        },
        "/auth/refresh": {
            post: {
                summary: "Refresh JWT access token with rotation",
                tags: ["Authentication"],
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    refreshToken: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Tokens refreshed and rotated successfully" },
                    401: { description: "Invalid or expired refresh token" },
                },
            },
        },
        "/auth/logout": {
            post: {
                summary: "Revoke session and logout",
                tags: ["Authentication"],
                responses: {
                    200: { description: "Logged out successfully" },
                },
            },
        },
        "/organizations": {
            post: {
                summary: "Create a new organization (tenant)",
                tags: ["Organizations"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "GrubPac Technologies" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Organization created successfully" },
                    401: { description: "Unauthorized" },
                },
            },
        },
        "/projects": {
            post: {
                summary: "Create a new project",
                tags: ["Projects"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name"],
                                properties: {
                                    name: { type: "string", example: "TaskFlow Backend" },
                                    description: { type: "string", example: "Core project management engine." },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Project created successfully" },
                },
            },
            get: {
                summary: "List all projects in user's organization",
                tags: ["Projects"],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "List of projects retrieved" },
                },
            },
        },
        "/projects/{id}": {
            get: {
                summary: "Get details of a project",
                tags: ["Projects"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    200: { description: "Project details retrieved" },
                    404: { description: "Project not found" },
                },
            },
            patch: {
                summary: "Update a project",
                tags: ["Projects"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Project updated" },
                    404: { description: "Project not found" },
                },
            },
            delete: {
                summary: "Soft-delete a project (ORG_ADMIN role only)",
                tags: ["Projects"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    200: { description: "Project soft-deleted" },
                    403: { description: "Forbidden" },
                    404: { description: "Project not found" },
                },
            },
        },
        "/projects/{id}/dashboard": {
            get: {
                summary: "Get task status aggregates for the project dashboard",
                tags: ["Projects"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    200: {
                        description: "Status aggregates retrieved",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        todo: { type: "integer" },
                                        in_progress: { type: "integer" },
                                        review: { type: "integer" },
                                        done: { type: "integer" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/tasks": {
            post: {
                summary: "Create a new task",
                tags: ["Tasks"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title", "projectId"],
                                properties: {
                                    title: { type: "string", example: "Setup database schema" },
                                    description: { type: "string" },
                                    status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] },
                                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                                    dueDate: { type: "string", format: "date-time" },
                                    projectId: { type: "string", format: "uuid" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Task created successfully" },
                    404: { description: "Project not found in organization" },
                },
            },
            get: {
                summary: "List and filter tasks with pagination",
                tags: ["Tasks"],
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "status", in: "query", schema: { type: "string" } },
                    { name: "priority", in: "query", schema: { type: "string" } },
                    { name: "assignee", in: "query", schema: { type: "string", format: "uuid" } },
                    { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
                    { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
                    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
                    { name: "sort", in: "query", schema: { type: "string", example: "-createdAt" } },
                ],
                responses: {
                    200: { description: "Tasks retrieved successfully" },
                },
            },
        },
        "/tasks/{id}/assign": {
            post: {
                summary: "Assign a task to an organization member",
                tags: ["Tasks"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["userId"],
                                properties: {
                                    userId: { type: "string", format: "uuid", example: "cd421e13-1c27-48b9-99e8-d554f839d6c9" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Task assigned successfully. Enqueues email job." },
                    400: { description: "User does not belong to same organization" },
                    404: { description: "Task or User not found" },
                },
            },
        },
        "/comments": {
            post: {
                summary: "Create a comment on a task",
                tags: ["Comments"],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["content", "taskId"],
                                properties: {
                                    content: { type: "string", example: "Schema looks complete." },
                                    taskId: { type: "string", format: "uuid" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Comment added" },
                    404: { description: "Task not found" },
                },
            },
            get: {
                summary: "List comments for a task",
                tags: ["Comments"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "taskId", in: "query", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    200: { description: "Comments retrieved successfully" },
                },
            },
        },
        "/jobs/{id}": {
            get: {
                summary: "Poll status of a background job",
                tags: ["Jobs"],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Job status details returned" },
                    404: { description: "Job not found" },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
};
