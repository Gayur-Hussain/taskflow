import commentsService from "./comments.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const commentsController = {
    createComment: async (req, res) => {
        const { content, taskId } = req.body;
        const userId = req.user.id;
        const orgId = req.user.orgId;

        const comment = await commentsService.createComment({
            content,
            taskId,
            userId,
            orgId,
        });

        return sendSuccess(res, 201, "Comment added successfully", comment);
    },

    listComments: async (req, res) => {
        const { taskId } = req.query;
        const orgId = req.user.orgId;

        if (!taskId) {
            const err = new Error("taskId is required as a query parameter");
            err.status = 400;
            err.code = "TASK_ID_REQUIRED";
            throw err;
        }

        const comments = await commentsService.listComments(taskId, orgId);
        return sendSuccess(res, 200, "Comments retrieved successfully", comments);
    },
};

export default commentsController;
