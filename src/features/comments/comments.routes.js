import { Router } from "express";
import commentsController from "./comments.controller.js";
import { protectRoute } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validation.middleware.js";
import { createCommentSchema } from "./comments.validator.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(protectRoute);

router.post("/", validateBody(createCommentSchema), asyncHandler(commentsController.createComment));
router.get("/", asyncHandler(commentsController.listComments));

export default router;
