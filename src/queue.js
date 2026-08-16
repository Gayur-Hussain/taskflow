import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis(
    process.env.REDIS_URL || 'redis://localhost:6379',
    {
        maxRetriesPerRequest: null,
    }
);

export const emailQueue = new Queue('emailQueue', {
    connection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const emailDLQ = new Queue('emailDLQ', {
    connection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const enqueueEmail = async (data) => {
    const dedupeKey = `dedupe:assign:${data.email}:${data.taskTitle.replace(/\s+/g, "_")}`;

    // Use connection (Redis client) to set a 5-second lock
    const isNew = await connection.set(dedupeKey, "1", "NX", "PX", 5000);

    if (!isNew) {
        // Deduplicated: identical assignment within 5 seconds
        return null;
    }

    return emailQueue.add('task-assigned', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
};