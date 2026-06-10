import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { db } from "../src/database/connection";

const app = createApp();

const createTempCsv = async (content: string) => {
    const filePath = path.join(os.tmpdir(), `${randomUUID()}.csv`);

    await fs.writeFile(filePath, content, "utf8");

    return filePath;
};

const createTempTextFile = async (content: string) => {
    const filePath = path.join(os.tmpdir(), `${randomUUID()}.txt`);

    await fs.writeFile(filePath, content, "utf8");

    return filePath;
};

const cleanDatabase = async () => {
    await db.raw(
        "truncate table workspaces, demographic_records, datasets restart identity cascade"
    );
};

describe("POST /api/upload", () => {
    const createdFiles: string[] = [];

    beforeEach(async () => {
        await cleanDatabase();
    });

    afterEach(async () => {
        await cleanDatabase();

        await Promise.all(
            createdFiles.map((filePath) => fs.rm(filePath, { force: true }))
        );

        createdFiles.length = 0;
    });

    afterAll(async () => {
        await db.destroy();
    });

    it("streams a CSV upload, inserts valid rows, and skips invalid and duplicate rows", async () => {
        const csv = [
            "id,full_name,gender,age,country,income,purchased_category,created_at",
            "1,Ada James,female,28,Nigeria,54000,Electronics,2026-05-01",
            "2,John Smith,male,34,United States,72000,Books,2026-05-05",
            "3,Ada James,female,28,Nigeria,56000,Clothing,2026-05-08",
            "4,,female,31,Ghana,45000,Books,2026-05-09",
            "5,Invalid Age,male,91,Nigeria,45000,Sports,2026-05-10",
            "6,Invalid Gender,unknown,35,Nigeria,45000,Sports,2026-05-11",
        ].join("\n");

        const filePath = await createTempCsv(csv);
        createdFiles.push(filePath);

        const response = await request(app)
            .post("/api/upload")
            .attach("file", filePath);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.dataset_id).toBeDefined();
        expect(response.body.total_rows_received).toBe(6);
        expect(response.body.rows_inserted).toBe(2);
        expect(response.body.rows_skipped).toBe(4);
        expect(response.body.skip_reasons).toMatchObject({
            duplicate: 1,
            missing_name: 1,
            invalid_age: 1,
            invalid_gender: 1,
        });

        const dataset = await db("datasets")
            .where({ id: response.body.dataset_id })
            .first();

        expect(dataset.status).toBe("active");
        expect(dataset.total_rows_received).toBe(6);
        expect(dataset.rows_inserted).toBe(2);
        expect(dataset.rows_skipped).toBe(4);

        const records = await db("demographic_records").where({
            dataset_id: response.body.dataset_id,
        });

        expect(records).toHaveLength(2);
    });

    it("rejects non-CSV files", async () => {
        const filePath = await createTempTextFile("not,csv");
        createdFiles.push(filePath);

        const response = await request(app)
            .post("/api/upload")
            .attach("file", filePath);

        expect(response.status).toBe(400);
        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Only CSV files are supported.");
    });
});