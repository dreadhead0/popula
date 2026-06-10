import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import multer from "multer";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { uploadRouter } from "./routes/upload.routes";

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
    app.use("/api/upload", uploadRouter);

    app.use(
        (
            err: unknown,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            if (err instanceof multer.MulterError) {
                const message =
                    err.code === "LIMIT_FILE_SIZE"
                        ? "CSV file must not be larger than 100MB."
                        : err.message;

                res.status(400).json({
                    status: "error",
                    message,
                });
                return;
            }

            const message =
                err instanceof Error ? err.message : "Unexpected server error.";

            res.status(400).json({
                status: "error",
                message,
            });
        }
    );

    app.use((req, res) => {
        res.status(404).json({
            status: "error",
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        });
    });

    return app;
};