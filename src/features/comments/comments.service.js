import commentsRepository from "./comments.repository.js";
import tasksService from "../tasks/tasks.service.js";

class CommentsService {
    async createComment({ content, taskId, userId, orgId }) {
        await tasksService.getTaskById(taskId, orgId);

        return commentsRepository.createComment({
            content,
            taskId,
            userId,
            orgId,
        });
    }

    async listComments(taskId, orgId) {
        await tasksService.getTaskById(taskId, orgId);

        return commentsRepository.listCommentsByTaskId(taskId, orgId);
    }
}

export default new CommentsService();
