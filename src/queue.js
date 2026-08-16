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
    return emailQueue.add('task-assigned', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
};