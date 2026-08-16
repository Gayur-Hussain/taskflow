import { Router } from "express";
import authRoutes from "../features/auth/auth.routes.js";
import organizationsRoutes from "../features/organizations/organizations.routes.js";
import projectsRoutes from "../features/projects/projects.routes.js";
import tasksRoutes from "../features/tasks/tasks.routes.js";
import commentsRoutes from "../features/comments/comments.routes.js";
import jobsRoutes from "../features/jobs/jobs.routes.js";
import requestLogger from "../middlewares/requestLogger.js";

const apiRouter = Router();

apiRouter.use(requestLogger);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/organizations", organizationsRoutes);
apiRouter.use("/projects", projectsRoutes);
apiRouter.use("/tasks", tasksRoutes);
apiRouter.use("/comments", commentsRoutes);
apiRouter.use("/jobs", jobsRoutes);

export default apiRouter;
