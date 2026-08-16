import tasksRepository from "./tasks.repository.js";
import projectsRepository from "../projects/projects.repository.js";
import organizationsRepository from "../organizations/organizations.repository.js";
import authRepository from "../auth/auth.repository.js";
import { enqueueEmail } from "../../queue.js";

class TasksService {
    async createTask(taskData, orgId) {
        const project = await projectsRepository.findProjectById(taskData.projectId, orgId);
        if (!project) {
            const err = new Error("Project not found");
            err.status = 404;
            err.code = "PROJECT_NOT_FOUND";
            throw err;
        }

        return tasksRepository.createTask({
            ...taskData,
            orgId,
        });
    }

    async listTasks(orgId, filters) {
        const { data, total } = await tasksRepository.listTasks(orgId, filters);

        return {
            data,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    }

    async getTaskById(id, orgId) {
        const task = await tasksRepository.findTaskById(id, orgId);
        if (!task) {
            const err = new Error("Task not found");
            err.status = 404;
            err.code = "TASK_NOT_FOUND";
            throw err;
        }
        return task;
    }

    async updateTask(id, orgId, updateData) {

        await this.getTaskById(id, orgId);
        return tasksRepository.updateTask(id, updateData);
    }

    async deleteTask(id, orgId) {

        await this.getTaskById(id, orgId);
        return tasksRepository.softDeleteTask(id);
    }

    async assignTask(taskId, targetUserId, orgId) {
        const task = await this.getTaskById(taskId, orgId);

        const targetUser = await authRepository.findUserById(targetUserId);

        if (!targetUser) {
            const err = new Error("Target user not found");
            err.status = 404;
            err.code = "USER_NOT_FOUND";
            throw err;
        }

        const membership =
            await organizationsRepository.findOrgMemberByUserId(
                orgId,
                targetUserId
            );

        if (!membership) {
            const err = new Error(
                "Assignee must belong to the same organization"
            );
            err.status = 400;
            err.code = "INVALID_ASSIGNEE_ORGANIZATION";
            throw err;
        }

        const existingAssignment =
            await tasksRepository.findAssignment(
                taskId,
                targetUserId
            );

        if (existingAssignment) {
            return existingAssignment;
            return {
                ...existingAssignment,
                jobId: null,
            };
        }

        const assignment = await tasksRepository.assignTask(taskId, targetUserId, orgId);

        let jobId = null;
        try {
            const job = await enqueueEmail({
                type: "task-assigned",
                email: targetUser.email,
                taskTitle: task.title,
                assigneeName: targetUser.name,
            });
            if (job) {
                jobId = job.id;
            }
        } catch (jobError) {
            console.error("Failed to enqueue assignment email background job:", jobError);
        }

        return {
            ...assignment,
            jobId,
        };
    }
    async unassignTask(taskId, targetUserId, orgId) {
        await this.getTaskById(taskId, orgId);

        const assignment = await tasksRepository.findAssignment(taskId, targetUserId);
        if (!assignment) {
            const err = new Error("Task assignment not found");
            err.status = 404;
            err.code = "ASSIGNMENT_NOT_FOUND";
            throw err;
        }

        await tasksRepository.unassignTask(taskId, targetUserId);
    }
}

export default new TasksService();
