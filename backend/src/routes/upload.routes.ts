import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { ingestCsv } from "../services/upload/ingest-csv";

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
const uploadTempDir = path.join(process.cwd(), "tmp", "uploads");

if (!existsSync(uploadTempDir)) {
    mkdirSync(uploadTempDir, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => {
            callback(null, uploadTempDir);
        },
        filename: (_req, file, callback) => {
            const safeOriginalName = file.originalname.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

            callback(null, `${randomUUID()}-${safeOriginalName}`);
        },
    }),
    limits: {
        fileSize: MAX_UPLOAD_SIZE_BYTES,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const isCsv =
            file.mimetype === "text/csv" ||
            file.originalname.toLowerCase().endsWith(".csv");

        if (!isCsv) {
            callback(new Error("Only CSV files are supported."));
            return;
        }

        callback(null, true);
    },
});

export const uploadRouter = Router();

uploadRouter.post("/", upload.single("file"), async (req, res, next) => {
    const uploadedFile = req.file;

    try {
        if (!uploadedFile) {
            res.status(400).json({
                status: "error",
                message: "A CSV file is required.",
            });
            return;
        }

        const summary = await ingestCsv({
            filePath: uploadedFile.path,
            originalFilename: uploadedFile.originalname,
        });

        res.status(201).json(summary);
    } catch (error) {
        next(error);
    } finally {
        if (uploadedFile?.path) {
            await rm(uploadedFile.path, { force: true });
        }
    }
});