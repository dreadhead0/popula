import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
    res.json({
        status: "success",
        service: "popula-api",
        timestamp: new Date().toISOString(),
    });
});