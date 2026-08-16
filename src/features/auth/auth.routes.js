import { Router } from "express";
import authController from "./auth.controller.js";
import { protectRoute } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validation.middleware.js";
import { registerSchema, loginSchema } from "./auth.validator.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), asyncHandler(authController.registerUser));
router.post("/login", authRateLimiter, validateBody(loginSchema), asyncHandler(authController.loginUser));
router.post("/refresh", asyncHandler(authController.refreshSession));
router.post("/logout", asyncHandler(authController.logoutUser));
router.post("/logout-all", protectRoute, asyncHandler(authController.logoutAllDevices));
router.get("/me", protectRoute, asyncHandler(authController.getCurrentUser));

export default router;
