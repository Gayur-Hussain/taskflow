import { Router } from "express";
import tasksController from "./tasks.controller.js";
import { protectRoute } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validation.middleware.js";
import { createTaskSchema, updateTaskSchema, assignTaskSchema, filterTasksSchema } from "./tasks.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(protectRoute);

router.post("/", validateBody(createTaskSchema), asyncHandler(tasksController.createTask));
router.get("/", validateQuery(filterTasksSchema), asyncHandler(tasksController.listTasks));
router.get("/:id", asyncHandler(tasksController.getTaskById));
router.patch("/:id", validateBody(updateTaskSchema), asyncHandler(tasksController.updateTask));
router.delete("/:id", asyncHandler(tasksController.deleteTask));
router.post("/:id/assign", validateBody(assignTaskSchema), asyncHandler(tasksController.assignTask));
router.post("/:id/unassign", validateBody(assignTaskSchema), asyncHandler(tasksController.unassignTask));

export default router;
