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

        return sendSuccess(res, 200, "Job status fetched successfully", {
            id: job.id,
            name: job.name,
            status: source === "dlq" ? "failed" : state,
            data: job.data,
            failedReason: job.failedReason,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            source,
        });
    },
};

export default jobsController;
