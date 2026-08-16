# TaskFlow - System Architecture Document

This document provides a detailed overview of the system architecture, component relationships, data flow, and key technical decisions implemented in the TaskFlow project management backend.

---

## 1. High-Level Architecture

TaskFlow uses a containerized micro-services architecture composed of four primary runtime components:

1.  **API Server (Express.js):** Handles client REST requests, enforces security/authentication, maps validations, and triggers business logic.
2.  **Background Worker (Node.js):** Asynchronously consumes email queues, processes assignment notifications, manages backoff retries, and handles failures.
3.  **Database (PostgreSQL):** Stores persistent multi-tenant data structures, constraints, and relationships.
4.  **Message Broker / Cache (Redis):** Backs the BullMQ message queue and stores short-lived distributed locking keys for API deduplication.

```
       +---------------------------------------------+
       |             Client Interface                |
       +---------------------------------------------+
                              |
                     HTTP REST Requests
                              v
       +---------------------------------------------+
       |               API Server                    |
       |  - Port 3000 (Express.js)                   |
       |  - Middlewares (Rate Limit, Auth, RBAC)     |
       +---------------------------------------------+
            |                                 |
      Prisma Queries                    Enqueue Email Jobs
            |                                 |
            v                                 v
+-----------------------+           +-----------------------+
|  PostgreSQL Database  |           |     Redis Cache       |
|  - Multi-Tenant DB    |           |  - BullMQ Queue       |
|  - Index Scopes       |           |  - Dedupe Locks (5s)  |
+-----------------------+           +-----------------------+
                                                ^
                                            Poll Jobs
                                                |
                                    +-----------------------+
                                    |   Background Worker   |
                                    |  - Email Job Runner   |
                                    |  - Max 50 jobs/min    |
                                    +-----------------------+
```

---

## 2. Software Design Patterns

The API codebase follows the **Layered Architecture (N-Tier)** design pattern to enforce separation of concerns, decoupling code from specific HTTP frameworks and database providers:

```
[ HTTP Route ]
      │ (Applies schema validator & authentication)
      ▼
[ Controller ]
      │ (Maps HTTP parameters and formats API responses)
      ▼
[ Service ]
      │ (Executes tenant rules & core business decisions)
      ▼
[ Repository ]
      │ (Handles raw database CRUD queries via Prisma ORM)
      ▼
[ Database (Postgres) ]
```

*   **Route $\to$ Controller:** Middleware parses client queries and payloads using **Zod** validators before passing clean objects to controllers.
*   **Controller $\to$ Service:** Controllers handle API presentation logic. They format response wrappers and capture errors using custom middlewares, leaving business decisions to Services.
*   **Service $\to$ Repository:** Services do not execute database operations directly. They reference repositories, which isolate Prisma ORM queries. This structure permits replacing the data store engine or ORM with zero friction to business code.

---

## 3. Core Architectural Details & Security Design

### A. Dynamic Multi-Tenant Isolation
TaskFlow operates on a single database containing tenant scopes (Shared Database, Shared Schema). To guarantee data isolation:
*   **No Spoken Tenant IDs:** The client is not trusted to supply an arbitrary `orgId` via query strings or payloads to fetch data.
*   **Context Lookup:** The protected route middleware [`auth.middleware.js`](file:///d:/work/taskflow/src/middlewares/auth.middleware.js) parses the authenticated user session. It looks up the membership relationship database records to fetch the organization context, attaching a verified `req.user.orgId` to the request.
*   **Scoped Repositories:** All repositories include mandatory `.findFirst({ where: { orgId } })` or `.findMany({ where: { orgId } })` filters, preventing cross-tenant information disclosure.

### B. OAuth 2.0 Token Rotation & Replay Attack Prevention
The authentication flow utilizes short-lived JWT access tokens (15-minute expiration) paired with persistent refresh tokens (7-day expiration):
1.  **HttpOnly Cookies:** Session tokens are stored in secure, HttpOnly, SameSite cookies to protect against Cross-Site Scripting (XSS) attacks.
2.  **Refresh Token Rotation:** On every refresh request, the active refresh token is invalidated and replaced with a new token.
3.  **Compromise Protection:** If a previously used (revoked) refresh token is submitted (indicating a session hijack replay attack), the system automatically invalidates *all* active refresh tokens associated with that user ID, immediately revoking all active sessions across all devices.

### C. Rate Limiting
To defend against brute-force attacks on credentials and spamming, two rate limit tiers are enforced:
*   **Auth Rate Limiter:** Restricted to 10 register/login requests per minute per IP using a lightweight memory accumulator.
*   **Email Queue rate limiter:** BullMQ workers are limited to 50 runs per minute to safeguard downstream SMTP servers from rate failures.

---

## 4. Background Job Processing Pipeline

Task assignment triggers asynchronous, non-blocking email notifications using **BullMQ** backed by Redis:

```
[ Task Assigned Service ]
           │
           ▼
[ Check Redis Lock Key ] ──(Lock exists within 5s?)──► [ Skip Enqueue (Deduplicated) ]
           │ No
           ▼
[ Enqueue Job ('task-assigned') ]
           │
           ▼
     [ Redis Queue ]
           │
     (Worker Pulls Job)
           ▼
[ BullMQ Worker (Max 50/min) ]
           │
           ├─► [ Success: Logger Outputs Mock Email ]
           │
           └─► [ Failure (SMTP timeout) ]
                     │
               (Retry Job up to 3 times)
                     │
          (Exponential Backoff: 1s -> 2s -> 4s)
                     │
            (All retries exhausted)
                     │
                     ▼
      [ Move to failed-email DLQ Queue ]
```

### Key Queue Characteristics:
*   **Redis Distributed Locks:** Before enqueuing an email job, the API sets a lock key `dedupe:assign:${email}:${taskTitle}` in Redis with a 5-second TTL. Duplicate assignment attempts within this window return a successful HTTP response immediately, but bypass enqueuing a duplicate worker job.
*   **Worker Attempt Backoff:** Failed jobs automatically retry up to 3 times. Retries are scheduled using an exponential backoff formula: $2^{\text{attempt}} \times 1000\text{ms}$ (delays of 1s, 2s, 4s).
*   **Dead Letter Queue (DLQ):** If all 3 attempts fail, an event listener intercepts the job and routes it to a designated `emailDLQ` queue, preserving worker throughput and allowing administrators to inspect failed runs.
