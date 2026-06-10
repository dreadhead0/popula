import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import csvParser from "csv-parser";
import { db } from "../../database/connection";
import {
    REQUIRED_CSV_HEADERS,
    type SkipReason,
} from "../../constants/demographic-schema";
import {
    type RawDemographicCsvRow,
    validateDemographicRow,
} from "./validate-demographic-row";

type UploadSummary = {
    status: "success";
    dataset_id: string;
    total_rows_received: number;
    rows_inserted: number;
    rows_skipped: number;
    skip_reasons: Partial<Record<SkipReason, number>>;
};

type IngestCsvOptions = {
    filePath: string;
    originalFilename: string;
};

const incrementSkipReason = (
    skipReasons: Partial<Record<SkipReason, number>>,
    reason: SkipReason
) => {
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
};

const validateHeaders = (headers: string[]) => {
    const normalizedHeaders = headers.map((header) => header.trim());

    const missingHeaders = REQUIRED_CSV_HEADERS.filter(
        (requiredHeader) => !normalizedHeaders.includes(requiredHeader)
    );

    if (missingHeaders.length > 0) {
        throw new Error(
            `CSV is missing required header(s): ${missingHeaders.join(", ")}`
        );
    }
};

export const ingestCsv = async ({
    filePath,
    originalFilename,
}: IngestCsvOptions): Promise<UploadSummary> => {
    const datasetId = randomUUID();
    const storedFilename = `${datasetId}-${originalFilename}`;

    let totalRowsReceived = 0;
    let rowsInserted = 0;
    let rowsSkipped = 0;
    const skipReasons: Partial<Record<SkipReason, number>> = {};

    await db("datasets").insert({
        id: datasetId,
        filename: storedFilename,
        original_filename: originalFilename,
        status: "processing",
        total_rows_received: 0,
        rows_inserted: 0,
        rows_skipped: 0,
        skip_reasons: JSON.stringify({}),
    });

    const seenUniqueKeys = new Set<string>();
    const batch: Record<string, unknown>[] = [];
    const batchSize = 500;

    const flushBatch = async () => {
        if (batch.length === 0) {
            return;
        }

        const inserted = await db("demographic_records")
            .insert(batch)
            .onConflict(["dataset_id", "full_name", "age"])
            .ignore()
            .returning("id");

        rowsInserted += inserted.length;

        const duplicatesFromDatabase = batch.length - inserted.length;

        if (duplicatesFromDatabase > 0) {
            rowsSkipped += duplicatesFromDatabase;
            skipReasons.duplicate =
                (skipReasons.duplicate ?? 0) + duplicatesFromDatabase;
        }

        batch.length = 0;
    };

    try {
        await new Promise<void>((resolve, reject) => {
            const stream = createReadStream(filePath).pipe(csvParser());

            stream.on("headers", (headers: string[]) => {
                try {
                    validateHeaders(headers);
                } catch (error) {
                    reject(error);
                }
            });

            stream.on("data", async (row: RawDemographicCsvRow) => {
                stream.pause();

                try {
                    totalRowsReceived += 1;

                    const validation = validateDemographicRow(row);

                    if (!validation.valid) {
                        rowsSkipped += 1;
                        incrementSkipReason(skipReasons, validation.reason);
                        stream.resume();
                        return;
                    }

                    const uniqueKey = `${validation.data.fullName.toLowerCase()}::${validation.data.age}`;

                    if (seenUniqueKeys.has(uniqueKey)) {
                        rowsSkipped += 1;
                        incrementSkipReason(skipReasons, "duplicate");
                        stream.resume();
                        return;
                    }

                    seenUniqueKeys.add(uniqueKey);

                    batch.push({
                        id: randomUUID(),
                        dataset_id: datasetId,
                        full_name: validation.data.fullName,
                        gender: validation.data.gender,
                        age: validation.data.age,
                        country: validation.data.country,
                        income: validation.data.income,
                        purchased_category: validation.data.purchasedCategory,
                        created_at: validation.data.createdAt,
                    });

                    if (batch.length >= batchSize) {
                        await flushBatch();
                    }

                    stream.resume();
                } catch (error) {
                    reject(error);
                }
            });

            stream.on("end", async () => {
                try {
                    await flushBatch();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            stream.on("error", reject);
        });

        await db("datasets")
            .where({ id: datasetId })
            .update({
                status: "active",
                total_rows_received: totalRowsReceived,
                rows_inserted: rowsInserted,
                rows_skipped: rowsSkipped,
                skip_reasons: JSON.stringify(skipReasons),
                updated_at: db.fn.now(),
            });

        return {
            status: "success",
            dataset_id: datasetId,
            total_rows_received: totalRowsReceived,
            rows_inserted: rowsInserted,
            rows_skipped: rowsSkipped,
            skip_reasons: skipReasons,
        };
    } catch (error) {
        await db("datasets").where({ id: datasetId }).update({
            status: "failed",
            total_rows_received: totalRowsReceived,
            rows_inserted: rowsInserted,
            rows_skipped: rowsSkipped,
            skip_reasons: JSON.stringify(skipReasons),
            updated_at: db.fn.now(),
        });

        throw error;
    }
};