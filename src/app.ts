import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import internalApiKey from "./middlewares/internalApiKey";
import routes from "./routes";
import internalRoutes from "./routes/internal.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv !== "test") {
  app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "identity-and-sso-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);
app.use("/internal", internalApiKey, internalRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
