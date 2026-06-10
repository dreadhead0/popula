import dotenv from "dotenv";
import type { Knex } from "knex";

dotenv.config();

const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/popula";

const config: Record<string, Knex.Config> = {
    development: {
        client: "pg",
        connection: databaseUrl,
        migrations: {
            directory: "./src/database/migrations",
            extension: "ts",
        },
        seeds: {
            directory: "./src/database/seeds",
            extension: "ts",
        },
    },
    test: {
        client: "pg",
        connection:
            process.env.TEST_DATABASE_URL ??
            "postgresql://postgres:postgres@localhost:5432/popula_test",
        migrations: {
            directory: "./src/database/migrations",
            extension: "ts",
        },
        seeds: {
            directory: "./src/database/seeds",
            extension: "ts",
        },
    },
    production: {
        client: "pg",
        connection: databaseUrl,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: "./dist/src/database/migrations",
            extension: "js",
        },
        seeds: {
            directory: "./dist/src/database/seeds",
            extension: "js",
        },
    },
};

export default config;