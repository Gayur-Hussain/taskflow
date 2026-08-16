import { Router } from "express";
import projectsController from "./projects.controller.js";
import { protectRoute } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validateBody } from "../../middlewares/validation.middleware.js";
import { createProjectSchema, updateProjectSchema } from "./projects.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(protectRoute);

router.post("/", validateBody(createProjectSchema), asyncHandler(projectsController.createProject));
router.get("/", asyncHandler(projectsController.listProjects));
router.get("/:id", asyncHandler(projectsController.getProjectById));
router.patch("/:id", validateBody(updateProjectSchema), asyncHandler(projectsController.updateProject));
router.delete("/:id", authorize("ORG_ADMIN"), asyncHandler(projectsController.deleteProject));
router.get("/:id/dashboard", asyncHandler(projectsController.getDashboard));

export default router;
