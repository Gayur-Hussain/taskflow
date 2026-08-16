import { Worker } from "bullmq";
import IORedis from "ioredis";
import { emailDLQ } from "./queue.js";
import logger from "./utils/logger.js";

const connection = new IORedis(
    process.env.REDIS_URL || "redis://localhost:6379",
    {
        maxRetriesPerRequest: null,
    },
);

const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
        logger.info(`Processing background job ${job.id} for task assignment...`);

        const { email, taskTitle, assigneeName } = job.data;

        logger.info(
            `[MOCK EMAIL] To: ${email} | Subject: Task Assigned: "${taskTitle}" | Body: Hi ${assigneeName}, you have been assigned to task "${taskTitle}".`,
        );

        if (email.includes("fail")) {
            throw new Error("SMTP connection timeout");
        }
    },
    {
        connection,
    },
);

emailWorker.on("failed", async (job, err) => {
    if (!job) return;

    logger.error(
        `Job ${job.id} failed: ${err.message}. Attempts made: ${job.attemptsMade}`,
    );

    if (job.attemptsMade >= (job.opts.attempts || 1)) {
        logger.error(`Job ${job.id} exhausted all attempts. Routing to DLQ...`);

        try {
            await emailDLQ.add("failed-email", {
                originalJobId: job.id,
                data: job.data,
                failedReason: err.message,
                failedAt: new Date(),
            });

            logger.info(`Job ${job.id} successfully routed to DLQ.`);
        } catch (dlqError) {
            logger.error(`Failed to route job ${job.id} to DLQ: ${dlqError.message}`);
        }
    }
});

emailWorker.on("completed", (job) => {
    logger.info(`Job ${job.id} processed successfully!`);
});

emailWorker.on("error", (err) => {
    logger.error(`Worker Redis connection error: ${err.message}`);
});

logger.info(
    "BullMQ Email Worker started successfully and listening for jobs...",
);
