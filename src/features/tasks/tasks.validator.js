import { z } from "zod";

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    status: taskStatusEnum.optional().default("TODO"),
    priority: taskPriorityEnum.optional().default("MEDIUM"),
    dueDate: z.string().datetime({ message: "Invalid ISO 8601 datetime format" }).optional(),
    projectId: z.string().uuid("Invalid projectId format"),
});

export const updateTaskSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    dueDate: z.string().datetime({ message: "Invalid ISO 8601 datetime format" }).optional(),
});

export const assignTaskSchema = z.object({
    userId: z.string().uuid("Invalid userId format"),
});

export const filterTasksSchema = z.object({
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    assignee: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.preprocess((val) => Number(val), z.number().int().min(1).default(1)),
    limit: z.preprocess((val) => Number(val), z.number().int().min(1).max(100).default(20)),
    sort: z.string().optional(),
});
