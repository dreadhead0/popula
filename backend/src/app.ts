import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";

export const createApp = () => {
    const app = express();

    app.use(helmet());

    app.use(
        cors({
            origin: env.CORS_ORIGIN,
            credentials: true,
        })
    );

    app.use(express.json({ limit: "1mb" }));

    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

    app.use("/api/health", healthRouter);

    app.use((req, res) => {
        res.status(404).json({
            status: "error",
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    });

    return app;
};