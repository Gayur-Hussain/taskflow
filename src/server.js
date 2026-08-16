import express from "express";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import apiRouter from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import db from "./config/db.js";

config();

const app = express();
const port = process.env.PORT || 3000;

db.connectDB();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", apiRouter);

app.get("/", (req, res) => {
  res.send("Hello from TaskFlow API server! Documentation is available at <a href='/docs'>/docs</a>.");
});

app.use(errorMiddleware);

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/docs`);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  server.close(async () => {
    await db.disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  await db.disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await db.disconnectDB();
    process.exit(0);
  });
});
export { app, server };