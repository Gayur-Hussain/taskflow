import { Router } from "express";
import jobsController from "./jobs.controller.js";
import { protectRoute } from "../../middlewares/auth.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.get("/:id", protectRoute, asyncHandler(jobsController.getJobStatus));

export default router;
