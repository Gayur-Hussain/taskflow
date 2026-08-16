import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(
    process.env.REDIS_URL || "redis://localhost:6379",
    {
        maxRetriesPerRequest: null,
    }
);

export const emailQueue = new Queue("emailQueue", {
    connection,
    defaultJobOptions: {
        removeOnComplete: {
            age: 60 * 60 * 24, // Keep completed jobs for 24 hours
            count: 1000, // Keep maximum 1000 completed jobs
        },
        removeOnFail: false,
    },
});

export const emailDLQ = new Queue("emailDLQ", {
    connection,
    defaultJobOptions: {
        removeOnComplete: {
            age: 60 * 60 * 24,
            count: 1000,
        },
        removeOnFail: false,
    },
});

export const enqueueEmail = async (data) => {
    const dedupeKey = `dedupe:assign:${data.email}:${data.taskTitle.replace(
        /\s+/g,
        "_"
    )}`;

    const isNew = await connection.set(
        dedupeKey,
        "1",
        "NX",
        "PX",
        5000
    );

    if (!isNew) {
        return null;
    }

    return emailQueue.add("task-assigned", data, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
    });
};