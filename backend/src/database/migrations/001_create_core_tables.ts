import type { Knex } from "knex";

const datasetStatusValues = [
    "pending",
    "processing",
    "active",
    "inactive",
    "failed",
];

const genderValues = ["male", "female", "rather not say"];

const purchasedCategoryValues = [
    "Electronics",
    "Clothing",
    "Home",
    "Books",
    "Sports",
];

export async function up(knex: Knex): Promise<void> {
    await knex.raw('create extension if not exists "pgcrypto"');

    await knex.schema.createTable("datasets", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("filename").notNullable();
        table.string("original_filename").notNullable();
        table
            .enu("status", datasetStatusValues, {
                useNative: true,
                enumName: "dataset_status",
            })
            .notNullable()
            .defaultTo("pending");
        table.integer("total_rows_received").notNullable().defaultTo(0);
        table.integer("rows_inserted").notNullable().defaultTo(0);
        table.integer("rows_skipped").notNullable().defaultTo(0);
        table.jsonb("skip_reasons").notNullable().defaultTo("{}");
        table.timestamps(true, true);
    });

    await knex.schema.createTable("demographic_records", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
            .uuid("dataset_id")
            .notNullable()
            .references("id")
            .inTable("datasets")
            .onDelete("CASCADE");
        table.string("full_name").notNullable();
        table
            .enu("gender", genderValues, {
                useNative: true,
                enumName: "gender_type",
            })
            .notNullable();
        table.integer("age").notNullable();
        table.string("country").notNullable();
        table.decimal("income", 14, 2).notNullable();
        table
            .enu("purchased_category", purchasedCategoryValues, {
                useNative: true,
                enumName: "purchased_category_type",
            })
            .notNullable();
        table.date("created_at").notNullable();
        table.timestamp("inserted_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

        table.check("age >= 5 AND age <= 90");
        table.unique(["dataset_id", "full_name", "age"]);
    });

    await knex.schema.createTable("workspaces", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("name").notNullable().defaultTo("Untitled workspace");
        table
            .uuid("dataset_id")
            .references("id")
            .inTable("datasets")
            .onDelete("SET NULL");
        table.jsonb("query_tree").notNullable();
        table.jsonb("chart_config").notNullable().defaultTo("{}");
        table.timestamps(true, true);
    });

    await knex.schema.alterTable("datasets", (table) => {
        table.index(["status"]);
        table.index(["created_at"]);
    });

    await knex.schema.alterTable("demographic_records", (table) => {
        table.index(["dataset_id"]);
        table.index(["dataset_id", "country"]);
        table.index(["dataset_id", "gender"]);
        table.index(["dataset_id", "purchased_category"]);
        table.index(["dataset_id", "created_at"]);
        table.index(["dataset_id", "age"]);
    });

    await knex.schema.alterTable("workspaces", (table) => {
        table.index(["dataset_id"]);
        table.index(["created_at"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("workspaces");
    await knex.schema.dropTableIfExists("demographic_records");
    await knex.schema.dropTableIfExists("datasets");

    await knex.raw("drop type if exists purchased_category_type");
    await knex.raw("drop type if exists gender_type");
    await knex.raw("drop type if exists dataset_status");
}