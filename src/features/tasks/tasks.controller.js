import tasksService from "./tasks.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const tasksController = {
    createTask: async (req, res) => {
        const orgId = req.user.orgId;
        const task = await tasksService.createTask(req.body, orgId);
        return sendSuccess(res, 201, "Task created successfully", task);
    },

    listTasks: async (req, res) => {
        const orgId = req.user.orgId;
        const result = await tasksService.listTasks(orgId, req.validatedQuery ?? req.query);
        return sendSuccess(res, 200, "Tasks retrieved successfully", result.data, {
            pagination: result.pagination,
        });
    },

    getTaskById: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;
        const task = await tasksService.getTaskById(id, orgId);
        return sendSuccess(res, 200, "Task retrieved successfully", task);
    },

    updateTask: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;
        const task = await tasksService.updateTask(id, orgId, req.body);
        return sendSuccess(res, 200, "Task updated successfully", task);
    },

    deleteTask: async (req, res) => {
        const { id } = req.params;
        const orgId = req.user.orgId;
        await tasksService.deleteTask(id, orgId);
        return sendSuccess(res, 200, "Task deleted successfully");
    },

    assignTask: async (req, res) => {
        const { id } = req.params;
        const { userId } = req.body;
        const orgId = req.user.orgId;

        const assignment = await tasksService.assignTask(id, userId, orgId);
        return sendSuccess(res, 200, "Task assigned successfully", assignment);
    },

    unassignTask: async (req, res) => {
        const { id } = req.params;
        const { userId } = req.body;
        const orgId = req.user.orgId;

        await tasksService.unassignTask(id, userId, orgId);
        return sendSuccess(res, 200, "Task unassigned successfully");
    },
};

export default tasksController;

