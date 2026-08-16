import { Job } from "bullmq";
import { emailQueue, emailDLQ } from "../../queue.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const jobsController = {
    getJobStatus: async (req, res) => {
        const { id } = req.params;

        let job = await Job.fromId(emailQueue, id);
        let source = "queue";

        if (!job) {
            job = await Job.fromId(emailDLQ, id);
            source = "dlq";
        }

        if (!job) {
            const err = new Error("Job not found");
            err.status = 404;
            err.code = "JOB_NOT_FOUND";
            throw err;
        }

        const state = await job.getState();

        let mappedStatus = "pending";
        if (source === "dlq" || state === "failed") {
            mappedStatus = "failed";
        } else if (state === "completed") {
            mappedStatus = "completed";
        } else if (state === "active") {
            mappedStatus = "active";
        } else if (state === "waiting" || state === "delayed") {
            mappedStatus = "pending";
        } else {
            mappedStatus = state;
        }

        return sendSuccess(res, 200, "Job status fetched successfully", {
            id: job.id,
            name: job.name,
            status: mappedStatus,
            data: job.data,
            failedReason: job.failedReason,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            source,
        });
    },
};

export default jobsController;
