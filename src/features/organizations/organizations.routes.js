import { Router } from "express";
import organizationsController from "./organizations.controller.js";
import { protectRoute } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validation.middleware.js";
import { createOrgSchema } from "./organizations.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post("/", protectRoute, validateBody(createOrgSchema), asyncHandler(organizationsController.createOrg));
router.get("/memberships", protectRoute, asyncHandler(organizationsController.getMemberships));

export default router;
